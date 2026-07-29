import { MISLayout } from '@/components/mis';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CandidateTable } from './CandidateTable';

interface Candidate {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    industry: string;
    current_position: string;
    years_of_experience: number | null;
    approval_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

async function getCandidates() {
    const supabase = await createClient();

    // Fetch all candidates for approval regardless of profile_completed status
    const { data: candidates, error } = await supabase
        .from('candidates')
        .select('id, first_name, last_name, email, industry, current_position, years_of_experience, approval_status, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching candidates:', error);
        return [];
    }

    return candidates as Candidate[];
}

export default async function MISCandidatesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/mis/login');
    }

    const candidates = await getCandidates();

    return (
        <MISLayout
            pageTitle="Candidate Approvals"
            pageDescription="Review and approve candidate profiles"
        >
            <CandidateTable candidates={candidates} />
        </MISLayout>
    );
}
