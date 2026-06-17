import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { StorageService } from "@/lib/storage";
import { logError } from "@/lib/logger";

export async function DELETE(
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
            .from("candidates").select("id, resume_url").eq("user_id", user.id).single();
        if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

        // Fetch the resume to get its storage path and primary status
        const { data: resume } = await admin
            .from("candidate_resumes")
            .select("id, file_path, file_url, is_primary")
            .eq("id", id)
            .eq("candidate_id", candidate.id)
            .single();
        if (!resume) return NextResponse.json({ error: "Resume not found" }, { status: 404 });

        // Delete from Supabase Storage (ignore errors — file may already be gone)
        if (resume.file_path) {
            await StorageService.deleteResume(resume.file_path).catch(() => {});
        }

        // Delete from DB
        await admin.from("candidate_resumes").delete().eq("id", id);

        // If it was primary, promote the next most-recent resume (if any)
        if (resume.is_primary) {
            const { data: next } = await admin
                .from("candidate_resumes")
                .select("id, file_url")
                .eq("candidate_id", candidate.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (next) {
                await admin.from("candidate_resumes").update({ is_primary: true }).eq("id", next.id);
                await admin.from("candidates").update({ resume_url: next.file_url, updated_at: new Date().toISOString() }).eq("id", candidate.id);
            } else {
                // No more resumes — clear resume_url
                await admin.from("candidates").update({ resume_url: null, updated_at: new Date().toISOString() }).eq("id", candidate.id);
            }
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        await logError({ source: "api/candidate/resumes/[id]:DELETE", errorType: "APIError", message: e instanceof Error ? e.message : String(e) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
