import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { buildAtsUpdate } from "@/app/actions/ats-score";

type Params = { params: Promise<{ id: string }> };

// POST /api/employer/applications/[id]/ats-recompute
// Employer-triggered "Check again": re-scores the résumé against the job and
// persists the result. Used when the automatic apply-time scoring failed.
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
            .select(`
                id, resume_url, candidate_id,
                job:jobs!job_applications_job_id_fkey(id, company_id, job_title, description, experience_level),
                candidate:candidates!job_applications_candidate_id_fkey(resume_url)
            `)
            .eq("id", applicationId)
            .single();
        if (!application) {
            return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
        }

        const job = (Array.isArray(application.job) ? application.job[0] : application.job) as {
            id: string; company_id: string; job_title: string; description: string | null; experience_level: string | null;
        } | null;
        if (!job || job.company_id !== employer.company_id) {
            return NextResponse.json({ success: false, error: "You do not have access to this application" }, { status: 403 });
        }

        const candidate = (Array.isArray(application.candidate) ? application.candidate[0] : application.candidate) as {
            resume_url: string | null;
        } | null;
        const resumeUrl = application.resume_url ?? candidate?.resume_url ?? null;

        const atsUpdate = await buildAtsUpdate({
            jobTitle: job.job_title,
            jobDescription: job.description,
            experienceLevel: job.experience_level,
            resumeUrl,
        });

        await supabase.from("job_applications").update(atsUpdate).eq("id", applicationId);

        if (atsUpdate.ats_status === "failed") {
            return NextResponse.json({ success: false, error: atsUpdate.ats_error ?? "Scoring failed", data: atsUpdate });
        }

        return NextResponse.json({ success: true, message: "ATS score updated", data: atsUpdate });
    } catch (error) {
        console.error("API error:", error);
        await logError({ source: "api/employer/applications/[id]/ats-recompute:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
