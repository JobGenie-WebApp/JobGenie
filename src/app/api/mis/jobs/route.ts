import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { hasPermission } from "@/lib/permissions";

// GET /api/mis/jobs — list all job ads with filters
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const canView = await hasPermission("jobs", "view");
        if (!canView) return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

        const url = new URL(request.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
        const offset = (page - 1) * limit;
        const search = url.searchParams.get("search") || "";
        const statusFilter = url.searchParams.get("status") || "";
        const companyId = url.searchParams.get("company_id") || "";
        const employerId = url.searchParams.get("employer_id") || "";
        const industry = url.searchParams.get("industry") || "";
        const jobType = url.searchParams.get("job_type") || "";
        const dateFrom = url.searchParams.get("date_from") || "";
        const dateTo = url.searchParams.get("date_to") || "";
        const includeDeleted = url.searchParams.get("include_deleted") === "true";

        let query = admin
            .from("jobs")
            .select(`
                id, job_title, location, industry, job_type, status,
                deadline, expires_at, validity_days, published_at, created_at, updated_at,
                salary_min, salary_max, salary_currency, positions_available, is_deleted,
                company:companies!jobs_company_id_fkey(id, company_name, logo_url),
                employer:employers!jobs_employer_id_fkey(id, first_name, last_name, email),
                job_applications(count),
                payment_requests(id, status, amount, currency, payment_types(code, label))
            `, { count: "exact" });

        if (!includeDeleted) query = query.eq("is_deleted", false);

        if (search) query = query.ilike("job_title", `%${search}%`);
        if (companyId) query = query.eq("company_id", companyId);
        if (employerId) query = query.eq("employer_id", employerId);
        if (industry) query = query.eq("industry", industry);
        if (jobType) query = query.eq("job_type", jobType);
        if (dateFrom) query = query.gte("created_at", dateFrom);
        if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59Z");

        if (statusFilter) {
            const statuses = statusFilter.split(",").map((s) => s.trim()).filter(Boolean);
            if (statuses.length === 1) query = query.eq("status", statuses[0]);
            else if (statuses.length > 1) query = query.in("status", statuses);
        }

        const { data, error, count } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return NextResponse.json({
            jobs: data ?? [],
            pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) },
        });
    } catch (error) {
        await logError({ source: "api/mis/jobs:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
