import { MISLayout } from '@/components/mis';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EmployerTable } from './EmployerTable';

interface Company {
    id: string;
    company_name: string;
    business_registration_no: string;
    industry: string;
    approval_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

async function getCompanies() {
    const supabase = await createClient();

    // Fetch confirmed companies (where profile is completed) for approval
    const { data: companies, error } = await supabase
        .from('companies')
        .select('id, company_name, business_registration_no, industry, approval_status, created_at')
        .eq('profile_completed', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching companies:', error);
        return [];
    }

    return companies as Company[];
}

export default async function MISEmployersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/mis/login');
    }

    const companies = await getCompanies();

    return (
        <MISLayout
            pageTitle="Company Approvals"
            pageDescription="Review and approve company registration requests"
        >
            <EmployerTable companies={companies} />
        </MISLayout>
    );
}
