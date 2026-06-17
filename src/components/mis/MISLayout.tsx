import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MISSidebar } from "./MISSidebar";
import { MISHeader } from "./MISHeader";
import { PageTransitionWrapper } from "@/components/layout/PageTransitionWrapper";
import { createClient } from "@/lib/supabase/server";

interface MISLayoutProps {
    children: React.ReactNode;
    pageTitle?: string;
    pageDescription?: string;
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

export async function MISLayout({ children, pageTitle, pageDescription, fullHeight }: MISLayoutProps) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <SidebarProvider className="h-dvh! min-h-0! overflow-hidden">
            <MISSidebar />
            <SidebarInset className="flex flex-col min-h-0 overflow-hidden">
                <MISHeader
                    user={user}
                    pageTitle={pageTitle}
                    pageDescription={pageDescription}
                />
                <div className={fullHeight ? "flex-1 min-h-0 overflow-hidden flex flex-col" : "flex-1 overflow-y-auto min-h-0"}>
                    <PageTransitionWrapper>
                        {fullHeight ? (
                            <div className="h-full overflow-hidden flex flex-col">
                                {children}
                            </div>
                        ) : (
                            <div className="bg-muted/30 p-4 md:p-6 min-h-full">
                                {children}
                            </div>
                        )}
                    </PageTransitionWrapper>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
