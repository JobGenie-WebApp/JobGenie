import type { Metadata } from "next";
import {
    RegistrationFlow,
    type RegistrationRole,
} from "@/components/auth/RegistrationFlow";

export const metadata: Metadata = {
    title: "Get Started | JobGenie",
    description: "Join JobGenie as a candidate or register your company.",
};

export default async function SignupPage({
    searchParams,
}: {
    searchParams: Promise<{ role?: string }>;
}) {
    const { role } = await searchParams;
    const initialRole: RegistrationRole | null =
        role === "candidate" || role === "company" ? role : null;

    return <RegistrationFlow initialRole={initialRole} />;
}
