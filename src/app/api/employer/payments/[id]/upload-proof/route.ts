import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";
import { notifyMisPaymentProofSubmitted } from "@/lib/payments";

// POST /api/employer/payments/[id]/upload-proof
// Body: multipart/form-data — file, bank_transfer_reference (optional)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();

        const { data: employer } = await admin
            .from("employers")
            .select("id, company_id")
            .eq("user_id", user.id)
            .single();

        if (!employer) return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });

        const { id } = await params;

        // Verify payment request belongs to employer's company and is actionable
        const { data: paymentRequest } = await admin
            .from("payment_requests")
            .select("id, status, amount, currency, company_id, companies(company_name)")
            .eq("id", id)
            .eq("company_id", employer.company_id)
            .single();

        if (!paymentRequest) return NextResponse.json({ error: "Payment request not found" }, { status: 404 });

        if (!["pending_payment", "rejected"].includes(paymentRequest.status as string)) {
            return NextResponse.json({ error: "Cannot upload proof for a payment in this status" }, { status: 400 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const bankTransferReference = (formData.get("bank_transfer_reference") as string | null) ?? null;

        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

        const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Only PDF, JPG, PNG, or WEBP files are allowed" }, { status: 400 });
        }
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
        }

        // Upload to payment-proofs bucket via existing upload API
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("bucket", "payment-proofs");
        uploadFormData.append("folder", `${employer.company_id}/${id}`);

        // Call internal upload API
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const uploadRes = await fetch(`${baseUrl}/api/upload`, {
            method: "POST",
            body: uploadFormData,
            headers: { Cookie: request.headers.get("Cookie") ?? "" },
        });

        if (!uploadRes.ok) {
            const errBody = await uploadRes.json().catch(() => ({}));
            return NextResponse.json({ error: errBody.error ?? "File upload failed" }, { status: 500 });
        }

        const { url: fileUrl, fileName: filePath } = await uploadRes.json();

        const now = new Date().toISOString();

        // Create proof record
        const { data: proof, error: proofErr } = await admin
            .from("payment_proofs")
            .insert({
                payment_request_id: id,
                uploaded_by_employer_id: employer.id,
                file_url: fileUrl,
                file_path: filePath,
                file_name: file.name,
                file_type: file.type,
                uploaded_at: now,
                status: "pending_review",
            })
            .select()
            .single();

        if (proofErr || !proof) throw proofErr ?? new Error("Failed to create proof record");

        // Update payment request status to under_review and optionally store bank ref
        await admin
            .from("payment_requests")
            .update({
                status: "under_review",
                updated_at: now,
                ...(bankTransferReference ? { bank_transfer_reference: bankTransferReference } : {}),
            })
            .eq("id", id);

        // Notify MIS
        const companyData = paymentRequest.companies as { company_name?: string } | null;
        await notifyMisPaymentProofSubmitted({
            payment_request_id: id,
            company_name: companyData?.company_name ?? "Unknown Company",
            amount: Number(paymentRequest.amount),
            currency: paymentRequest.currency as string,
        });

        await logBusiness("payment_proof_uploaded", user.id, "employer", "payment_request", id, { proof_id: proof.id });

        return NextResponse.json({ success: true, data: proof }, { status: 201 });
    } catch (error) {
        await logError({ source: "api/employer/payments/[id]/upload-proof:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
