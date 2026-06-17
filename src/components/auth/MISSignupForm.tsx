"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    misRegistrationSchema,
    calculatePasswordStrength,
    getStrengthLabel,
    getStrengthColor,
} from "@/lib/validations/mis-schema";
import { registerMISUser, type ActionState } from "@/app/actions/auth";
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

export function MISSignupForm() {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
        registerMISUser,
        null
    );

    // Handle redirect on success
    useEffect(() => {
        if (state?.success && state.redirectTo) {
            // Small delay to show success message before redirect
            const timer = setTimeout(() => {
                router.push(state.redirectTo!);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [state, router]);

    // Form state for controlled inputs
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Client-side validation state
    const [clientErrors, setClientErrors] = useState<Record<string, string[]>>({});

    // Password strength
    const passwordStrength = calculatePasswordStrength(password);
    const strengthLabel = getStrengthLabel(passwordStrength);
    const strengthColor = getStrengthColor(passwordStrength);

    // Password match check
    const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
    const passwordsDontMatch = confirmPassword.length > 0 && password !== confirmPassword;

    // Combine server and client errors
    const errors = { ...clientErrors, ...state?.errors };

    // Real-time validation for specific fields
    const validateField = (name: string, value: string) => {
        try {
            const schema = misRegistrationSchema;
            const fieldSchema = schema.shape[name as keyof typeof schema.shape];
            if (fieldSchema) {
                fieldSchema.parse(value);
                setClientErrors((prev) => {
                    const next = { ...prev };
                    delete next[name];
                    return next;
                });
            }
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'issues' in error) {
                const zodError = error as { issues: Array<{ message: string }> };
                setClientErrors((prev) => ({
                    ...prev,
                    [name]: zodError.issues.map((i) => i.message),
                }));
            }
        }
    };

    return (
        <form action={formAction} className="space-y-4">
            {/* Success/Error Message */}
            {state?.message && (
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
            )}

            {/* Name Fields - Row */}
            <div className="grid grid-cols-2 gap-4">
                <FormField label="First Name" id="firstName" error={errors.firstName}>
                    <Input
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        onBlur={(e) => validateField("firstName", e.target.value)}
                        aria-invalid={!!errors.firstName}
                    />
                </FormField>

                <FormField label="Last Name" id="lastName" error={errors.lastName}>
                    <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        onBlur={(e) => validateField("lastName", e.target.value)}
                        aria-invalid={!!errors.lastName}
                    />
                </FormField>
            </div>

            {/* Email */}
            <FormField label="Email" id="email" error={errors.email}>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    onBlur={(e) => validateField("email", e.target.value)}
                    aria-invalid={!!errors.email}
                />
            </FormField>

            {/* Password */}
            <FormField label="Password" id="password" error={errors.password}>
                <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={(e) => validateField("password", e.target.value)}
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

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                    <div className="mt-2 space-y-1">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                    key={level}
                                    className={cn(
                                        "h-1.5 flex-1 rounded-full transition-colors",
                                        level <= passwordStrength ? strengthColor : "bg-muted"
                                    )}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Password strength: <span className="font-medium">{strengthLabel}</span>
                        </p>
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
            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                {isPending ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating Account...
                    </>
                ) : (
                    "Create Account"
                )}
            </Button>
        </form>
    );
}
