import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { EmployerSignupWizard } from '@/components/employer/EmployerSignupWizard';
import { AuthShell } from '@/components/layout/AuthShell';

export const metadata: Metadata = {
    title: 'Employer Signup | JobGenie',
    description: 'Register your company and start hiring top talent',
};

export default async function EmployerSignupPage() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) redirect('/employer/dashboard');

    return (
        <AuthShell
            sideHeadline="Evidence-led hiring for serious teams."
            sideDescription="Verify your organization, upload BR credentials, and onboard recruiters into one audit-friendly workspace."
            bullets={[
                'Business registry & document verification',
                'Pipeline analytics leadership actually reads',
                'Structured interviews & feedback in context',
            ]}
            formWidth="2xl"
            bare
        >
            <div className="mx-auto w-full max-w-4xl space-y-7">
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Employer registration
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Complete company details, then your admin profile — we&apos;ll guide you through both steps.
                    </p>
                </div>

                <EmployerSignupWizard />

                <p className="text-center text-sm text-muted-foreground/70">
                    Already have an account?{' '}
                    <Link href="/login" className="font-semibold text-primary hover:brightness-110 transition-all">
                        Sign in
                    </Link>
                </p>
            </div>
        </AuthShell>
    );
}
