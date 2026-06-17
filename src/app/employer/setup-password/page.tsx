import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmployerSetupPasswordForm } from "@/components/employer/EmployerSetupPasswordForm";
import { Shield } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Set Up Password | JobGenie",
    description: "Complete your account setup",
};

interface SetupPasswordPageProps {
    searchParams: Promise<{ token?: string }>;
}

export default async function SetupPasswordPage({ searchParams }: SetupPasswordPageProps) {
    const { token } = await searchParams;

    if (!token) {
        redirect("/employer/login");
    }

    // Verify token exists and get user info
    const adminClient = createAdminClient();
    const { data: user, error } = await adminClient
        .from("users")
        .select("id, email, invitation_token_expires_at, role")
        .eq("invitation_token", token)
        .maybeSingle();

    if (error || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 dark:bg-background">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-card border dark:border-green-800/50 rounded-2xl shadow-xl p-8 text-center">
                        <div className="mb-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                                <span className="text-3xl">❌</span>
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Invalid Invitation</h1>
                        <p className="text-muted-foreground mb-6">
                            This invitation link is invalid or has already been used. Please contact your administrator for assistance.
                        </p>
                        <a
                            href="/employer/login"
                            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            Go to Login
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // Check if token is expired
    if (user.invitation_token_expires_at) {
        const expiryDate = new Date(user.invitation_token_expires_at);
        if (expiryDate.getTime() < Date.now()) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 dark:bg-background">
                    <div className="w-full max-w-md">
                        <div className="bg-white dark:bg-card border dark:border-green-800/50 rounded-2xl shadow-xl p-8 text-center">
                            <div className="mb-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 mb-4">
                                    <span className="text-3xl">⏰</span>
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold mb-2">Invitation Expired</h1>
                            <p className="text-muted-foreground mb-6">
                                This invitation has expired. Please contact your company administrator to receive a new invitation.
                            </p>
                            <a
                                href="/employer/login"
                                className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                                Go to Login
                            </a>
                        </div>
                    </div>
                </div>
            );
        }
    }

    // Verify role is employer
    if (user.role !== "employer") {
        redirect("/employer/login");
    }

    // Get employer details
    const { data: employer } = await adminClient
        .from("employers")
        .select("first_name, last_name, email")
        .eq("user_id", user.id)
        .single();

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background dark:bg-background">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Welcome to JobGenie!</h1>
                    <p className="text-muted-foreground">
                        Set up your password to complete your account
                    </p>
                </div>

                {/* User Info Card */}
                {employer && (
                    <div className="bg-green-50 dark:bg-card border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
                        <p className="text-sm text-green-700 dark:text-green-400">
                            <strong>Account:</strong> {employer.first_name} {employer.last_name}
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-400">
                            <strong>Email:</strong> {employer.email}
                        </p>
                    </div>
                )}

                {/* Form Card */}
                <div className="bg-white dark:bg-card border dark:border-green-800/50 rounded-2xl shadow-xl p-8">
                    <EmployerSetupPasswordForm token={token} />
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                    Already have an account?{" "}
                    <a href="/employer/login" className="text-primary hover:underline font-medium">
                        Log in
                    </a>
                </p>
            </div>
        </div>
    );
}
