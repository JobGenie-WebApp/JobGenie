import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface CreateProfileLayoutProps {
    children: React.ReactNode;
}

async function checkAuth() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Check if profile is already completed
    const { data: candidate } = await supabase
        .from("candidates")
        .select("profile_completed, first_name")
        .eq("user_id", user.id)
        .single();

    if (candidate?.profile_completed) {
        redirect("/candidate/dashboard");
    }

    return { user, firstName: candidate?.first_name || "" };
}

export default async function CreateProfileLayout({ children }: CreateProfileLayoutProps) {
    await checkAuth();

    return (
        <div className="min-h-screen bg-muted/30">
            <div className="mx-auto max-w-4xl px-4 py-8">
                {children}
            </div>
        </div>
    );
}
