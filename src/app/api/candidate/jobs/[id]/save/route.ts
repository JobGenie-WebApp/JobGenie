import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

type Params = { params: Promise<{ id: string }> };

// Resolve the signed-in candidate. Returns the candidate id or an error response.
async function resolveCandidate(userId: string) {
    const admin = createAdminClient();
    const { data: candidate } = await admin
        .from("candidates")
        .select("id")
        .eq("user_id", userId)
        .single();
    return candidate?.id ?? null;
}

// POST /api/candidate/jobs/[id]/save — save (bookmark) a job.
export async function POST(_request: NextRequest, { params }: Params) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const candidateId = await resolveCandidate(user.id);
        if (!candidateId) return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });

        const { id } = await params;
        const admin = createAdminClient();

        // Upsert on the unique (job_id, candidate_id) pair so repeated saves are idempotent.
        const { error } = await admin
            .from("saved_jobs")
            .upsert({ job_id: id, candidate_id: candidateId }, { onConflict: "job_id,candidate_id", ignoreDuplicates: true });
        if (error) throw error;

        return NextResponse.json({ success: true, saved: true }, { status: 201 });
    } catch (error) {
        await logError({ source: "api/candidate/jobs/[id]/save:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/candidate/jobs/[id]/save — remove a saved job.
export async function DELETE(_request: NextRequest, { params }: Params) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const candidateId = await resolveCandidate(user.id);
        if (!candidateId) return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });

        const { id } = await params;
        const admin = createAdminClient();

        const { error } = await admin
            .from("saved_jobs")
            .delete()
            .eq("job_id", id)
            .eq("candidate_id", candidateId);
        if (error) throw error;

        return NextResponse.json({ success: true, saved: false });
    } catch (error) {
        await logError({ source: "api/candidate/jobs/[id]/save:DELETE", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
