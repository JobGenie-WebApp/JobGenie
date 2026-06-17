import { MISLayout } from '@/components/mis';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { InterviewsClient } from './InterviewsClient';
import { getUserTimezone } from '@/lib/user-timezone';
import { monthBoundsUTC } from '@/lib/date-utils';
import { formatInTimeZone } from 'date-fns-tz';

async function getInterviews() {
    try {
        const adminClient = createAdminClient();

        // Fetch job invitations where status is 'accepted' (active interviews)
        const { data: interviews, error } = await adminClient
            .from("job_invitations")
            .select(`
                id,
                status,
                industry,
                job_designation,
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
                invitation_canceled,
                canceled_by,
                cancellation_reason,
                canceled_at,
                sent_at,
                viewed_at,
                responded_at,
                mis_rescheduled,
                mis_rescheduled_at,
                mis_reschedule_data,
                candidate:candidates!inner(
                    id,
                    first_name,
                    last_name,
                    email,
                    industry,
                    current_position,
                    profile_image_url
                ),
                employer:employers!inner(
                    id,
                    first_name,
                    last_name,
                    email,
                    designation,
                    company_id
                ),
                company:companies!inner(
                    id,
                    company_name,
                    industry,
                    logo_url
                )
            `)
            .order("sent_at", { ascending: false });

        if (error) {
            console.error('Error fetching interviews:', error);
            return { interviews: [], error: 'Failed to fetch interviews' };
        }

        return { interviews: interviews || [], error: null };
    } catch (error) {
        console.error('Error in getInterviews:', error);
        return { interviews: [], error: 'Failed to fetch interviews' };
    }
}

async function getStats(viewerTz: string) {
    try {
        const adminClient = createAdminClient();

        // Compute the first day of the viewer's calendar month, expressed as a
        // UTC instant. Using `new Date(y, m, 1)` would use the server's tz
        // (UTC on Vercel), which can bucket edge-of-month records into the
        // wrong month for non-UTC viewers.
        const now = new Date();
        const viewerYear = parseInt(formatInTimeZone(now, viewerTz, "yyyy"), 10);
        const viewerMonthIndex = parseInt(formatInTimeZone(now, viewerTz, "M"), 10) - 1;
        const { start: firstDayOfMonth } = monthBoundsUTC(viewerYear, viewerMonthIndex, viewerTz);

        // Fetch all accepted invitations (interviews)
        const { data: allInterviews, error } = await adminClient
            .from("job_invitations")
            .select("id, interview_confirmed, invitation_canceled, canceled_by, interview_mode, sent_at, viewed_at, responded_at, industry");

        if (error) {
            console.error('Error fetching interview stats:', error);
            return { stats: null, error: 'Failed to fetch statistics' };
        }

        const interviews = allInterviews || [];

        // Calculate statistics
        const totalInterviews = interviews.length;
        const confirmedInterviews = interviews.filter(i => i.interview_confirmed && !i.invitation_canceled).length;
        const pendingConfirmation = interviews.filter(i => !i.interview_confirmed && !i.invitation_canceled).length;
        const cancelledInterviews = interviews.filter(i => i.invitation_canceled).length;
        const cancelledByCandidate = interviews.filter(i => i.invitation_canceled && i.canceled_by === "candidate").length;
        const cancelledByEmployer = interviews.filter(i => i.invitation_canceled && i.canceled_by === "employer").length;

        // Interview mode distribution
        const onlineInterviews = interviews.filter(i => i.interview_mode === "online" && !i.invitation_canceled).length;
        const physicalInterviews = interviews.filter(i => i.interview_mode === "physical" && !i.invitation_canceled).length;

        // Current month statistics
        const monthlyInterviews = interviews.filter(i => new Date(i.sent_at) >= firstDayOfMonth).length;

        // Calculate average response time (from sent to responded)
        const respondedInterviews = interviews.filter(i => i.responded_at);
        let avgResponseTime = 0;
        if (respondedInterviews.length > 0) {
            const totalResponseTime = respondedInterviews.reduce((acc, i) => {
                const sent = new Date(i.sent_at).getTime();
                const responded = new Date(i.responded_at).getTime();
                return acc + (responded - sent);
            }, 0);
            avgResponseTime = Math.round(totalResponseTime / respondedInterviews.length / (1000 * 60 * 60)); // Convert to hours
        }

        const stats = {
            overview: {
                totalInterviews,
                confirmedInterviews,
                pendingConfirmation,
                cancelledInterviews,
                monthlyInterviews,
                avgResponseTimeHours: avgResponseTime,
            },
            cancellations: {
                total: cancelledInterviews,
                byCandidate: cancelledByCandidate,
                byEmployer: cancelledByEmployer,
            },
            interviewMode: {
                online: onlineInterviews,
                physical: physicalInterviews,
            },
        };

        return { stats, error: null };
    } catch (error) {
        console.error('Error in getStats:', error);
        return { stats: null, error: 'Failed to fetch statistics' };
    }
}

export default async function InterviewsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/mis/login');
    }

    // Fetch data server-side (stats bucketed in viewer's timezone)
    const viewerTz = await getUserTimezone(user.id);
    const [interviewsResult, statsResult] = await Promise.all([
        getInterviews(),
        getStats(viewerTz)
    ]);

    return (
        <MISLayout
            pageTitle="Interview Management"
            pageDescription="Monitor and manage all scheduled interviews between employers and candidates"
        >
            <InterviewsClient
                initialInterviews={interviewsResult.interviews}
                initialStats={statsResult.stats}
                error={interviewsResult.error || statsResult.error}
            />
        </MISLayout>
    );
}
