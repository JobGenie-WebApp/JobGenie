import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

export async function PUT(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: candidate } = await admin
            .from("candidates").select("id").eq("user_id", user.id).single();
        if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

        // Verify the resume belongs to this candidate
        const { data: resume } = await admin
            .from("candidate_resumes")
            .select("id, file_url")
            .eq("id", id)
            .eq("candidate_id", candidate.id)
            .single();
        if (!resume) return NextResponse.json({ error: "Resume not found" }, { status: 404 });

        // Clear all primaries for this candidate, then set the selected one
        await admin.from("candidate_resumes")
            .update({ is_primary: false })
            .eq("candidate_id", candidate.id);

        await admin.from("candidate_resumes")
            .update({ is_primary: true, updated_at: new Date().toISOString() })
            .eq("id", id);

        // Sync candidates.resume_url to the new primary
        await admin.from("candidates")
            .update({ resume_url: resume.file_url, updated_at: new Date().toISOString() })
            .eq("id", candidate.id);

        return NextResponse.json({ success: true });
    } catch (e) {
        await logError({ source: "api/candidate/resumes/[id]/primary:PUT", errorType: "APIError", message: e instanceof Error ? e.message : String(e) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
