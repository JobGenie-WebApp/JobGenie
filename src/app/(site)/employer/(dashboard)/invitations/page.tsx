import { Metadata } from "next";
import { EmployerLayout } from "@/components/employer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InvitationsClient from "./InvitationsClient";

export const metadata: Metadata = {
    title: "Applicants | JobGenie",
    description: "Review applicants and manage your interview pipeline",
};

export default async function InvitationsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <EmployerLayout
            pageTitle="Applicants"
            pageDescription="Review applicants and manage your interview pipeline"
            fullHeight
            fullHeightBordered={false}
        >
            <InvitationsClient />
        </EmployerLayout>
    );
}
