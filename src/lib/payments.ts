"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { computeHiringFee, type SalaryPeriod } from "@/lib/hiring-fee";

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

// The payment types the application relies on. Ensured to exist at runtime so a
// fresh database (or one missing the seed) self-heals instead of failing.
const CORE_PAYMENT_TYPES: { code: string; label: string; description: string; sort_order: number }[] = [
  { code: "JOB_AD_PUBLISH", label: "Job Advertisement Publication", description: "Fee to publish a job advertisement", sort_order: 10 },
  { code: "JOB_AD_EXTEND", label: "Job Advertisement Extension", description: "Fee to extend an expired job advertisement", sort_order: 11 },
  { code: "hiring_fee", label: "Hiring Fee", description: "Fee payable when a candidate is hired (percentage of monthly salary)", sort_order: 12 },
];

// Idempotently create any missing core payment types. Safe to call on any path
// that needs them (payment creation, MIS config screens, employer quote).
export async function ensureCorePaymentTypes(): Promise<void> {
  const supabase = createAdminClient();
  const { data: existing } = await supabase.from("payment_types").select("code");
  const have = new Set((existing ?? []).map((r) => r.code));
  const missing = CORE_PAYMENT_TYPES.filter((t) => !have.has(t.code));
  if (missing.length === 0) return;
  await supabase.from("payment_types").insert(
    missing.map((t) => ({ code: t.code, label: t.label, description: t.description, is_active: true, sort_order: t.sort_order }))
  );
}

// Resolve a MIS user id that is guaranteed to exist in `mis_user` (needed to
// satisfy the created_by_mis_user_id FK). Prefers the provided/env id; if that
// row is missing, falls back to any existing MIS user.
export async function resolveSystemMisUserId(preferredUserId?: string): Promise<string> {
  const supabase = createAdminClient();
  if (preferredUserId) {
    const { data } = await supabase.from("mis_user").select("user_id").eq("user_id", preferredUserId).maybeSingle();
    if (data?.user_id) return data.user_id;
  }
  const { data: anyMis } = await supabase.from("mis_user").select("user_id").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!anyMis?.user_id) throw new Error("No MIS user exists to attribute the payment request to");
  return anyMis.user_id;
}

// Read the MIS-configured hiring fee percentage (defaults to 50 if unset).
export async function getHiringFeePercentage(): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("payment_settings").select("hiring_fee_percentage").eq("id", 1).maybeSingle();
  const pct = data ? Number(data.hiring_fee_percentage) : 50;
  return Number.isFinite(pct) && pct >= 0 ? pct : 50;
}

// Read the MIS-configured payment terms for hiring fees (defaults to 14 days).
export async function getHiringFeeDueDays(): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("payment_settings").select("hiring_fee_due_days").eq("id", 1).maybeSingle();
  const days = data ? Number(data.hiring_fee_due_days) : 14;
  return Number.isFinite(days) && days >= 1 ? days : 14;
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

  // Self-heal: make sure the core payment types exist before resolving.
  await ensureCorePaymentTypes();

  // Resolve a valid "created by" MIS user. The configured id (env) can drift
  // between environments; if it doesn't reference a real mis_user row, fall back
  // to any existing MIS user so the FK constraint is always satisfied.
  const createdByMisUserId = await resolveSystemMisUserId(created_by_mis_user_id);

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
      created_by_mis_user_id: createdByMisUserId,
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

// Bill a hire. The single place hiring-fee amount, currency, terms and wording
// are decided — used both by the automatic path (candidate accepts an offer)
// and by MIS creating a missed fee by hand from the Placements tab.
// The unique index on payment_requests.reference_invitation_id makes a second
// call for the same hire fail at the database, so this is safe to retry.
export async function createHiringFeeForInvitation(
  invitationId: string,
  createdByMisUserId?: string
): Promise<string> {
  const supabase = createAdminClient();

  const { data: inv, error } = await supabase
    .from("job_invitations")
    .select(`
      id, company_id, employer_id, job_id,
      employer:employers!job_invitations_employer_id_fkey(user_id),
      candidate:candidates!job_invitations_candidate_id_fkey(first_name, last_name),
      job_offer:job_offers!job_offers_invitation_id_fkey(salary_amount, salary_currency, salary_period, job_title)
    `)
    .eq("id", invitationId)
    .single();

  if (error || !inv) throw new Error(`Invitation ${invitationId} not found: ${error?.message ?? "no row"}`);

  // Embeds arrive as an object or a single-element array depending on how
  // PostgREST resolves the relationship.
  const first = <T,>(v: T | T[] | null | undefined): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

  const employer = first(inv.employer as unknown as { user_id: string } | { user_id: string }[]);
  const candidate = first(inv.candidate as unknown as { first_name: string; last_name: string } | { first_name: string; last_name: string }[]);
  const offer = first(
    inv.job_offer as unknown as
      | { salary_amount: number | null; salary_currency: string | null; salary_period: string | null; job_title: string }
      | { salary_amount: number | null; salary_currency: string | null; salary_period: string | null; job_title: string }[]
  );

  const pct = await getHiringFeePercentage();
  const fee = computeHiringFee(
    offer?.salary_amount ?? null,
    (offer?.salary_period ?? "monthly") as SalaryPeriod,
    pct
  );

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (await getHiringFeeDueDays()));

  const candidateName = candidate ? `${candidate.first_name} ${candidate.last_name}` : "the candidate";

  return createPaymentRequest({
    company_id: inv.company_id,
    employer_id: inv.employer_id,
    employer_user_id: employer?.user_id,
    payment_type_code: "hiring_fee",
    reference_invitation_id: invitationId,
    reference_job_id: inv.job_id ?? undefined,
    due_date: dueDate.toISOString().slice(0, 10),
    // Throws when no MIS user exists, so a missing creator surfaces to the
    // caller instead of silently skipping the bill.
    created_by_mis_user_id: await resolveSystemMisUserId(createdByMisUserId),
    // No usable salary on the offer: fall back to the configured hiring_fee
    // pricing by leaving amount/currency unset.
    ...(fee != null
      ? {
          amount: fee,
          currency: offer?.salary_currency ?? undefined,
          description: `Hiring fee (${pct}% of monthly salary): ${offer?.job_title ?? "Placement"} — ${candidateName}`,
        }
      : {}),
  });
}

// Alert every MIS user that a hire completed but was not billed, so the missing
// payment request can be created by hand from the Placements tab.
export async function notifyMisHiringFeeFailed(params: {
  invitation_id: string;
  company_name: string;
  candidate_name: string;
  reason: string;
}): Promise<void> {
  const { invitation_id, company_name, candidate_name, reason } = params;
  const supabase = createAdminClient();

  const { data: misUsers } = await supabase.from("mis_user").select("user_id");
  if (!misUsers || misUsers.length === 0) return;

  await supabase.from("notifications").insert(
    misUsers.map((u) => ({
      user_id: u.user_id,
      type: "hiring_fee_creation_failed",
      title: "Hiring Fee Not Created",
      body: `${company_name} hired ${candidate_name} but the hiring fee could not be created. Create it from MIS → Payments → Placements.`,
      data: { invitation_id, company_name, candidate_name, reason },
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
