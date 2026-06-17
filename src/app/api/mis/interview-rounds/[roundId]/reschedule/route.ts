import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    sendMISRoundRescheduleNotificationToCandidate,
    sendMISRoundRescheduleNotificationToEmployer
} from "@/lib/interview-emails";
import { logAudit, logError } from "@/lib/logger";
import { getUserTimezone, getUserTimezoneByEmail } from "@/lib/user-timezone";
import { formatInTimeZone } from "date-fns-tz";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ roundId: string }> }
) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized - Please log in" },
                { status: 401 }
            );
        }

        const adminClient = createAdminClient();
        const { data: userRecord, error: userError } = await adminClient
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        if (userError || !userRecord || userRecord.role !== "mis") {
            return NextResponse.json(
                { error: "Forbidden - MIS access required" },
                { status: 403 }
            );
        }

        const { roundId } = await params;
        const body = await request.json();

        const { date, time, interview_mode, meeting_link, interview_address, map_link, notes } = body;

        if (!date || !time || !interview_mode) {
            return NextResponse.json(
                { error: "Missing required fields: date, time, interview_mode" },
                { status: 400 }
            );
        }

        if (interview_mode === "online" && !meeting_link) {
            return NextResponse.json(
                { error: "Meeting link is required for online interviews" },
                { status: 400 }
            );
        }

        if (interview_mode === "physical" && !interview_address) {
            return NextResponse.json(
                { error: "Interview address is required for physical interviews" },
                { status: 400 }
            );
        }

        const misUserTz = await getUserTimezone(user.id);
        const todayInUserTz = formatInTimeZone(new Date(), misUserTz, "yyyy-MM-dd");
        if (date < todayInUserTz) {
            return NextResponse.json(
                { error: "Interview date must be in the future" },
                { status: 400 }
            );
        }

        const timeRegex = /^(0?[9]|1[0-2]|0?[1-4]):(00|30) (AM|PM)$/;
        if (!timeRegex.test(time)) {
            return NextResponse.json(
                { error: "Invalid time format. Use 30-minute intervals between 9:00 AM and 5:00 PM" },
                { status: 400 }
            );
        }

        // Fetch round to verify eligibility
        const { data: round, error: fetchError } = await adminClient
            .from("interview_rounds")
            .select("id, interview_confirmed, round_canceled, mis_rescheduled, invitation_id, round_label, round_number")
            .eq("id", roundId)
            .single();

        if (fetchError || !round) {
            return NextResponse.json(
                { error: "Interview round not found" },
                { status: 404 }
            );
        }

        if (!round.interview_confirmed) {
            return NextResponse.json(
                { error: "Only confirmed rounds can be rescheduled" },
                { status: 400 }
            );
        }

        if (!round.round_canceled) {
            return NextResponse.json(
                { error: "Only cancelled rounds can be rescheduled by MIS" },
                { status: 400 }
            );
        }

        if (round.mis_rescheduled) {
            return NextResponse.json(
                { error: "This round has already been rescheduled by MIS" },
                { status: 400 }
            );
        }

        const rescheduleData = {
            date,
            time,
            interview_mode,
            ...(interview_mode === "online" && { meeting_link }),
            ...(interview_mode === "physical" && {
                interview_address,
                ...(map_link && { map_link })
            }),
            ...(notes && { notes })
        };

        const { error: updateError } = await adminClient
            .from("interview_rounds")
            .update({
                mis_rescheduled: true,
                mis_rescheduled_at: new Date().toISOString(),
                mis_rescheduled_by: user.id,
                mis_reschedule_data: rescheduleData
            })
            .eq("id", roundId);

        if (updateError) {
            console.error("Error updating round:", updateError);
            return NextResponse.json(
                { error: "Failed to reschedule round" },
                { status: 500 }
            );
        }

        // Fetch invitation details for email notifications
        const { data: invitation } = await adminClient
            .from("job_invitations")
            .select(`
                id,
                job_designation,
                candidate:candidates!inner(id, first_name, last_name, email),
                employer:employers!inner(id, first_name, last_name, email),
                company:companies!inner(id, company_name)
            `)
            .eq("id", round.invitation_id)
            .single();

        // Delete stale reminders for the parent invitation
        await adminClient
            .from("interview_reminder_sent")
            .delete()
            .eq("job_invitation_id", round.invitation_id);

        if (invitation) {
            const candidateData = (invitation.candidate as unknown as { id: string; first_name: string; last_name: string; email: string }[])?.[0];
            const employerData = (invitation.employer as unknown as { id: string; first_name: string; last_name: string; email: string }[])?.[0];
            const companyData = (invitation.company as unknown as { company_name: string }[])?.[0];
            const roundLabel = round.round_label || `Round ${round.round_number}`;
            const meetingLinkOrAddress = interview_mode === 'online' ? meeting_link : interview_address;

            const [candidateTz, employerTz] = await Promise.all([
                getUserTimezoneByEmail(candidateData.email),
                getUserTimezoneByEmail(employerData.email),
            ]);

            await sendMISRoundRescheduleNotificationToCandidate(
                candidateData.email,
                candidateData.first_name,
                companyData.company_name,
                invitation.job_designation,
                roundLabel,
                date,
                time,
                interview_mode,
                meetingLinkOrAddress || '',
                round.invitation_id,
                notes || '',
                candidateTz
            );

            await sendMISRoundRescheduleNotificationToEmployer(
                employerData.email,
                employerData.first_name,
                `${candidateData.first_name} ${candidateData.last_name}`,
                invitation.job_designation,
                roundLabel,
                date,
                time,
                interview_mode,
                meetingLinkOrAddress || '',
                round.invitation_id,
                notes || '',
                employerTz
            );
        }

        await logAudit("round_rescheduled_by_mis", user.id, "mis", "interview_round", roundId, { date, time, interview_mode });

        return NextResponse.json({
            success: true,
            message: "Interview round rescheduled successfully and notifications sent"
        });

    } catch (error) {
        console.error("Error rescheduling interview round:", error);
        await logError({ source: "api/mis/interview-rounds/reschedule:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { error: "Failed to reschedule interview round" },
            { status: 500 }
        );
    }
}
