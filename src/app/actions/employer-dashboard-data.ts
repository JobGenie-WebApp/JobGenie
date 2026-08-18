'use server';

import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveInvitationSlot, resolveRoundSlot, type CalendarInvitation } from '@/lib/calendar-utils';

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
    const today = format(new Date(), 'yyyy-MM-dd');
    const sevenDaysAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const inSevenDays = new Date(Date.now() + 7 * 864e5).toISOString();

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

        supabase
            .from('job_invitations')
            .select(`
                id, job_designation, status, interview_mode, pipeline_status,
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

    // ── Batch 2: rows that hang off the ids resolved above ──────────────────
    const [{ data: applications }, { data: offers }] = await Promise.all([
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
            : Promise.resolve({ data: [] as Record<string, unknown>[] }),

        invitationIds.length
            ? supabase
                .from('job_offers')
                .select('id, status, invitation_id')
                .in('invitation_id', invitationIds)
            : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    ]);

    const appList = (applications ?? []) as Record<string, unknown>[];
    const offerList = (offers ?? []) as Record<string, unknown>[];
    const paymentList = (payments ?? []) as Record<string, unknown>[];

    /* ── Job posting counts ──────────────────────────────────────────────── */
    const countJobs = (s: string) => jobList.filter((j) => j.status === s).length;
    const expiringSoon = jobList.filter((j) =>
        j.status === 'published' && j.expires_at && (j.expires_at as string) <= inSevenDays,
    ).length;

    /* ── Applicant counts ────────────────────────────────────────────────── */
    const applicantsPerJob = new Map<string, number>();
    for (const a of appList) {
        const jid = a.job_id as string;
        applicantsPerJob.set(jid, (applicantsPerJob.get(jid) ?? 0) + 1);
    }
    const countApps = (s: string) => appList.filter((a) => a.status === s).length;

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

    const upcomingInterviews = events
        .filter((e) => e.date >= today)
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .slice(0, 5);

    /* ── Funnel ──────────────────────────────────────────────────────────── */
    const interviewing = invitations.filter(
        (i) => i.status === 'accepted' && !i.invitation_canceled && i.pipeline_status === 'active',
    ).length;
    const hired = invitations.filter((i) => i.pipeline_status === 'hired').length
        + countApps('hired');

    return {
        firstName: (employer.first_name as string) || 'there',
        companyName: (company.company_name as string) || 'Your company',
        companyLogo: (company.logo_url as string) ?? null,
        approvalStatus: (company.approval_status as string) || 'pending',
        isApproved: company.approval_status === 'approved',
        isSuperAdmin: !!employer.is_super_admin,
        memberSince: employer.created_at as string,

        activeJobs: countJobs('published'),
        draftJobs: countJobs('draft'),
        pausedJobs: countJobs('paused'),
        closedJobs: countJobs('closed'),
        expiringSoon,

        totalApplicants: appList.length,
        newApplicants: appList.filter((a) => (a.applied_at as string) >= sevenDaysAgo).length,
        shortlisted: countApps('shortlisted'),
        interviewing,
        offersExtended: offerList.length,
        hired,

        pendingInvitations: invitations.filter((i) => i.status === 'pending' && !i.invitation_canceled).length,
        upcomingInterviewCount: events.filter((e) => e.date >= today).length,

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

        recentApplicants: appList.slice(0, 5).map((a) => {
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

        topJobs: jobList
            .filter((j) => j.status === 'published')
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
