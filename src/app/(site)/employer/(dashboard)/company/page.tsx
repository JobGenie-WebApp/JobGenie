import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmployerLayout } from "@/components/employer";
import { getCompanyProfile } from "@/app/actions/employer-profiles";
import { CompanyProfileClient } from "@/components/employer/CompanyProfileClient";

export const metadata: Metadata = {
    title: "Company Profile | JobGenie",
    description: "View your company information",
};

export default async function CompanyProfilePage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: employerInfo } = await supabase
        .from("employers")
        .select("is_super_admin")
        .eq("user_id", user.id)
        .single();

    const isSuperAdmin = employerInfo?.is_super_admin || false;

    const companyProfile = await getCompanyProfile(user.id);

    if (!companyProfile) {
        redirect("/employer/dashboard");
    }

    return (
        <EmployerLayout
            pageTitle="Company Profile"
            pageDescription="View and manage your company information"
        >
            <CompanyProfileClient company={companyProfile} isSuperAdmin={isSuperAdmin} />
        </EmployerLayout>
    );
}
