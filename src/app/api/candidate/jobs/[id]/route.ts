import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

// GET /api/candidate/jobs/[id]
export async function GET(_request: NextRequest, { params }: Params) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: candidate } = await admin
            .from("candidates")
            .select("id")
            .eq("user_id", user.id)
            .single();

        const { id } = await params;

        const { data: job, error } = await admin
            .from("jobs")
            .select(`
                id, job_title, location, industry, job_type, status,
                description, deadline, expires_at, salary_min, salary_max,
                salary_currency, experience_level, positions_available,
                advertisement_link, published_at, created_at,
                company:companies!jobs_company_id_fkey(
                    id, company_name, logo_url, industry, description,
                    headoffice_location, website, company_size
                )
            `)
            .eq("id", id)
            .eq("status", "published")
            .eq("is_deleted", false)
            .single();

        if (error || !job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

        // Check if candidate has already applied
        let has_applied = false;
        let application_status: string | null = null;
        if (candidate) {
            const { data: app } = await admin
                .from("job_applications")
                .select("id, status")
                .eq("job_id", id)
                .eq("candidate_id", candidate.id)
                .maybeSingle();
            if (app) {
                has_applied = true;
                application_status = app.status;
            }
        }

        return NextResponse.json({ job, has_applied, application_status });
    } catch (error) {
        await logError({ source: "api/candidate/jobs/[id]:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
