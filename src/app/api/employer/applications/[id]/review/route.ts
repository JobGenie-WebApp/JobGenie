import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

// POST /api/employer/applications/[id]/review
// Lightweight transition: pending -> reviewed (marks that the employer has looked at it).
export async function POST(_request: NextRequest, { params }: Params) {
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

        const { data: application } = await supabase
            .from("job_applications")
            .select(`id, status, candidate_id, job:jobs!job_applications_job_id_fkey(id, company_id, job_title)`)
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

        // Only advance a fresh application; never overwrite a further-along status.
        if (application.status !== "pending") {
            return NextResponse.json({ success: true, message: "No change", data: { status: application.status } });
        }

        const now = new Date().toISOString();
        await supabase
            .from("job_applications")
            .update({ status: "reviewed", updated_at: now })
            .eq("id", applicationId);

        // Notify the candidate their application is being reviewed
        const { data: candidate } = await supabase
            .from("candidates")
            .select("user_id")
            .eq("id", application.candidate_id)
            .single();
        if (candidate?.user_id) {
            await supabase.from("notifications").insert({
                user_id: candidate.user_id,
                type: "application_reviewed",
                title: "Application Under Review",
                body: `Your application for "${job.job_title}" is now under review.`,
                data: { application_id: applicationId, job_id: job.id },
            });
        }

        await logBusiness("application_reviewed", user.id, "employer", "job_application", applicationId, { jobId: job.id });

        return NextResponse.json({ success: true, message: "Marked as reviewed", data: { status: "reviewed" } });
    } catch (error) {
        console.error("API error:", error);
        await logError({ source: "api/employer/applications/[id]/review:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
