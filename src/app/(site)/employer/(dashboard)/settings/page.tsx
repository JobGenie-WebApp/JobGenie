import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmployerLayout } from "@/components/employer";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: employer } = await supabase
        .from("employers")
        .select(`
            is_super_admin,
            email,
            created_at,
            companies (
                company_name,
                approval_status
            )
        `)
        .eq("user_id", user.id)
        .single();

    if (!employer) redirect("/login");

    const company = (employer as Record<string, unknown>).companies as { approval_status?: string; company_name?: string } | null;

    return (
        <EmployerLayout
            pageTitle="Settings"
            pageDescription="Manage your account, appearance, notifications and hiring preferences"
        >
            <SettingsClient
                isSuperAdmin={employer.is_super_admin}
                email={employer.email}
                createdAt={employer.created_at}
                approvalStatus={company?.approval_status ?? "pending"}
                companyName={company?.company_name ?? null}
            />
        </EmployerLayout>
    );
}
