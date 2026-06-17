import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";
import { notifyEmployerPaymentReview } from "@/lib/payments";
import { handleJobAdPaymentAction } from "@/lib/job-advertisement";

// POST /api/mis/payments/[id]/review — approve or reject the latest payment proof
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { data: misUser } = await admin.from("mis_user").select("user_id").eq("user_id", user.id).single();
        if (!misUser) return NextResponse.json({ error: "MIS user profile not found" }, { status: 404 });

        const { id } = await params;
        const body = await request.json();
        const { action, review_notes } = body as { action: "approve" | "reject"; review_notes?: string };

        if (action !== "approve" && action !== "reject") {
            return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
        }

        // Load payment request
        const { data: paymentRequest } = await admin
            .from("payment_requests")
            .select(`
                id, status, amount, currency, company_id,
                employer:employers!payment_requests_employer_id_fkey(user_id),
                companies(company_name)
            `)
            .eq("id", id)
            .single();

        if (!paymentRequest) return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
        if (paymentRequest.status !== "under_review") {
            return NextResponse.json({ error: "Payment request is not under review" }, { status: 400 });
        }

        // Find the latest pending_review proof
        const { data: proof } = await admin
            .from("payment_proofs")
            .select("id, uploaded_by_employer_id")
            .eq("payment_request_id", id)
            .eq("status", "pending_review")
            .order("uploaded_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!proof) return NextResponse.json({ error: "No pending proof found" }, { status: 404 });

        const now = new Date().toISOString();
        const newProofStatus = action === "approve" ? "approved" : "rejected";
        const newRequestStatus = action === "approve" ? "verified" : "rejected";

        // Update proof status
        await admin
            .from("payment_proofs")
            .update({
                status: newProofStatus,
                reviewed_by_mis_user_id: misUser.user_id,
                reviewed_at: now,
                review_notes: review_notes ?? null,
            })
            .eq("id", proof.id);

        // Update payment request status
        await admin
            .from("payment_requests")
            .update({ status: newRequestStatus, updated_at: now })
            .eq("id", id);

        // Notify employer
        const employerData = (paymentRequest.employer as unknown as { user_id: string }[])?.[0] ?? null;
        if (employerData?.user_id) {
            await notifyEmployerPaymentReview({
                employer_user_id: employerData.user_id,
                payment_request_id: id,
                action: action === "approve" ? "approved" : "rejected",
                review_notes,
                amount: Number(paymentRequest.amount),
                currency: paymentRequest.currency,
            });
        }

        // Trigger job status change if this payment is for a job advertisement
        await handleJobAdPaymentAction(id, action === "approve" ? "approve" : "reject", review_notes);

        await logBusiness(
            `payment_proof_${action}d`,
            user.id,
            "mis",
            "payment_request",
            id,
            { proof_id: proof.id, review_notes }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        await logError({ source: "api/mis/payments/[id]/review:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
