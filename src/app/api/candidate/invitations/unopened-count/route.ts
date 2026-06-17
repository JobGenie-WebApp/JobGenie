import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export const dynamic = 'force-dynamic';

// GET /api/candidate/invitations/unopened-count

export async function GET() {
    try {
        const authClient = await createClient();

        // Get the current user
        const { data: { user } } = await authClient.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supabase = createAdminClient();

        // Get candidate record
        const { data: candidate, error: candidateError } = await supabase
            .from('candidates')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (candidateError || !candidate) {
            return NextResponse.json(
                { success: false, error: "Candidate profile not found" },
                { status: 404 }
            );
        }

        // Count unopened invitations (where viewed_at is null)
        const { count, error: countError } = await supabase
            .from('job_invitations')
            .select('id', { count: 'exact', head: true })
            .eq('candidate_id', candidate.id)
            .is('viewed_at', null)
            .eq('invitation_canceled', false);

        if (countError) {
            console.error('Error counting unopened invitations:', countError);
            return NextResponse.json(
                { success: false, error: "Failed to count unopened invitations" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            count: count || 0
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({ source: "api/candidate/invitations/unopened-count:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
