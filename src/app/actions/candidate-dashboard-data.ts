'use server';

import { createClient } from '@/lib/supabase/server';

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'canceled' | 'confirmed' | 'completed';

export interface RecentInvitation {
    id: string;
    job_title: string;
    industry: string | null;
    job_designation: string | null;
    status: InvitationStatus;
    sent_at: string;
    invitation_canceled: boolean;
    company_name: string | null;
}

export interface WorkExperienceSnap {
    id: string;
    job_title: string;
    company: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
}

export interface EducationSnap {
    id: string;
    degree_diploma: string;
    institution: string;
    status: string;
    professional_qualification: string | null;
}

export interface RecommendedJob {
    id: string;
    job_title: string;
    employment_type: string | null;
    salary_min: number | null;
    salary_max: number | null;
    company_name: string | null;
    location: string | null;
    posted_at: string;
    is_new: boolean;
}

export interface InterviewEvent {
    id: string;
    date: string;                   // YYYY-MM-DD
    time: string;                   // e.g. "10:00 AM"
    job_designation: string;
    company_name: string | null;
    interview_mode: string | null;   // 'online' | 'physical'
    is_confirmed: boolean;           // employer has confirmed (interview_confirmed = true)
    is_canceled: boolean;            // invitation_canceled = true
    invitation_id: string;
}

export interface CandidateDashboardData {
    // Profile
    id: string;
    firstName: string;
    lastName: string;
    currentPosition: string | null;
    industry: string | null;
    yearsOfExperience: number | null;
    experienceLevel: string | null;
    availabilityStatus: string | null;
    approvalStatus: string;
    membershipNo: string | null;
    profileImageUrl: string | null;
    profileCompleted: boolean;
    expectedMonthlySalary: number | null;
    gender: string | null;
    country: string | null;
    qualifications: string[] | null;
    highestQualification: string | null;
    professionalSummary: string | null;
    // Completion is calculated
    profileCompletionPercent: number;
    profileCompletionItems: { label: string; done: boolean }[];

    // Application stats (for "My Application Statuses" row)
    underReviewApplications: number;
    interviews: number;       // accepted/confirmed invitations
    offersReceived: number;   // completed invitations or future offers
    savedJobs: number;        // bookmarked jobs

    // Legacy invitation stats (kept for any remaining widgets)
    totalInvitations: number;
    pendingInvitations: number;
    acceptedInvitations: number;
    rejectedInvitations: number;

    // Recent data
    recentInvitations: RecentInvitation[];
    recentExperiences: WorkExperienceSnap[];
    recentEducations: EducationSnap[];

    // Recommended jobs
    recommendedJobs: RecommendedJob[];

    // Calendar events (confirmed/accepted interviews)
    interviewEvents: InterviewEvent[];

    // Jobs
    activeJobsCount: number;

    // Metadata
    memberSince: string;
}

function calculateProfileCompletion(
    candidate: Record<string, unknown>,
    hasExperience: boolean,
    hasEducation: boolean
): { percent: number; items: { label: string; done: boolean }[] } {
    const items = [
        { label: 'Profile photo', done: !!candidate.profile_image_url },
        { label: 'Full name', done: !!(candidate.first_name && candidate.last_name) },
        { label: 'Contact number', done: !!(candidate.phone || candidate.contact_no) },
        { label: 'Current position', done: !!candidate.current_position },
        { label: 'Industry', done: !!candidate.industry },
        { label: 'Professional summary', done: !!candidate.professional_summary },
        { label: 'Years of experience', done: candidate.years_of_experience !== null && candidate.years_of_experience !== undefined },
        { label: 'Work experience', done: hasExperience },
        { label: 'Education', done: hasEducation },
        { label: 'Expected salary', done: candidate.expected_monthly_salary !== null && candidate.expected_monthly_salary !== undefined },
        { label: 'Highest qualification', done: !!candidate.highest_qualification },
        { label: 'Availability status', done: !!candidate.availability_status },
    ];

    const done = items.filter(i => i.done).length;
    const percent = Math.round((done / items.length) * 100);
    return { percent, items };
}

export async function getCandidateDashboardData(): Promise<CandidateDashboardData | null> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 1. Fetch candidate profile
    const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .select(`
      id, first_name, last_name, current_position, industry,
      years_of_experience, experience_level, availability_status,
      approval_status, membership_no, profile_image_url, profile_completed,
      expected_monthly_salary, gender, country, qualifications,
      highest_qualification, professional_summary, phone, contact_no, created_at
    `)
        .eq('user_id', user.id)
        .single();

    if (candidateError || !candidate) return null;

    // Parallelize all remaining queries (2-6 queries → ~50ms instead of 500ms)
    const [
        { data: invitations },
        { data: recentInvRaw },
        { data: experiences },
        { data: educations },
        { count: activeJobsCount },
        { count: bookmarksCount },
        { data: interviewRaw },
        applicationStatsResult,
    ] = await Promise.all([
        // 2. Fetch invitation stats
        supabase
            .from('job_invitations')
            .select('id, job_id, status, sent_at, invitation_canceled, industry, job_designation, company_id')
            .eq('candidate_id', candidate.id),

        // 3. Fetch recent invitations with company name via companies join
        supabase
            .from('job_invitations')
            .select(`
          id, status, sent_at, invitation_canceled, industry, job_designation,
          jobs ( job_title ),
          companies ( name )
        `)
            .eq('candidate_id', candidate.id)
            .order('sent_at', { ascending: false })
            .limit(5),

        // 4. Fetch recent work experiences
        supabase
            .from('work_experiences')
            .select('id, job_title, company, start_date, end_date, is_current')
            .eq('candidate_id', candidate.id)
            .order('start_date', { ascending: false })
            .limit(3),

        // 5. Fetch recent educations
        supabase
            .from('educations')
            .select('id, degree_diploma, institution, status, professional_qualification')
            .eq('candidate_id', candidate.id)
            .order('created_at', { ascending: false })
            .limit(3),

        // 6. Fetch active jobs count
        supabase
            .from('jobs')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active'),

        // 8. Fetch bookmarks count
        supabase
            .from('job_bookmarks')
            .select('id', { count: 'exact', head: true })
            .eq('candidate_id', candidate.id),

        // 8b. Fetch all interview events for the calendar
        supabase
            .from('job_invitations')
            .select(`
          id, job_designation, interview_mode,
          status, interview_confirmed, invitation_canceled,
          selected_time_slot, mis_rescheduled, mis_reschedule_data,
          given_time_slots,
          companies ( name )
        `)
            .eq('candidate_id', candidate.id)
            .in('status', ['accepted', 'confirmed']),

        // 9. Fetch application stats
        supabase
            .from('job_applications')
            .select('id', { count: 'exact', head: true })
            .eq('candidate_id', candidate.id)
            .in('status', ['pending', 'under_review', 'reviewed']),
    ]);

    // 7. Fetch recommended jobs with fallback logic
    let finalJobsRaw;
    if (candidate.industry) {
        const { data: industryJobs } = await supabase
            .from('jobs')
            .select(`
        id, job_title, employment_type, salary_min, salary_max, location, created_at,
        companies ( name )
      `)
            .eq('status', 'active')
            .ilike('industry', `%${candidate.industry}%`)
            .order('created_at', { ascending: false })
            .limit(5);
        
        finalJobsRaw = industryJobs && industryJobs.length > 0 ? industryJobs : null;
    }

    // Fallback to latest jobs if no industry match
    if (!finalJobsRaw) {
        const { data: fallbackJobs } = await supabase
            .from('jobs')
            .select(`
        id, job_title, employment_type, salary_min, salary_max, location, created_at,
        companies ( name )
      `)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(5);
        finalJobsRaw = fallbackJobs;
    }

    const savedJobsCount = bookmarksCount || 0;
    const underReviewApplications = (applicationStatsResult.count as number) || 0;

    // Map to InterviewEvent[], priority: mis_reschedule_data > selected_time_slot > given_time_slots[0]
    const interviewEvents: InterviewEvent[] = (interviewRaw || []).reduce<InterviewEvent[]>((acc, inv) => {
        const companies = inv.companies as unknown as Record<string, string> | null;
        const slot = inv.selected_time_slot as { date: string; time: string } | null;
        const misData = inv.mis_reschedule_data as { date: string; time: string; interview_mode?: string } | null;
        const givenSlots = inv.given_time_slots as { date: string; time: string; order?: number }[] | null;

        // Priority: rescheduled → selected → first given slot
        let finalDate = inv.mis_rescheduled && misData?.date ? misData.date : slot?.date;
        let finalTime = inv.mis_rescheduled && misData?.time ? misData.time : slot?.time;
        const finalMode = inv.mis_rescheduled && misData?.interview_mode ? misData.interview_mode : inv.interview_mode;

        // Fallback to first given/proposed slot if neither selected nor rescheduled
        if (!finalDate && givenSlots && givenSlots.length > 0) {
            const sorted = [...givenSlots].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            finalDate = sorted[0].date;
            finalTime = sorted[0].time;
        }

        if (!finalDate) return acc; // no date info at all — skip

        acc.push({
            id: inv.id as string,
            invitation_id: inv.id as string,
            date: finalDate,
            time: finalTime || '',
            job_designation: (inv.job_designation as string) || 'Interview',
            company_name: companies?.name || null,
            interview_mode: (finalMode as string) || null,
            is_confirmed: (inv.interview_confirmed as boolean) || false,
            is_canceled: (inv.invitation_canceled as boolean) || false,
        });
        return acc;
    }, []);

    // Calculate stats
    const allInvitations = invitations || [];
    const totalInvitations = allInvitations.length;
    const pendingInvitations = allInvitations.filter(i =>
        i.status === 'pending' && !i.invitation_canceled
    ).length;
    const acceptedInvitations = allInvitations.filter(i =>
        i.status === 'accepted' || i.status === 'confirmed' || i.status === 'completed'
    ).length;
    const rejectedInvitations = allInvitations.filter(i => i.status === 'rejected').length;

    // Interviews = accepted/confirmed invitations
    const interviews = allInvitations.filter(i =>
        i.status === 'accepted' || i.status === 'confirmed'
    ).length;

    // Offers received = completed invitations (interview completed)
    const offersReceived = allInvitations.filter(i => i.status === 'completed').length;

    // Map recent invitations
    const recentInvitations: RecentInvitation[] = (recentInvRaw || []).map((inv: Record<string, unknown>) => {
        const jobs = inv.jobs as Record<string, string> | null;
        const companies = inv.companies as Record<string, string> | null;
        return {
            id: inv.id as string,
            job_title: jobs?.job_title || inv.job_designation as string || 'Job Invitation',
            industry: inv.industry as string | null,
            job_designation: inv.job_designation as string | null,
            status: inv.status as InvitationStatus,
            sent_at: inv.sent_at as string,
            invitation_canceled: inv.invitation_canceled as boolean,
            company_name: companies?.name || null,
        };
    });

    // Map recommended jobs
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recommendedJobs: RecommendedJob[] = (finalJobsRaw || []).map((job: Record<string, unknown>) => {
        const companies = job.companies as Record<string, string> | null;
        const postedAt = job.created_at as string;
        return {
            id: job.id as string,
            job_title: job.job_title as string,
            employment_type: (job.employment_type as string) || null,
            salary_min: job.salary_min as number | null,
            salary_max: job.salary_max as number | null,
            company_name: companies?.name || null,
            location: (job.location as string) || null,
            posted_at: postedAt,
            is_new: new Date(postedAt) >= new Date(sevenDaysAgo),
        };
    });

    const hasExperience = (experiences || []).length > 0;
    const hasEducation = (educations || []).length > 0;

    const { percent: profileCompletionPercent, items: profileCompletionItems } =
        calculateProfileCompletion(candidate as Record<string, unknown>, hasExperience, hasEducation);

    return {
        id: candidate.id as string,
        firstName: (candidate.first_name as string) || '',
        lastName: (candidate.last_name as string) || '',
        currentPosition: (candidate.current_position as string) || null,
        industry: (candidate.industry as string) || null,
        yearsOfExperience: candidate.years_of_experience as number | null,
        experienceLevel: (candidate.experience_level as string) || null,
        availabilityStatus: (candidate.availability_status as string) || null,
        approvalStatus: (candidate.approval_status as string) || 'pending',
        membershipNo: (candidate.membership_no as string) || null,
        profileImageUrl: (candidate.profile_image_url as string) || null,
        profileCompleted: (candidate.profile_completed as boolean) || false,
        expectedMonthlySalary: candidate.expected_monthly_salary as number | null,
        gender: (candidate.gender as string) || null,
        country: (candidate.country as string) || null,
        qualifications: (candidate.qualifications as string[]) || null,
        highestQualification: (candidate.highest_qualification as string) || null,
        professionalSummary: (candidate.professional_summary as string) || null,
        profileCompletionPercent,
        profileCompletionItems,
        underReviewApplications,
        interviews,
        offersReceived,
        savedJobs: savedJobsCount,
        totalInvitations,
        pendingInvitations,
        acceptedInvitations,
        rejectedInvitations,
        recentInvitations,
        recentExperiences: (experiences || []).map(e => ({
            id: e.id as string,
            job_title: e.job_title as string,
            company: e.company as string,
            start_date: e.start_date as string,
            end_date: e.end_date as string | null,
            is_current: e.is_current as boolean,
        })),
        recentEducations: (educations || []).map(e => ({
            id: e.id as string,
            degree_diploma: e.degree_diploma as string,
            institution: e.institution as string,
            status: e.status as string,
            professional_qualification: e.professional_qualification as string | null,
        })),
        recommendedJobs,
        interviewEvents,
        activeJobsCount: activeJobsCount || 0,
        memberSince: candidate.created_at as string,
    };
}
