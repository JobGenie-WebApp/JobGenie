"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    BriefcaseBusiness,
    Building2,
    Check,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import { CandidateSignupForm } from "@/components/auth/CandidateSignupForm";
import type { CountryOption } from "@/lib/countries";
import { EmployerSignupWizard } from "@/components/employer/EmployerSignupWizard";
import { AuthShell } from "@/components/layout/AuthShell";
import { cn } from "@/lib/utils";

export type RegistrationRole = "candidate" | "company";

type RoleOption = {
    value: RegistrationRole;
    title: string;
    description: string;
    detail: string;
    icon: typeof UserRound;
};

const roleOptions: RoleOption[] = [
    {
        value: "candidate",
        title: "Are you a job seeker?",
        description: "Create your profile and find your next opportunity!",
        detail: "Explore your opportunities!",
        icon: UserRound,
    },
    {
        value: "company",
        title: "Are you an employer?",
        description: "Register your company and find the best talent!",
        detail: "Discover the best talent!",
        icon: Building2,
    },
];

const shellContent = {
    undecided: {
        headline: "Choose the account that fits your goals.",
        description: "Register as a candidate to explore career opportunities, or as a company to connect with qualified talent.",
        bullets: [
            "A tailored experience for each account type",
            "Verified candidate and company profiles",
            "A clear and transparent recruitment process",
        ],
    },
    candidate: {
        headline: "Build a profile that supports your career.",
        description: "Present your experience and qualifications, track applications, and discover roles aligned with your skills and preferences.",
        bullets: [
            "A verified professional profile",
            "Clear application progress from review to offer",
            "Coordinated interview scheduling with employers",
        ],
    },
    company: {
        headline: "Build your dream team with exceptional talent.",
        description: "One platform for all your hiring needs.",
        bullets: [
            "Set up your profile in just a few clicks.",
            "A trusted, regulated interview process you can rely on.",
            "Easily evaluate and monitor individual competencies.",
        ],
    },
};

function RoleSelector({
    value,
    onChange,
    compact = false,
}: {
    value: RegistrationRole | null;
    onChange: (role: RegistrationRole) => void;
    compact?: boolean;
}) {
    return (
        <div
            className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", compact && "gap-2.5")}
            role="radiogroup"
            aria-label="Choose an account type"
        >
            {roleOptions.map((option) => {
                const selected = value === option.value;
                const Icon = option.icon;

                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "group relative min-h-12 w-full cursor-pointer rounded-2xl border text-left outline-none transition-[border-color,background-color,box-shadow,transform] duration-200",
                            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-[0.99]",
                            selected
                                ? "border-primary/60 bg-primary/[0.08] shadow-sm"
                                : "border-border/80 bg-background/60 hover:border-primary/35 hover:bg-primary/[0.04]",
                            compact ? "p-3.5" : "p-5 sm:p-6",
                        )}
                    >
                        <div className={cn("flex", compact ? "items-center gap-3" : "items-start gap-4")}>
                            <span
                                className={cn(
                                    "flex shrink-0 items-center justify-center rounded-xl ring-1 transition-colors",
                                    compact ? "h-10 w-10" : "h-12 w-12",
                                    selected
                                        ? "bg-primary text-primary-foreground ring-primary/40"
                                        : "bg-primary/[0.08] text-primary ring-primary/15 group-hover:bg-primary/15",
                                )}
                            >
                                <Icon className={compact ? "h-5 w-5" : "h-6 w-6"} aria-hidden="true" />
                            </span>

                            <span className="min-w-0 flex-1">
                                <span className={cn("block font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
                                    {compact
                                        ? option.value === "candidate" ? "Job Seeker" : "Employer"
                                        : option.title}
                                </span>
                                <span className={cn("block text-muted-foreground", compact ? "mt-0.5 text-xs" : "mt-2 text-sm leading-relaxed")}>
                                    {compact ? option.detail : option.description}
                                </span>
                            </span>

                            <span
                                className={cn(
                                    "flex shrink-0 items-center justify-center rounded-full transition-all",
                                    selected
                                        ? "h-6 w-6 bg-primary text-primary-foreground"
                                        : "h-6 w-6 border border-border bg-card text-muted-foreground group-hover:border-primary/40 group-hover:text-primary",
                                )}
                                aria-hidden="true"
                            >
                                {selected ? <Check className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function AccountTypeHeader({
    role,
    onChange,
}: {
    role: RegistrationRole;
    onChange: (role: RegistrationRole) => void;
}) {
    return (
        <section className="rounded-2xl border border-border/80 bg-card/95 p-4 shadow-[0_12px_40px_-30px_rgba(0,0,0,.45)] ring-1 ring-primary/[0.04] backdrop-blur-xl sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-foreground">Pick Your Profile</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Select the option that reflects how you will use the platform.</p>
                </div>
            </div>
            <RoleSelector value={role} onChange={onChange} compact />
        </section>
    );
}

function RegistrationHeader({
    role,
}: {
    role: RegistrationRole;
}) {
    const candidate = role === "candidate";
    const Icon = candidate ? UserRound : Building2;

    return (
        <header className="flex items-start gap-4 rounded-2xl border border-border/80 bg-card/95 p-5 shadow-[0_12px_40px_-30px_rgba(0,0,0,.45)] ring-1 ring-primary/[0.04] sm:p-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    {candidate ? "Job Seeker account" : "Employer account"}
                </p>
                <h1 className="mt-1.5 text-2xl font-bold tracking-[-0.035em] text-foreground">
                    {candidate ? "Create Your Profile" : "Register Your Company"}
                </h1>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {candidate
                        ? "Create a verified profile to present your experience and access relevant career opportunities."
                        : "Provide your organization and administrator details to create a verified company account."}
                </p>
            </div>
        </header>
    );
}

export function RegistrationFlow({ initialRole, countries }: { initialRole: RegistrationRole | null; countries: CountryOption[] }) {
    const router = useRouter();
    const role = initialRole;
    const content = role ? shellContent[role] : shellContent.undecided;

    const selectRole = (nextRole: RegistrationRole) => {
        router.replace(`/signup?role=${nextRole}`, { scroll: false });
    };

    return (
        <AuthShell
            sideHeadline={content.headline}
            sideDescription={content.description}
            bullets={content.bullets}
            formWidth="2xl"
            bare
        >
            {!role && (
                <div className="mx-auto w-full max-w-3xl">
                    <div className="rounded-[1.75rem] border border-border/80 bg-card/95 p-6 shadow-[0_24px_80px_-42px_rgba(0,0,0,.5)] ring-1 ring-primary/[0.05] backdrop-blur-xl sm:p-9">
                        <div className="mx-auto max-w-xl text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-lg shadow-primary/10">
                                <BriefcaseBusiness className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <h1 className="mt-5 text-2xl font-bold tracking-[-0.04em] text-foreground sm:text-3xl">
                                Pick your profile
                            </h1>
                            <p className="mt-3 text-[15px] leading-6 text-muted-foreground">
                                Select the option that best reflects how you plan to use the platform.
                            </p>
                        </div>

                        <div className="mt-7">
                            <RoleSelector value={null} onChange={selectRole} />
                        </div>

                        <div className="mx-auto mt-7 flex max-w-md items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/50 px-4 py-3 text-center text-xs leading-5 text-muted-foreground">
                            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                            Your information is handled securely and reviewed to maintain platform integrity.
                        </div>

                        <p className="mt-6 text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="font-semibold text-primary transition-all hover:brightness-110">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            )}

            {role === "candidate" && (
                <div className="mx-auto w-full max-w-4xl space-y-5">
                    <AccountTypeHeader role={role} onChange={selectRole} />
                    <RegistrationHeader role={role} />

                    <div className="rounded-2xl border border-border/80 bg-card/95 p-5 shadow-[0_16px_50px_-36px_rgba(0,0,0,.5)] ring-1 ring-primary/[0.04] sm:p-7">
                        <CandidateSignupForm countries={countries} />
                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold text-primary transition-all hover:brightness-110">
                            Sign in
                        </Link>
                    </p>
                </div>
            )}

            {role === "company" && (
                <div className="mx-auto w-full max-w-4xl space-y-5">
                    <AccountTypeHeader role={role} onChange={selectRole} />
                    <RegistrationHeader role={role} />

                    <EmployerSignupWizard />

                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold text-primary transition-all hover:brightness-110">
                            Sign in
                        </Link>
                    </p>
                </div>
            )}
        </AuthShell>
    );
}
