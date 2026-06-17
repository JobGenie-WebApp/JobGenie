import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { StorageService } from "@/lib/storage";
import { logError } from "@/lib/logger";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_RESUMES = 5;

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: candidate } = await admin
            .from("candidates").select("id").eq("user_id", user.id).single();
        if (!candidate) return NextResponse.json({ error: "Candidate not found" }, { status: 404 });

        const { data: resumes, error } = await admin
            .from("candidate_resumes")
            .select("id, file_name, file_url, is_primary, created_at")
            .eq("candidate_id", candidate.id)
            .order("created_at", { ascending: false });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true, resumes: resumes ?? [] });
    } catch (e) {
        await logError({ source: "api/candidate/resumes:GET", errorType: "APIError", message: e instanceof Error ? e.message : String(e) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

        if (file.type !== "application/pdf")
            return NextResponse.json({ error: "Only PDF files are allowed." }, { status: 400 });
        if (file.size > MAX_FILE_SIZE)
            return NextResponse.json({ error: "File size must not exceed 5 MB." }, { status: 400 });

        const admin = createAdminClient();
        const { data: candidate } = await admin
            .from("candidates").select("id").eq("user_id", user.id).single();
        if (!candidate) return NextResponse.json({ error: "Candidate profile not found." }, { status: 404 });

        // Enforce per-candidate limit
        const { count } = await admin
            .from("candidate_resumes")
            .select("id", { count: "exact", head: true })
            .eq("candidate_id", candidate.id);
        if ((count ?? 0) >= MAX_RESUMES)
            return NextResponse.json({ error: `You can upload at most ${MAX_RESUMES} resumes.` }, { status: 400 });

        // Watermark & upload via StorageService
        const { url, filePath } = await StorageService.uploadResume(candidate.id, file);

        // Clean display name from original filename
        const displayName = file.name
            .replace(/\.[^.]+$/, "")         // strip extension
            .replace(/[_-]+/g, " ")           // underscores/dashes → spaces
            .replace(/\s+/g, " ").trim()
            || "My Resume";

        // Is this the first resume? → make it primary
        const isFirst = (count ?? 0) === 0;

        const { data: inserted, error: insertError } = await admin
            .from("candidate_resumes")
            .insert({ candidate_id: candidate.id, file_name: displayName, file_url: url, file_path: filePath, is_primary: isFirst })
            .select("id, file_name, file_url, is_primary, created_at")
            .single();

        if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

        // If first resume, also sync candidates.resume_url
        if (isFirst) {
            await admin.from("candidates").update({ resume_url: url, updated_at: new Date().toISOString() }).eq("id", candidate.id);
        }

        return NextResponse.json({ success: true, resume: inserted });
    } catch (e) {
        await logError({ source: "api/candidate/resumes:POST", errorType: "APIError", message: e instanceof Error ? e.message : String(e) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
