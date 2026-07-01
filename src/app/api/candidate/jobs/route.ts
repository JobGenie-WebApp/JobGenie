import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// GET /api/candidate/jobs — browse published job ads
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();

        const url = new URL(request.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
        const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
        const offset = (page - 1) * limit;
        const search = url.searchParams.get("search") || "";
        const industry = url.searchParams.get("industry") || "";
        const jobType = url.searchParams.get("job_type") || "";
        const location = url.searchParams.get("location") || "";
        const experienceLevel = url.searchParams.get("experience_level") || "";
        const salaryMin = parseInt(url.searchParams.get("salary_min") || "", 10);

        const now = new Date().toISOString();

        let query = admin
            .from("jobs")
            .select(`
                id, job_title, location, industry, job_type, status,
                deadline, expires_at, salary_min, salary_max, salary_currency,
                experience_level, positions_available, description,
                published_at, created_at,
                company:companies!jobs_company_id_fkey(
                    id, company_name, logo_url, industry, headoffice_location
                )
            `, { count: "exact" })
            .eq("status", "published")
            .eq("is_deleted", false)
            .gt("expires_at", now);

        if (search) query = query.ilike("job_title", `%${search}%`);
        if (industry) query = query.eq("industry", industry);
        if (jobType) query = query.eq("job_type", jobType);
        if (location) query = query.ilike("location", `%${location}%`);
        if (experienceLevel) query = query.eq("experience_level", experienceLevel);
        // Jobs whose max salary is at least the requested floor (jobs without a
        // salary_max are excluded when a floor is selected).
        if (Number.isFinite(salaryMin)) query = query.gte("salary_max", salaryMin);

        const { data, error, count } = await query
            .order("published_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // Flag which of the returned jobs the current candidate has saved / applied to.
        let jobs = data ?? [];
        const jobIds = jobs.map((j) => j.id);
        if (jobIds.length > 0) {
            const { data: candidate } = await admin
                .from("candidates")
                .select("id")
                .eq("user_id", user.id)
                .maybeSingle();
            if (candidate) {
                const [{ data: saved }, { data: applied }] = await Promise.all([
                    admin.from("saved_jobs").select("job_id").eq("candidate_id", candidate.id).in("job_id", jobIds),
                    admin.from("job_applications").select("job_id").eq("candidate_id", candidate.id).in("job_id", jobIds),
                ]);
                const savedSet = new Set((saved ?? []).map((s) => s.job_id));
                const appliedSet = new Set((applied ?? []).map((a) => a.job_id));
                jobs = jobs.map((j) => ({ ...j, is_saved: savedSet.has(j.id), has_applied: appliedSet.has(j.id) }));
            }
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
        await logError({ source: "api/candidate/jobs:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
