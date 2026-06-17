import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { CandidateSidebar } from "./CandidateSidebar";
import { CandidateHeader } from "./CandidateHeader";
import { PageTransitionWrapper } from "@/components/layout/PageTransitionWrapper";
import { PortalMain } from "@/components/layout/PortalMain";
import { Toaster } from "@/components/ui/toaster";
import { createClient } from "@/lib/supabase/server";

interface CandidateLayoutProps {
    children: React.ReactNode;
    pageTitle?: string;
    pageDescription?: string;
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

export async function CandidateLayout({ children, pageTitle, pageDescription }: CandidateLayoutProps) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <SidebarProvider className="h-dvh! min-h-0! overflow-hidden">
            <CandidateSidebar />
            <SidebarInset className="flex flex-col min-h-0 overflow-hidden">
                <CandidateHeader
                    user={user}
                    pageTitle={pageTitle}
                    pageDescription={pageDescription}
                />
                <div className="flex-1 overflow-y-auto min-h-0 bg-background">
                    <PageTransitionWrapper>
                        <div className="p-5 md:p-6">
                            {children}
                        </div>
                    </PageTransitionWrapper>
                </div>
            </SidebarInset>
            <Toaster />
        </SidebarProvider>
    );
}
