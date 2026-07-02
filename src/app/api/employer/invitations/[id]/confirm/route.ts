import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { sendInterviewConfirmedEmail } from "@/lib/interview-emails";
import { logBusiness, logError } from "@/lib/logger";
import { getUserTimezoneByEmail } from "@/lib/user-timezone";

// POST /api/employer/invitations/[id]/confirm
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authClient = await createClient();
        const { confirmed_time, meeting_link, interview_address, map_link } = await request.json();

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
            .select('id, company_id')
            .eq('user_id', user.id)
            .single();

        if (employerError || !employer) {
            return NextResponse.json(
                { success: false, error: "Employer profile not found" },
                { status: 404 }
            );
        }

        const { id } = await params;

        // Verify the invitation belongs to this company and is accepted
        const { data: invitation, error: invitationError } = await supabase
            .from('job_invitations')
            .select('id, status, interview_mode, selected_time_slot, interview_confirmed, meeting_link, interview_address, map_link')
            .eq('id', id)
            .eq('company_id', employer.company_id)
            .eq('status', 'accepted')
            .single();

        if (invitationError || !invitation) {
            return NextResponse.json(
                { success: false, error: "Accepted invitation not found" },
                { status: 404 }
            );
        }

        // Check if already confirmed
        if (invitation.interview_confirmed) {
            return NextResponse.json(
                { success: false, error: "Interview already confirmed" },
                { status: 400 }
            );
        }

        // Resolve location details: prefer values submitted at confirm time, otherwise fall
        // back to what was attached when the interview was scheduled/edited.
        const resolvedMeetingLink = (meeting_link && meeting_link.trim() !== '')
            ? meeting_link.trim()
            : (invitation.meeting_link || null);
        const resolvedAddress = (interview_address && interview_address.trim() !== '')
            ? interview_address.trim()
            : (invitation.interview_address || null);

        // Validate based on interview mode
        if (invitation.interview_mode === 'online') {
            if (!resolvedMeetingLink) {
                return NextResponse.json(
                    { success: false, error: "Meeting link is required for online interviews" },
                    { status: 400 }
                );
            }
        } else if (invitation.interview_mode === 'physical') {
            if (!resolvedAddress) {
                return NextResponse.json(
                    { success: false, error: "Interview address is required for physical interviews" },
                    { status: 400 }
                );
            }
        }

        // Check if it's an alternative date
        const selectedSlot = invitation.selected_time_slot as { is_alternative?: boolean } | null;
        if (selectedSlot?.is_alternative && (!confirmed_time || confirmed_time.trim() === '')) {
            return NextResponse.json(
                { success: false, error: "Time slot is required for alternative dates" },
                { status: 400 }
            );
        }

        // Update invitation with confirmation details
        const updateData: Record<string, unknown> = {
            interview_confirmed: true,
            confirmed_at: new Date().toISOString()
        };

        if (selectedSlot?.is_alternative && confirmed_time) {
            updateData.confirmed_time = confirmed_time;
        }

        if (invitation.interview_mode === 'online') {
            updateData.meeting_link = resolvedMeetingLink;
        } else if (invitation.interview_mode === 'physical') {
            updateData.interview_address = resolvedAddress;
            if (map_link && map_link.trim() !== '') {
                updateData.map_link = map_link;
            }
        }

        const { error: updateError } = await supabase
            .from('job_invitations')
            .update(updateData)
            .eq('id', id);

        if (updateError) {
            console.error('Error confirming interview:', updateError);
            return NextResponse.json(
                { success: false, error: "Failed to confirm interview" },
                { status: 500 }
            );
        }

        // The confirmed initial interview IS Round 1 — create it now so the employer can
        // immediately record feedback instead of having to "Initialize Round 1" manually.
        try {
            const { data: existingRound } = await supabase
                .from('interview_rounds')
                .select('id')
                .eq('invitation_id', id)
                .eq('round_number', 1)
                .maybeSingle();

            if (!existingRound) {
                const slot = invitation.selected_time_slot as { date?: string; time?: string; is_alternative?: boolean } | null;
                const roundConfirmedTime = (slot?.is_alternative && confirmed_time) ? confirmed_time : (slot?.time ?? null);

                await supabase.from('interview_rounds').insert({
                    invitation_id: id,
                    round_number: 1,
                    round_label: 'Initial Interview',
                    status: 'confirmed',
                    given_time_slots: slot ? [slot] : [],
                    selected_time_slot: slot,
                    interview_mode: invitation.interview_mode,
                    interview_confirmed: true,
                    confirmed_time: roundConfirmedTime,
                    meeting_link: invitation.interview_mode === 'online' ? resolvedMeetingLink : null,
                    interview_address: invitation.interview_mode === 'physical' ? resolvedAddress : null,
                    map_link: invitation.interview_mode === 'physical' ? (invitation.map_link ?? null) : null,
                    confirmed_at: new Date().toISOString(),
                });

                await supabase
                    .from('job_invitations')
                    .update({ current_round_number: 1 })
                    .eq('id', id)
                    .lt('current_round_number', 1);
            }
        } catch (seedErr) {
            // Non-fatal: the client can still fall back to auto-seed / manual init.
            console.error('Round 1 auto-create error:', seedErr);
        }

        // Send confirmation email to candidate (async - non-blocking)
        const { data: fullInvitation } = await supabase
            .from('job_invitations')
            .select(`
                id,
                job_designation,
                interview_mode,
                selected_time_slot,
                confirmed_time,
                meeting_link,
                interview_address,
                candidate:candidates(first_name, email),
                company:companies(company_name)
            `)
            .eq('id', id)
            .single();

        if (fullInvitation) {
            const candidate = fullInvitation.candidate as unknown as { first_name: string; email: string };
            const company = fullInvitation.company as unknown as { company_name: string };
            const timeSlot = fullInvitation.selected_time_slot as { time?: string; date?: string; is_alternative?: boolean } | null;

            const finalTime = (timeSlot?.is_alternative && confirmed_time)
                ? confirmed_time
                : timeSlot?.time || '';

            const locationInfo = fullInvitation.interview_mode === 'online'
                ? resolvedMeetingLink
                : resolvedAddress;

            getUserTimezoneByEmail(candidate.email).then(recipientTz =>
                sendInterviewConfirmedEmail(
                    candidate.email,
                    candidate.first_name,
                    company.company_name,
                    fullInvitation.job_designation,
                    timeSlot?.date || '',
                    finalTime,
                    fullInvitation.interview_mode,
                    locationInfo,
                    id,
                    recipientTz
                )
            ).catch(err => console.error('Email send error:', err));
        }

        await logBusiness("interview_confirmed", user.id, "employer", "job_invitation", id, { interview_mode: invitation.interview_mode });
        return NextResponse.json({
            success: true,
            message: "Interview confirmed successfully"
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({ source: "api/employer/invitations/confirm:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
