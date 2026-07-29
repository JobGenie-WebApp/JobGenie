import { Metadata } from "next";
import { CandidateLayout } from "@/components/candidate";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InvitationsClient from "./InvitationsClient";

export const metadata: Metadata = {
    title: "My Invitations | JobGenie",
    description: "View and manage interview invitations",
};

export default async function CandidateInvitationsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <CandidateLayout
            pageTitle="Interview Invitations"
            pageDescription="Manage your interview invitations from employers"
        >
            <InvitationsClient />
        </CandidateLayout>
    );
}
