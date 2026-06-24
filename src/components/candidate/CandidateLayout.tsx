import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { CandidateSidebar } from "./CandidateSidebar";
import { createClient } from "@/lib/supabase/server";

interface CandidateLayoutProps {
    children: React.ReactNode;
    pageTitle?: string;
    pageDescription?: string;
    /** Right-aligned action buttons in the content title row. */
    headerActions?: React.ReactNode;
    /** Overrides the last breadcrumb label (for id-based detail routes). */
    breadcrumbOverride?: string;
    /** When true, the layout scroll container is suppressed so the page can manage its own scrolling columns */
    fullHeight?: boolean;
}

async function getCurrentUser() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // Get additional user data from candidates table
    const { data: candidate } = await supabase
        .from('candidates')
        .select('first_name, last_name, profile_image_url, membership_no')
        .eq('user_id', user.id)
        .single();

    return {
        id: user.id,
        email: user.email || '',
        firstName: candidate?.first_name || user.user_metadata?.first_name || '',
        lastName: candidate?.last_name || user.user_metadata?.last_name || '',
        profileImage: candidate?.profile_image_url || undefined,
        membershipNo: candidate?.membership_no || undefined,
    };
}

export async function CandidateLayout({ children, pageTitle, pageDescription, headerActions, breadcrumbOverride, fullHeight }: CandidateLayoutProps) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <DashboardShell
            sidebar={<CandidateSidebar user={user} />}
            pageTitle={pageTitle}
            pageDescription={pageDescription}
            headerActions={headerActions}
            breadcrumbOverride={breadcrumbOverride}
            fullHeight={fullHeight}
            notificationRole="candidate"
        >
            {children}
        </DashboardShell>
    );
}
