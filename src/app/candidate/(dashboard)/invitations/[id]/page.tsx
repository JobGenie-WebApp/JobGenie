import { Metadata } from "next";
import { CandidateLayout } from "@/components/candidate";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InvitationDetailClient from "./InvitationDetailClient";

export const metadata: Metadata = {
    title: "Invitation Details | JobGenie",
    description: "View interview invitation details",
};

export default async function InvitationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { id } = await params;

    return (
        <CandidateLayout
            pageTitle="Invitation Details"
            pageDescription="Review your interview invitation"
        >
            <InvitationDetailClient invitationId={id} />
        </CandidateLayout>
    );
}
