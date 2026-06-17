"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginCandidate, type ActionState } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

// Individual field component for consistent styling
function FormField({
    label,
    id,
    error,
    children,
}: {
    label: string;
    id: string;
    error?: string[];
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            {children}
            {error && error.length > 0 && (
                <p className="text-sm text-destructive">{error[0]}</p>
            )}
        </div>
    );
}

export function CandidateLoginForm() {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
        loginCandidate,
        null
    );

    // Handle redirect on success
    useEffect(() => {
        if (state?.success && state.redirectTo) {
            // Small delay to show success message before redirect
            const timer = setTimeout(() => {
                // Use window.location.href for full page reload to ensure cookies are synced
                // This prevents middleware redirect loops by ensuring session is fully established
                window.location.href = state.redirectTo!;
            }, 500);
            return () => clearTimeout(timer);
        }
        // Handle redirect to verify email if email not verified
        if (!state?.success && state?.redirectTo) {
            const timer = setTimeout(() => {
                router.push(state.redirectTo!);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [state, router]);


    // Password visibility toggle
    const [showPassword, setShowPassword] = useState(false);

    return (
        <form action={formAction} className="space-y-5">
            {/* Success/Error Message */}
            {state?.message && (
                <div>
                    <div
                        className={cn(
                            "rounded-lg p-3 text-sm",
                            state.success
                                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-destructive/10 text-destructive"
                        )}
                    >
                        {state.message}
                    </div>
                </div>
            )}

            {/* Email Field */}
            <FormField label="Email" id="email" error={state?.errors?.email}>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-invalid={!!state?.errors?.email}
                />
            </FormField>

            {/* Password Field */}
            <FormField label="Password" id="password" error={state?.errors?.password}>
                <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="pr-10"
                        aria-invalid={!!state?.errors?.password}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </FormField>

            {/* Forgot Password Link */}
            <div className="text-right">
                <Link
                    href="/forgot-password"
                    className="text-sm text-muted-foreground hover:text-primary"
                >
                    Forgot password?
                </Link>
            </div>

            {/* Submit Button */}
            <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={isPending}>
                {isPending ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing in...
                    </>
                ) : (
                    "Sign In"
                )}
            </Button>
        </form>
    );
}
