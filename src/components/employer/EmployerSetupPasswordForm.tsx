"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff, CheckCircle2, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setupEmployerPassword, type ActionState } from "@/app/actions/employer-actions";
import { cn } from "@/lib/utils";

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
            <Label htmlFor={id}>
                {label} <span className="text-destructive">*</span>
            </Label>
            {children}
            {error && error.length > 0 && (
                <p className="text-sm text-destructive">{error[0]}</p>
            )}
        </div>
    );
}

export function EmployerSetupPasswordForm({ token }: { token: string }) {
    const router = useRouter();
    const [showTempPassword, setShowTempPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
        setupEmployerPassword,
        null
    );

    // Handle redirect on success
    useEffect(() => {
        if (state?.success && state.redirectTo) {
            const timer = setTimeout(() => {
                router.push(state.redirectTo!);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [state, router]);

    const errors = state?.errors || {};

    return (
        <form action={formAction} className="space-y-6">
            {/* Hidden token field */}
            <input type="hidden" name="token" value={token} />

            {/* Success/Error Message */}
            {state?.message && (
                <div>
                    <div
                        className={cn(
                            "rounded-lg p-4 text-sm flex items-start gap-3",
                            state.success
                                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800"
                                : "bg-destructive/10 text-destructive border border-destructive/20"
                        )}
                    >
                        {state.success && <CheckCircle2 className="h-5 w-5 mt-0.5" />}
                        <span>{state.message}</span>
                    </div>
                </div>
            )}

            {/* Temporary Password */}
            <FormField label="Temporary Password" id="tempPassword" error={errors.tempPassword}>
                <div className="relative">
                    <Input
                        id="tempPassword"
                        name="tempPassword"
                        type={showTempPassword ? "text" : "password"}
                        placeholder="Enter the password from your email"
                        aria-invalid={!!errors.tempPassword}
                        disabled={isPending}
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowTempPassword(!showTempPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                    >
                        {showTempPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </FormField>

            {/* New Password */}
            <FormField label="New Password" id="password" error={errors.password}>
                <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        aria-invalid={!!errors.password}
                        disabled={isPending}
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Minimum 8 characters, including uppercase, lowercase, and number
                </p>
            </FormField>

            {/* Confirm Password */}
            <FormField label="Confirm New Password" id="confirmPassword" error={errors.confirmPassword}>
                <div className="relative">
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        aria-invalid={!!errors.confirmPassword}
                        disabled={isPending}
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                    >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </FormField>

            {/* Submit Button */}
            <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={isPending}>
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                        Setting Up Password...
                    </>
                ) : (
                    <>
                        <Key className="h-4 w-4" />
                        Set Up Password
                    </>
                )}
            </Button>
        </form>
    );
}
