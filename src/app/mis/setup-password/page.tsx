import Link from "next/link";
import { SetupPasswordForm } from "@/components/auth/SetupPasswordForm";
import { createAdminClient } from "@/lib/supabase/admin";
import { AlertCircle, CheckCircle } from "lucide-react";

export default async function SetupPasswordPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    const params = await searchParams;
    const token = params.token;

    // Validate token exists
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-md space-y-6">
                    <div className="text-center space-y-2">
                        <div className="flex justify-center">
                            <AlertCircle className="h-12 w-12 text-destructive" />
                        </div>
                        <h1 className="text-2xl font-bold">Invalid Link</h1>
                        <p className="text-muted-foreground">
                            No invitation token provided
                        </p>
                    </div>
                    <div className="text-center">
                        <Link href="/mis/login" className="text-sm text-primary hover:underline">
                            Return to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Verify token is valid and not expired
    const adminClient = createAdminClient();
    const { data: user, error } = await adminClient
        .from("users")
        .select("id, email, invitation_token_expires_at, role, status")
        .eq("invitation_token", token)
        .maybeSingle();

    const isExpired = user?.invitation_token_expires_at
        ? new Date(user.invitation_token_expires_at).getTime() < Date.now()
        : true;

    const isInvalid = !user || error || isExpired || user.role !== "mis";

    if (isInvalid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="w-full max-w-md space-y-6">
                    <div className="text-center space-y-2">
                        <div className="flex justify-center">
                            <AlertCircle className="h-12 w-12 text-destructive" />
                        </div>
                        <h1 className="text-2xl font-bold">
                            {isExpired ? "Invitation Expired" : "Invalid Invitation"}
                        </h1>
                        <p className="text-muted-foreground">
                            {isExpired
                                ? "This invitation link has expired. Please contact your administrator for a new invitation."
                                : "This invitation link is invalid or has already been used."
                            }
                        </p>
                    </div>
                    <div className="bg-card border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground text-center">
                            Need help? Contact your system administrator at{" "}
                            <a href="mailto:support@jobgenie.com" className="text-primary hover:underline">
                                support@jobgenie.com
                            </a>
                        </p>
                    </div>
                    <div className="text-center">
                        <Link href="/mis/login" className="text-sm text-primary hover:underline">
                            Return to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Token is valid - show password setup form
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-2">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Set Up Your Password
                    </h1>
                    <p className="text-muted-foreground">
                        Create a password to activate your MIS admin account
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-card border rounded-lg p-6 shadow-sm">
                    <SetupPasswordForm token={token} />
                </div>

                {/* Login Link */}
                <div className="text-center text-sm text-muted-foreground">
                    Already set up your password?{" "}
                    <Link
                        href="/mis/login"
                        className="font-medium text-primary hover:underline"
                    >
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
}
