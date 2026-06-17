import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { sendEmployerCancellationEmail } from '@/lib/interview-emails';
import { logBusiness, logError } from '@/lib/logger';
import { getUserTimezoneByEmail } from '@/lib/user-timezone';

// POST /api/employer/invitations/:id/cancel-interview
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

        // Get employer record
        const { data: employer, error: employerError } = await supabase
            .from('employers')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (employerError || !employer) {
            return NextResponse.json(
                { success: false, error: 'Employer profile not found' },
                { status: 404 }
            );
        }

        const { id } = await params;

        // Verify the invitation belongs to this employer and is cancellable
        const { data: invitation, error: invitationError } = await supabase
            .from('job_invitations')
            .select('id, status, interview_confirmed, invitation_canceled, candidate_id')
            .eq('id', id)
            .eq('employer_id', employer.id)
            .single();

        if (invitationError || !invitation) {
            return NextResponse.json(
                { success: false, error: 'Invitation not found' },
                { status: 404 }
            );
        }

        // Must be accepted by the candidate to cancel
        if (invitation.status !== 'accepted') {
            return NextResponse.json(
                { success: false, error: 'Only accepted invitations can be cancelled' },
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
                canceled_by: 'employer',
                cancellation_reason: cancellation_reason.trim(),
                canceled_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            console.error('Error canceling interview:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to cancel interview' },
                { status: 500 }
            );
        }

        // Send cancellation email + in-app notification to candidate (async - non-blocking)
        const { data: fullInvitation } = await supabase
            .from('job_invitations')
            .select(`
                job_designation,
                selected_time_slot,
                confirmed_time,
                candidate:candidates(id, user_id, first_name, email),
                company:companies(company_name)
            `)
            .eq('id', id)
            .single();

        if (fullInvitation) {
            const candidate = fullInvitation.candidate as unknown as { id: string; user_id: string; first_name: string; email: string };
            const company = fullInvitation.company as unknown as { company_name: string };
            const timeSlot = fullInvitation.selected_time_slot as { time?: string; date?: string; is_alternative?: boolean } | null;

            const finalTime = timeSlot?.is_alternative && fullInvitation.confirmed_time
                ? fullInvitation.confirmed_time
                : timeSlot?.time || '';

            // In-app notification to candidate
            if (candidate?.user_id) {
                supabase.rpc('notify_user', {
                    p_user_id: candidate.user_id,
                    p_type: 'invitation_cancelled',
                    p_title: 'Interview Cancelled',
                    p_body: `${company?.company_name ?? 'The employer'} has cancelled your interview for ${fullInvitation.job_designation}`,
                    p_data: { invitation_id: id, reason: cancellation_reason.trim() }
                }).then(null, (err: unknown) => console.error('Notification error:', err));
            }

            // Email notification
            getUserTimezoneByEmail(candidate.email).then(recipientTz =>
                sendEmployerCancellationEmail(
                    candidate.email,
                    candidate.first_name,
                    company.company_name,
                    fullInvitation.job_designation,
                    timeSlot?.date || '',
                    finalTime,
                    cancellation_reason,
                    recipientTz
                )
            ).catch(err => console.error('Email send error:', err));
        }

        await logBusiness("interview_canceled_by_employer", user.id, "employer", "job_invitation", id, { reason: cancellation_reason });
        return NextResponse.json({
            success: true,
            message: 'Interview canceled successfully'
        });
    } catch (error) {
        console.error('API error:', error);
        await logError({ source: "api/employer/invitations/cancel-interview:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
