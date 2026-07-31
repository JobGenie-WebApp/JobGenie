import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ASSESSMENT_BUCKET = "assessment-attachments";
const SIGNED_URL_TTL_SECONDS = 60;

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ roundId: string }> },
) {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { roundId } = await params;
    const supabase = createAdminClient();
    const { data: candidate } = await supabase
        .from("candidates")
        .select("id")
        .eq("user_id", user.id)
        .single();
    if (!candidate) {
        return NextResponse.json({ success: false, error: "Candidate profile not found" }, { status: 404 });
    }

    const { data: round, error: roundError } = await supabase
        .from("interview_rounds")
        .select(`
            assessment_attachment_path,
            assessment_attachment_name,
            invitation:job_invitations!inner(candidate_id)
        `)
        .eq("id", roundId)
        .single();

    const invitation = round?.invitation as unknown as { candidate_id: string } | { candidate_id: string }[] | null;
    const candidateId = Array.isArray(invitation) ? invitation[0]?.candidate_id : invitation?.candidate_id;
    if (roundError || !round || candidateId !== candidate.id) {
        return NextResponse.json({ success: false, error: "Attachment not found" }, { status: 404 });
    }
    if (!round.assessment_attachment_path) {
        return NextResponse.json({ success: false, error: "This assessment has no attachment" }, { status: 404 });
    }

    const { data: signed, error: signError } = await supabase.storage
        .from(ASSESSMENT_BUCKET)
        .createSignedUrl(round.assessment_attachment_path, SIGNED_URL_TTL_SECONDS, {
            download: round.assessment_attachment_name || true,
        });

    if (signError || !signed?.signedUrl) {
        console.error("Failed to sign assessment attachment:", signError);
        return NextResponse.json({ success: false, error: "Failed to prepare attachment download" }, { status: 500 });
    }

    return NextResponse.redirect(signed.signedUrl);
}
