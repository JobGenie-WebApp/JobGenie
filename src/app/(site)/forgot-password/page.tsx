import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { AuthShell } from '@/components/layout/AuthShell';

export default function ForgotPasswordPage() {
    return (
        <AuthShell
            sideHeadline="Reset access without losing continuity."
            sideDescription="We&apos;ll email a secure link so you can set a new password and get back to hiring or applying in minutes."
            bullets={[
                'Time-limited reset links',
                'Works for every JobGenie workspace role',
                'Same SSO-ready email you use to sign in',
            ]}
            formWidth="md"
        >
            <div className="mb-5 flex justify-center sm:mb-6">
                <div className="inline-flex items-center justify-center rounded-2xl bg-primary/10 p-3.5 text-primary sm:p-4">
                    <KeyRound className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
            </div>

            <h1 className="text-center text-2xl font-bold tracking-tight sm:text-[1.65rem]">
                Forgot password?
            </h1>
            <p className="mb-6 mt-2 text-center text-sm text-muted-foreground sm:mb-7 sm:text-[15px]">
                Enter your registered email — we&apos;ll send a reset link if an account exists.
            </p>

            <ForgotPasswordForm />

            <p className="mt-6 text-center text-sm text-muted-foreground sm:mt-7">
                Remember your password?{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                    Back to sign in
                </Link>
            </p>
        </AuthShell>
    );
}
