import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
    reason: z.string().trim().min(3, "A reason is required"),
    payment_request_id: z.string().uuid().optional(),
    proof_id: z.string().uuid().optional(),
});

type Params = { params: Promise<{ id: string }> };

// POST /api/mis/jobs/[id]/compliance-pause
// MIS pauses a published/paused job because its payment document is suspected fake.
// Locks the job so only MIS can republish, records a compliance flag, notifies the
// employer with the reason and alerts the rest of the MIS team.
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const canModerate = await hasPermission("jobs", "moderate");
        if (!canModerate) return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

        const { data: misUser } = await admin.from("mis_user").select("user_id").eq("user_id", user.id).single();
        if (!misUser) return NextResponse.json({ error: "MIS user profile not found" }, { status: 404 });

        const { id } = await params;
        const parsed = schema.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
        }
        const { reason, payment_request_id, proof_id } = parsed.data;

        const { data: job } = await admin
            .from("jobs")
            .select("id, status, job_title, mis_pause_locked, employer:employers!jobs_employer_id_fkey(user_id, first_name, email)")
            .eq("id", id)
            .eq("is_deleted", false)
            .single();

        if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
        if (!["published", "paused"].includes(job.status)) {
            return NextResponse.json({ error: "Only a live (published or paused) job can be flagged" }, { status: 400 });
        }

        // Avoid duplicate open flags for the same job.
        const { data: openFlag } = await admin
            .from("job_compliance_flags")
            .select("id")
            .eq("job_id", id)
            .in("status", ["paused", "resubmitted"])
            .maybeSingle();
        if (openFlag) {
            return NextResponse.json({ error: "An open compliance flag already exists for this job" }, { status: 409 });
        }

        const now = new Date().toISOString();

        await admin.from("jobs").update({ status: "paused", mis_pause_locked: true, updated_at: now }).eq("id", id);

        const { data: flag, error: flagErr } = await admin
            .from("job_compliance_flags")
            .insert({
                job_id: id,
                payment_request_id: payment_request_id ?? null,
                flagged_proof_id: proof_id ?? null,
                reason,
                flagged_by_mis_user_id: misUser.user_id,
                status: "paused",
            })
            .select("id")
            .single();

        if (flagErr || !flag) throw flagErr ?? new Error("Failed to create compliance flag");

        // Notify employer
        const employer = (job.employer as unknown as { user_id: string; first_name: string; email: string }[])?.[0] ?? null;
        if (employer?.user_id) {
            await admin.from("notifications").insert({
                user_id: employer.user_id,
                type: "job_compliance_paused",
                title: "Advertisement Paused — Document Review",
                body: `Your advertisement "${job.job_title}" was paused. Reason: ${reason}. Submit a corrected document from the job page to request republication.`,
                data: { job_id: id, compliance_flag_id: flag.id },
            });
        }

        const { data: misUsers } = await admin.from("mis_user").select("user_id");
        const recipients = (misUsers ?? []).filter((mis) => mis.user_id !== user.id);
        if (recipients.length) {
            await admin.from("notifications").insert(recipients.map((mis) => ({
                user_id: mis.user_id,
                type: "payment_suspicious_flagged",
                title: "Suspicious Payment Proof Flagged",
                body: `The payment document for "${job.job_title}" was flagged for compliance review. Reason: ${reason}`,
                data: { job_id: id, compliance_flag_id: flag.id, payment_request_id: payment_request_id ?? null },
            })));
        }

        await logBusiness("job_compliance_paused", user.id, "mis", "job", id, { compliance_flag_id: flag.id, reason });

        return NextResponse.json({ success: true, compliance_flag_id: flag.id });
    } catch (error) {
        await logError({ source: "api/mis/jobs/[id]/compliance-pause:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
