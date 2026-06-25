import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { MISSidebar } from "./MISSidebar";
import { createClient } from "@/lib/supabase/server";

interface MISLayoutProps {
    children: React.ReactNode;
    pageTitle?: string;
    pageDescription?: string;
    /** Right-aligned action buttons in the content title row. */
    headerActions?: React.ReactNode;
    /** Overrides the last breadcrumb label (for id-based detail routes). */
    breadcrumbOverride?: string;
    fullHeight?: boolean;
}

async function getCurrentUser() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    // Get additional user data from users table
    const { data: userData } = await supabase
        .from('users')
        .select('first_name, last_name, profile_image_url')
        .eq('id', user.id)
        .single();

    return {
        id: user.id,
        email: user.email || '',
        firstName: userData?.first_name || user.user_metadata?.first_name || '',
        lastName: userData?.last_name || user.user_metadata?.last_name || '',
        profileImage: userData?.profile_image_url || undefined,
    };
}

export async function MISLayout({ children, pageTitle, pageDescription, headerActions, breadcrumbOverride, fullHeight }: MISLayoutProps) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <DashboardShell
            sidebar={<MISSidebar user={user} />}
            pageTitle={pageTitle}
            pageDescription={pageDescription}
            headerActions={headerActions}
            breadcrumbOverride={breadcrumbOverride}
            fullHeight={fullHeight}
        >
            {children}
        </DashboardShell>
    );
}
