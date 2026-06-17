"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginMISUser, type ActionState } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

// Individual field component for consistent styling
function FormField({
    label,
    id,
    error,
    children,
    required = true,
}: {
    label: string;
    id: string;
    error?: string[];
    children: React.ReactNode;
    required?: boolean;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>
                {label} {required && <span className="text-destructive">*</span>}
            </Label>
            {children}
            {error && error.length > 0 && (
                <p className="text-sm text-destructive">{error[0]}</p>
            )}
        </div>
    );
}

export function MISLoginForm() {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
        loginMISUser,
        null
    );

    // Handle redirect on success
    useEffect(() => {
        if (state?.success && state.redirectTo) {
            router.push(state.redirectTo);
        }
    }, [state, router]);

    // Combine server errors
    const errors = state?.errors || {};

    return (
        <form action={formAction} className="space-y-4">
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

            {/* Email */}
            <FormField label="Email" id="email" error={errors.email}>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    aria-invalid={!!errors.email}
                    autoComplete="email"
                />
            </FormField>

            {/* Password */}
            <FormField label="Password" id="password" error={errors.password}>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                    autoComplete="current-password"
                />
            </FormField>

            {/* Submit Button */}
            <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={isPending}>
                {isPending ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Logging in...
                    </>
                ) : (
                    "Log In"
                )}
            </Button>
        </form>
    );
}
