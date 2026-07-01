import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// GET /api/employer/applications?jobId=&status=
// Aggregated applicant pipeline across all of the company's jobs, with the linked
// interview-invitation journey fields so the UI can show live stage + deep-link.
export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const jobIdFilter = searchParams.get("jobId");
        const statusFilter = searchParams.get("status");
        // When set, return only applicants not yet represented by an invitation card
        // (used by the unified hiring board's "Applied" column).
        const unlinkedOnly = searchParams.get("unlinkedOnly") === "1";

        // Resolve the company's (non-deleted) job ids
        let jobQuery = supabase
            .from("jobs")
            .select("id, job_title")
            .eq("company_id", employer.company_id)
            .eq("is_deleted", false);
        if (jobIdFilter) jobQuery = jobQuery.eq("id", jobIdFilter);
        const { data: jobs } = await jobQuery;

        const jobIds = (jobs ?? []).map((j) => j.id);
        if (jobIds.length === 0) {
            return NextResponse.json({ success: true, data: [], jobs: jobs ?? [] });
        }

        let appsQuery = supabase
            .from("job_applications")
            .select(`
                id, status, cover_letter, resume_url, applied_at, updated_at, notes,
                job:jobs!job_applications_job_id_fkey(id, job_title, industry),
                candidate:candidates!job_applications_candidate_id_fkey(
                    id, first_name, last_name, email, current_position, profile_image_url
                ),
                job_invitation:job_invitations!job_invitations_application_id_fkey(
                    id, status, pipeline_status, interview_confirmed, invitation_canceled,
                    current_round_number, mis_rescheduled,
                    job_offers(id, status)
                )
            `)
            .in("job_id", jobIds)
            .order("applied_at", { ascending: false });

        if (statusFilter) appsQuery = appsQuery.eq("status", statusFilter);

        const { data: applications, error } = await appsQuery;
        if (error) {
            console.error("Error fetching applications:", error);
            return NextResponse.json({ success: false, error: "Failed to fetch applications" }, { status: 500 });
        }

        // Normalize embedded arrays -> single objects
        let normalized = (applications ?? []).map((app) => {
            const inv = Array.isArray(app.job_invitation) ? app.job_invitation[0] : app.job_invitation;
            return {
                ...app,
                job: Array.isArray(app.job) ? app.job[0] : app.job,
                candidate: Array.isArray(app.candidate) ? app.candidate[0] : app.candidate,
                job_invitation: inv ?? null,
            };
        });

        // Board "Applied" column: drop anyone already represented by an invitation card.
        if (unlinkedOnly) {
            normalized = normalized.filter((app) => app.job_invitation == null);
        }

        return NextResponse.json({ success: true, data: normalized, jobs: jobs ?? [] });
    } catch (error) {
        console.error("API error:", error);
        await logError({ source: "api/employer/applications:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
