import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
    action: z.enum(["republish", "dismiss"]),
    notes: z.string().trim().optional(),
});

type Params = { params: Promise<{ id: string }> };

// POST /api/mis/jobs/[id]/compliance-resolve
// MIS resolves an open compliance flag: "republish" puts the job live again and
// clears the lock; "dismiss" keeps it paused and locked. Only MIS can do this.
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
        const { action, notes } = parsed.data;

        const { data: flag } = await admin
            .from("job_compliance_flags")
            .select("id, status")
            .eq("job_id", id)
            .in("status", ["paused", "resubmitted"])
            .order("flagged_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!flag) return NextResponse.json({ error: "No open compliance flag for this job" }, { status: 404 });

        const { data: job } = await admin
            .from("jobs")
            .select("id, status, validity_days, job_title, employer:employers!jobs_employer_id_fkey(user_id, first_name, email)")
            .eq("id", id)
            .single();
        if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

        const now = new Date();
        const nowIso = now.toISOString();
        const employer = (job.employer as unknown as { user_id: string; first_name: string; email: string }[])?.[0] ?? null;

        if (action === "republish") {
            const expiresAt = new Date(now);
            expiresAt.setDate(expiresAt.getDate() + (job.validity_days ?? 30));

            await admin.from("jobs").update({
                status: "published",
                mis_pause_locked: false,
                published_at: nowIso,
                expires_at: expiresAt.toISOString(),
                updated_at: nowIso,
            }).eq("id", id);

            await admin.from("job_compliance_flags").update({
                status: "resolved",
                resolved_by_mis_user_id: misUser.user_id,
                resolved_at: nowIso,
                resolution_notes: notes ?? null,
            }).eq("id", flag.id);

            if (employer?.user_id) {
                await admin.from("notifications").insert({
                    user_id: employer.user_id,
                    type: "job_compliance_republished",
                    title: "Advertisement Republished",
                    body: `Your advertisement "${job.job_title}" has been republished and is accepting applications again.`,
                    data: { job_id: id, compliance_flag_id: flag.id },
                });
            }
        } else {
            // dismiss — keep paused & locked
            await admin.from("job_compliance_flags").update({
                status: "dismissed",
                resolved_by_mis_user_id: misUser.user_id,
                resolved_at: nowIso,
                resolution_notes: notes ?? null,
            }).eq("id", flag.id);

            if (employer?.user_id) {
                await admin.from("notifications").insert({
                    user_id: employer.user_id,
                    type: "job_compliance_dismissed",
                    title: "Document Request Declined",
                    body: `Your republication request for "${job.job_title}" was declined.${notes ? ` Note: ${notes}` : ""} The advertisement remains paused.`,
                    data: { job_id: id, compliance_flag_id: flag.id },
                });
            }
        }

        await logBusiness(`job_compliance_${action}`, user.id, "mis", "job", id, { compliance_flag_id: flag.id, notes });

        return NextResponse.json({ success: true });
    } catch (error) {
        await logError({ source: "api/mis/jobs/[id]/compliance-resolve:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
