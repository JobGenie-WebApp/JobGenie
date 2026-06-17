import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/candidate/applications/[id] — withdraw application
export async function DELETE(_request: NextRequest, { params }: Params) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: candidate } = await admin
            .from("candidates")
            .select("id")
            .eq("user_id", user.id)
            .single();
        if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

        const { id } = await params;

        const { data: app } = await admin
            .from("job_applications")
            .select("id, status, candidate_id")
            .eq("id", id)
            .single();

        if (!app || app.candidate_id !== candidate.id) return NextResponse.json({ error: "Application not found" }, { status: 404 });
        if (app.status === "withdrawn") return NextResponse.json({ error: "Application already withdrawn" }, { status: 400 });
        if (["hired", "rejected"].includes(app.status)) {
            return NextResponse.json({ error: "Cannot withdraw an application with status: " + app.status }, { status: 400 });
        }

        await admin.from("job_applications").update({ status: "withdrawn" }).eq("id", id);
        return NextResponse.json({ success: true });
    } catch (error) {
        await logError({ source: "api/candidate/applications/[id]:DELETE", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
