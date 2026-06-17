import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// GET /api/candidate/applications — list own applications
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
        if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

        const url = new URL(request.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
        const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
        const offset = (page - 1) * limit;
        const statusFilter = url.searchParams.get("status") || "";

        let query = admin
            .from("job_applications")
            .select(`
                id, status, cover_letter, resume_url, applied_at, updated_at,
                job:jobs!job_applications_job_id_fkey(
                    id, job_title, location, job_type, status, expires_at,
                    company:companies!jobs_company_id_fkey(
                        company_name, logo_url
                    )
                )
            `, { count: "exact" })
            .eq("candidate_id", candidate.id);

        if (statusFilter) query = query.eq("status", statusFilter);

        const { data, error, count } = await query
            .order("applied_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return NextResponse.json({
            applications: data ?? [],
            pagination: {
                page,
                limit,
                total: count ?? 0,
                totalPages: Math.ceil((count ?? 0) / limit),
            },
        });
    } catch (error) {
        await logError({ source: "api/candidate/applications:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
