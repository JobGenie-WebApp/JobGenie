"use client";

import { useState } from "react";
import { User, Eye, EyeOff, Loader2, Check, X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { PolicyConsent } from "@/components/auth/PolicyConsent";
import { JobDesignationCombobox } from "@/components/auth/JobDesignationCombobox";

const inputCls = cn(
    "min-h-12 w-full rounded-xl border border-border/80 bg-background/70 px-4 text-base text-foreground shadow-sm placeholder:text-muted-foreground/60 sm:text-sm",
    "outline-none transition-[border-color,box-shadow,background-color] duration-200 focus:border-primary/60 focus:bg-background focus:ring-4 focus:ring-primary/10",
);
const labelCls = "mb-2 block text-sm font-semibold text-foreground";

interface EmployerProfileStepProps {
    data: { firstName: string; lastName: string; phone: string; email: string; password: string; confirmPassword: string; jobTitle: string; };
    onChange: (data: EmployerProfileStepProps["data"]) => void;
    onPrevious: () => void;
    onSubmit: () => void;
    isLoading: boolean;
    acceptedPolicies: boolean;
    onAcceptedPoliciesChange: (checked: boolean) => void;
}

export function EmployerProfileStep({
    data,
    onChange,
    onPrevious,
    onSubmit,
    isLoading,
    acceptedPolicies,
    onAcceptedPoliciesChange,
}: EmployerProfileStepProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const set = (field: keyof typeof data, value: string) => {
        onChange({ ...data, [field]: value });
        if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!data.firstName.trim() || data.firstName.length < 2) e.firstName = "First name must be at least 2 characters";
        if (!data.lastName.trim() || data.lastName.length < 2) e.lastName = "Last name must be at least 2 characters";
        if (!data.phone.trim() || !/^[+]?[\d\s-]+$/.test(data.phone)) e.phone = "Please enter a valid phone number";
        if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Please enter a valid email address";
        if (!data.jobTitle.trim()) e.jobTitle = "Job title is required";
        if (!data.password || data.password.length < 8) e.password = "Password must be at least 8 characters";
        else if (!/[a-z]/.test(data.password)) e.password = "Must contain a lowercase letter";
        else if (!/[A-Z]/.test(data.password)) e.password = "Must contain an uppercase letter";
        else if (!/[0-9]/.test(data.password)) e.password = "Must contain a number";
        else if (!/[^a-zA-Z0-9]/.test(data.password)) e.password = "Must contain a special character";
        if (!data.confirmPassword) e.confirmPassword = "Please confirm your password";
        else if (data.password !== data.confirmPassword) e.confirmPassword = "Passwords do not match";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const passwordsMatch = data.password.length > 0 && data.confirmPassword.length > 0 && data.password === data.confirmPassword;
    const passwordsDontMatch = data.confirmPassword.length > 0 && data.password !== data.confirmPassword;

    return (
        <div className="space-y-6 rounded-2xl border border-border/80 bg-card/95 p-5 shadow-[0_16px_50px_-36px_rgba(0,0,0,.5)] ring-1 ring-primary/[0.04] sm:p-7">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/15 ring-1 ring-primary/25 flex items-center justify-center flex-shrink-0">
                    <User className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-foreground">Your Information</h2>
                    <p className="text-xs text-muted-foreground">Step 2 of 2 — Admin account</p>
                </div>
            </div>

            {/* Name row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="firstName" className={labelCls}>First Name <span className="text-destructive">*</span></label>
                    <input id="firstName" placeholder="John" value={data.firstName}
                        onChange={e => set("firstName", e.target.value)}
                        className={cn(inputCls, errors.firstName && "border-red-500/50")} />
                    {errors.firstName && <p className="mt-1.5 text-xs text-destructive" role="alert">{errors.firstName}</p>}
                </div>
                <div>
                    <label htmlFor="lastName" className={labelCls}>Last Name <span className="text-destructive">*</span></label>
                    <input id="lastName" placeholder="Doe" value={data.lastName}
                        onChange={e => set("lastName", e.target.value)}
                        className={cn(inputCls, errors.lastName && "border-red-500/50")} />
                    {errors.lastName && <p className="mt-1.5 text-xs text-destructive" role="alert">{errors.lastName}</p>}
                </div>
            </div>

            {/* Phone / Email row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="phone" className={labelCls}>
                        Phone <span className="text-xs font-normal normal-case tracking-normal text-muted-foreground">+94XXXXXXXXX</span> <span className="text-destructive">*</span>
                    </label>
                    <input id="phone" type="tel" maxLength={15} placeholder="+94771234567" value={data.phone}
                        onChange={e => set("phone", e.target.value)}
                        className={cn(inputCls, errors.phone && "border-red-500/50")} />
                    {errors.phone && <p className="mt-1.5 text-xs text-destructive" role="alert">{errors.phone}</p>}
                </div>
                <div>
                    <label htmlFor="email" className={labelCls}>Email Address <span className="text-destructive">*</span></label>
                    <input id="email" type="email" placeholder="you@company.com" value={data.email}
                        onChange={e => set("email", e.target.value)}
                        className={cn(inputCls, errors.email && "border-red-500/50")} />
                    {errors.email && <p className="mt-1.5 text-xs text-destructive" role="alert">{errors.email}</p>}
                </div>
            </div>

            {/* Job Title */}
            <div>
                <label htmlFor="jobTitle" className={labelCls}>Job Title / Designation <span className="text-destructive">*</span></label>
                <JobDesignationCombobox
                    id="jobTitle"
                    value={data.jobTitle}
                    onValueChange={(value) => set("jobTitle", value)}
                    hasError={Boolean(errors.jobTitle)}
                />
                {errors.jobTitle && <p className="mt-1.5 text-xs text-destructive" role="alert">{errors.jobTitle}</p>}
            </div>

            {/* Password / Confirm password row */}
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="password" className={labelCls}>Password <span className="text-destructive">*</span></label>
                    <div className="relative">
                        <input id="password" type={showPassword ? "text" : "password"} placeholder="Create a strong password"
                            value={data.password} onChange={e => set("password", e.target.value)}
                            className={cn(inputCls, "pr-12", errors.password && "border-red-500/50")} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label={showPassword ? "Hide password" : "Show password"}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {errors.password && <p className="mt-1.5 text-xs text-destructive" role="alert">{errors.password}</p>}
                    <PasswordRequirements password={data.password} />
                </div>

                <div>
                    <label htmlFor="confirmPassword" className={labelCls}>Confirm Password <span className="text-destructive">*</span></label>
                    <div className="relative">
                        <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                            placeholder="Re-enter your password" value={data.confirmPassword}
                            onChange={e => set("confirmPassword", e.target.value)}
                            className={cn(
                                inputCls, "pr-16",
                                passwordsMatch && "border-primary/40 focus:ring-primary/30",
                                passwordsDontMatch && "border-red-500/50 focus:ring-red-500/30",
                            )} />
                        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                            {data.confirmPassword.length > 0 && (
                                <span className={passwordsMatch ? "text-primary" : "text-destructive"}>
                                    {passwordsMatch ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                </span>
                            )}
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}>
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    {errors.confirmPassword && <p className="mt-1.5 text-xs text-destructive" role="alert">{errors.confirmPassword}</p>}
                    {data.confirmPassword.length > 0 && !errors.confirmPassword && (
                        <p className={cn("mt-1.5 text-xs", passwordsMatch ? "text-primary" : "text-destructive")}>
                            {passwordsMatch ? "Passwords match ✓" : "Passwords do not match"}
                        </p>
                    )}
                </div>
            </div>

            <PolicyConsent
                id="employer-policy-consent"
                checked={acceptedPolicies}
                onCheckedChange={onAcceptedPoliciesChange}
                disabled={isLoading}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
                <button
                    onClick={onPrevious}
                    disabled={isLoading}
                    className={cn(
                        "flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all",
                        "border border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                    )}
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                    onClick={() => { if (validate()) onSubmit(); }}
                    disabled={isLoading || !acceptedPolicies}
                    className={cn(
                        "flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground",
                        "shadow-lg shadow-primary/20 transition-[filter,transform,box-shadow] duration-200 hover:brightness-105 active:scale-[0.99]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                        "disabled:opacity-60 disabled:cursor-not-allowed",
                    )}
                >
                    {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating Account…</> : "Create Account"}
                </button>
            </div>
        </div>
    );
}
