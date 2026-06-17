import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

const CANDIDATE_KEYS = [
    "dashboard",
    "browse-jobs",
    "applications",
    "invitations",
    "calendar",
    "my-profile",
    "my-resumes",
    "settings",
] as const;

const EMPLOYER_KEYS = [
    "dashboard",
    "job-postings",
    "applications",
    "candidates",
    "invitations",
    "calendar",
    "company-profile",
    "company-admins",
    "settings",
] as const;

type VisibilityMap = Record<string, boolean>;

function buildDefaults(keys: readonly string[]): VisibilityMap {
    return Object.fromEntries(keys.map((k) => [k, true]));
}

function sanitize(raw: unknown, keys: readonly string[]): VisibilityMap {
    const defaults = buildDefaults(keys);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;
    const out: VisibilityMap = { ...defaults };
    for (const k of keys) {
        const val = (raw as Record<string, unknown>)[k];
        if (typeof val === "boolean") out[k] = val;
    }
    return out;
}

async function requireMisAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;

    const admin = createAdminClient();
    const { data: misUser } = await admin
        .from("mis_user")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    return misUser ? user : null;
}

export async function GET() {
    try {
        const user = await requireMisAdmin();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const admin = createAdminClient();
        const { data: rows, error } = await admin
            .from("mis_sidebar_visibility_settings")
            .select("portal_type, visibility_config, updated_at, updated_by_user_id");

        if (error) {
            console.error("GET sidebar-visibility:", error);
            return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
        }

        const candidate =
            rows?.find((r) => r.portal_type === "candidate")?.visibility_config ?? {};
        const employer =
            rows?.find((r) => r.portal_type === "employer")?.visibility_config ?? {};

        return NextResponse.json({
            success: true,
            settings: {
                candidate: sanitize(candidate, CANDIDATE_KEYS),
                employer: sanitize(employer, EMPLOYER_KEYS),
            },
        });
    } catch (e) {
        await logError({
            source: "api/mis/settings/sidebar-visibility:GET",
            errorType: "APIError",
            message: e instanceof Error ? e.message : String(e),
        });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await requireMisAdmin();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { portal_type, visibility_config } = body ?? {};

        if (portal_type !== "candidate" && portal_type !== "employer") {
            return NextResponse.json(
                { error: "portal_type must be 'candidate' or 'employer'" },
                { status: 400 }
            );
        }

        const keys = portal_type === "candidate" ? CANDIDATE_KEYS : EMPLOYER_KEYS;
        const sanitized = sanitize(visibility_config, keys);

        const admin = createAdminClient();
        const { data: row, error } = await admin
            .from("mis_sidebar_visibility_settings")
            .upsert(
                {
                    portal_type,
                    visibility_config: sanitized,
                    updated_at: new Date().toISOString(),
                    updated_by_user_id: user.id,
                },
                { onConflict: "portal_type" }
            )
            .select("portal_type, visibility_config, updated_at")
            .single();

        if (error) {
            console.error("PUT sidebar-visibility:", error);
            return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
        }

        return NextResponse.json({ success: true, settings: row });
    } catch (e) {
        await logError({
            source: "api/mis/settings/sidebar-visibility:PUT",
            errorType: "APIError",
            message: e instanceof Error ? e.message : String(e),
        });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
