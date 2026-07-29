import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { CandidateSignupForm } from '@/components/auth/CandidateSignupForm';
import { AuthShell } from '@/components/layout/AuthShell';

export default function CandidateSignupPage() {
    return (
        <AuthShell
            sideHeadline="Your career graph, one verified profile."
            sideDescription="Show intent-rich credentials, track every application in one timeline, and get matched to roles that fit how you work."
            bullets={[
                'Credential-backed identity & résumé graph',
                'Transparent stages from screen to offer',
                'Calendar-aware scheduling with employers',
            ]}
            formWidth="lg"
        >
            {/* Icon */}
            <div className="mb-6 flex justify-center">
                <div className="relative">
                    <div className="h-14 w-14 rounded-2xl bg-primary/15 ring-1 ring-primary/25 flex items-center justify-center shadow-lg shadow-primary/10">
                        <UserPlus className="h-6 w-6 text-primary" />
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl -z-10" />
                </div>
            </div>

            <h1 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-[1.7rem]">
                Create your candidate account
            </h1>
            <p className="mb-7 mt-2 text-center text-sm text-muted-foreground">
                Join verified job seekers on JobGenie — free to get started.
            </p>

            <CandidateSignupForm />

            <p className="mt-6 text-center text-sm text-muted-foreground/70">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary hover:brightness-110 transition-all">
                    Sign in
                </Link>
            </p>
        </AuthShell>
    );
}
