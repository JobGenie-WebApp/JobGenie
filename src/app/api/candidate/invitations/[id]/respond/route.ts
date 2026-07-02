import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";

// POST /api/candidate/invitations/:id/respond
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authClient = await createClient();
        const { action, selected_time_slot, request_reschedule, reschedule_reason } = await request.json();

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

        const { id } = await params;

        // Validate action
        if (!['accept', 'decline', 'cancel'].includes(action)) {
            return NextResponse.json(
                { success: false, error: "Invalid action. Must be 'accept', 'decline', or 'cancel'" },
                { status: 400 }
            );
        }

        // For accept action, selected_time_slot is required
        if (action === 'accept' && !selected_time_slot) {
            return NextResponse.json(
                { success: false, error: "Selected time slot is required when accepting" },
                { status: 400 }
            );
        }



        // Verify the invitation belongs to this candidate
        const { data: invitation, error: invitationError } = await supabase
            .from('job_invitations')
            .select('id, status, interview_mode, meeting_link, interview_address, map_link')
            .eq('id', id)
            .eq('candidate_id', candidate.id)
            .eq('invitation_canceled', false)
            .single();

        if (invitationError || !invitation) {
            return NextResponse.json(
                { success: false, error: "Invitation not found" },
                { status: 404 }
            );
        }

        // Check if invitation has already been responded to (unless canceling)
        if (action !== 'cancel' && invitation.status !== 'pending' && invitation.status !== 'viewed') {
            return NextResponse.json(
                { success: false, error: "Invitation has already been responded to" },
                { status: 400 }
            );
        }

        // For cancel action, verify invitation is currently accepted or declined
        if (action === 'cancel' && invitation.status !== 'accepted' && invitation.status !== 'declined') {
            return NextResponse.json(
                { success: false, error: "Can only cancel accepted or declined invitations" },
                { status: 400 }
            );
        }

        // Update invitation based on action
        const now = new Date().toISOString();
        let updateData: Record<string, unknown> = {};

        // Auto-confirm on accept when the employer already attached everything at scheduling time
        // (online → meeting link; physical → address) and a concrete time was picked — so the
        // manual employer "Confirm" step (and its button) is skipped.
        const inv = invitation as unknown as { interview_mode: string | null; meeting_link: string | null; interview_address: string | null; map_link: string | null };
        const acceptSlot = selected_time_slot as { time?: string; is_alternative?: boolean } | null;
        const autoConfirmInterview = action === 'accept'
            && !!acceptSlot?.time && !acceptSlot?.is_alternative
            && ((inv.interview_mode === 'online' && !!inv.meeting_link)
                || (inv.interview_mode === 'physical' && !!inv.interview_address));

        if (action === 'cancel') {
            // Reset to viewed and clear selected time slot (keep employer's interview mode)
            updateData = {
                status: 'viewed',
                selected_time_slot: null,
                responded_at: null,
                employer_last_seen_at: null,
            };
        } else {
            // Handle accept or decline
            updateData = {
                status: action === 'accept' ? 'accepted' : 'declined',
                responded_at: now,
                employer_last_seen_at: null,
            };

            // Add selected_time_slot if accepting
            if (action === 'accept' && selected_time_slot) {
                updateData.selected_time_slot = selected_time_slot;
            }

            if (autoConfirmInterview) {
                updateData.interview_confirmed = true;
                updateData.confirmed_at = now;
            }
        }

        const { error: updateError } = await supabase
            .from('job_invitations')
            .update(updateData)
            .eq('id', id);

        if (updateError) {
            console.error('Error updating invitation:', updateError);
            return NextResponse.json(
                { success: false, error: "Failed to update invitation" },
                { status: 500 }
            );
        }

        // When auto-confirmed, the initial interview IS Round 1 — create it now (mirrors the
        // employer confirm endpoint) so feedback/next-round work immediately.
        if (autoConfirmInterview) {
            const { data: existingRound } = await supabase
                .from('interview_rounds')
                .select('id')
                .eq('invitation_id', id)
                .eq('round_number', 1)
                .maybeSingle();

            if (!existingRound) {
                await supabase.from('interview_rounds').insert({
                    invitation_id: id,
                    round_number: 1,
                    round_label: 'Initial Interview',
                    status: 'confirmed',
                    given_time_slots: selected_time_slot ? [selected_time_slot] : [],
                    selected_time_slot: selected_time_slot,
                    interview_mode: inv.interview_mode,
                    interview_confirmed: true,
                    confirmed_time: acceptSlot?.time ?? null,
                    meeting_link: inv.interview_mode === 'online' ? inv.meeting_link : null,
                    interview_address: inv.interview_mode === 'physical' ? inv.interview_address : null,
                    map_link: inv.interview_mode === 'physical' ? inv.map_link : null,
                    confirmed_at: now,
                });
                await supabase
                    .from('job_invitations')
                    .update({ current_round_number: 1 })
                    .eq('id', id)
                    .lt('current_round_number', 1);
            }
        }

        const messages = {
            accept: autoConfirmInterview ? 'Interview confirmed — all details are set' : 'Invitation accepted successfully',
            decline: 'Invitation declined successfully',
            cancel: 'Acceptance cancelled successfully'
        };

        await logBusiness(`invitation_${action}`, user.id, "candidate", "job_invitation", id, { action });
        return NextResponse.json({
            success: true,
            message: messages[action as keyof typeof messages]
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({ source: "api/candidate/invitations/respond:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
