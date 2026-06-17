import Link from 'next/link';
import { Shield } from 'lucide-react';
import { MISLoginForm } from '@/components/auth/MISLoginForm';
import { AuthShell } from '@/components/layout/AuthShell';

export default function MISLoginPage() {
    return (
        <AuthShell
            sideHeadline="Operations console for trusted admins."
            sideDescription="Management Information System access is restricted to authorized personnel. Sign in with your issued credentials."
            bullets={[
                'Role & permission governance',
                'Employer and candidate oversight',
                'Audit logs and platform analytics',
            ]}
            formWidth="md"
        >
            <div className="mb-5 flex justify-center sm:mb-6">
                <div className="inline-flex items-center justify-center rounded-2xl bg-primary/10 p-3.5 text-primary sm:p-4">
                    <Shield className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
            </div>

            <h1 className="text-center text-2xl font-bold tracking-tight sm:text-[1.65rem]">
                MIS sign in
            </h1>
            <p className="mb-6 mt-2 text-center text-sm text-muted-foreground sm:mb-7 sm:text-[15px]">
                Enter your administrator email and password.
            </p>

            <MISLoginForm />
        </AuthShell>
    );
}
