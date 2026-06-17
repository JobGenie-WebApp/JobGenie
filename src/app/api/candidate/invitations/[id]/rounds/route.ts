import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// GET /api/candidate/invitations/[id]/rounds
// Get all interview rounds for a specific invitation (candidate view)
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

        // Get candidate record
        const { data: candidate } = await supabase
            .from('candidates')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!candidate) {
            return NextResponse.json(
                { success: false, error: "Candidate profile not found" },
                { status: 404 }
            );
        }

        // Verify invitation belongs to this candidate
        const { data: invitation, error: invitationError } = await supabase
            .from('job_invitations')
            .select('id, candidate_id')
            .eq('id', invitationId)
            .eq('candidate_id', candidate.id)
            .single();

        if (invitationError || !invitation) {
            return NextResponse.json(
                { success: false, error: "Invitation not found or unauthorized" },
                { status: 404 }
            );
        }

        // Get all interview rounds for this invitation
        const { data: rounds, error: roundsError } = await supabase
            .from('interview_rounds')
            .select(`
                id,
                round_number,
                round_label,
                status,
                outcome,
                outcome_notes,
                outcome_at,
                given_time_slots,
                alternative_dates,
                selected_time_slot,
                interview_mode,
                interview_confirmed,
                confirmed_time,
                meeting_link,
                interview_address,
                map_link,
                confirmed_at,
                round_canceled,
                canceled_by,
                cancellation_reason,
                canceled_at,
                mis_rescheduled,
                mis_reschedule_data,
                sent_at,
                viewed_at,
                responded_at
            `)
            .eq('invitation_id', invitationId)
            .order('round_number', { ascending: true });

        if (roundsError) {
            console.error('Error fetching rounds:', roundsError);
            return NextResponse.json(
                { success: false, error: "Failed to fetch interview rounds" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: rounds || []
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({
            source: "api/candidate/invitations/rounds:GET",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error)
        });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
