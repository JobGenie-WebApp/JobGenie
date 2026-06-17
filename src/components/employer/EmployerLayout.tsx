import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { EmployerSidebar } from "./EmployerSidebar";
import { EmployerHeader } from "./EmployerHeader";
import { PageTransitionWrapper } from "@/components/layout/PageTransitionWrapper";
import { PortalMain } from "@/components/layout/PortalMain";
import { Toaster } from "@/components/ui/toaster";
import { createClient } from "@/lib/supabase/server";

interface EmployerLayoutProps {
    children: React.ReactNode;
    pageTitle?: string;
    pageDescription?: string;
    /** When true, the layout scroll container is suppressed so the page can manage its own scrolling columns */
    fullHeight?: boolean;
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
    };
}

export async function EmployerLayout({ children, pageTitle, pageDescription, fullHeight }: EmployerLayoutProps) {
    const user = await getCurrentEmployer();

    if (!user) {
        redirect('/login');
    }

    return (
        <SidebarProvider className="sidebar-fullheight-wrapper">
            <EmployerSidebar />
            <SidebarInset className="flex flex-col overflow-hidden" style={{ minHeight: 0, height: "100%", maxHeight: "100dvh" }}>
                <EmployerHeader
                    user={user}
                    pageTitle={pageTitle}
                    pageDescription={pageDescription}
                />
                {fullHeight ? (
                    // Page manages its own scroll — no padding, no overflow wrapper
                    <div className="flex-1 min-h-0 overflow-hidden bg-background">
                        {children}
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto min-h-0 bg-background" id="employer-scroll-container">
                        <PageTransitionWrapper>
                            <div className="p-5 md:p-6">
                                {children}
                            </div>
                        </PageTransitionWrapper>
                    </div>
                )}
            </SidebarInset>
            <Toaster />
        </SidebarProvider>
    );
}
