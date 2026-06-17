import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { jobCreateSchema } from "@/lib/validations/job-schema";

// GET /api/employer/jobs — list company's job ads
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: employer } = await admin
            .from("employers")
            .select("id, company_id")
            .eq("user_id", user.id)
            .single();
        if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

        const url = new URL(request.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
        const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
        const offset = (page - 1) * limit;
        const statusFilter = url.searchParams.get("status") || "";

        let query = admin
            .from("jobs")
            .select(`
                id, job_title, location, industry, job_type, status,
                deadline, expires_at, validity_days, published_at, created_at, updated_at,
                salary_min, salary_max, salary_currency, positions_available,
                job_applications(count),
                payment_requests(id, status, payment_types(code))
            `, { count: "exact" })
            .eq("company_id", employer.company_id)
            .eq("is_deleted", false);

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
            pagination: {
                page,
                limit,
                total: count ?? 0,
                totalPages: Math.ceil((count ?? 0) / limit),
            },
        });
    } catch (error) {
        await logError({ source: "api/employer/jobs:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/employer/jobs — create a new job ad draft
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: employer } = await admin
            .from("employers")
            .select("id, company_id")
            .eq("user_id", user.id)
            .single();
        if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

        const body = await request.json();
        const parsed = jobCreateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
        }

        const d = parsed.data;

        const { data: job, error } = await admin
            .from("jobs")
            .insert({
                employer_id: employer.id,
                company_id: employer.company_id,
                job_title: d.job_title,
                location: d.location ?? null,
                industry: d.industry ?? null,
                job_type: d.job_type,
                description: d.description ?? null,
                deadline: d.deadline ?? null,
                salary_min: d.salary_min ?? null,
                salary_max: d.salary_max ?? null,
                salary_currency: d.salary_currency,
                experience_level: d.experience_level ?? null,
                positions_available: d.positions_available,
                validity_days: d.validity_days,
                custom_start_date: d.custom_start_date ?? null,
                custom_end_date: d.custom_end_date ?? null,
                advertisement_link: d.advertisement_link ?? null,
                status: "draft",
            })
            .select("id")
            .single();

        if (error) {
            console.error("[POST /api/employer/jobs] DB error:", JSON.stringify(error));
            return NextResponse.json({ error: "Database error", detail: error.message, code: error.code, hint: error.hint }, { status: 500 });
        }

        return NextResponse.json({ job_id: job.id }, { status: 201 });
    } catch (error) {
        const msg = error instanceof Error ? error.message : (typeof error === "object" ? JSON.stringify(error) : String(error));
        console.error("[POST /api/employer/jobs]", msg, error);
        await logError({ source: "api/employer/jobs:POST", errorType: "APIError", message: msg });
        return NextResponse.json({ error: "Internal server error", detail: msg }, { status: 500 });
    }
}
