import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";

// POST /api/employer/interview-rounds/[roundId]/feedback
// Add interview feedback and outcome for a specific round
export async function POST(
    request: Request,
    { params }: { params: Promise<{ roundId: string }> }
) {
    try {
        const authClient = await createClient();
        const { roundId } = await params;
        const body = await request.json();
        const { outcome, outcome_notes } = body;

        // Validate outcome
        const validOutcomes = ['advance', 'reject', 'offer', 'no_decision'];
        if (!outcome || !validOutcomes.includes(outcome)) {
            return NextResponse.json(
                { success: false, error: "Invalid outcome. Must be one of: advance, reject, offer, no_decision" },
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

        // Get employer record
        const { data: employer, error: employerError } = await supabase
            .from('employers')
            .select('id, company_id, user_id')
            .eq('user_id', user.id)
            .single();

        if (employerError || !employer) {
            return NextResponse.json(
                { success: false, error: "Employer profile not found" },
                { status: 404 }
            );
        }

        // Get the interview round and verify it belongs to this company
        const { data: round, error: roundError } = await supabase
            .from('interview_rounds')
            .select(`
                id,
                invitation_id,
                round_number,
                status,
                outcome,
                invitation:job_invitations!inner(
                    id,
                    company_id,
                    candidate_id,
                    pipeline_status
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

        // Type assertion for nested invitation
        const invitation = round.invitation as unknown as { id: string; company_id: string; candidate_id: string; candidate: { first_name: string; last_name: string; email: string }[]; pipeline_status: string } | null;

        if (!invitation) return NextResponse.json({ success: false, error: "Invitation not found" }, { status: 404 });

        // Verify the round belongs to this company
        if (invitation.company_id !== employer.company_id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized access to this interview round" },
                { status: 403 }
            );
        }

        // Check if round is in a state that allows feedback
        if (round.status !== 'confirmed' && round.status !== 'completed') {
            return NextResponse.json(
                { success: false, error: "Can only add feedback to confirmed or completed interviews" },
                { status: 400 }
            );
        }

        // Check if feedback already exists
        if (round.outcome && round.outcome !== 'no_decision') {
            return NextResponse.json(
                { success: false, error: "Feedback has already been provided for this round" },
                { status: 400 }
            );
        }

        // Update the round with outcome and feedback
        const { error: updateError } = await supabase
            .from('interview_rounds')
            .update({
                outcome: outcome,
                outcome_notes: outcome_notes || null,
                outcome_at: new Date().toISOString(),
                outcome_by: employer.user_id,
                status: outcome === 'advance' ? 'completed' : round.status
            })
            .eq('id', roundId);

        if (updateError) {
            console.error('Error updating interview round:', updateError);
            return NextResponse.json(
                { success: false, error: "Failed to save feedback" },
                { status: 500 }
            );
        }

        await logBusiness(
            "interview_feedback_added",
            user.id,
            "employer",
            "interview_round",
            roundId,
            { outcome, round_number: round.round_number, invitation_id: invitation.id }
        );

        return NextResponse.json({
            success: true,
            message: "Interview feedback saved successfully",
            data: {
                outcome,
                round_number: round.round_number,
                next_action: outcome === 'advance' ? 'create_next_round' : 
                            outcome === 'offer' ? 'create_job_offer' : 
                            outcome === 'reject' ? 'candidate_rejected' : 
                            'no_further_action'
            }
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({
            source: "api/employer/interview-rounds/feedback:POST",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error)
        });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// GET /api/employer/interview-rounds/[roundId]/feedback
// Get feedback for a specific round
export async function GET(
    request: Request,
    { params }: { params: Promise<{ roundId: string }> }
) {
    try {
        const authClient = await createClient();
        const { roundId } = await params;

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

        // Get the interview round with feedback
        const { data: round, error: roundError } = await supabase
            .from('interview_rounds')
            .select(`
                id,
                round_number,
                round_label,
                status,
                outcome,
                outcome_notes,
                outcome_at,
                outcome_by,
                confirmed_at,
                invitation:job_invitations!inner(
                    id,
                    company_id,
                    candidate:candidates(
                        first_name,
                        last_name,
                        email
                    )
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

        const invitation = round.invitation as unknown as { id: string; company_id: string; candidate_id: string; candidate: { first_name: string; last_name: string; email: string }[]; pipeline_status: string } | null;

        if (!invitation) return NextResponse.json({ success: false, error: "Invitation not found" }, { status: 404 });

        // Verify access
        if (invitation.company_id !== employer.company_id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            data: round
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({
            source: "api/employer/interview-rounds/feedback:GET",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error)
        });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
