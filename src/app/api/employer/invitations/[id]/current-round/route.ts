import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// GET /api/employer/invitations/[id]/current-round
// Get the current interview round for an invitation
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authClient = await createClient();
        const { id: invitationId } = await params;

        // Get the current user
        const { data: { user } } = await authClient.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supabase = createAdminClient();

        // Get employer record
        const { data: employer } = await supabase
            .from('employers')
            .select('company_id')
            .eq('user_id', user.id)
            .single();

        if (!employer) {
            return NextResponse.json(
                { success: false, error: "Employer profile not found" },
                { status: 404 }
            );
        }

        // Verify invitation belongs to this company and get current round number
        const { data: invitation, error: invitationError } = await supabase
            .from('job_invitations')
            .select('id, company_id, current_round_number')
            .eq('id', invitationId)
            .eq('company_id', employer.company_id)
            .single();

        if (invitationError || !invitation) {
            return NextResponse.json(
                { success: false, error: "Invitation not found or unauthorized" },
                { status: 404 }
            );
        }

        // Get the current round
        const { data: currentRound, error: roundError } = await supabase
            .from('interview_rounds')
            .select('id, round_number, outcome, outcome_notes, outcome_at, status')
            .eq('invitation_id', invitationId)
            .eq('round_number', invitation.current_round_number)
            .maybeSingle();

        // If no round exists, return null (migration not run or first confirmation pending)
        if (roundError && roundError.code !== 'PGRST116') {
            console.error('Error fetching current round:', roundError);
            return NextResponse.json(
                { success: false, error: "Failed to fetch current round" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: currentRound,
            current_round_number: invitation.current_round_number
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({
            source: "api/employer/invitations/current-round:GET",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error)
        });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
