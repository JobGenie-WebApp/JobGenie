import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const adminClient = createAdminClient();
        const { data: misUser, error: misUserError } = await adminClient
            .from("mis_user")
            .select("user_id")
            .eq("user_id", user.id)
            .single();

        if (misUserError || !misUser) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Core counts
        const [
            candidatesResult,
            employersResult,
            jobsResult,
            interviewsResult,
            pendingCandidatesResult,
            pendingEmployersResult,
            activeJobsResult,
            confirmedInterviewsResult,
            approvedCandidatesResult,
            rejectedCandidatesResult,
            approvedEmployersResult,
            rejectedEmployersResult,
        ] = await Promise.all([
            adminClient.from("candidates").select("*", { count: "exact", head: true }),
            adminClient.from("companies").select("*", { count: "exact", head: true }),
            adminClient.from("jobs").select("*", { count: "exact", head: true }),
            adminClient.from("job_invitations").select("*", { count: "exact", head: true }),
            adminClient.from("candidates").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
            adminClient.from("companies").select("*", { count: "exact", head: true }).eq("approval_status", "pending"),
            adminClient.from("jobs").select("*", { count: "exact", head: true }).eq("status", "published"),
            adminClient.from("job_invitations").select("*", { count: "exact", head: true }).eq("interview_confirmed", true),
            adminClient.from("candidates").select("*", { count: "exact", head: true }).eq("approval_status", "approved"),
            adminClient.from("candidates").select("*", { count: "exact", head: true }).eq("approval_status", "rejected"),
            adminClient.from("companies").select("*", { count: "exact", head: true }).eq("approval_status", "approved"),
            adminClient.from("companies").select("*", { count: "exact", head: true }).eq("approval_status", "rejected"),
        ]);

        // Recent activity
        const { data: recentActivity } = await adminClient
            .from("event_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(20);

        // Last 30 days approval data
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [approvedCandidates, approvedEmployers] = await Promise.all([
            adminClient
                .from("candidates")
                .select("approved_at")
                .eq("approval_status", "approved")
                .gte("approved_at", thirtyDaysAgo.toISOString()),
            adminClient
                .from("companies")
                .select("approved_at")
                .eq("approval_status", "approved")
                .gte("approved_at", thirtyDaysAgo.toISOString()),
        ]);

        // Build daily approval trend for last 30 days
        const dayMap: Record<string, { date: string; candidates: number; employers: number }> = {};
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            dayMap[key] = { date: key, candidates: 0, employers: 0 };
        }
        for (const c of approvedCandidates.data || []) {
            if (c.approved_at) {
                const key = c.approved_at.slice(0, 10);
                if (dayMap[key]) dayMap[key].candidates++;
            }
        }
        for (const e of approvedEmployers.data || []) {
            if (e.approved_at) {
                const key = e.approved_at.slice(0, 10);
                if (dayMap[key]) dayMap[key].employers++;
            }
        }

        // Activity category breakdown (last 30 days)
        const { data: activityLogs } = await adminClient
            .from("event_logs")
            .select("category, action")
            .gte("created_at", thirtyDaysAgo.toISOString());

        const categoryMap: Record<string, number> = {};
        for (const log of activityLogs || []) {
            const cat = log.category || "other";
            categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        }
        const activityByCategory = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

        return NextResponse.json({
            success: true,
            stats: {
                totalCandidates: candidatesResult.count || 0,
                totalEmployers: employersResult.count || 0,
                totalJobs: jobsResult.count || 0,
                totalInterviews: interviewsResult.count || 0,
                pendingCandidates: pendingCandidatesResult.count || 0,
                pendingEmployers: pendingEmployersResult.count || 0,
                activeJobs: activeJobsResult.count || 0,
                confirmedInterviews: confirmedInterviewsResult.count || 0,
                approvedCandidates: approvedCandidatesResult.count || 0,
                rejectedCandidates: rejectedCandidatesResult.count || 0,
                approvedEmployers: approvedEmployersResult.count || 0,
                rejectedEmployers: rejectedEmployersResult.count || 0,
                recentApprovals: {
                    candidates: approvedCandidates.data?.length || 0,
                    employers: approvedEmployers.data?.length || 0,
                },
            },
            recentActivity: recentActivity || [],
            approvalTrend: Object.values(dayMap),
            activityByCategory,
        });
    } catch (error) {
        console.error("Error in GET /api/mis/analytics/stats:", error);
        await logError({
            source: "api/mis/analytics/stats:GET",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
