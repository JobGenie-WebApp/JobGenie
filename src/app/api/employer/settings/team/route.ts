import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_TEAM_SETTINGS = {
    sub_admin_can_post_jobs: true,
    sub_admin_can_invite_candidates: true,
    require_super_admin_approval_for_posts: false,
};

function mergeWithDefaults(stored: unknown) {
    const result = { ...DEFAULT_TEAM_SETTINGS };
    if (stored && typeof stored === "object" && !Array.isArray(stored)) {
        const s = stored as Record<string, unknown>;
        if (typeof s.sub_admin_can_post_jobs === "boolean") result.sub_admin_can_post_jobs = s.sub_admin_can_post_jobs;
        if (typeof s.sub_admin_can_invite_candidates === "boolean") result.sub_admin_can_invite_candidates = s.sub_admin_can_invite_candidates;
        if (typeof s.require_super_admin_approval_for_posts === "boolean") result.require_super_admin_approval_for_posts = s.require_super_admin_approval_for_posts;
    }
    return result;
}

async function getEmployerAndCompany(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
    const { data } = await supabase
        .from("employers")
        .select("id, company_id, is_super_admin, companies(team_settings)")
        .eq("user_id", userId)
        .single();
    return data;
}

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const employer = await getEmployerAndCompany(supabase, user.id);
        if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

        const company = (employer as Record<string, unknown>).companies as { team_settings?: Record<string, unknown> } | null;
        return NextResponse.json({ success: true, data: mergeWithDefaults(company?.team_settings) });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const employer = await getEmployerAndCompany(supabase, user.id);
        if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
        if (!employer.is_super_admin) return NextResponse.json({ error: "Forbidden: Super admin access required." }, { status: 403 });

        const body = await request.json();
        if (
            typeof body.sub_admin_can_post_jobs !== "boolean" ||
            typeof body.sub_admin_can_invite_candidates !== "boolean" ||
            typeof body.require_super_admin_approval_for_posts !== "boolean"
        ) {
            return NextResponse.json({ error: "Invalid payload: all fields must be boolean." }, { status: 400 });
        }

        const validated = {
            sub_admin_can_post_jobs: body.sub_admin_can_post_jobs as boolean,
            sub_admin_can_invite_candidates: body.sub_admin_can_invite_candidates as boolean,
            require_super_admin_approval_for_posts: body.require_super_admin_approval_for_posts as boolean,
        };

        const admin = createAdminClient();
        const { error } = await admin.from("companies").update({
            team_settings: validated,
            updated_at: new Date().toISOString(),
        }).eq("id", employer.company_id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true, data: validated });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
    }
}
