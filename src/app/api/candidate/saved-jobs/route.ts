import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// GET /api/candidate/saved-jobs — list the current candidate's saved jobs.
// Only jobs that are still published and not expired are returned; stale saves
// (job unpublished/expired/deleted) are filtered out of the response.
export async function GET(request: NextRequest) {
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
        if (!candidate) return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });

        const url = new URL(request.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
        const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
        const offset = (page - 1) * limit;
        const now = new Date().toISOString();

        const { data, error, count } = await admin
            .from("saved_jobs")
            .select(`
                id, created_at,
                job:jobs!saved_jobs_job_id_fkey(
                    id, job_title, location, industry, job_type, status, is_deleted,
                    expires_at, salary_min, salary_max, salary_currency,
                    experience_level, published_at,
                    company:companies!jobs_company_id_fkey(company_name, logo_url, headoffice_location)
                )
            `, { count: "exact" })
            .eq("candidate_id", candidate.id)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // Keep only saves whose job is still live, and flatten to job objects
        // with is_saved = true and the saved timestamp.
        let jobs = (data ?? [])
            .map((row) => {
                const job = Array.isArray(row.job) ? row.job[0] : row.job;
                if (!job || job.status !== "published" || job.is_deleted) return null;
                if (job.expires_at && job.expires_at < now) return null;
                return { ...job, is_saved: true, saved_at: row.created_at };
            })
            .filter((j): j is NonNullable<typeof j> => j !== null);

        // Flag which saved jobs the candidate has already applied to.
        const savedJobIds = jobs.map((j) => j.id);
        if (savedJobIds.length > 0) {
            const { data: applied } = await admin
                .from("job_applications")
                .select("job_id")
                .eq("candidate_id", candidate.id)
                .in("job_id", savedJobIds);
            const appliedSet = new Set((applied ?? []).map((a) => a.job_id));
            jobs = jobs.map((j) => ({ ...j, has_applied: appliedSet.has(j.id) }));
        }

        return NextResponse.json({
            jobs,
            pagination: {
                page,
                limit,
                total: count ?? 0,
                totalPages: Math.ceil((count ?? 0) / limit),
            },
        });
    } catch (error) {
        await logError({ source: "api/candidate/saved-jobs:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
