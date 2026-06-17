import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { createPaymentRequest } from "@/lib/payments";

type Params = { params: Promise<{ id: string }> };

// POST /api/employer/jobs/[id]/request-payment
// Creates a JOB_AD_PUBLISH payment request for a draft job.
export async function POST(_request: NextRequest, { params }: Params) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: employer } = await admin
            .from("employers")
            .select("id, company_id, user_id")
            .eq("user_id", user.id)
            .single();
        if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

        const { id } = await params;
        const { data: job } = await admin
            .from("jobs")
            .select("id, status, job_title, company_id")
            .eq("id", id)
            .eq("company_id", employer.company_id)
            .eq("is_deleted", false)
            .single();

        if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
        if (job.status !== "draft") {
            return NextResponse.json({ error: "Only draft jobs can request payment for publication" }, { status: 400 });
        }

        // Check for an existing active payment request
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

        const systemMisUserId = process.env.SYSTEM_MIS_USER_ID;
        if (!systemMisUserId) throw new Error("SYSTEM_MIS_USER_ID env var is not set");

        const paymentRequestId = await createPaymentRequest({
            company_id: employer.company_id,
            employer_id: employer.id,
            employer_user_id: user.id,
            payment_type_code: "JOB_AD_PUBLISH",
            reference_job_id: id,
            created_by_mis_user_id: systemMisUserId,
            description: `Job Advertisement Publication: ${job.job_title}`,
        });

        return NextResponse.json({ payment_request_id: paymentRequestId }, { status: 201 });
    } catch (error) {
        await logError({ source: "api/employer/jobs/[id]/request-payment:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
