import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmployerLayout } from "@/components/employer";
import { AdminProfilesClient } from "./AdminProfilesClient";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
    title: "Company Admins | JobGenie",
    description: "View all company administrators",
};

async function getCompanyAdmins(companyId: string) {
    const supabase = await createClient();

    const { data: admins, error } = await supabase
        .from("employers")
        .select(
            "id, user_id, first_name, last_name, email, designation, job_title, department, phone, is_super_admin, profile_image_url, created_at"
        )
        .eq("company_id", companyId)
        .order("is_super_admin", { ascending: false })
        .order("first_name", { ascending: true });

    if (error) {
        console.error("Error fetching company admins:", error);
        return [];
    }

    return admins || [];
}

export default async function AdminProfilesPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/employer/login");
    }

    const { data: employer } = await supabase
        .from("employers")
        .select("id, company_id, is_super_admin")
        .eq("user_id", user.id)
        .single();

    if (!employer) {
        redirect("/employer/login");
    }

    const admins = await getCompanyAdmins(employer.company_id);

    const subAdminCount = admins.filter((admin) => !admin.is_super_admin).length;
    const maxSubAdmins = 5;
    const canAddMore = employer.is_super_admin && subAdminCount < maxSubAdmins;

    return (
        <EmployerLayout
            pageTitle="Company Admins"
            pageDescription="View all administrators in your company"
        >
            {employer.is_super_admin && (
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Badge variant="outline" className="w-fit border-primary/25 text-sm">
                        {subAdminCount} / {maxSubAdmins} sub-admins
                    </Badge>
                    <Button asChild disabled={!canAddMore} className="gap-2" variant={canAddMore ? "gradient" : "secondary"}>
                        <Link href="/employer/admins/add">
                            <Plus className="h-4 w-4" />
                            Add sub-admin
                        </Link>
                    </Button>
                </div>
            )}

            <AdminProfilesClient admins={admins} />
        </EmployerLayout>
    );
}
