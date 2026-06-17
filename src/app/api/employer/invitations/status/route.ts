import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export async function GET(request: Request) {
    try {
        const authClient = await createClient();
        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get("jobId");
        const candidateId = searchParams.get("candidateId");

        if (!jobId || !candidateId) {
            return NextResponse.json(
                { success: false, error: "Missing required parameters" },
                { status: 400 }
            );
        }

        // Get the current user
        const { data: { user } } = await authClient.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supabase = createAdminClient();

        // Check for existing invitation - single optimized query
        const { data: invitation, error } = await supabase
            .from('job_invitations')
            .select('status, sent_at')
            .eq('job_id', jobId)
            .eq('candidate_id', candidateId)
            .maybeSingle();

        if (error) {
            console.error('Error checking invitation status:', error);
            return NextResponse.json(
                { success: false, error: "Failed to check invitation status" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: invitation
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({ source: "api/employer/invitations/status:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
