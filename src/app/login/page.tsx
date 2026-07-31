import Link from 'next/link';
import { ArrowRight, Building2, ShieldCheck, UserRound } from 'lucide-react';
import { UniversalLoginForm } from '@/components/auth/UniversalLoginForm';
import { AuthShell } from '@/components/layout/AuthShell';

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ returnUrl?: string }>;
}) {
    const params = await searchParams;
    const returnUrl = params.returnUrl;

    return (
        <AuthShell
            sideHeadline="Where great careers and great teams meet."
            sideDescription="Access your personalized JobGenie workspace with one secure sign-in — whether you are growing your career or building a team."
            formWidth="md"
        >
            <div className="mb-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1.5 text-xs font-semibold text-primary">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Secure workspace access
                </div>

                <h1 className="mt-5 text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-[2rem]">
                    Welcome back
                </h1>
                <p className="mt-2 text-[15px] leading-6 text-muted-foreground">
                    Sign in to continue to your JobGenie workspace.
                </p>
            </div>

            <UniversalLoginForm returnUrl={returnUrl} />

            <div className="my-7 flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-medium text-muted-foreground">New to JobGenie?</span>
                <div className="flex-1 h-px bg-border" />
            </div>

            <Link
                href="/signup"
                className="group flex min-h-12 w-full items-center justify-between rounded-xl border border-border bg-muted/30 px-4 transition-all hover:border-primary/30 hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <span>
                    <span className="block text-sm font-semibold text-foreground">Create an account</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">Choose candidate or company</span>
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
            </Link>

            <div className="mt-4 grid grid-cols-2 gap-3" aria-label="Supported account types">
                <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-background/50 px-3 py-2.5">
                    <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span className="text-xs font-medium text-muted-foreground">Candidates</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-background/50 px-3 py-2.5">
                    <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span className="text-xs font-medium text-muted-foreground">Companies</span>
                </div>
            </div>
        </AuthShell>
    );
}
