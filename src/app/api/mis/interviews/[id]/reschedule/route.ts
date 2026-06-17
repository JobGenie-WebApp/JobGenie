import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    sendMISRescheduleNotificationToCandidate,
    sendMISRescheduleNotificationToEmployer
} from "@/lib/interview-emails";
import { logAudit, logError } from "@/lib/logger";
import { getUserTimezone, getUserTimezoneByEmail } from "@/lib/user-timezone";
import { formatInTimeZone } from "date-fns-tz";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Authenticate user
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

        // Verify user is MIS user
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

        const { id } = await params;
        const body = await request.json();

        // Validate request body
        const { date, time, interview_mode, meeting_link, interview_address, map_link, notes } = body;

        if (!date || !time || !interview_mode) {
            return NextResponse.json(
                { error: "Missing required fields: date, time, interview_mode" },
                { status: 400 }
            );
        }

        // Validate interview mode specific requirements
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

        // Validate date is in the future. Compare calendar dates in the MIS
        // user's timezone so a user picking "today" locally is never rejected
        // because the UTC server has already rolled over to tomorrow (or vice versa).
        const misUserTz = await getUserTimezone(user.id);
        const todayInUserTz = formatInTimeZone(new Date(), misUserTz, "yyyy-MM-dd");
        if (date < todayInUserTz) {
            return NextResponse.json(
                { error: "Interview date must be in the future" },
                { status: 400 }
            );
        }

        // Validate time slot format (should be like "9:00 AM", "2:30 PM")
        const timeRegex = /^(0?[9]|1[0-2]|0?[1-4]):(00|30) (AM|PM)$/;
        if (!timeRegex.test(time)) {
            return NextResponse.json(
                { error: "Invalid time format. Use 30-minute intervals between 9:00 AM and 5:00 PM" },
                { status: 400 }
            );
        }

        // Fetch interview to verify eligibility
        const { data: interview, error: fetchError } = await adminClient
            .from("job_invitations")
            .select("id, interview_confirmed, invitation_canceled, mis_rescheduled")
            .eq("id", id)
            .single();

        if (fetchError || !interview) {
            return NextResponse.json(
                { error: "Interview not found" },
                { status: 404 }
            );
        }

        // Verify interview is eligible for reschedule
        if (!interview.invitation_canceled) {
            return NextResponse.json(
                { error: "Only cancelled interviews can be rescheduled by MIS" },
                { status: 400 }
            );
        }

        if (interview.mis_rescheduled) {
            return NextResponse.json(
                { error: "This interview has already been rescheduled by MIS" },
                { status: 400 }
            );
        }

        // Prepare reschedule data
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

        // Update interview with MIS reschedule data
        const { data: updatedInterview, error: updateError } = await adminClient
            .from("job_invitations")
            .update({
                mis_rescheduled: true,
                mis_rescheduled_at: new Date().toISOString(),
                mis_rescheduled_by: user.id,
                mis_reschedule_data: rescheduleData
            })
            .eq("id", id)
            .select(`
                *,
                candidate:candidates!inner(
                    id,
                    user_id,
                    first_name,
                    last_name,
                    email
                ),
                employer:employers!inner(
                    id,
                    user_id,
                    first_name,
                    last_name,
                    email
                ),
                company:companies!inner(
                    id,
                    company_name
                )
            `)
            .single();

        if (updateError) {
            console.error("Error updating interview:", updateError);
            return NextResponse.json(
                { error: "Failed to reschedule interview" },
                { status: 500 }
            );
        }

        await adminClient.from("interview_reminder_sent").delete().eq("job_invitation_id", id);

        // Send email notifications to both candidate and employer
        const candidateData = (updatedInterview.candidate as unknown as { id: string; user_id: string; first_name: string; last_name: string; email: string }[])?.[0];
        const employerData = (updatedInterview.employer as unknown as { id: string; user_id: string; first_name: string; last_name: string; email: string }[])?.[0];
        const companyData = (updatedInterview.company as unknown as { company_name: string }[])?.[0];
        const meetingLinkOrAddress = interview_mode === 'online' ? meeting_link : interview_address;

        const [candidateTz, employerTz] = await Promise.all([
            getUserTimezoneByEmail(candidateData.email),
            getUserTimezoneByEmail(employerData.email),
        ]);

        // Send to candidate
        await sendMISRescheduleNotificationToCandidate(
            candidateData.email,
            candidateData.first_name,
            companyData.company_name,
            updatedInterview.job_designation,
            date,
            time,
            interview_mode,
            meetingLinkOrAddress || '',
            id,
            notes || '',
            candidateTz
        );

        // Send to employer
        await sendMISRescheduleNotificationToEmployer(
            employerData.email,
            employerData.first_name,
            `${candidateData.first_name} ${candidateData.last_name}`,
            updatedInterview.job_designation,
            date,
            time,
            interview_mode,
            meetingLinkOrAddress || '',
            id,
            notes || '',
            employerTz
        );

        // In-app notifications (non-blocking)
        const notificationPayload = {
            invitation_id: id,
            date,
            time,
            interview_mode,
        };

        const inAppPromises: Promise<unknown>[] = [];

        if (candidateData?.user_id) {
            inAppPromises.push(
                Promise.resolve(
                    adminClient.rpc('notify_user', {
                        p_user_id: candidateData.user_id,
                        p_type: 'interview_rescheduled',
                        p_title: 'Interview Rescheduled',
                        p_body: `Your interview for ${updatedInterview.job_designation} at ${companyData.company_name} has been rescheduled by JobGenie.`,
                        p_data: notificationPayload,
                    })
                ).catch((err: unknown) => console.error('Candidate notification error:', err))
            );
        }

        if (employerData?.user_id) {
            inAppPromises.push(
                Promise.resolve(
                    adminClient.rpc('notify_user', {
                        p_user_id: employerData.user_id,
                        p_type: 'interview_rescheduled',
                        p_title: 'Interview Rescheduled',
                        p_body: `The interview with ${candidateData.first_name} ${candidateData.last_name} for ${updatedInterview.job_designation} has been rescheduled by JobGenie.`,
                        p_data: notificationPayload,
                    })
                ).catch((err: unknown) => console.error('Employer notification error:', err))
            );
        }

        await Promise.all(inAppPromises);

        await logAudit("interview_rescheduled_by_mis", user.id, "mis", "job_invitation", id, { date, time, interview_mode });
        return NextResponse.json({
            success: true,
            interview: updatedInterview,
            message: "Interview rescheduled successfully and notifications sent"
        });

    } catch (error) {
        console.error("Error rescheduling interview:", error);
        await logError({ source: "api/mis/interviews/reschedule:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { error: "Failed to reschedule interview" },
            { status: 500 }
        );
    }
}
