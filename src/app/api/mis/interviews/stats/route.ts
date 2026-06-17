import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";
import { getUserTimezone } from "@/lib/user-timezone";
import { monthBoundsUTC } from "@/lib/date-utils";
import { formatInTimeZone } from "date-fns-tz";

export async function GET(request: NextRequest) {
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

        // Compute month boundaries in the viewer's timezone (so "this month" matches
        // what the MIS user sees on their calendar, not the server's wall clock).
        const viewerTz = await getUserTimezone(user.id);
        const now = new Date();
        const viewerYearStr = formatInTimeZone(now, viewerTz, "yyyy");
        const viewerMonthStr = formatInTimeZone(now, viewerTz, "M");
        const viewerYear = parseInt(viewerYearStr, 10);
        const viewerMonthIndex = parseInt(viewerMonthStr, 10) - 1;
        const { start: firstDayOfMonth } = monthBoundsUTC(viewerYear, viewerMonthIndex, viewerTz);

        // Fetch all accepted invitations (interviews)
        const { data: allInterviews, error: allError } = await adminClient
            .from("job_invitations")
            .select("id, interview_confirmed, invitation_canceled, canceled_by, interview_mode, sent_at, viewed_at, responded_at, industry");

        if (allError) {
            console.error("Error fetching interview stats:", allError);
            return NextResponse.json(
                { error: "Failed to fetch statistics" },
                { status: 500 }
            );
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

        // Industry breakdown
        const industryBreakdown: Record<string, number> = {};
        interviews.forEach(i => {
            if (i.industry) {
                industryBreakdown[i.industry] = (industryBreakdown[i.industry] || 0) + 1;
            }
        });

        // Monthly trend (last 6 months) — bucketed by the viewer's calendar months.
        const monthlyTrend: Array<{ month: string; count: number }> = [];
        for (let i = 5; i >= 0; i--) {
            const targetMonthIndex = viewerMonthIndex - i;
            const yearOffset = Math.floor(targetMonthIndex / 12);
            const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
            const targetYear = viewerYear + yearOffset;
            const { start, end } = monthBoundsUTC(targetYear, normalizedMonth, viewerTz);
            const monthName = formatInTimeZone(start, viewerTz, "MMM yyyy");
            const count = interviews.filter(interview => {
                const sentDate = new Date(interview.sent_at);
                return sentDate >= start && sentDate < end;
            }).length;
            monthlyTrend.push({ month: monthName, count });
        }

        return NextResponse.json({
            success: true,
            stats: {
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
                industryBreakdown,
                monthlyTrend,
            },
        });
    } catch (error) {
        console.error("Error fetching interview statistics:", error);
        await logError({ source: "api/mis/interviews/stats:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { error: "Failed to fetch statistics" },
            { status: 500 }
        );
    }
}
