import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { EmployerSidebar } from "./EmployerSidebar";
import { createClient } from "@/lib/supabase/server";

interface EmployerLayoutProps {
    children: React.ReactNode;
    pageTitle?: string;
    pageDescription?: string;
    /** Right-aligned action buttons in the content title row. */
    headerActions?: React.ReactNode;
    /** Overrides the last breadcrumb label (for id-based detail routes). */
    breadcrumbOverride?: string;
    /** When true, the layout scroll container is suppressed so the page can manage its own scrolling columns */
    fullHeight?: boolean;
    /** fullHeight only: set false for full-width bare content (no bordered card), e.g. the kanban board. */
    fullHeightBordered?: boolean;
}

async function getCurrentEmployer() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // Get employer data with company info
    const { data: employer } = await supabase
        .from('employers')
        .select(`
            first_name,
            last_name,
            is_super_admin,
            companies!inner (
                company_name
            )
        `)
        .eq('user_id', user.id)
        .single();

    if (!employer) {
        return null;
    }

    // Type assertion for nested company data
    const company = (employer as Record<string, unknown>).companies as { company_name?: string } | null;

    return {
        id: user.id,
        email: user.email || '',
        firstName: employer.first_name || '',
        lastName: employer.last_name || '',
        companyName: company?.company_name || undefined,
        isSuperAdmin: employer.is_super_admin ?? false,
    };
}

export async function EmployerLayout({ children, pageTitle, pageDescription, headerActions, breadcrumbOverride, fullHeight, fullHeightBordered }: EmployerLayoutProps) {
    const user = await getCurrentEmployer();

    if (!user) {
        redirect('/login');
    }

    return (
        <DashboardShell
            sidebar={<EmployerSidebar user={user} isSuperAdmin={user.isSuperAdmin} />}
            pageTitle={pageTitle}
            pageDescription={pageDescription}
            headerActions={headerActions}
            breadcrumbOverride={breadcrumbOverride}
            fullHeight={fullHeight}
            fullHeightBordered={fullHeightBordered}
            notificationRole="employer"
        >
            {children}
        </DashboardShell>
    );
}
