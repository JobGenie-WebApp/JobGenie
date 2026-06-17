import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Employer Login | JobGenie",
    description: "Sign in to your employer account",
};

export default function EmployerLoginPage() {
    // Redirect to unified login
    redirect("/login");
}
