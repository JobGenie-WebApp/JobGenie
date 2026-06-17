import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

const statusActionSchema = z.object({
    action: z.enum(["publish", "pause", "resume", "expire", "restore", "delete"]),
    validity_days: z.number().int().refine((v) => [30, 60, 90].includes(v)).optional(),
});

type Params = { params: Promise<{ id: string }> };

// POST /api/mis/jobs/[id]/status — admin force-change job status
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const canManage = await hasPermission("jobs", "manage_status");
        if (!canManage) return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

        const { id } = await params;
        const body = await request.json();
        const parsed = statusActionSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
        }

        const { action, validity_days } = parsed.data;

        const { data: job } = await admin
            .from("jobs")
            .select("id, status, is_deleted, validity_days, job_title")
            .eq("id", id)
            .single();

        if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

        const now = new Date();
        let update: Record<string, unknown> = { updated_at: now.toISOString() };

        switch (action) {
            case "publish": {
                if (job.status !== "draft") return NextResponse.json({ error: "Only draft jobs can be force-published" }, { status: 400 });
                const days = validity_days ?? job.validity_days ?? 30;
                const expiresAt = new Date(now);
                expiresAt.setDate(expiresAt.getDate() + days);
                update = {
                    ...update,
                    status: "published",
                    published_at: now.toISOString(),
                    expires_at: expiresAt.toISOString(),
                    validity_days: days,
                };
                break;
            }
            case "pause":
                if (job.status !== "published") return NextResponse.json({ error: "Only published jobs can be paused" }, { status: 400 });
                update = { ...update, status: "paused" };
                break;
            case "expire":
                if (!["published", "paused"].includes(job.status)) {
                    return NextResponse.json({ error: "Only published or paused jobs can be manually expired" }, { status: 400 });
                }
                update = { ...update, status: "expired", expires_at: now.toISOString() };
                break;
            case "resume":
                if (job.status !== "paused") return NextResponse.json({ error: "Only paused jobs can be resumed" }, { status: 400 });
                update = { ...update, status: "published" };
                break;
            case "restore":
                if (!job.is_deleted) return NextResponse.json({ error: "Job is not deleted" }, { status: 400 });
                update = { ...update, status: "draft", is_deleted: false, deleted_at: null };
                break;
            case "delete":
                if (job.is_deleted) return NextResponse.json({ error: "Job is already deleted" }, { status: 400 });
                update = { ...update, status: "deleted", is_deleted: true, deleted_at: now.toISOString() };
                break;
        }

        await admin.from("jobs").update(update).eq("id", id);
        await logBusiness(`job_status_${action}`, user.id, "mis", "job", id, { previous_status: job.status });

        return NextResponse.json({ success: true });
    } catch (error) {
        await logError({ source: "api/mis/jobs/[id]/status:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
