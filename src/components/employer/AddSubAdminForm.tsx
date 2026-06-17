"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSubAdmin, type ActionState } from "@/app/actions/employer-actions";
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

export function AddSubAdminForm() {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
        createSubAdmin,
        null
    );

    // Handle redirect on success
    useEffect(() => {
        if (state?.success && state.redirectTo) {
            // Small delay to show success message before redirect
            const timer = setTimeout(() => {
                router.push(state.redirectTo!);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [state, router]);

    // Combine server and client errors
    const errors = state?.errors || {};

    return (
        <form action={formAction} className="space-y-6">
            {/* Success/Error Message */}
            {state?.message && (
                <div
                    className={cn(
                        "rounded-lg p-3 text-sm flex items-start gap-2",
                        state.success
                            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-destructive/10 text-destructive"
                    )}
                >
                    {state.success && <Mail className="h-4 w-4 mt-0.5" />}
                    <span>{state.message}</span>
                </div>
            )}

            {/* Information Banner */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-sm text-green-700 dark:text-green-300">
                <p className="font-medium mb-1">📨 Invitation Email Process</p>
                <p className="text-xs">
                    An invitation email will be sent with a temporary password and setup link. The sub-admin will be able to manage jobs but cannot edit company information.
                </p>
            </div>

            {/* Name Fields - Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="First Name" id="firstName" error={errors.firstName}>
                    <Input
                        id="firstName"
                        name="firstName"
                        placeholder="John"
                        aria-invalid={!!errors.firstName}
                        disabled={isPending}
                    />
                </FormField>

                <FormField label="Last Name" id="lastName" error={errors.lastName}>
                    <Input
                        id="lastName"
                        name="lastName"
                        placeholder="Doe"
                        aria-invalid={!!errors.lastName}
                        disabled={isPending}
                    />
                </FormField>
            </div>

            {/* Email */}
            <FormField label="Email Address" id="email" error={errors.email}>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@company.com"
                    aria-invalid={!!errors.email}
                    disabled={isPending}
                />
            </FormField>

            {/* Optional Fields Section */}
            <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-4 text-muted-foreground">
                    Optional Information
                </h3>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Designation" id="designation" error={errors.designation} required={false}>
                            <Input
                                id="designation"
                                name="designation"
                                placeholder="Senior Manager"
                                aria-invalid={!!errors.designation}
                                disabled={isPending}
                            />
                        </FormField>

                        <FormField label="Department" id="department" error={errors.department} required={false}>
                            <Input
                                id="department"
                                name="department"
                                placeholder="Human Resources"
                                aria-invalid={!!errors.department}
                                disabled={isPending}
                            />
                        </FormField>
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                {isPending ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending Invitation...
                    </>
                ) : (
                    <>
                        <Mail className="h-4 w-4" />
                        Send Invitation
                    </>
                )}
            </Button>
        </form>
    );
}
