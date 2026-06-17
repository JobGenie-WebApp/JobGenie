import { Metadata } from "next";
import { EmployerLayout } from "@/components/employer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InvitationsClient from "./InvitationsClient";

export const metadata: Metadata = {
    title: "Invitations | JobGenie",
    description: "View all interview invitations sent to candidates",
};

export default async function InvitationsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <EmployerLayout
            pageTitle="Invitations"
            pageDescription="View and manage interview invitations sent to candidates"
        >
            <InvitationsClient />
        </EmployerLayout>
    );
}
