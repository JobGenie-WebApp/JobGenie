"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setupMISPassword, type ActionState } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

interface SetupPasswordFormProps {
    token: string;
}

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

export function SetupPasswordForm({ token }: SetupPasswordFormProps) {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
        setupMISPassword,
        null
    );

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Handle redirect on success
    useEffect(() => {
        if (state?.success && state.redirectTo) {
            const timer = setTimeout(() => {
                router.push(state.redirectTo!);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [state, router]);

    // Password validation checks
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
    const passwordsDontMatch = confirmPassword.length > 0 && password !== confirmPassword;

    const errors = state?.errors || {};

    return (
        <form action={formAction} className="space-y-4">
            {/* Hidden token field */}
            <input type="hidden" name="token" value={token} />

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

            {/* Temporary Password */}
            <FormField label="Temporary Password" id="tempPassword" error={errors.tempPassword}>
                <Input
                    id="tempPassword"
                    name="tempPassword"
                    type="text"
                    placeholder="Enter the password from your email"
                    aria-invalid={!!errors.tempPassword}
                    autoComplete="off"
                />
                <p className="text-xs text-muted-foreground mt-1">
                    📧 Check your email for the temporary password
                </p>
            </FormField>

            {/* New Password */}
            <FormField label="New Password" id="password" error={errors.password}>
                <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        aria-invalid={!!errors.password}
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

                {/* Password Requirements */}
                {password.length > 0 && (
                    <div className="mt-2 space-y-1 text-xs">
                        <p className="font-medium text-muted-foreground">Password must include:</p>
                        <div className="space-y-0.5">
                            <div className={cn("flex items-center gap-1.5", hasMinLength ? "text-green-600" : "text-muted-foreground")}>
                                {hasMinLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                <span>At least 8 characters</span>
                            </div>
                            <div className={cn("flex items-center gap-1.5", hasUpperCase ? "text-green-600" : "text-muted-foreground")}>
                                {hasUpperCase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                <span>One uppercase letter</span>
                            </div>
                            <div className={cn("flex items-center gap-1.5", hasLowerCase ? "text-green-600" : "text-muted-foreground")}>
                                {hasLowerCase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                <span>One lowercase letter</span>
                            </div>
                            <div className={cn("flex items-center gap-1.5", hasNumber ? "text-green-600" : "text-muted-foreground")}>
                                {hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                <span>One number</span>
                            </div>
                        </div>
                    </div>
                )}
            </FormField>

            {/* Confirm Password */}
            <FormField label="Confirm Password" id="confirmPassword" error={errors.confirmPassword}>
                <div className="relative">
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={cn(
                            "pr-16",
                            passwordsMatch && "border-green-500 focus-visible:ring-green-500/50",
                            passwordsDontMatch && "border-destructive focus-visible:ring-destructive/50"
                        )}
                        aria-invalid={passwordsDontMatch || !!errors.confirmPassword}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {confirmPassword.length > 0 && (
                            <span className={cn(
                                "flex items-center",
                                passwordsMatch ? "text-green-500" : "text-destructive"
                            )}>
                                {passwordsMatch ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <X className="h-4 w-4" />
                                )}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Password Match Indicator */}
                {confirmPassword.length > 0 && (
                    <p className={cn(
                        "text-xs mt-1",
                        passwordsMatch ? "text-green-500" : "text-destructive"
                    )}>
                        {passwordsMatch ? "Passwords match ✓" : "Passwords do not match"}
                    </p>
                )}
            </FormField>

            {/* Submit Button */}
            <Button type="submit" variant="gradient" className="w-full" size="lg" disabled={isPending}>
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                        Setting up account...
                    </>
                ) : (
                    "Create Password & Activate Account"
                )}
            </Button>
        </form>
    );
}
