import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { jobUpdateSchema } from "@/lib/validations/job-schema";

type Params = { params: Promise<{ id: string }> };

async function getEmployerAndJob(userId: string, jobId: string) {
    const admin = createAdminClient();
    const { data: employer } = await admin
        .from("employers")
        .select("id, company_id")
        .eq("user_id", userId)
        .single();
    if (!employer) return { employer: null, job: null, admin };

    const { data: job } = await admin
        .from("jobs")
        .select("id, status, company_id, employer_id, is_deleted, expires_at")
        .eq("id", jobId)
        .single();

    if (!job || job.company_id !== employer.company_id || job.is_deleted) return { employer, job: null, admin };
    return { employer, job, admin };
}

// GET /api/employer/jobs/[id]
export async function GET(_request: NextRequest, { params }: Params) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const admin = createAdminClient();
        const { data: employer } = await admin.from("employers").select("id, company_id").eq("user_id", user.id).single();
        if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

        const { data: job, error } = await admin
            .from("jobs")
            .select(`
                id, job_title, location, industry, job_type, status,
                description, deadline, expires_at, validity_days,
                custom_start_date, custom_end_date, published_at,
                salary_min, salary_max, salary_currency, experience_level,
                positions_available, advertisement_link, is_deleted, created_at, updated_at,
                job_applications(
                    id, status, applied_at,
                    candidate:candidates!job_applications_candidate_id_fkey(
                        id, first_name, last_name, email, profile_image_url,
                        current_position, industry, years_of_experience
                    )
                ),
                payment_requests(
                    id, status, amount, currency, created_at,
                    payment_types(code, label),
                    payment_proofs(id, status, uploaded_at, review_notes)
                )
            `)
            .eq("id", id)
            .eq("company_id", employer.company_id)
            .eq("is_deleted", false)
            .single();

        if (error || !job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

        return NextResponse.json({ job });
    } catch (error) {
        await logError({ source: "api/employer/jobs/[id]:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/employer/jobs/[id] — update (only allowed in draft status)
export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const { employer, job, admin } = await getEmployerAndJob(user.id, id);
        if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
        if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
        if (job.status !== "draft") return NextResponse.json({ error: "Only draft jobs can be edited" }, { status: 400 });

        const body = await request.json();
        const parsed = jobUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
        }

        const d = parsed.data;
        const { error } = await admin.from("jobs").update({
            ...(d.job_title !== undefined && { job_title: d.job_title }),
            ...(d.location !== undefined && { location: d.location }),
            ...(d.industry !== undefined && { industry: d.industry }),
            ...(d.job_type !== undefined && { job_type: d.job_type }),
            ...(d.description !== undefined && { description: d.description }),
            ...(d.deadline !== undefined && { deadline: d.deadline }),
            ...(d.salary_min !== undefined && { salary_min: d.salary_min }),
            ...(d.salary_max !== undefined && { salary_max: d.salary_max }),
            ...(d.salary_currency !== undefined && { salary_currency: d.salary_currency }),
            ...(d.experience_level !== undefined && { experience_level: d.experience_level }),
            ...(d.positions_available !== undefined && { positions_available: d.positions_available }),
            ...(d.validity_days !== undefined && { validity_days: d.validity_days }),
            ...(d.custom_start_date !== undefined && { custom_start_date: d.custom_start_date }),
            ...(d.custom_end_date !== undefined && { custom_end_date: d.custom_end_date }),
            ...(d.advertisement_link !== undefined && { advertisement_link: d.advertisement_link }),
        }).eq("id", id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        await logError({ source: "api/employer/jobs/[id]:PATCH", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/employer/jobs/[id] — soft delete
export async function DELETE(_request: NextRequest, { params }: Params) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;
        const { employer, job, admin } = await getEmployerAndJob(user.id, id);
        if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
        if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

        const now = new Date().toISOString();
        const { error } = await admin.from("jobs").update({
            is_deleted: true,
            deleted_at: now,
            status: "deleted",
        }).eq("id", id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        await logError({ source: "api/employer/jobs/[id]:DELETE", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
