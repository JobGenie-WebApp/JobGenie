import { Metadata } from "next";
import { EmployerLayout } from "@/components/employer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EmployerCalendarClient from "./EmployerCalendarClient";

export const metadata: Metadata = {
    title: "Interview Calendar | JobGenie",
    description: "View all scheduled interviews for your company in one place",
};

export default async function EmployerCalendarPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <EmployerLayout
            pageTitle="Interview Calendar"
            pageDescription="View all scheduled interviews for your company"
        >
            <EmployerCalendarClient />
        </EmployerLayout>
    );
}
