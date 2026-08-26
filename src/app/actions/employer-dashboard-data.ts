'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatInTz } from '@/lib/date-utils';
import { getUserTimezone } from '@/lib/user-timezone';
import { resolveInvitationSlot, resolveRoundSlot, type CalendarInvitation } from '@/lib/calendar-utils';
import { countExpiringSoon, countHires, isLive } from '@/lib/employer-dashboard-stats';

/**
 * Employer dashboard aggregate.
 *
 * Reads go through the admin client scoped explicitly by `company_id`, matching
 * every other employer API in this app (see api/employer/applications). This is
 * deliberate: the `jobs`/`job_offers` employer RLS policies are scoped to
 * `employer_id`, so a user-client read would show a sub-admin only their own
 * rows, and `payment_requests` has RLS enabled with no policies at all — a
 * user-client read there returns zero rows silently. Auth is still enforced with
 * the user client before any data is touched.
 */

export interface ProfileChecklistItem { label: string; done: boolean; href: string }

export interface UpcomingInterview {
    id: string;
    invitationId: string;
    date: string;            // YYYY-MM-DD
    time: string;
    candidateName: string;
    candidateImage: string | null;
    jobDesignation: string;
    roundLabel: string | null;
    interviewMode: string | null;
    isConfirmed: boolean;
}

export interface RecentApplicant {
    id: string;
    candidateName: string;
    candidateImage: string | null;
    currentPosition: string | null;
    jobTitle: string;
    appliedAt: string;
    status: string;
    atsScore: number | null;
}

export interface JobSummary {
    id: string;
    jobTitle: string;
    status: string;
    location: string | null;
    jobType: string | null;
    applicantCount: number;
    positionsAvailable: number | null;
    expiresAt: string | null;
}

export interface EmployerDashboardData {
    firstName: string;
    companyName: string;
    companyLogo: string | null;
    approvalStatus: string;
    isApproved: boolean;
    isSuperAdmin: boolean;
    memberSince: string;

    // Job postings
    activeJobs: number;
    draftJobs: number;
    pausedJobs: number;
    closedJobs: number;
    lapsedJobs: number;      // published, but past their deadline
    expiringSoon: number;

    // Hiring funnel
    totalApplicants: number;
    newApplicants: number;      // last 7 days
    shortlisted: number;
    interviewing: number;
    offersExtended: number;
    hired: number;

    // Invitations / interviews
    pendingInvitations: number;
    upcomingInterviewCount: number;

    // Offers
    offersPending: number;
    offersAccepted: number;

    // Billing
    paymentsOutstanding: number;
    paymentsUnderReview: number;
    amountOutstanding: number;

    // Team
    teamMembers: number;

    // Profile completeness
    profileCompletionPercent: number;
    profileChecklist: ProfileChecklistItem[];

    // Lists
    upcomingInterviews: UpcomingInterview[];
    recentApplicants: RecentApplicant[];
    topJobs: JobSummary[];
}

/** Company + employer profile completeness. Required-at-signup columns are
 *  skipped — only fields the employer can still act on are scored. */
function buildProfileChecklist(
    company: Record<string, unknown>,
    employer: Record<string, unknown>,
): { percent: number; items: ProfileChecklistItem[] } {
    const COMPANY = '/employer/company';
    const PROFILE = '/employer/profile';
    const items: ProfileChecklistItem[] = [
        { label: 'Company logo', done: !!company.logo_url, href: COMPANY },
        { label: 'Company description', done: !!company.description, href: COMPANY },
        { label: 'Short bio', done: !!company.bio, href: COMPANY },
        { label: 'Website', done: !!company.website, href: COMPANY },
        { label: 'Head office location', done: !!company.headoffice_location, href: COMPANY },
        { label: 'Company size', done: !!company.company_size, href: COMPANY },
        { label: 'Specialities', done: Array.isArray(company.specialities) && company.specialities.length > 0, href: COMPANY },
        { label: 'Map link', done: !!company.map_link, href: COMPANY },
        { label: 'Your photo', done: !!employer.profile_image_url, href: PROFILE },
        { label: 'Your designation', done: !!employer.designation, href: PROFILE },
        { label: 'Your phone', done: !!employer.phone, href: PROFILE },
        { label: 'Department', done: !!employer.department, href: PROFILE },
    ];
    const done = items.filter((i) => i.done).length;
    return { percent: Math.round((done / items.length) * 100), items };
}

function fullName(p: { first_name?: string | null; last_name?: string | null } | null): string {
    if (!p) return 'Candidate';
    return [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Candidate';
}

export async function getEmployerDashboardData(): Promise<EmployerDashboardData | null> {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return null;

    const supabase = createAdminClient();

    const { data: employer } = await supabase
        .from('employers')
        .select(`
            id, company_id, first_name, is_super_admin, created_at,
            designation, phone, department, profile_image_url,
            companies!inner (
                company_name, logo_url, approval_status, description, bio, website,
                headoffice_location, company_size, specialities, map_link
            )
        `)
        .eq('user_id', user.id)
        .single();

    if (!employer) return null;

    const company = employer.companies as unknown as Record<string, unknown>;
    const companyId = employer.company_id as string;
    const now = Date.now();
    const sevenDaysAgoIso = new Date(now - 7 * 864e5).toISOString();
    // Interview slots are stored as wall-clock date + time, so "upcoming" has to be judged
    // against the employer's own clock — on a UTC server, Colombo's evening is tomorrow.
    const employerTz = await getUserTimezone(user.id);
    const nowLocal = formatInTz(new Date(), 'yyyy-MM-dd HH:mm', employerTz);

    // ── Batch 1: everything reachable straight from company_id ──────────────
    const [
        { data: jobs },
        { data: invitationRaw },
        { data: payments },
        { count: teamCount },
    ] = await Promise.all([
        supabase
            .from('jobs')
            .select('id, job_title, status, location, job_type, positions_available, expires_at, created_at')
            .eq('company_id', companyId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false }),

        // ponytail: invitations are still fetched whole — the slot resolvers need every round.
        // Fine to a few hundred per company; past the API's max-rows cap this needs the same
        // count-in-Postgres treatment as applications, with the rounds fetched per page.
        supabase
            .from('job_invitations')
            .select(`
                id, application_id, job_designation, status, interview_mode, pipeline_status,
                interview_confirmed, invitation_canceled, current_round_number,
                selected_time_slot, given_time_slots, confirmed_time,
                mis_rescheduled, mis_reschedule_data,
                candidate:candidates ( id, first_name, last_name, profile_image_url ),
                interview_rounds (
                    id, round_number, round_label, status, outcome, interview_mode,
                    selected_time_slot, given_time_slots, confirmed_time, confirmed_at,
                    round_canceled, mis_rescheduled, mis_reschedule_data
                )
            `)
            .eq('company_id', companyId),

        supabase
            .from('payment_requests')
            .select('id, status, amount')
            .eq('company_id', companyId),

        supabase
            .from('employers')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', companyId),
    ]);

    const jobList = jobs ?? [];
    const jobIds = jobList.map((j) => j.id as string);
    const invitations = (invitationRaw ?? []) as unknown as CalendarInvitation[];
    const invitationIds = invitations.map((i) => i.id);

    // Live = published and not past its deadline. A lapsed posting is hidden from the
    // candidate job board (api/candidate/jobs filters `expires_at > now`), so counting it
    // as "active" told the employer they had openings nobody could see.
    const liveJobs = jobList.filter((j) => isLive(j, now));
    const topJobIds = liveJobs.slice(0, 5).map((j) => j.id as string);

    // ── Batch 2: rows that hang off the ids resolved above ──────────────────
    // Applicant totals are counted in Postgres rather than by fetching every row: the API
    // caps a single response at max-rows (1000 by default), which silently truncated every
    // count derived from the list once a company got busy.
    const applicationsQuery = () =>
        supabase.from('job_applications').select('id', { count: 'exact', head: true }).in('job_id', jobIds);

    const zeroCount = Promise.resolve({ count: 0 });
    const emptyRows = Promise.resolve({ data: [] as Record<string, unknown>[] });

    const [
        { count: totalApplicantCount },
        { count: newApplicantCount },
        { count: shortlistedCount },
        { data: recentAppRows },
        { data: hiredAppRows },
        { data: offers },
        perJobCounts,
    ] = await Promise.all([
        jobIds.length ? applicationsQuery() : zeroCount,
        jobIds.length ? applicationsQuery().gte('applied_at', sevenDaysAgoIso) : zeroCount,
        jobIds.length ? applicationsQuery().eq('status', 'shortlisted') : zeroCount,

        jobIds.length
            ? supabase
                .from('job_applications')
                .select(`
                    id, status, applied_at, ats_score, job_id,
                    job:jobs ( job_title ),
                    candidate:candidates ( first_name, last_name, profile_image_url, current_position )
                `)
                .in('job_id', jobIds)
                .order('applied_at', { ascending: false })
                .limit(5)
            : emptyRows,

        // Hires are few, and their ids are needed to de-duplicate against invitations.
        jobIds.length
            ? supabase.from('job_applications').select('id').in('job_id', jobIds).eq('status', 'hired')
            : emptyRows,

        invitationIds.length
            ? supabase
                .from('job_offers')
                .select('id, status, invitation_id')
                .in('invitation_id', invitationIds)
            : emptyRows,

        Promise.all(
            topJobIds.map(async (id) => {
                const { count } = await supabase
                    .from('job_applications')
                    .select('id', { count: 'exact', head: true })
                    .eq('job_id', id);
                return [id, count ?? 0] as const;
            }),
        ),
    ]);

    const recentAppList = (recentAppRows ?? []) as Record<string, unknown>[];
    const hiredAppIds = ((hiredAppRows ?? []) as { id: string }[]).map((a) => a.id);
    const offerList = (offers ?? []) as Record<string, unknown>[];
    const paymentList = (payments ?? []) as Record<string, unknown>[];
    const applicantsPerJob = new Map<string, number>(perJobCounts);

    /* ── Job posting counts ──────────────────────────────────────────────── */
    const countJobs = (s: string) => jobList.filter((j) => j.status === s).length;
    const expiringSoon = countExpiringSoon(jobList, now);

    /* ── Interview events (shared resolver with the calendar) ────────────── */
    const events: UpcomingInterview[] = invitations.flatMap((inv): UpcomingInterview[] => {
        const candidate = inv.candidate as unknown as Record<string, string> | null;
        const name = fullName(candidate);
        const image = candidate?.profile_image_url ?? null;
        const rounds = inv.interview_rounds ?? [];
        const invCanceled = inv.invitation_canceled && !inv.mis_rescheduled;

        if (rounds.length === 0) {
            const slot = resolveInvitationSlot(inv);
            if (!slot || invCanceled) return [];
            return [{
                id: `inv-${inv.id}`,
                invitationId: inv.id,
                date: slot.date,
                time: slot.time || '',
                candidateName: name,
                candidateImage: image,
                jobDesignation: inv.job_designation || 'Interview',
                roundLabel: null,
                interviewMode: inv.interview_mode,
                isConfirmed: inv.interview_confirmed,
            }];
        }

        return rounds.flatMap((round): UpcomingInterview[] => {
            const slot = resolveRoundSlot(round);
            const canceled = ((round.round_canceled || round.status === 'canceled') && !round.mis_rescheduled) || invCanceled;
            // Rounds already decided are history, not upcoming.
            if (!slot || canceled || round.outcome) return [];
            return [{
                id: `round-${round.id}`,
                invitationId: inv.id,
                date: slot.date,
                time: slot.time || '',
                candidateName: name,
                candidateImage: image,
                jobDesignation: inv.job_designation || 'Interview',
                roundLabel: round.round_label || `Round ${round.round_number}`,
                interviewMode: round.interview_mode ?? inv.interview_mode,
                isConfirmed: round.status === 'confirmed' || round.confirmed_at !== null,
            }];
        });
    });

    // An interview earlier today is history, not "upcoming" — the calendar page draws the
    // same line (`e.start >= new Date()`), and the two counts have to agree.
    const isUpcoming = (e: UpcomingInterview) => `${e.date} ${e.time || '23:59'}` >= nowLocal;
    const upcomingEvents = events.filter(isUpcoming);
    const upcomingInterviews = [...upcomingEvents]
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .slice(0, 5);

    /* ── Funnel ──────────────────────────────────────────────────────────── */
    const interviewing = invitations.filter(
        (i) => i.status === 'accepted' && !i.invitation_canceled && i.pipeline_status === 'active',
    ).length;
    // Accepting an offer writes `hired` to both the invitation and the application it came
    // from (api/candidate/invitations/[id]/offer), so the two sources must be de-duplicated.
    const hired = countHires(
        invitations as (CalendarInvitation & { application_id?: string | null })[],
        hiredAppIds.map((id) => ({ id, status: 'hired' })),
    );

    return {
        firstName: (employer.first_name as string) || 'there',
        companyName: (company.company_name as string) || 'Your company',
        companyLogo: (company.logo_url as string) ?? null,
        approvalStatus: (company.approval_status as string) || 'pending',
        isApproved: company.approval_status === 'approved',
        isSuperAdmin: !!employer.is_super_admin,
        memberSince: employer.created_at as string,

        activeJobs: liveJobs.length,
        draftJobs: countJobs('draft'),
        pausedJobs: countJobs('paused'),
        closedJobs: countJobs('closed'),
        lapsedJobs: jobList.filter((j) => j.status === 'published' && !isLive(j, now)).length,
        expiringSoon,

        totalApplicants: totalApplicantCount ?? 0,
        newApplicants: newApplicantCount ?? 0,
        shortlisted: shortlistedCount ?? 0,
        interviewing,
        offersExtended: offerList.length,
        hired,

        // 'viewed' means the candidate opened it without answering — still awaiting a reply.
        pendingInvitations: invitations.filter(
            (i) => (i.status === 'pending' || i.status === 'viewed') && !i.invitation_canceled,
        ).length,
        upcomingInterviewCount: upcomingEvents.length,

        offersPending: offerList.filter((o) => o.status === 'pending').length,
        offersAccepted: offerList.filter((o) => o.status === 'accepted').length,

        paymentsOutstanding: paymentList.filter((p) => p.status === 'pending_payment').length,
        paymentsUnderReview: paymentList.filter((p) => p.status === 'under_review').length,
        amountOutstanding: paymentList
            .filter((p) => p.status === 'pending_payment')
            .reduce((sum, p) => sum + Number(p.amount ?? 0), 0),

        teamMembers: teamCount ?? 1,

        ...(() => {
            const { percent, items } = buildProfileChecklist(company, employer as Record<string, unknown>);
            return { profileCompletionPercent: percent, profileChecklist: items };
        })(),

        upcomingInterviews,

        recentApplicants: recentAppList.map((a) => {
            const c = a.candidate as Record<string, string> | null;
            const j = a.job as Record<string, string> | null;
            return {
                id: a.id as string,
                candidateName: fullName(c),
                candidateImage: c?.profile_image_url ?? null,
                currentPosition: c?.current_position ?? null,
                jobTitle: j?.job_title || 'Job posting',
                appliedAt: a.applied_at as string,
                status: a.status as string,
                atsScore: a.ats_score != null ? Number(a.ats_score) : null,
            };
        }),

        topJobs: liveJobs
            .slice(0, 5)
            .map((j) => ({
                id: j.id as string,
                jobTitle: j.job_title as string,
                status: j.status as string,
                location: (j.location as string) ?? null,
                jobType: (j.job_type as string) ?? null,
                applicantCount: applicantsPerJob.get(j.id as string) ?? 0,
                positionsAvailable: (j.positions_available as number) ?? null,
                expiresAt: (j.expires_at as string) ?? null,
            })),
    };
}
