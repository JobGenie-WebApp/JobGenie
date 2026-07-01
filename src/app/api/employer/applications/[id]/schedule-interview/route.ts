import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { sendInterviewInvitationEmail } from "@/lib/interview-emails";
import { getUserTimezoneByEmail } from "@/lib/user-timezone";
import { logBusiness, logError } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

// POST /api/employer/applications/[id]/schedule-interview
// Bridges a job application into the interview pipeline by creating a JobInvitation
// linked to the application, then reuses the existing interview/rounds/offer machinery.
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const authClient = await createClient();
        const { data: { user } } = await authClient.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createAdminClient();

        // Employer performing the action
        const { data: employer, error: employerError } = await supabase
            .from("employers")
            .select("id, company_id")
            .eq("user_id", user.id)
            .single();
        if (employerError || !employer) {
            return NextResponse.json({ success: false, error: "Employer profile not found" }, { status: 404 });
        }

        const { id: applicationId } = await params;

        // Load application + its job; verify it belongs to this employer's company
        const { data: application, error: appError } = await supabase
            .from("job_applications")
            .select(`
                id, candidate_id, status,
                job:jobs!job_applications_job_id_fkey(id, company_id, job_title, industry)
            `)
            .eq("id", applicationId)
            .single();
        if (appError || !application) {
            return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
        }

        const job = (Array.isArray(application.job) ? application.job[0] : application.job) as {
            id: string; company_id: string; job_title: string; industry: string | null;
        } | null;
        if (!job || job.company_id !== employer.company_id) {
            return NextResponse.json({ success: false, error: "You do not have access to this application" }, { status: 403 });
        }

        const candidateId = application.candidate_id;
        const industry = job.industry || "General";
        const jobDesignation = job.job_title;

        // Validate scheduling payload
        const body = await request.json();
        const { message, timeSlots, interviewMode, interviewAddress, mapLink } = body;

        if (!interviewMode) {
            return NextResponse.json({ success: false, error: "Interview mode is required" }, { status: 400 });
        }
        if (interviewMode === "physical" && !interviewAddress) {
            return NextResponse.json({ success: false, error: "Interview address is required for physical interviews" }, { status: 400 });
        }
        if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0 || timeSlots.length > 3) {
            return NextResponse.json({ success: false, error: "Invalid time slots (must be 1-3)" }, { status: 400 });
        }
        for (const slot of timeSlots) {
            if (!slot.date || !slot.time || !slot.order) {
                return NextResponse.json({ success: false, error: "Incomplete time slot data" }, { status: 400 });
            }
        }

        // Candidate must exist and be approved
        const { data: candidate, error: candidateError } = await supabase
            .from("candidates")
            .select("id, approval_status")
            .eq("id", candidateId)
            .eq("approval_status", "approved")
            .single();
        if (candidateError || !candidate) {
            return NextResponse.json({ success: false, error: "Candidate not found or not approved" }, { status: 404 });
        }

        // Block if this candidate has been hired by ANY company
        const { data: hiredInvitation } = await supabase
            .from("job_invitations")
            .select("id, company_id")
            .eq("candidate_id", candidateId)
            .eq("pipeline_status", "hired")
            .neq("invitation_canceled", true)
            .maybeSingle();
        if (hiredInvitation) {
            const isSameCompany = hiredInvitation.company_id === employer.company_id;
            return NextResponse.json({
                success: false,
                error: isSameCompany
                    ? "You have already hired this candidate."
                    : "This candidate has already accepted a job offer from another company.",
            }, { status: 409 });
        }

        // If an active invitation already exists for this candidate+company, link to it
        // instead of creating a duplicate.
        const { data: existingInvitation } = await supabase
            .from("job_invitations")
            .select("id, status, pipeline_status, interview_confirmed, invitation_canceled")
            .eq("candidate_id", candidateId)
            .eq("company_id", employer.company_id)
            .neq("invitation_canceled", true)
            .not("status", "in", "(declined,expired)")
            .not("pipeline_status", "in", "(rejected,withdrawn,expired)")
            .maybeSingle();
        if (existingInvitation) {
            return NextResponse.json({
                success: false,
                error: "An interview process with this candidate is already in progress.",
                data: { invitationId: existingInvitation.id },
            }, { status: 409 });
        }

        // Create the invitation, linked to the application
        const sentNow = new Date().toISOString();
        const { data: invitation, error: invitationError } = await supabase
            .from("job_invitations")
            .insert({
                application_id: applicationId,
                job_id: job.id,
                candidate_id: candidateId,
                employer_id: employer.id,
                company_id: employer.company_id,
                industry,
                job_designation: jobDesignation,
                message: message || null,
                status: "pending",
                given_time_slots: timeSlots,
                alternative_dates: null,
                employer_last_seen_at: sentNow,
                interview_mode: interviewMode,
                interview_address: interviewAddress || null,
                map_link: mapLink || null,
            })
            .select()
            .single();
        if (invitationError) {
            console.error("Error creating invitation:", invitationError);
            return NextResponse.json({ success: false, error: "Failed to schedule interview" }, { status: 500 });
        }

        // Advance the application to "shortlisted" (= in interview pipeline)
        await supabase
            .from("job_applications")
            .update({ status: "shortlisted", updated_at: sentNow })
            .eq("id", applicationId);

        // Notify + email the candidate
        const { data: candidateData } = await supabase
            .from("candidates")
            .select("first_name, email, user_id")
            .eq("id", candidateId)
            .single();
        const { data: companyData } = await supabase
            .from("companies")
            .select("company_name")
            .eq("id", employer.company_id)
            .single();

        if (candidateData?.user_id) {
            await supabase.from("notifications").insert({
                user_id: candidateData.user_id,
                type: "interview_scheduled",
                title: "Interview Invitation",
                body: `${companyData?.company_name ?? "A company"} has invited you to interview for "${jobDesignation}".`,
                data: { invitation_id: invitation.id, application_id: applicationId, job_id: job.id },
            });
        }

        if (candidateData && companyData) {
            const recipientTz = await getUserTimezoneByEmail(candidateData.email);
            sendInterviewInvitationEmail(
                candidateData.email,
                candidateData.first_name,
                companyData.company_name,
                jobDesignation,
                timeSlots,
                invitation.id,
                recipientTz
            ).catch((err) => console.error("Email send error:", err));
        }

        await logBusiness("invitation_sent", user.id, "employer", "job_invitation", invitation.id, {
            candidateId, industry, jobDesignation, source: "application", applicationId,
        });

        return NextResponse.json({
            success: true,
            message: "Interview scheduled successfully",
            data: { ...invitation, time_slots_count: timeSlots.length },
        });
    } catch (error) {
        console.error("API error:", error);
        await logError({ source: "api/employer/applications/[id]/schedule-interview:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
