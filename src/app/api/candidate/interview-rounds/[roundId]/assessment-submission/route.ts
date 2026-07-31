import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { validateUpload } from "@/lib/storage";
import { NextResponse } from "next/server";

const SUBMISSION_BUCKET = "assessment-submissions";
const MAX_SUBMISSION_SIZE = 10 * 1024 * 1024;
const SUBMISSION_FILE_TYPES = ["application/pdf", "application/zip", "application/x-zip-compressed"];

type RoundWithInvitation = {
    id: string;
    interview_mode: string | null;
    assessment_delivery_mode: string | null;
    assessment_deadline: string | null;
    assessment_submission_file_path: string | null;
    assessment_submission_file_name: string | null;
    round_canceled: boolean;
    outcome: string | null;
    invitation: { candidate_id: string } | { candidate_id: string }[];
};

export async function POST(
    request: Request,
    { params }: { params: Promise<{ roundId: string }> },
) {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { roundId } = await params;
    const supabase = createAdminClient();
    const { data: candidate } = await supabase.from("candidates").select("id").eq("user_id", user.id).single();
    if (!candidate) return NextResponse.json({ success: false, error: "Candidate profile not found" }, { status: 404 });

    const { data: roundData, error: roundError } = await supabase
        .from("interview_rounds")
        .select(`
            id,
            interview_mode,
            assessment_delivery_mode,
            assessment_deadline,
            assessment_submission_file_path,
            assessment_submission_file_name,
            round_canceled,
            outcome,
            invitation:job_invitations!inner(candidate_id)
        `)
        .eq("id", roundId)
        .single();
    const round = roundData as unknown as RoundWithInvitation | null;
    const invitation = Array.isArray(round?.invitation) ? round.invitation[0] : round?.invitation;
    if (roundError || !round || invitation?.candidate_id !== candidate.id) {
        return NextResponse.json({ success: false, error: "Assessment round not found" }, { status: 404 });
    }
    if (round.interview_mode !== "assessment" || round.assessment_delivery_mode !== "online") {
        return NextResponse.json({ success: false, error: "Submissions are only available for online assessments" }, { status: 400 });
    }
    if (round.round_canceled || round.outcome) {
        return NextResponse.json({ success: false, error: "This assessment no longer accepts submissions" }, { status: 400 });
    }
    if (!round.assessment_deadline || new Date(round.assessment_deadline) <= new Date()) {
        return NextResponse.json({ success: false, error: "The assessment deadline has passed" }, { status: 400 });
    }

    const formData = await request.formData();
    const fileValue = formData.get("file");
    const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;
    const linksValue = formData.get("links");
    let links: string[];
    try {
        const parsed = JSON.parse(typeof linksValue === "string" ? linksValue : "[]");
        if (!Array.isArray(parsed)) throw new Error("Invalid links");
        links = [...new Set(parsed.map(value => String(value).trim()).filter(Boolean))];
    } catch {
        return NextResponse.json({ success: false, error: "Invalid submission links" }, { status: 400 });
    }
    if (links.length > 5 || links.some(link => link.length > 2000 || !isHttpUrl(link))) {
        return NextResponse.json({ success: false, error: "Add up to 5 valid http(s) links" }, { status: 400 });
    }
    if (file) {
        try {
            validateUpload(file, SUBMISSION_FILE_TYPES, MAX_SUBMISSION_SIZE);
        } catch (error) {
            return NextResponse.json(
                { success: false, error: error instanceof Error ? error.message : "Invalid submission file" },
                { status: 400 },
            );
        }
    }
    if (!file && links.length === 0 && !round.assessment_submission_file_path) {
        return NextResponse.json({ success: false, error: "Upload a ZIP/PDF file or add at least one link" }, { status: 400 });
    }

    let newFilePath: string | null = null;
    if (file) {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        if (listError) return NextResponse.json({ success: false, error: "Failed to prepare submission storage" }, { status: 500 });
        if (!buckets?.some(bucket => bucket.name === SUBMISSION_BUCKET)) {
            const { error: bucketError } = await supabase.storage.createBucket(SUBMISSION_BUCKET, {
                public: false,
                fileSizeLimit: MAX_SUBMISSION_SIZE,
                allowedMimeTypes: SUBMISSION_FILE_TYPES,
            });
            if (bucketError) return NextResponse.json({ success: false, error: "Failed to prepare submission storage" }, { status: 500 });
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-160);
        newFilePath = `${candidate.id}/${round.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
            .from(SUBMISSION_BUCKET)
            .upload(newFilePath, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
        if (uploadError) {
            console.error("Assessment submission upload failed:", uploadError);
            return NextResponse.json({ success: false, error: "Failed to upload submission file" }, { status: 500 });
        }
    }

    const update: Record<string, unknown> = {
        assessment_submission_links: links,
        assessment_submitted_at: new Date().toISOString(),
    };
    if (file && newFilePath) {
        update.assessment_submission_file_path = newFilePath;
        update.assessment_submission_file_name = file.name.slice(0, 255);
        update.assessment_submission_file_type = file.type;
    }
    const { error: updateError } = await supabase.from("interview_rounds").update(update).eq("id", round.id);
    if (updateError) {
        if (newFilePath) await supabase.storage.from(SUBMISSION_BUCKET).remove([newFilePath]);
        console.error("Assessment submission update failed:", updateError);
        return NextResponse.json({ success: false, error: "Failed to save assessment submission" }, { status: 500 });
    }
    if (newFilePath && round.assessment_submission_file_path) {
        await supabase.storage.from(SUBMISSION_BUCKET).remove([round.assessment_submission_file_path]);
    }

    return NextResponse.json({
        success: true,
        message: round.assessment_submission_file_path || round.assessment_submission_file_name
            ? "Assessment submission updated"
            : "Assessment submitted successfully",
    });
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ roundId: string }> },
) {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { roundId } = await params;
    const supabase = createAdminClient();
    const { data: candidate } = await supabase.from("candidates").select("id").eq("user_id", user.id).single();
    const { data: round } = await supabase
        .from("interview_rounds")
        .select(`assessment_submission_file_path, assessment_submission_file_name, invitation:job_invitations!inner(candidate_id)`)
        .eq("id", roundId)
        .single();
    const invitation = round?.invitation as unknown as { candidate_id: string } | { candidate_id: string }[] | null;
    const candidateId = Array.isArray(invitation) ? invitation[0]?.candidate_id : invitation?.candidate_id;
    if (!candidate || !round?.assessment_submission_file_path || candidateId !== candidate.id) {
        return NextResponse.json({ success: false, error: "Submission file not found" }, { status: 404 });
    }
    const { data: signed, error } = await supabase.storage
        .from(SUBMISSION_BUCKET)
        .createSignedUrl(round.assessment_submission_file_path, 60, { download: round.assessment_submission_file_name || true });
    if (error || !signed?.signedUrl) return NextResponse.json({ success: false, error: "Failed to prepare download" }, { status: 500 });
    return NextResponse.redirect(signed.signedUrl);
}

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}
