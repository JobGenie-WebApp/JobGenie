import Link from 'next/link';
import { AlertCircle, UserCog } from 'lucide-react';
import { MISSignupForm } from '@/components/auth/MISSignupForm';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuthShell } from '@/components/layout/AuthShell';

export default async function MISRegisterPage() {
    const adminClient = createAdminClient();
    const { count: misCount } = await adminClient
        .from('mis_user')
        .select('*', { count: 'exact', head: true });

    const misExists = misCount && misCount > 0;

    return (
        <AuthShell
            sideHeadline="Bootstrap your platform administrator."
            sideDescription="The first MIS account provisions governance for employers, candidates, and compliance. Additional admins are added by your team later."
            bullets={[
                'One-time self-service registration when no admin exists',
                'Strong password policy & verified email',
                'Full access to MIS dashboards after sign-in',
            ]}
            formWidth="md"
        >
            <div className="mb-5 flex justify-center sm:mb-6">
                <div className="inline-flex items-center justify-center rounded-2xl bg-primary/10 p-3.5 text-primary sm:p-4">
                    <UserCog className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
            </div>

            <h1 className="text-center text-2xl font-bold tracking-tight sm:text-[1.65rem]">
                {misExists ? 'MIS registration closed' : 'Create MIS account'}
            </h1>
            <p className="mb-6 mt-2 text-center text-sm text-muted-foreground sm:mb-7 sm:text-[15px]">
                {misExists
                    ? 'An administrator is already provisioned for this deployment.'
                    : 'Register the initial Management Information System administrator.'}
            </p>

            {misExists ? (
                <div className="space-y-5">
                    <div className="flex gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/40">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700 dark:text-yellow-500" />
                        <div>
                            <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                                Registration not available
                            </p>
                            <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-200/90">
                                Public MIS signup is limited to initial setup. Contact your system owner
                                for access.
                            </p>
                        </div>
                    </div>
                    <p className="text-center text-sm">
                        <Link href="/mis/login" className="font-semibold text-primary hover:underline">
                            Go to MIS sign in →
                        </Link>
                    </p>
                </div>
            ) : (
                <>
                    <MISSignupForm />
                    <p className="mt-6 text-center text-sm text-muted-foreground sm:mt-7">
                        Already have an account?{' '}
                        <Link href="/mis/login" className="font-semibold text-primary hover:underline">
                            Sign in
                        </Link>
                    </p>
                </>
            )}
        </AuthShell>
    );
}
