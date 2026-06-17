import { Metadata } from "next";
import { CandidateLayout } from "@/components/candidate";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CandidateCalendarClient from "./CandidateCalendarClient";

export const metadata: Metadata = {
    title: "Interview Calendar | JobGenie",
    description: "View all your interviews and invitations in one place",
};

export default async function CandidateCalendarPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <CandidateLayout
            pageTitle="Interview Calendar"
            pageDescription="View all your scheduled interviews and invitations"
        >
            <CandidateCalendarClient />
        </CandidateLayout>
    );
}
