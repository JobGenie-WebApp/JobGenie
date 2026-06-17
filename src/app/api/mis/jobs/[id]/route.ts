import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";
import { hasPermission } from "@/lib/permissions";
import { jobUpdateSchema } from "@/lib/validations/job-schema";

type Params = { params: Promise<{ id: string }> };

async function authMis(userId: string) {
    const admin = createAdminClient();
    const { data: userData } = await admin.from("users").select("role").eq("id", userId).single();
    return userData?.role === "mis" ? admin : null;
}

// GET /api/mis/jobs/[id]
export async function GET(_request: NextRequest, { params }: Params) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = await authMis(user.id);
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const canView = await hasPermission("jobs", "view");
        if (!canView) return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

        const { id } = await params;

        const { data: job, error } = await admin
            .from("jobs")
            .select(`
                id, job_title, location, industry, job_type, status,
                description, deadline, expires_at, validity_days, published_at,
                salary_min, salary_max, salary_currency, experience_level,
                positions_available, advertisement_link, is_deleted, deleted_at,
                created_at, updated_at,
                company:companies!jobs_company_id_fkey(
                    id, company_name, logo_url, industry, headoffice_location
                ),
                employer:employers!jobs_employer_id_fkey(
                    id, first_name, last_name, email, designation
                ),
                job_applications(
                    id, status, cover_letter, resume_url, applied_at, updated_at, notes,
                    candidate:candidates!job_applications_candidate_id_fkey(
                        id, first_name, last_name, email, profile_image_url,
                        current_position, industry, years_of_experience
                    )
                ),
                payment_requests(
                    id, status, amount, currency, description, created_at, updated_at,
                    payment_types(code, label),
                    payment_proofs(id, status, uploaded_at, reviewed_at, review_notes, file_url, file_name)
                )
            `)
            .eq("id", id)
            .single();

        if (error || !job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

        return NextResponse.json({ job });
    } catch (error) {
        await logError({ source: "api/mis/jobs/[id]:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/mis/jobs/[id] — admin edit
export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = await authMis(user.id);
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const canEdit = await hasPermission("jobs", "edit");
        if (!canEdit) return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

        const { id } = await params;
        const body = await request.json();
        const parsed = jobUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
        }

        const { data: job } = await admin.from("jobs").select("id, status").eq("id", id).single();
        if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
        if (job.status === "deleted") return NextResponse.json({ error: "Cannot edit a deleted job" }, { status: 400 });

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
            ...(d.advertisement_link !== undefined && { advertisement_link: d.advertisement_link }),
        }).eq("id", id);

        if (error) throw error;

        await logBusiness("job_edited_by_mis", user.id, "mis", "job", id, { fields: Object.keys(d) });
        return NextResponse.json({ success: true });
    } catch (error) {
        await logError({ source: "api/mis/jobs/[id]:PATCH", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
