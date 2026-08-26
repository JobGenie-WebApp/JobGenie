import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEmployerProfileData } from "@/app/actions/employer-profile";
import { EmployerProfileWizard } from "@/components/employer/profile/EmployerProfileWizard";
import { getCountries } from "@/lib/countries";

export const metadata: Metadata = {
    title: "Complete Profile | JobGenie",
    description: "Complete your employer profile to start posting jobs",
};

export default async function CompleteProfilePage() {
    // Check authentication. Use getUser() (not getSession()) so the identity is
    // verified against the Supabase Auth server rather than trusted from cookies.
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/employer/login");
    }

    // Fetch employer and company data
    const profileData = await getEmployerProfileData(user.id);

    if (!profileData) {
        redirect("/employer/login");
    }

    // Check if user is super admin (needed to determine which steps to show)
    const { data: employerInfo } = await supabase
        .from("employers")
        .select("is_super_admin")
        .eq("user_id", user.id)
        .single();

    const isSuperAdmin = employerInfo?.is_super_admin || false;

    const countries = await getCountries();

    // If both profiles are complete, redirect to dashboard
    // For sub-admins, only check employer profile completion
    const isProfileComplete = isSuperAdmin
        ? profileData.company.profile_completed
        : profileData.employer.profile_completed;

    if (isProfileComplete) {
        redirect("/employer/dashboard");
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto w-full max-w-3xl px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Complete Employer Profile</h1>
                    <p className="text-muted-foreground">
                        {isSuperAdmin
                            ? "Let's finish setting up your profile to start posting jobs and finding top talent"
                            : "Complete your personal profile to start working with your team"
                        }
                    </p>
                </div>

                {/* Wizard */}
                <EmployerProfileWizard initialData={profileData} isSuperAdmin={isSuperAdmin} countries={countries} />
            </div>
        </div>
    );
}
