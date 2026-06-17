import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";
import { sendInterviewConfirmedEmail } from "@/lib/interview-emails";
import { getUserTimezoneByEmail } from "@/lib/user-timezone";

// POST /api/employer/interview-rounds/:roundId/confirm
// Employer confirms an interview round after candidate acceptance
export async function POST(
    request: Request,
    { params }: { params: Promise<{ roundId: string }> }
) {
    try {
        const authClient = await createClient();
        const { roundId } = await params;
        const body = await request.json();
        const { confirmed_time, meeting_link } = body;

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
            .select('id, company_id, first_name, last_name')
            .eq('user_id', user.id)
            .single();

        if (employerError || !employer) {
            return NextResponse.json(
                { success: false, error: "Employer profile not found" },
                { status: 404 }
            );
        }

        // Get the interview round and verify permissions
        const { data: round, error: roundError } = await supabase
            .from('interview_rounds')
            .select(`
                id,
                round_number,
                round_label,
                status,
                selected_time_slot,
                interview_mode,
                interview_address,
                invitation:job_invitations!inner(
                    id,
                    company_id,
                    candidate_id,
                    job_designation,
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

        const invitation = round.invitation as unknown as { id: string; company_id: string; candidate_id: string; job_designation: string; candidate: { first_name: string; last_name: string; email: string }[] };

        // Verify the round belongs to this company
        if (invitation.company_id !== employer.company_id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized access to this interview round" },
                { status: 403 }
            );
        }

        // Check if round is in accepted status
        if (round.status !== 'accepted') {
            return NextResponse.json(
                { success: false, error: "Can only confirm rounds that have been accepted by the candidate" },
                { status: 400 }
            );
        }

        // Validate required fields based on interview mode
        const selectedSlot = round.selected_time_slot as { is_alternative?: boolean; date?: string; time?: string } | null;
        const isAlternative = selectedSlot?.is_alternative;

        if (isAlternative && !confirmed_time) {
            return NextResponse.json(
                { success: false, error: "Confirmed time is required for alternative dates" },
                { status: 400 }
            );
        }

        if (round.interview_mode === 'online' && !meeting_link) {
            return NextResponse.json(
                { success: false, error: "Meeting link is required for online interviews" },
                { status: 400 }
            );
        }
        // Physical: address was already provided when the round was created — no re-entry needed

        // Update the round with confirmation details
        const updateData: Record<string, unknown> = {
            interview_confirmed: true,
            status: 'confirmed',
            confirmed_at: new Date().toISOString()
        };

        if (confirmed_time) {
            updateData.confirmed_time = confirmed_time;
        }
        if (meeting_link) {
            updateData.meeting_link = meeting_link;
        }

        const { error: updateError } = await supabase
            .from('interview_rounds')
            .update(updateData)
            .eq('id', roundId);

        if (updateError) {
            console.error('Error confirming interview round:', updateError);
            return NextResponse.json(
                { success: false, error: "Failed to confirm interview round" },
                { status: 500 }
            );
        }

        // Get company info for email
        const { data: company } = await supabase
            .from('companies')
            .select('company_name')
            .eq('id', employer.company_id)
            .single();

        // Send confirmation email to candidate
        const candidate = invitation.candidate?.[0] ?? null;
        if (candidate && company) {
            const recipientTz = await getUserTimezoneByEmail(candidate.email);
            const interviewDate = selectedSlot?.date ?? '';
            const interviewTime = confirmed_time || selectedSlot?.time;
            
            // For online use the newly provided meeting link; for physical use address already on the round
            const meetingLinkOrAddress = round.interview_mode === 'online'
                ? meeting_link
                : (round.interview_address ?? '');
            
            sendInterviewConfirmedEmail(
                candidate.email,
                candidate.first_name,
                company.company_name,
                invitation.job_designation,
                interviewDate,
                interviewTime,
                round.interview_mode,
                meetingLinkOrAddress,
                invitation.id,
                recipientTz
            ).catch(err => console.error('Email send error:', err));
        }

        await logBusiness(
            "interview_round_confirmed",
            user.id,
            "employer",
            "interview_round",
            roundId,
            { 
                round_number: round.round_number,
                invitation_id: invitation.id,
                interview_mode: round.interview_mode
            }
        );

        return NextResponse.json({
            success: true,
            message: "Interview round confirmed successfully",
            data: {
                round_id: roundId,
                round_number: round.round_number,
                status: 'confirmed'
            }
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({
            source: "api/employer/interview-rounds/confirm:POST",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error)
        });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
