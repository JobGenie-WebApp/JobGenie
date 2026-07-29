import { Metadata } from "next";
import { EmployerLayout } from "@/components/employer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CandidateTable } from "./CandidateTable";

export const metadata: Metadata = {
    title: "Browse Candidates | JobGenie",
    description: "Browse and filter approved candidate profiles",
};

interface CandidateForTable {
    id: string;
    first_name: string;
    last_name: string;
    industry: string;
    current_position: string;
    years_of_experience: number | null;
    experience_level: string | null;
    employment_type: string | null;
    availability_status: string | null;
    expected_monthly_salary: number | null;
    highest_qualification: string | null;
    qualifications: string[];
    expected_positions: string[];  // Positions the candidate is targeting
    invited: boolean;  // Track if candidate has been invited by this company
    isHiredElsewhere: boolean;  // Candidate hired by a different company
    // Invitation journey fields (present when invited=true)
    invitationStatus?: string | null;
    invitationPipelineStatus?: string | null;
    invitationInterviewConfirmed?: boolean;
    invitationCurrentRound?: number | null;
    invitationMisRescheduled?: boolean;
}

async function getApprovedCandidates() {
    const supabase = await createClient();

    // Fetch only MIS approved candidates
    const { data: candidates, error } = await supabase
        .from('candidates')
        .select('id, first_name, last_name, industry, current_position, years_of_experience, experience_level, employment_type, availability_status, expected_monthly_salary, highest_qualification, qualifications, expected_positions')
        // .eq('approval_status', 'approved')
        // .eq('profile_completed', true)
        .order('years_of_experience', { ascending: false });

    if (error) {
        console.error('Error fetching candidates:', error);
        return [];
    }

    return candidates as CandidateForTable[];
}

export default async function EmployerCandidatesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/employer/login");
    }

    // Get employer record including company_id
    const { data: employer } = await supabase
        .from('employers')
        .select('id, company_id')
        .eq('user_id', user.id)
        .single();

    const thisCompanyId = employer?.company_id ?? '';

    // Fetch approved candidates and all invitation data in parallel
    const [candidates, invitationsResult, hiredResult] = await Promise.all([
        getApprovedCandidates(),
        supabase
            .from('job_invitations')
            .select('candidate_id, status, pipeline_status, interview_confirmed, current_round_number, mis_rescheduled')
            .eq('company_id', thisCompanyId)
            .eq('invitation_canceled', false),
        supabase
            .from('job_invitations')
            .select('candidate_id, company_id')
            .eq('pipeline_status', 'hired')
            .eq('invitation_canceled', false),
    ]);

    // Build a lookup map: candidate_id -> active invitation for this company
    const invitationMap = new Map(
        (invitationsResult.data ?? [])
            .filter(inv =>
                !['declined', 'expired'].includes(inv.status ?? '') &&
                !['rejected', 'withdrawn', 'expired'].includes(inv.pipeline_status ?? '')
            )
            .map(inv => [inv.candidate_id, inv])
    );

    // Add invitation status to candidates
    const candidatesWithStatus = candidates.map(candidate => {
        const inv = invitationMap.get(candidate.id);
        const hiredEntry = (hiredResult.data ?? []).find(h => h.candidate_id === candidate.id);
        const isHiredElsewhere = !!hiredEntry && hiredEntry.company_id !== thisCompanyId;
        return {
            ...candidate,
            invited: !!inv,
            isHiredElsewhere,
            invitationStatus: inv?.status ?? null,
            invitationPipelineStatus: inv?.pipeline_status ?? null,
            invitationInterviewConfirmed: inv?.interview_confirmed ?? false,
            invitationCurrentRound: inv?.current_round_number ?? null,
            invitationMisRescheduled: inv?.mis_rescheduled ?? false,
        };
    });

    // Fetch industries from the database table
    const { data: industriesData, error: industriesError } = await supabase
        .from('industries')
        .select('industry_id, industry_name')
        .order('industry_name', { ascending: true });

    if (industriesError) {
        console.error('Error fetching industries:', industriesError);
    }

    const industries = industriesData || [];

    return (
        <EmployerLayout
            pageTitle="Browse Candidates"
            pageDescription="Filter and view approved candidate profiles"
        >
            <CandidateTable
                candidates={candidatesWithStatus}
                industries={industries}
            />
        </EmployerLayout>
    );
}
