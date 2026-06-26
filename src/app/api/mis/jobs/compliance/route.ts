import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// GET /api/mis/jobs/compliance — list job compliance flags (fake-document pauses)
// Filters: status, companyId, jobSearch.
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const url = new URL(request.url);
        const statusFilter = url.searchParams.get("status") || "";
        const companyId = url.searchParams.get("companyId") || "";
        const jobSearch = url.searchParams.get("jobSearch") || "";

        let query = admin
            .from("job_compliance_flags")
            .select(`
                id, job_id, status, reason, flagged_at,
                payment_request_id, flagged_proof_id,
                employer_doc_url, employer_doc_name, employer_note, resubmitted_at,
                resolution_notes, resolved_at,
                job:jobs!job_compliance_flags_job_id_fkey(
                    id, job_title, status, company_id,
                    company:companies(id, company_name)
                )
            `)
            .order("flagged_at", { ascending: false });

        if (statusFilter) query = query.eq("status", statusFilter);

        if (jobSearch) {
            const { data: jobs } = await admin.from("jobs").select("id").ilike("job_title", `%${jobSearch}%`).limit(500);
            const ids = (jobs ?? []).map((j) => j.id);
            query = query.in("job_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
        }

        const { data: rows, error } = await query;
        if (error) throw error;

        // Company filter is applied in-memory on the embedded job.company_id.
        const data = companyId && rows
            ? rows.filter((f) => (f.job as unknown as { company_id?: string } | null)?.company_id === companyId)
            : rows;

        return NextResponse.json({ success: true, data: data ?? [] });
    } catch (error) {
        await logError({ source: "api/mis/jobs/compliance:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
