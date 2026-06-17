import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasPermission } from "@/lib/permissions";
import { logError } from "@/lib/logger";

const MAX_ROUNDS = 8;
const MIN_OFFSET = 15;
const MAX_OFFSET = 10080; // 7 days

function normalizeOffsets(raw: unknown): number[] | null {
    if (!Array.isArray(raw)) return null;
    const nums = raw
        .map((x) => (typeof x === "number" ? x : parseInt(String(x), 10)))
        .filter((n) => !Number.isNaN(n) && n >= MIN_OFFSET && n <= MAX_OFFSET);
    const unique = Array.from(new Set(nums)).sort((a, b) => a - b);
    if (unique.length > MAX_ROUNDS) return null;
    return unique;
}

export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!(await hasPermission("interviews", "configure_reminders"))) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const admin = createAdminClient();
        const { data: row, error } = await admin
            .from("mis_interview_reminder_settings")
            .select("enabled, offsets_minutes, updated_at, updated_by_user_id")
            .eq("id", 1)
            .maybeSingle();

        if (error) {
            console.error("GET interview-reminders settings:", error);
            return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
        }

        if (!row) {
            return NextResponse.json({
                success: true,
                settings: {
                    enabled: false,
                    offsets_minutes: [],
                    updated_at: null,
                    updated_by_user_id: null,
                },
            });
        }

        return NextResponse.json({
            success: true,
            settings: {
                enabled: row.enabled,
                offsets_minutes: row.offsets_minutes ?? [],
                updated_at: row.updated_at,
                updated_by_user_id: row.updated_by_user_id,
            },
        });
    } catch (e) {
        await logError({
            source: "api/mis/settings/interview-reminders:GET",
            errorType: "APIError",
            message: e instanceof Error ? e.message : String(e),
        });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!(await hasPermission("interviews", "configure_reminders"))) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const enabled = Boolean(body?.enabled);
        const offsets = normalizeOffsets(body?.offsets_minutes);

        if (offsets === null) {
            return NextResponse.json(
                {
                    error: `Invalid offsets: provide ${MIN_OFFSET}–${MAX_OFFSET} minutes per reminder, at most ${MAX_ROUNDS} rounds, unique values.`,
                },
                { status: 400 }
            );
        }

        if (enabled && offsets.length === 0) {
            return NextResponse.json(
                { error: "When reminders are enabled, add at least one time (hours before the interview)." },
                { status: 400 }
            );
        }

        const admin = createAdminClient();
        const { data: row, error } = await admin
            .from("mis_interview_reminder_settings")
            .upsert(
                {
                    id: 1,
                    enabled,
                    offsets_minutes: offsets,
                    updated_by_user_id: user.id,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "id" }
            )
            .select("enabled, offsets_minutes, updated_at, updated_by_user_id")
            .single();

        if (error) {
            console.error("PUT interview-reminders settings:", error);
            return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
        }

        return NextResponse.json({ success: true, settings: row });
    } catch (e) {
        await logError({
            source: "api/mis/settings/interview-reminders:PUT",
            errorType: "APIError",
            message: e instanceof Error ? e.message : String(e),
        });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
