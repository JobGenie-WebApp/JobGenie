import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const SUBMISSION_BUCKET = "assessment-submissions";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ roundId: string }> },
) {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { roundId } = await params;
    const supabase = createAdminClient();
    const { data: employer } = await supabase.from("employers").select("company_id").eq("user_id", user.id).single();
    const { data: round } = await supabase
        .from("interview_rounds")
        .select(`assessment_submission_file_path, assessment_submission_file_name, invitation:job_invitations!inner(company_id)`)
        .eq("id", roundId)
        .single();
    const invitation = round?.invitation as unknown as { company_id: string } | { company_id: string }[] | null;
    const companyId = Array.isArray(invitation) ? invitation[0]?.company_id : invitation?.company_id;
    if (!employer || !round?.assessment_submission_file_path || companyId !== employer.company_id) {
        return NextResponse.json({ success: false, error: "Submission file not found" }, { status: 404 });
    }
    const { data: signed, error } = await supabase.storage
        .from(SUBMISSION_BUCKET)
        .createSignedUrl(round.assessment_submission_file_path, 60, { download: round.assessment_submission_file_name || true });
    if (error || !signed?.signedUrl) return NextResponse.json({ success: false, error: "Failed to prepare download" }, { status: 500 });
    return NextResponse.redirect(signed.signedUrl);
}
