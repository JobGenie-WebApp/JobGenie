import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { sendCandidateRoundCancellationEmail } from '@/lib/interview-emails';
import { logBusiness, logError } from '@/lib/logger';
import { getUserTimezoneByEmail } from '@/lib/user-timezone';

// POST /api/candidate/interview-rounds/[roundId]/cancel-round
export async function POST(
    request: Request,
    { params }: { params: Promise<{ roundId: string }> }
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

        const { data: { user } } = await authClient.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const supabase = createAdminClient();

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

        const { roundId } = await params;

        // Fetch round and verify ownership via invitation -> candidate
        const { data: round, error: roundError } = await supabase
            .from('interview_rounds')
            .select(`
                id,
                status,
                interview_confirmed,
                round_canceled,
                invitation_id,
                invitation:job_invitations(candidate_id)
            `)
            .eq('id', roundId)
            .single();

        if (roundError || !round) {
            return NextResponse.json(
                { success: false, error: 'Interview round not found' },
                { status: 404 }
            );
        }

        const invitation = (round.invitation as unknown as { candidate_id: string } | null);
        if (!invitation || invitation.candidate_id !== candidate.id) {
            return NextResponse.json(
                { success: false, error: 'Interview round not found or unauthorized' },
                { status: 404 }
            );
        }

        if (!round.interview_confirmed) {
            return NextResponse.json(
                { success: false, error: 'Interview round is not confirmed yet' },
                { status: 400 }
            );
        }

        if (round.round_canceled) {
            return NextResponse.json(
                { success: false, error: 'Interview round is already canceled' },
                { status: 400 }
            );
        }

        const { error: updateError } = await supabase
            .from('interview_rounds')
            .update({
                round_canceled: true,
                canceled_by: 'candidate',
                cancellation_reason: cancellation_reason.trim(),
                canceled_at: new Date().toISOString(),
                status: 'canceled',
            })
            .eq('id', roundId);

        if (updateError) {
            console.error('Error canceling interview round:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to cancel interview round' },
                { status: 500 }
            );
        }

        // Send cancellation email to employer (async - non-blocking)
        const { data: fullRound } = await supabase
            .from('interview_rounds')
            .select(`
                round_label,
                round_number,
                selected_time_slot,
                confirmed_time,
                invitation:job_invitations(
                    job_designation,
                    candidate:candidates(first_name),
                    employer:employers(first_name, email)
                )
            `)
            .eq('id', roundId)
            .single();

        if (fullRound) {
            const inv = fullRound.invitation as unknown as { job_designation: string; candidate: { first_name: string }[]; employer: { first_name: string; email: string }[] } | null;
            const employer = inv?.employer?.[0] ?? null;
            const candidateInfo = inv?.candidate?.[0] ?? null;
            const timeSlot = fullRound.selected_time_slot as { time?: string; date?: string; is_alternative?: boolean } | null;
            const roundLabel = fullRound.round_label || `Round ${fullRound.round_number}`;

            const finalTime = timeSlot?.is_alternative && fullRound.confirmed_time
                ? fullRound.confirmed_time
                : timeSlot?.time || '';

            if (employer?.email) {
                getUserTimezoneByEmail(employer.email).then(recipientTz =>
                    sendCandidateRoundCancellationEmail(
                        employer.email,
                        employer.first_name,
                        candidateInfo?.first_name || '',
                        inv?.job_designation || '',
                        roundLabel,
                        timeSlot?.date || '',
                        finalTime,
                        cancellation_reason,
                        recipientTz
                    )
                ).catch(err => console.error('Email send error:', err));
            }
        }

        await logBusiness("round_canceled_by_candidate", user.id, "candidate", "interview_round", roundId, { reason: cancellation_reason });

        return NextResponse.json({
            success: true,
            message: 'Interview round canceled successfully'
        });
    } catch (error) {
        console.error('API error:', error);
        await logError({
            source: "api/candidate/interview-rounds/cancel-round:POST",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error)
        });
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
