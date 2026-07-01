import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

const PROOF_BUCKET = "payment-proofs";
const SIGNED_URL_TTL_SECONDS = 300; // 5 minutes

// GET /api/payments/proofs/[proofId]
// Payment proofs live in a PRIVATE bucket. This endpoint authorizes the caller
// (MIS reviewer, or the employer whose company owns the payment request) and
// redirects to a short-lived signed URL so the file can be viewed/downloaded.
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ proofId: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { proofId } = await params;

        // Load the proof together with the owning company of its payment request.
        const { data: proof } = await admin
            .from("payment_proofs")
            .select("id, file_path, payment_requests(company_id)")
            .eq("id", proofId)
            .single();

        if (!proof || !proof.file_path) {
            return NextResponse.json({ error: "Proof not found" }, { status: 404 });
        }

        // Authorization: MIS users can view any proof; employers only their own.
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        const role = userData?.role;

        if (role !== "mis") {
            const pr = proof.payment_requests as { company_id: string } | { company_id: string }[] | null;
            const ownerCompanyId = (Array.isArray(pr) ? pr[0] : pr)?.company_id;
            const { data: employer } = await admin
                .from("employers")
                .select("company_id")
                .eq("user_id", user.id)
                .single();
            if (!employer || !ownerCompanyId || employer.company_id !== ownerCompanyId) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const { data: signed, error: signErr } = await admin.storage
            .from(PROOF_BUCKET)
            .createSignedUrl(proof.file_path, SIGNED_URL_TTL_SECONDS);

        if (signErr || !signed?.signedUrl) {
            throw signErr ?? new Error("Failed to sign payment proof URL");
        }

        return NextResponse.redirect(signed.signedUrl);
    } catch (error) {
        await logError({ source: "api/payments/proofs/[proofId]:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
