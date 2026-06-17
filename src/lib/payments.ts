"use server";

import { createAdminClient } from "@/lib/supabase/admin";

interface CreatePaymentRequestParams {
  company_id: string;
  employer_id?: string;
  employer_user_id?: string; // for sending notification
  payment_type_code: string;
  reference_job_id?: string;
  reference_invitation_id?: string;
  amount?: number; // override; if omitted, looks up active pricing
  currency?: string;
  description?: string;
  due_date?: string; // ISO date string YYYY-MM-DD
  created_by_mis_user_id: string;
}

// Look up the current active price for a payment type code.
export async function getActivePrice(
  paymentTypeCode: string
): Promise<{ amount: number; currency: string }> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("payment_pricing")
    .select("amount, currency, payment_types!inner(code)")
    .eq("payment_types.code", paymentTypeCode)
    .eq("is_active", true)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    amount: data ? Number(data.amount) : 0,
    currency: (data?.currency as string) ?? "LKR",
  };
}

// Create a PaymentRequest and optionally notify the employer.
export async function createPaymentRequest(
  params: CreatePaymentRequestParams
): Promise<string> {
  const {
    company_id,
    employer_id,
    employer_user_id,
    payment_type_code,
    reference_job_id,
    reference_invitation_id,
    amount: overrideAmount,
    currency: overrideCurrency,
    description: overrideDescription,
    due_date,
    created_by_mis_user_id,
  } = params;

  const supabase = createAdminClient();

  // Resolve payment type
  const { data: paymentType } = await supabase
    .from("payment_types")
    .select("id, label")
    .eq("code", payment_type_code)
    .single();

  if (!paymentType) {
    throw new Error(`Unknown payment type code: ${payment_type_code}`);
  }

  // Resolve amount
  let finalAmount = overrideAmount;
  let finalCurrency = overrideCurrency ?? "LKR";
  if (finalAmount === undefined) {
    const pricing = await getActivePrice(payment_type_code);
    finalAmount = pricing.amount;
    finalCurrency = pricing.currency;
  }

  const description =
    overrideDescription ?? paymentType.label;

  const { data: paymentRequest, error } = await supabase
    .from("payment_requests")
    .insert({
      company_id,
      employer_id: employer_id ?? null,
      created_by_mis_user_id,
      payment_type_id: paymentType.id,
      reference_job_id: reference_job_id ?? null,
      reference_invitation_id: reference_invitation_id ?? null,
      amount: finalAmount,
      currency: finalCurrency,
      description,
      due_date: due_date ?? null,
      status: "pending_payment",
    })
    .select("id")
    .single();

  if (error || !paymentRequest) {
    throw new Error(`Failed to create payment request: ${error?.message}`);
  }

  // Notify employer if user_id provided
  if (employer_user_id) {
    await supabase.from("notifications").insert({
      user_id: employer_user_id,
      type: "payment_request_created",
      title: `New Payment Request: ${paymentType.label}`,
      body: `A payment of ${finalCurrency} ${Number(finalAmount).toFixed(2)} is due. Please review and submit payment proof.`,
      data: {
        payment_request_id: paymentRequest.id,
        payment_type: payment_type_code,
        amount: finalAmount,
        currency: finalCurrency,
      },
    });
  }

  return paymentRequest.id;
}

// Notify all MIS users about a submitted payment proof.
export async function notifyMisPaymentProofSubmitted(params: {
  payment_request_id: string;
  company_name: string;
  amount: number;
  currency: string;
}): Promise<void> {
  const { payment_request_id, company_name, amount, currency } = params;
  const supabase = createAdminClient();

  const { data: misUsers } = await supabase
    .from("mis_user")
    .select("user_id");

  if (!misUsers || misUsers.length === 0) return;

  await supabase.from("notifications").insert(
    misUsers.map((u) => ({
      user_id: u.user_id,
      type: "payment_proof_submitted",
      title: "Payment Proof Submitted",
      body: `${company_name} submitted proof for ${currency} ${Number(amount).toFixed(2)}. Please review.`,
      data: { payment_request_id, company_name, amount, currency },
    }))
  );
}

// Notify employer of MIS review outcome.
export async function notifyEmployerPaymentReview(params: {
  employer_user_id: string;
  payment_request_id: string;
  action: "approved" | "rejected";
  review_notes?: string;
  amount: number;
  currency: string;
}): Promise<void> {
  const { employer_user_id, payment_request_id, action, review_notes, amount, currency } = params;
  const supabase = createAdminClient();

  await supabase.from("notifications").insert({
    user_id: employer_user_id,
    type: action === "approved" ? "payment_proof_approved" : "payment_proof_rejected",
    title: action === "approved" ? "Payment Verified" : "Payment Proof Rejected",
    body:
      action === "approved"
        ? `Your payment of ${currency} ${Number(amount).toFixed(2)} has been verified.`
        : `Your payment proof was rejected. ${review_notes ? `Reason: ${review_notes}` : "Please re-upload your payment slip."}`,
    data: { payment_request_id, review_notes: review_notes ?? null },
  });
}
