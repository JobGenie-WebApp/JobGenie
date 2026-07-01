import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { sendApplicationRejectedEmail } from "@/lib/job-advertisement-emails";
import { logBusiness, logError } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

// POST /api/employer/applications/[id]/reject
// Directly rejects an applicant without an interview, with an optional reason.
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const authClient = await createClient();
        const { data: { user } } = await authClient.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createAdminClient();

        const { data: employer } = await supabase
            .from("employers")
            .select("id, company_id")
            .eq("user_id", user.id)
            .single();
        if (!employer) {
            return NextResponse.json({ success: false, error: "Employer profile not found" }, { status: 404 });
        }

        const { id: applicationId } = await params;
        const body = await request.json().catch(() => ({}));
        const reason: string | undefined = typeof body.reason === "string" ? body.reason.trim() || undefined : undefined;

        const { data: application } = await supabase
            .from("job_applications")
            .select(`
                id, candidate_id, status,
                job:jobs!job_applications_job_id_fkey(id, company_id, job_title),
                job_invitation:job_invitations!job_invitations_application_id_fkey(id, pipeline_status, invitation_canceled)
            `)
            .eq("id", applicationId)
            .single();
        if (!application) {
            return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
        }

        const job = (Array.isArray(application.job) ? application.job[0] : application.job) as {
            id: string; company_id: string; job_title: string;
        } | null;
        if (!job || job.company_id !== employer.company_id) {
            return NextResponse.json({ success: false, error: "You do not have access to this application" }, { status: 403 });
        }

        if (application.status === "hired") {
            return NextResponse.json({ success: false, error: "This candidate has already been hired." }, { status: 409 });
        }

        // If an active interview process is underway, direct rejection is blocked —
        // it must be managed through the interview pipeline (Invitations).
        const invitation = (Array.isArray(application.job_invitation)
            ? application.job_invitation[0]
            : application.job_invitation) as { id: string; pipeline_status: string; invitation_canceled: boolean } | null;
        if (invitation && !invitation.invitation_canceled &&
            !["rejected", "withdrawn", "expired"].includes(invitation.pipeline_status)) {
            return NextResponse.json({
                success: false,
                error: "This candidate is in an active interview process. Manage the outcome from Invitations.",
                data: { invitationId: invitation.id },
            }, { status: 409 });
        }

        const now = new Date().toISOString();
        await supabase
            .from("job_applications")
            .update({ status: "rejected", notes: reason ?? null, updated_at: now })
            .eq("id", applicationId);

        // Notify + email the candidate
        const { data: candidate } = await supabase
            .from("candidates")
            .select("first_name, last_name, email, user_id")
            .eq("id", application.candidate_id)
            .single();
        const { data: company } = await supabase
            .from("companies")
            .select("company_name")
            .eq("id", employer.company_id)
            .single();

        if (candidate?.user_id) {
            await supabase.from("notifications").insert({
                user_id: candidate.user_id,
                type: "application_rejected",
                title: "Application Update",
                body: `Your application for "${job.job_title}" was not selected to move forward.`,
                data: { application_id: applicationId, job_id: job.id },
            });
        }

        if (candidate?.email) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
            sendApplicationRejectedEmail({
                to: candidate.email,
                candidateName: `${candidate.first_name} ${candidate.last_name}`,
                jobTitle: job.job_title,
                companyName: company?.company_name ?? "the company",
                reason,
                jobsUrl: `${baseUrl}/candidate/jobs`,
            }).catch(console.error);
        }

        await logBusiness("application_rejected", user.id, "employer", "job_application", applicationId, {
            jobId: job.id, hasReason: Boolean(reason),
        });

        return NextResponse.json({ success: true, message: "Applicant rejected" });
    } catch (error) {
        console.error("API error:", error);
        await logError({ source: "api/employer/applications/[id]/reject:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
