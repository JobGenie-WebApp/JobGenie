"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
    sendJobPublishedEmail,
    sendPaymentRejectedJobEmail,
} from "@/lib/job-advertisement-emails";

/**
 * Called by the MIS payment review route after approving/rejecting a proof.
 * Checks if the payment is for a job advertisement and updates the job status accordingly.
 */
export async function handleJobAdPaymentAction(
    paymentRequestId: string,
    action: "approve" | "reject",
    reviewNotes?: string
): Promise<void> {
    const admin = createAdminClient();

    // Load payment request with type code and job
    const { data: pr } = await admin
        .from("payment_requests")
        .select(`
            id,
            reference_job_id,
            payment_types!inner(code),
            employer:employers!payment_requests_employer_id_fkey(user_id, first_name, email)
        `)
        .eq("id", paymentRequestId)
        .single();

    if (!pr || !pr.reference_job_id) return;

    const typeCode = (pr.payment_types as unknown as { code: string })?.code;
    if (!["JOB_AD_PUBLISH", "JOB_AD_EXTEND"].includes(typeCode)) return;

    const { data: job } = await admin
        .from("jobs")
        .select("id, status, validity_days, job_title")
        .eq("id", pr.reference_job_id)
        .single();

    if (!job) return;

    const employerArr = pr.employer as unknown as { user_id: string; first_name: string; email: string }[];
    const employer = Array.isArray(employerArr) ? employerArr[0] : null;

    const now = new Date();

    if (action === "approve") {
        const canPublish =
            (typeCode === "JOB_AD_PUBLISH" && job.status === "draft") ||
            (typeCode === "JOB_AD_EXTEND" && job.status === "expired");

        if (!canPublish) return;

        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + (job.validity_days ?? 30));

        await admin
            .from("jobs")
            .update({
                status: "published",
                published_at: now.toISOString(),
                expires_at: expiresAt.toISOString(),
                updated_at: now.toISOString(),
            })
            .eq("id", job.id);

        // In-app notification to employer
        if (employer?.user_id) {
            await admin.from("notifications").insert({
                user_id: employer.user_id,
                type: "job_published",
                title: "Job Advertisement Published",
                body: `Your job advertisement "${job.job_title}" is now live and accepting applications.`,
                data: {
                    job_id: job.id,
                    job_title: job.job_title,
                    expires_at: expiresAt.toISOString(),
                },
            });
        }

        // Email notification
        if (employer?.email) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
            await sendJobPublishedEmail({
                to: employer.email,
                firstName: employer.first_name,
                jobTitle: job.job_title,
                expiresAt: expiresAt,
                jobUrl: `${baseUrl}/employer/jobs/${job.id}`,
            });
        }
    } else {
        // Rejected — notify employer to resubmit payment
        if (employer?.user_id) {
            await admin.from("notifications").insert({
                user_id: employer.user_id,
                type: "job_payment_rejected",
                title: "Payment Proof Rejected",
                body: `The payment proof for "${job.job_title}" was rejected. Please resubmit via the Payments page.${reviewNotes ? ` Reason: ${reviewNotes}` : ""}`,
                data: { job_id: job.id, payment_request_id: paymentRequestId },
            });
        }

        if (employer?.email) {
            await sendPaymentRejectedJobEmail({
                to: employer.email,
                firstName: employer.first_name,
                jobTitle: job.job_title,
                reason: reviewNotes,
            });
        }
    }
}
