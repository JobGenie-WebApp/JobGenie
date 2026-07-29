import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/layout/AuthShell';

interface PageProps {
    searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const token = params.token;

    if (!token) {
        redirect('/forgot-password');
    }

    return (
        <AuthShell
            sideHeadline="Choose a password that protects your pipeline."
            sideDescription="Use a unique passphrase with mixed characters — it secures every workspace tied to this email."
            bullets={[
                'Password strength enforced platform-wide',
                'Single sign-on to candidate or employer apps',
                'Invalid links expire automatically',
            ]}
            formWidth="md"
        >
            <div className="mb-5 flex justify-center sm:mb-6">
                <div className="inline-flex items-center justify-center rounded-2xl bg-primary/10 p-3.5 text-primary sm:p-4">
                    <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
            </div>

            <h1 className="text-center text-2xl font-bold tracking-tight sm:text-[1.65rem]">
                Set new password
            </h1>
            <p className="mb-6 mt-2 text-center text-sm text-muted-foreground sm:mb-7 sm:text-[15px]">
                Enter and confirm your new password below.
            </p>

            <ResetPasswordForm token={token} />

            <p className="mt-6 text-center text-sm text-muted-foreground sm:mt-7">
                <Link href="/login" className="font-semibold text-primary hover:underline">
                    Back to sign in
                </Link>
            </p>
        </AuthShell>
    );
}
