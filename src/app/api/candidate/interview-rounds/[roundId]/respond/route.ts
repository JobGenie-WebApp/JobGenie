import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";

// POST /api/candidate/interview-rounds/:roundId/respond
// Candidate responds to an interview round invitation
export async function POST(
    request: Request,
    { params }: { params: Promise<{ roundId: string }> }
) {
    try {
        const authClient = await createClient();
        const { roundId } = await params;
        const body = await request.json();
        const { action, selected_time_slot, interview_mode } = body;

        // Validate action
        if (!['accept', 'decline'].includes(action)) {
            return NextResponse.json(
                { success: false, error: "Invalid action. Must be 'accept' or 'decline'" },
                { status: 400 }
            );
        }

        // For accept action, validate required fields
        if (action === 'accept') {
            if (!selected_time_slot) {
                return NextResponse.json(
                    { success: false, error: "Selected time slot is required when accepting" },
                    { status: 400 }
                );
            }
            // interview_mode is pre-set by employer; accept if provided, skip validation if absent
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

        // Get the interview round and verify it belongs to this candidate
        const { data: round, error: roundError } = await supabase
            .from('interview_rounds')
            .select(`
                id,
                round_number,
                status,
                invitation_id,
                invitation:job_invitations!inner(
                    id,
                    candidate_id,
                    company_id,
                    job_designation
                )
            `)
            .eq('id', roundId)
            .single();

        if (roundError || !round) {
            return NextResponse.json(
                { success: false, error: "Interview round not found" },
                { status: 404 }
            );
        }

        const invitation = round.invitation as unknown as { id: string; candidate_id: string };

        // Verify the round belongs to this candidate
        if (invitation.candidate_id !== candidate.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized access to this interview round" },
                { status: 403 }
            );
        }

        // Check if round can be responded to
        if (round.status !== 'pending' && round.status !== 'viewed') {
            return NextResponse.json(
                { success: false, error: "This round has already been responded to" },
                { status: 400 }
            );
        }

        // Update the round based on action
        const updateData: Record<string, unknown> = {
            status: action === 'accept' ? 'accepted' : 'declined',
            responded_at: new Date().toISOString()
        };

        if (action === 'accept') {
            updateData.selected_time_slot = selected_time_slot;
            updateData.interview_mode = interview_mode;
            updateData.viewed_at = updateData.viewed_at || new Date().toISOString();
        }

        const { error: updateError } = await supabase
            .from('interview_rounds')
            .update(updateData)
            .eq('id', roundId);

        if (updateError) {
            console.error('Error updating interview round:', updateError);
            return NextResponse.json(
                { success: false, error: "Failed to update interview round" },
                { status: 500 }
            );
        }

        await supabase
            .from("job_invitations")
            .update({ employer_last_seen_at: null })
            .eq("id", invitation.id);

        await logBusiness(
            `interview_round_${action}`,
            user.id,
            "candidate",
            "interview_round",
            roundId,
            { 
                action, 
                round_number: round.round_number,
                invitation_id: invitation.id,
                interview_mode 
            }
        );

        return NextResponse.json({
            success: true,
            message: action === 'accept' 
                ? 'Interview round accepted successfully' 
                : 'Interview round declined',
            data: {
                round_id: roundId,
                round_number: round.round_number,
                status: updateData.status
            }
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({
            source: "api/candidate/interview-rounds/respond:POST",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error)
        });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
