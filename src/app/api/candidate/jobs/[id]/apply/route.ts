import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { jobApplySchema } from "@/lib/validations/job-schema";
import {
    sendApplicationReceivedEmail,
    sendNewApplicationEmail,
} from "@/lib/job-advertisement-emails";

type Params = { params: Promise<{ id: string }> };

// POST /api/candidate/jobs/[id]/apply
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: candidate } = await admin
            .from("candidates")
            .select("id, first_name, last_name, email, user_id")
            .eq("user_id", user.id)
            .single();
        if (!candidate) return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });

        const { id } = await params;
        const now = new Date().toISOString();

        // Validate job is published and not expired
        const { data: job } = await admin
            .from("jobs")
            .select(`
                id, job_title, status, expires_at, is_deleted,
                company:companies!jobs_company_id_fkey(company_name),
                employer:employers!jobs_employer_id_fkey(user_id, first_name, email)
            `)
            .eq("id", id)
            .single();

        if (!job || job.is_deleted) return NextResponse.json({ error: "Job not found" }, { status: 404 });
        if (job.status !== "published") return NextResponse.json({ error: "This job is not accepting applications" }, { status: 400 });
        if (job.expires_at && new Date(job.expires_at) < new Date()) {
            return NextResponse.json({ error: "This job advertisement has expired" }, { status: 400 });
        }

        // Duplicate check (belt + suspenders before DB constraint)
        const { data: existing } = await admin
            .from("job_applications")
            .select("id")
            .eq("job_id", id)
            .eq("candidate_id", candidate.id)
            .maybeSingle();

        if (existing) return NextResponse.json({ error: "You have already applied to this job" }, { status: 409 });

        const body = await request.json().catch(() => ({}));
        const parsed = jobApplySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
        }

        const { data: application, error } = await admin
            .from("job_applications")
            .insert({
                job_id: id,
                candidate_id: candidate.id,
                status: "pending",
                cover_letter: parsed.data.cover_letter ?? null,
                resume_url: parsed.data.resume_url ?? null,
                applied_at: now,
                updated_at: now,
            })
            .select("id")
            .single();

        if (error) {
            // Handle DB-level unique violation
            if (error.code === "23505") return NextResponse.json({ error: "You have already applied to this job" }, { status: 409 });
            throw error;
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
        const companyArr = job.company as unknown as { company_name: string }[];
        const companyName = Array.isArray(companyArr) ? companyArr[0]?.company_name : "the company";
        const candidateName = `${candidate.first_name} ${candidate.last_name}`;
        const employerArr = job.employer as unknown as { user_id: string; first_name: string; email: string }[];
        const employer = Array.isArray(employerArr) ? employerArr[0] : null;

        // Notify candidate
        await admin.from("notifications").insert({
            user_id: candidate.user_id,
            type: "application_submitted",
            title: "Application Submitted",
            body: `Your application for "${job.job_title}" has been submitted successfully.`,
            data: { job_id: id, application_id: application.id },
        });

        // Notify employer
        if (employer?.user_id) {
            await admin.from("notifications").insert({
                user_id: employer.user_id,
                type: "new_application",
                title: "New Application Received",
                body: `${candidateName} has applied for "${job.job_title}".`,
                data: { job_id: id, application_id: application.id, candidate_name: candidateName },
            });
        }

        // Emails (fire-and-forget)
        sendApplicationReceivedEmail({
            to: candidate.email,
            candidateName,
            jobTitle: job.job_title,
            companyName,
            applicationsUrl: `${baseUrl}/candidate/applications`,
        }).catch(console.error);

        if (employer?.email) {
            sendNewApplicationEmail({
                to: employer.email,
                employerName: employer.first_name,
                jobTitle: job.job_title,
                candidateName,
                applicationUrl: `${baseUrl}/employer/jobs/${id}`,
            }).catch(console.error);
        }

        return NextResponse.json({ application_id: application.id }, { status: 201 });
    } catch (error) {
        await logError({ source: "api/candidate/jobs/[id]/apply:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
