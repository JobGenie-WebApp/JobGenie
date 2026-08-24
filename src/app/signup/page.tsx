import type { Metadata } from "next";
import {
    RegistrationFlow,
    type RegistrationRole,
} from "@/components/auth/RegistrationFlow";
import { getCountries } from "@/lib/countries";

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

    const countries = await getCountries();

    return <RegistrationFlow initialRole={initialRole} countries={countries} />;
}
