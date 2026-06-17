import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

type FilterDimension = "all" | "candidates" | "employers" | "companies" | "jobs" | "applications";
type PeriodPreset = "24h" | "7d" | "30d" | "all_time" | "custom";

function getDateRange(period: PeriodPreset, dateFrom?: string, dateTo?: string) {
    const now = new Date();
    if (period === "custom" && dateFrom && dateTo) {
        return { from: new Date(dateFrom), to: new Date(dateTo) };
    }
    if (period === "all_time") {
        return { from: new Date("2020-01-01T00:00:00.000Z"), to: now };
    }
    const hours = period === "24h" ? 24 : period === "7d" ? 168 : 720;
    const from = new Date(now.getTime() - hours * 60 * 60 * 1000);
    return { from, to: now };
}

function buildDayBuckets(from: Date, to: Date): Record<string, number> {
    const map: Record<string, number> = {};
    const cur = new Date(from);
    cur.setUTCHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setUTCHours(23, 59, 59, 999);
    while (cur <= end) {
        map[cur.toISOString().slice(0, 10)] = 0;
        cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return map;
}

function countByDay(rows: { created_at: string }[], from: Date, to: Date) {
    const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 90) {
        const monthMap: Record<string, number> = {};
        const cur = new Date(from);
        cur.setUTCDate(1);
        while (cur <= to) {
            monthMap[cur.toISOString().slice(0, 7)] = 0;
            cur.setUTCMonth(cur.getUTCMonth() + 1);
        }
        for (const r of rows) {
            const key = r.created_at.slice(0, 7);
            if (key in monthMap) monthMap[key]++;
        }
        return Object.entries(monthMap).map(([date, count]) => ({ date, count }));
    }
    const map = buildDayBuckets(from, to);
    for (const r of rows) {
        const key = r.created_at.slice(0, 10);
        if (key in map) map[key]++;
    }
    return Object.entries(map).map(([date, count]) => ({ date: date.slice(5), count }));
}

function groupCount<T>(rows: T[], keyFn: (r: T) => string): { name: string; value: number }[] {
    const map: Record<string, number> = {};
    for (const r of rows) {
        const k = keyFn(r) || "unknown";
        map[k] = (map[k] || 0) + 1;
    }
    return Object.entries(map)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const adminClient = createAdminClient();
        const { data: misUser, error: misUserError } = await adminClient
            .from("mis_user").select("user_id").eq("user_id", user.id).single();
        if (misUserError || !misUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const filter = (searchParams.get("filter") || "all") as FilterDimension;
        const period = (searchParams.get("period") || "30d") as PeriodPreset;
        const dateFrom = searchParams.get("dateFrom") || undefined;
        const dateTo = searchParams.get("dateTo") || undefined;

        const { from, to } = getDateRange(period, dateFrom, dateTo);
        const fromISO = from.toISOString();
        const toISO = to.toISOString();

        // ── Platform Engagement (always fetched) ─────────────────────────────
        const { data: engagementLogs } = await adminClient
            .from("event_logs")
            .select("user_id, user_role, action, created_at")
            .gte("created_at", fromISO)
            .lte("created_at", toISO);

        const logs = engagementLogs || [];

        type DauEntry = { candidates: number; employers: number; mis: number; total: number };
        const dauMap: Record<string, DauEntry & { sets: { c: Set<string>; e: Set<string>; m: Set<string> } }> = {};
        const dayKeys = buildDayBuckets(from, to);
        for (const key of Object.keys(dayKeys)) {
            dauMap[key] = { candidates: 0, employers: 0, mis: 0, total: 0, sets: { c: new Set(), e: new Set(), m: new Set() } };
        }
        for (const log of logs) {
            const key = log.created_at.slice(0, 10);
            if (!dauMap[key] || !log.user_id) continue;
            const role = (log.user_role || "").toLowerCase();
            if (role === "candidate") dauMap[key].sets.c.add(log.user_id);
            else if (role === "employer") dauMap[key].sets.e.add(log.user_id);
            else if (role.startsWith("mis")) dauMap[key].sets.m.add(log.user_id);
        }
        const dailyActiveUsers = Object.entries(dauMap).map(([date, v]) => ({
            date: date.slice(5),
            candidates: v.sets.c.size,
            employers: v.sets.e.size,
            mis: v.sets.m.size,
            total: new Set([...v.sets.c, ...v.sets.e, ...v.sets.m]).size,
        }));

        const actionCounts: Record<string, number> = {};
        for (const log of logs) {
            const a = log.action || "unknown";
            actionCounts[a] = (actionCounts[a] || 0) + 1;
        }
        const topActions = Object.entries(actionCounts)
            .map(([action, count]) => ({ action, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const hourCounts = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
        for (const log of logs) {
            const h = new Date(log.created_at).getUTCHours();
            hourCounts[h].count++;
        }

        const platformEngagement = { dailyActiveUsers, topActions, peakHours: hourCounts };

        // ── Filter-specific data ──────────────────────────────────────────────
        let filterData: Record<string, unknown> = {};

        if (filter === "candidates") {
            const { data: candRows } = await adminClient
                .from("candidates")
                .select(`
                    id, first_name, last_name, email, industry, experience_level,
                    employment_type, approval_status, created_at, approved_at,
                    profile_completed, years_of_experience, availability_status
                `)
                .gte("created_at", fromISO).lte("created_at", toISO)
                .order("created_at", { ascending: false });
            const rows = candRows || [];

            const registrationsOverTime = countByDay(rows, from, to);
            const approvalStatus = groupCount(rows, r => r.approval_status);
            const experienceLevel = groupCount(rows, r => r.experience_level || "unknown");
            const employmentType = groupCount(rows, r => r.employment_type || "unknown");
            const industryBreakdown = groupCount(rows, r => r.industry || "unknown").slice(0, 10);

            const approvedRows = rows.filter(r => r.approval_status === "approved" && r.approved_at);
            const avgDaysToApproval = approvedRows.length > 0
                ? Math.round(approvedRows.reduce((sum, r) => {
                    const diff = new Date(r.approved_at!).getTime() - new Date(r.created_at).getTime();
                    return sum + diff / (1000 * 60 * 60 * 24);
                }, 0) / approvedRows.length)
                : null;

            const { data: userRows } = await adminClient
                .from("users")
                .select("provider, created_at")
                .eq("role", "candidate")
                .gte("created_at", fromISO).lte("created_at", toISO);
            const registrationSource = groupCount(userRows || [], r => r.provider === "google" ? "Google" : "Email");

            filterData = {
                registrationsOverTime,
                approvalStatus,
                experienceLevel,
                employmentType,
                industryBreakdown,
                avgDaysToApproval,
                registrationSource,
                totalCandidates: rows.length,
                approvedCount: rows.filter(r => r.approval_status === "approved").length,
                pendingCount: rows.filter(r => r.approval_status === "pending").length,
                rejectedCount: rows.filter(r => r.approval_status === "rejected").length,
                // Detail records
                candidates: rows.map(r => ({
                    id: r.id,
                    name: `${r.first_name} ${r.last_name}`,
                    email: r.email,
                    industry: r.industry,
                    experience_level: r.experience_level,
                    employment_type: r.employment_type,
                    approval_status: r.approval_status,
                    years_of_experience: r.years_of_experience,
                    availability_status: r.availability_status,
                    profile_completed: r.profile_completed,
                    created_at: r.created_at,
                    approved_at: r.approved_at,
                })),
            };
        }

        if (filter === "employers") {
            const { data: empRows } = await adminClient
                .from("employers")
                .select(`
                    id, first_name, last_name, email, designation, department,
                    job_title, is_super_admin, profile_completed, created_at,
                    company_id
                `)
                .gte("created_at", fromISO).lte("created_at", toISO)
                .order("created_at", { ascending: false });
            const rows = empRows || [];

            // Fetch company names
            const companyIds = [...new Set(rows.map(r => r.company_id))];
            const { data: companies } = companyIds.length > 0
                ? await adminClient.from("companies").select("id, company_name, approval_status").in("id", companyIds)
                : { data: [] };
            const companyMap: Record<string, { name: string; status: string }> = {};
            for (const c of companies || []) companyMap[c.id] = { name: c.company_name, status: c.approval_status };

            const registrationsOverTime = countByDay(rows, from, to);
            const companyEmpCount: Record<string, number> = {};
            for (const r of rows) {
                companyEmpCount[r.company_id] = (companyEmpCount[r.company_id] || 0) + 1;
            }
            const empPerCompany = [
                { name: "1", value: Object.values(companyEmpCount).filter(c => c === 1).length },
                { name: "2-3", value: Object.values(companyEmpCount).filter(c => c >= 2 && c <= 3).length },
                { name: "4-10", value: Object.values(companyEmpCount).filter(c => c >= 4 && c <= 10).length },
                { name: "10+", value: Object.values(companyEmpCount).filter(c => c > 10).length },
            ].filter(d => d.value > 0);

            const { data: compRows } = await adminClient
                .from("companies").select("approval_status")
                .gte("created_at", fromISO).lte("created_at", toISO);
            const approvalStatus = groupCount(compRows || [], r => r.approval_status);

            filterData = {
                registrationsOverTime,
                empPerCompany,
                approvalStatus,
                totalEmployers: rows.length,
                employers: rows.map(r => ({
                    id: r.id,
                    name: `${r.first_name} ${r.last_name}`,
                    email: r.email,
                    designation: r.designation,
                    department: r.department,
                    job_title: r.job_title,
                    is_super_admin: r.is_super_admin,
                    profile_completed: r.profile_completed,
                    company_name: companyMap[r.company_id]?.name || "—",
                    company_status: companyMap[r.company_id]?.status || "—",
                    created_at: r.created_at,
                })),
            };
        }

        if (filter === "companies") {
            const { data: compRows } = await adminClient
                .from("companies")
                .select(`
                    id, company_name, industry, company_size, approval_status,
                    profile_completed, business_registration_no, phone,
                    headoffice_location, created_at, approved_at, rejected_at
                `)
                .gte("created_at", fromISO).lte("created_at", toISO)
                .order("created_at", { ascending: false });
            const rows = compRows || [];

            // Employer count per company
            const companyIds = rows.map(r => r.id);
            const { data: empCounts } = companyIds.length > 0
                ? await adminClient.from("employers").select("company_id").in("company_id", companyIds)
                : { data: [] };
            const empCountMap: Record<string, number> = {};
            for (const e of empCounts || []) {
                empCountMap[e.company_id] = (empCountMap[e.company_id] || 0) + 1;
            }

            // Job count per company
            const { data: jobCounts } = companyIds.length > 0
                ? await adminClient.from("jobs").select("company_id").in("company_id", companyIds)
                : { data: [] };
            const jobCountMap: Record<string, number> = {};
            for (const j of jobCounts || []) {
                jobCountMap[j.company_id] = (jobCountMap[j.company_id] || 0) + 1;
            }

            const registrationsOverTime = countByDay(rows, from, to);
            const approvalStatus = groupCount(rows, r => r.approval_status);
            const industryBreakdown = groupCount(rows, r => r.industry || "unknown").slice(0, 10);
            const sizeBreakdown = groupCount(rows, r => r.company_size || "unknown");

            filterData = {
                registrationsOverTime,
                approvalStatus,
                industryBreakdown,
                sizeBreakdown,
                totalCompanies: rows.length,
                approvedCount: rows.filter(r => r.approval_status === "approved").length,
                pendingCount: rows.filter(r => r.approval_status === "pending").length,
                rejectedCount: rows.filter(r => r.approval_status === "rejected").length,
                companies: rows.map(r => ({
                    id: r.id,
                    company_name: r.company_name,
                    industry: r.industry,
                    company_size: r.company_size,
                    approval_status: r.approval_status,
                    profile_completed: r.profile_completed,
                    business_registration_no: r.business_registration_no,
                    headoffice_location: r.headoffice_location,
                    employer_count: empCountMap[r.id] || 0,
                    job_count: jobCountMap[r.id] || 0,
                    created_at: r.created_at,
                    approved_at: r.approved_at,
                })),
            };
        }

        if (filter === "jobs") {
            const { data: jobRows } = await adminClient
                .from("jobs")
                .select(`
                    id, job_title, industry, job_type, status,
                    location, deadline, created_at, published_at, company_id, employer_id
                `)
                .gte("created_at", fromISO).lte("created_at", toISO)
                .order("created_at", { ascending: false });
            const rows = jobRows || [];

            // Company names
            const companyIds = [...new Set(rows.map(r => r.company_id))];
            const { data: companies } = companyIds.length > 0
                ? await adminClient.from("companies").select("id, company_name").in("id", companyIds)
                : { data: [] };
            const companyNameMap: Record<string, string> = {};
            for (const c of companies || []) companyNameMap[c.id] = c.company_name;

            // Application count per job
            const jobIds = rows.map(r => r.id);
            const { data: invitations } = jobIds.length > 0
                ? await adminClient.from("job_invitations").select("job_id").in("job_id", jobIds)
                : { data: [] };
            const appCountMap: Record<string, number> = {};
            for (const inv of invitations || []) {
                if (inv.job_id) appCountMap[inv.job_id] = (appCountMap[inv.job_id] || 0) + 1;
            }

            const postedOverTime = countByDay(rows, from, to);
            const statusBreakdown = groupCount(rows, r => r.status);
            const industryBreakdown = groupCount(rows, r => r.industry || "unknown").slice(0, 10);
            const jobTypeBreakdown = groupCount(rows, r => r.job_type || "unknown");

            const companyJobCount: Record<string, number> = {};
            for (const r of rows) {
                companyJobCount[r.company_id] = (companyJobCount[r.company_id] || 0) + 1;
            }
            const topCompanies = Object.entries(companyJobCount)
                .sort((a, b) => b[1] - a[1]).slice(0, 10)
                .map(([id, jobs]) => ({ name: companyNameMap[id] || "Unknown", jobs }));

            filterData = {
                postedOverTime,
                statusBreakdown,
                industryBreakdown,
                jobTypeBreakdown,
                topCompanies,
                totalJobs: rows.length,
                jobs: rows.map(r => ({
                    id: r.id,
                    job_title: r.job_title,
                    company_name: companyNameMap[r.company_id] || "—",
                    industry: r.industry,
                    job_type: r.job_type,
                    status: r.status,
                    location: r.location,
                    deadline: r.deadline,
                    application_count: appCountMap[r.id] || 0,
                    created_at: r.created_at,
                    published_at: r.published_at,
                })),
            };
        }

        if (filter === "applications") {
            const { data: invRows } = await adminClient
                .from("job_invitations")
                .select(`
                    id, status, interview_confirmed, invitation_canceled,
                    pipeline_status, industry, job_designation, interview_mode,
                    created_at, confirmed_at, canceled_at, responded_at,
                    candidate_id, employer_id, company_id, job_id
                `)
                .gte("created_at", fromISO).lte("created_at", toISO)
                .order("created_at", { ascending: false });
            const rows = invRows || [];

            // Candidate names
            const candIds = [...new Set(rows.map(r => r.candidate_id))];
            const { data: cands } = candIds.length > 0
                ? await adminClient.from("candidates").select("id, first_name, last_name, email").in("id", candIds)
                : { data: [] };
            const candMap: Record<string, { name: string; email: string }> = {};
            for (const c of cands || []) candMap[c.id] = { name: `${c.first_name} ${c.last_name}`, email: c.email };

            // Company names
            const companyIds = [...new Set(rows.map(r => r.company_id))];
            const { data: comps } = companyIds.length > 0
                ? await adminClient.from("companies").select("id, company_name").in("id", companyIds)
                : { data: [] };
            const compMap: Record<string, string> = {};
            for (const c of comps || []) compMap[c.id] = c.company_name;

            const applicationsOverTime = countByDay(rows, from, to);
            const statusBreakdown = groupCount(rows, r => r.status);

            const total = rows.length;
            const accepted = rows.filter(r => r.status === "accepted" || r.interview_confirmed).length;
            const interviewed = rows.filter(r => r.interview_confirmed).length;

            const { data: offerRows } = await adminClient
                .from("job_offers")
                .select("status, created_at")
                .gte("created_at", fromISO).lte("created_at", toISO);
            const offers = offerRows || [];
            const offersMade = offers.length;
            const offersAccepted = offers.filter(o => o.status === "accepted").length;

            const funnel = [
                { step: "Applications Sent", count: total, pct: 100 },
                { step: "Accepted", count: accepted, pct: total > 0 ? Math.round((accepted / total) * 100) : 0 },
                { step: "Interview Confirmed", count: interviewed, pct: total > 0 ? Math.round((interviewed / total) * 100) : 0 },
                { step: "Offer Made", count: offersMade, pct: total > 0 ? Math.round((offersMade / total) * 100) : 0 },
                { step: "Offer Accepted", count: offersAccepted, pct: total > 0 ? Math.round((offersAccepted / total) * 100) : 0 },
            ];

            filterData = {
                applicationsOverTime,
                statusBreakdown,
                funnel,
                totalApplications: total,
                offersMade,
                offersAccepted,
                offerAcceptanceRate: offersMade > 0 ? Math.round((offersAccepted / offersMade) * 100) : 0,
                applications: rows.map(r => ({
                    id: r.id,
                    candidate_name: candMap[r.candidate_id]?.name || "—",
                    candidate_email: candMap[r.candidate_id]?.email || "—",
                    company_name: compMap[r.company_id] || "—",
                    job_designation: r.job_designation,
                    industry: r.industry,
                    status: r.status,
                    pipeline_status: r.pipeline_status,
                    interview_confirmed: r.interview_confirmed,
                    interview_mode: r.interview_mode,
                    invitation_canceled: r.invitation_canceled,
                    created_at: r.created_at,
                    responded_at: r.responded_at,
                    confirmed_at: r.confirmed_at,
                })),
            };
        }

        if (filter === "all") {
            const [candRes, empRes, compRes, jobRes, invRes, userRes] = await Promise.all([
                adminClient.from("candidates").select("created_at, approval_status").gte("created_at", fromISO).lte("created_at", toISO),
                adminClient.from("employers").select("created_at").gte("created_at", fromISO).lte("created_at", toISO),
                adminClient.from("companies").select("created_at, approval_status").gte("created_at", fromISO).lte("created_at", toISO),
                adminClient.from("jobs").select("created_at, status").gte("created_at", fromISO).lte("created_at", toISO),
                adminClient.from("job_invitations").select("created_at, status, interview_confirmed").gte("created_at", fromISO).lte("created_at", toISO),
                adminClient.from("users").select("role, provider, created_at").gte("created_at", fromISO).lte("created_at", toISO).in("role", ["candidate", "employer"]),
            ]);

            const candRows = candRes.data || [];
            const empRows = empRes.data || [];
            const compRows = compRes.data || [];
            const jobRows = jobRes.data || [];
            const invRows = invRes.data || [];
            const userRows = userRes.data || [];

            const { data: offerRows } = await adminClient.from("job_offers").select("status, created_at").gte("created_at", fromISO).lte("created_at", toISO);
            const offers = offerRows || [];
            const offersMade = offers.length;
            const offersAccepted = offers.filter(o => o.status === "accepted").length;
            const total = invRows.length;
            const accepted = invRows.filter(r => r.status === "accepted" || r.interview_confirmed).length;
            const interviewed = invRows.filter(r => r.interview_confirmed).length;

            filterData = {
                candidateRegistrations: countByDay(candRows, from, to),
                employerRegistrations: countByDay(empRows, from, to),
                companyRegistrations: countByDay(compRows, from, to),
                jobsPostedOverTime: countByDay(jobRows, from, to),
                applicationsOverTime: countByDay(invRows, from, to),
                candidateApprovalStatus: groupCount(candRows, r => r.approval_status),
                companyApprovalStatus: groupCount(compRows, r => r.approval_status),
                jobStatusBreakdown: groupCount(jobRows, r => r.status),
                registrationSource: groupCount(userRows, r => r.provider === "google" ? "Google" : "Email"),
                candidateCount: candRows.length,
                employerCount: empRows.length,
                companyCount: compRows.length,
                jobCount: jobRows.length,
                applicationCount: total,
                totalNewUsers: userRows.length,
                funnel: [
                    { step: "Applications Sent", count: total, pct: 100 },
                    { step: "Accepted", count: accepted, pct: total > 0 ? Math.round((accepted / total) * 100) : 0 },
                    { step: "Interview Confirmed", count: interviewed, pct: total > 0 ? Math.round((interviewed / total) * 100) : 0 },
                    { step: "Offer Made", count: offersMade, pct: total > 0 ? Math.round((offersMade / total) * 100) : 0 },
                    { step: "Offer Accepted", count: offersAccepted, pct: total > 0 ? Math.round((offersAccepted / total) * 100) : 0 },
                ],
            };
        }

        return NextResponse.json({
            success: true,
            filter,
            period: { preset: period, from: fromISO, to: toISO },
            data: filterData,
            platformEngagement,
        });
    } catch (error) {
        console.error("Error in GET /api/mis/analytics/reports:", error);
        await logError({
            source: "api/mis/analytics/reports:GET",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ error: "Failed to fetch report data" }, { status: 500 });
    }
}
