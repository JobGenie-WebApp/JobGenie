import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";
import { hasPermission } from "@/lib/permissions";
import { applicationStatusUpdateSchema } from "@/lib/validations/job-schema";

type Params = { params: Promise<{ id: string; appId: string }> };

// PATCH /api/mis/jobs/[id]/applications/[appId]
export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const canManage = await hasPermission("jobs", "manage_applications");
        if (!canManage) return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

        const { id, appId } = await params;

        const { data: app } = await admin
            .from("job_applications")
            .select("id, status, job_id")
            .eq("id", appId)
            .eq("job_id", id)
            .single();

        if (!app) return NextResponse.json({ error: "Application not found" }, { status: 404 });

        const body = await request.json();
        const parsed = applicationStatusUpdateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
        }

        await admin.from("job_applications").update({
            status: parsed.data.status,
            notes: parsed.data.notes ?? null,
        }).eq("id", appId);

        await logBusiness("application_status_updated", user.id, "mis", "job_application", appId, {
            previous_status: app.status,
            new_status: parsed.data.status,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        await logError({ source: "api/mis/jobs/[id]/applications/[appId]:PATCH", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
