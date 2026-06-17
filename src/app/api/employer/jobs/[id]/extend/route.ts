import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { createPaymentRequest } from "@/lib/payments";
import { z } from "zod";

const extendSchema = z.object({
    validity_days: z.number().int().refine((v) => [30, 60, 90].includes(v)).optional(),
});

type Params = { params: Promise<{ id: string }> };

// POST /api/employer/jobs/[id]/extend
// Creates a JOB_AD_EXTEND payment request for an expired job.
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: employer } = await admin.from("employers").select("id, company_id").eq("user_id", user.id).single();
        if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

        const { id } = await params;
        const { data: job } = await admin
            .from("jobs")
            .select("id, status, company_id, job_title, validity_days")
            .eq("id", id)
            .eq("company_id", employer.company_id)
            .eq("is_deleted", false)
            .single();

        if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
        if (job.status !== "expired") return NextResponse.json({ error: "Only expired jobs can be extended" }, { status: 400 });

        // Check for existing active extension payment
        const { data: existingPr } = await admin
            .from("payment_requests")
            .select("id, status")
            .eq("reference_job_id", id)
            .in("status", ["pending_payment", "under_review"])
            .maybeSingle();

        if (existingPr) {
            return NextResponse.json({
                error: "A payment request is already pending or under review for this job",
                payment_request_id: existingPr.id,
            }, { status: 409 });
        }

        const body = await request.json().catch(() => ({}));
        const parsed = extendSchema.safeParse(body);
        const newValidityDays = parsed.success && parsed.data.validity_days ? parsed.data.validity_days : job.validity_days;

        // Update validity_days if changed
        if (newValidityDays !== job.validity_days) {
            await admin.from("jobs").update({ validity_days: newValidityDays }).eq("id", id);
        }

        const systemMisUserId = process.env.SYSTEM_MIS_USER_ID;
        if (!systemMisUserId) throw new Error("SYSTEM_MIS_USER_ID env var is not set");

        const paymentRequestId = await createPaymentRequest({
            company_id: employer.company_id,
            employer_id: employer.id,
            employer_user_id: user.id,
            payment_type_code: "JOB_AD_EXTEND",
            reference_job_id: id,
            created_by_mis_user_id: systemMisUserId,
            description: `Job Advertisement Extension (${newValidityDays} days): ${job.job_title}`,
        });

        return NextResponse.json({ payment_request_id: paymentRequestId }, { status: 201 });
    } catch (error) {
        await logError({ source: "api/employer/jobs/[id]/extend:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
