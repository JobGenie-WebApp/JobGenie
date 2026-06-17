import Link from 'next/link';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm';
import { redirect } from 'next/navigation';

interface PageProps {
    searchParams: Promise<{ email?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const email = params.email;

    // Redirect to signup if no email provided
    if (!email) {
        redirect('/candidate/signup');
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-8">
            <div className="w-full max-w-md">
                <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                    {/* Icon */}
                    <div className="mb-6 flex justify-center">
                        <div className="inline-flex items-center justify-center rounded-2xl bg-primary/10 p-4 text-primary">
                            <MailCheck className="h-10 w-10" />
                        </div>
                    </div>

                    {/* Header */}
                    <h1 className="mb-2 text-center text-2xl font-bold">
                        Verify Your Email
                    </h1>
                    <p className="mb-8 text-center text-muted-foreground">
                        We&apos;ve sent a 6-digit verification code to your email address.
                    </p>

                    {/* Verification Form */}
                    <VerifyEmailForm email={email} />
                </div>

                {/* Back link */}
                <div className="mt-6 text-center">
                    <Button variant="ghost" asChild>
                        <Link href="/candidate/signup" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Sign Up
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
