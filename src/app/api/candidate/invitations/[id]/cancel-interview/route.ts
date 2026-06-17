import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { sendCandidateCancellationEmail } from '@/lib/interview-emails';
import { logBusiness, logError } from '@/lib/logger';
import { getUserTimezoneByEmail } from '@/lib/user-timezone';

// POST /api/candidate/invitations/:id/cancel-interview
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authClient = await createClient();
        const { cancellation_reason } = await request.json();

        if (!cancellation_reason || cancellation_reason.trim() === '') {
            return NextResponse.json(
                { success: false, error: 'Cancellation reason is required' },
                { status: 400 }
            );
        }

        // Get the current user
        const { data: { user } } = await authClient.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
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
                { success: false, error: 'Candidate profile not found' },
                { status: 404 }
            );
        }

        const { id } = await params;

        // Verify the invitation belongs to this candidate
        const { data: invitation, error: invitationError } = await supabase
            .from('job_invitations')
            .select('id, status, interview_confirmed, invitation_canceled')
            .eq('id', id)
            .eq('candidate_id', candidate.id)
            .single();

        if (invitationError || !invitation) {
            return NextResponse.json(
                { success: false, error: 'Invitation not found' },
                { status: 404 }
            );
        }

        // Verify the interview is confirmed
        if (!invitation.interview_confirmed) {
            return NextResponse.json(
                { success: false, error: 'Interview is not confirmed yet' },
                { status: 400 }
            );
        }

        // Verify it's not already canceled
        if (invitation.invitation_canceled) {
            return NextResponse.json(
                { success: false, error: 'Interview is already canceled' },
                { status: 400 }
            );
        }

        // Cancel the interview
        const { error: updateError } = await supabase
            .from('job_invitations')
            .update({
                invitation_canceled: true,
                canceled_by: 'candidate',
                cancellation_reason: cancellation_reason.trim(),
                canceled_at: new Date().toISOString(),
                employer_last_seen_at: null,
            })
            .eq('id', id);

        if (updateError) {
            console.error('Error canceling interview:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to cancel interview' },
                { status: 500 }
            );
        }

        // Send cancellation email to employer (async - non-blocking)
        const { data: fullInvitation } = await supabase
            .from('job_invitations')
            .select(`
                job_designation,
                selected_time_slot,
                confirmed_time,
                candidate:candidates(first_name),
                employer:employers(first_name, email)
            `)
            .eq('id', id)
            .single();

        if (fullInvitation) {
            const candidate = fullInvitation.candidate as unknown as { first_name: string };
            const employer = fullInvitation.employer as unknown as { first_name: string; email: string };
            const timeSlot = fullInvitation.selected_time_slot as { time?: string; date?: string; is_alternative?: boolean } | null;

            const finalTime = timeSlot?.is_alternative && fullInvitation.confirmed_time
                ? fullInvitation.confirmed_time
                : timeSlot?.time || '';

            getUserTimezoneByEmail(employer.email).then(recipientTz =>
                sendCandidateCancellationEmail(
                    employer.email,
                    employer.first_name,
                    candidate.first_name,
                    fullInvitation.job_designation,
                    timeSlot?.date || '',
                    finalTime,
                    cancellation_reason,
                    recipientTz
                )
            ).catch(err => console.error('Email send error:', err));
        }

        await logBusiness("interview_canceled_by_candidate", user.id, "candidate", "job_invitation", id, { reason: cancellation_reason });
        return NextResponse.json({
            success: true,
            message: 'Interview canceled successfully'
        });
    } catch (error) {
        console.error('API error:', error);
        await logError({ source: "api/candidate/invitations/cancel-interview:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

