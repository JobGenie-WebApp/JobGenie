import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

// POST /api/employer/jobs/[id]/resume
export async function POST(_request: NextRequest, { params }: Params) {
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
            .select("id, status, company_id, expires_at")
            .eq("id", id)
            .eq("company_id", employer.company_id)
            .eq("is_deleted", false)
            .single();

        if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
        if (job.status !== "paused") return NextResponse.json({ error: "Only paused jobs can be resumed" }, { status: 400 });

        // Prevent resuming if already past expiry
        if (job.expires_at && new Date(job.expires_at) < new Date()) {
            return NextResponse.json({ error: "This job ad has expired and cannot be resumed. Please extend it instead." }, { status: 400 });
        }

        await admin.from("jobs").update({ status: "published" }).eq("id", id);
        return NextResponse.json({ success: true });
    } catch (error) {
        await logError({ source: "api/employer/jobs/[id]/resume:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
