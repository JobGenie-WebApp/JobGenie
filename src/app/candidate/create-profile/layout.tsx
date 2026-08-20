import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthShell } from "@/components/layout/AuthShell";

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
        <AuthShell
            sideHeadline="Build a profile that opens the right doors."
            sideDescription="Turn your experience, education, and goals into one verified profile employers can trust."
            bullets={[
                "One profile for every opportunity",
                "CV-assisted setup that saves time",
                "Clear progress from application to offer",
            ]}
            formWidth="2xl"
            bare
        >
            {children}
        </AuthShell>
    );
}
