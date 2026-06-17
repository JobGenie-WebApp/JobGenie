"use client";

import { useState } from "react";
import { User, Eye, EyeOff, Loader2, Check, X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    calculatePasswordStrength,
    getStrengthLabel,
    getStrengthColor,
} from "@/lib/validations/employer-schema";

const inputCls = cn(
    "w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60",
    "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 focus:bg-background transition-all",
);
const labelCls = "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

const strengthBarColor: Record<string, string> = {
    "bg-red-500":    "bg-red-500",
    "bg-orange-500": "bg-orange-500",
    "bg-yellow-500": "bg-yellow-500",
    "bg-lime-500":   "bg-lime-500",
    "bg-green-500":  "bg-green-500",
};

interface EmployerProfileStepProps {
    data: { firstName: string; lastName: string; phone: string; email: string; password: string; confirmPassword: string; jobTitle: string; };
    onChange: (data: EmployerProfileStepProps["data"]) => void;
    onPrevious: () => void;
    onSubmit: () => void;
    isLoading: boolean;
}

export function EmployerProfileStep({ data, onChange, onPrevious, onSubmit, isLoading }: EmployerProfileStepProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const passwordStrength = calculatePasswordStrength(data.password);
    const strengthLabel = getStrengthLabel(passwordStrength);
    const strengthColor = getStrengthColor(passwordStrength);

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
        if (!data.confirmPassword) e.confirmPassword = "Please confirm your password";
        else if (data.password !== data.confirmPassword) e.confirmPassword = "Passwords do not match";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const passwordsMatch = data.password.length > 0 && data.confirmPassword.length > 0 && data.password === data.confirmPassword;
    const passwordsDontMatch = data.confirmPassword.length > 0 && data.password !== data.confirmPassword;

    return (
        <div className="rounded-2xl border border-border bg-card/80 p-6 space-y-5 shadow-sm">
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
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="firstName" className={labelCls}>First Name <span className="text-red-400/80">*</span></label>
                    <input id="firstName" placeholder="John" value={data.firstName}
                        onChange={e => set("firstName", e.target.value)}
                        className={cn(inputCls, errors.firstName && "border-red-500/50")} />
                    {errors.firstName && <p className="mt-1.5 text-xs text-red-400">{errors.firstName}</p>}
                </div>
                <div>
                    <label htmlFor="lastName" className={labelCls}>Last Name <span className="text-red-400/80">*</span></label>
                    <input id="lastName" placeholder="Doe" value={data.lastName}
                        onChange={e => set("lastName", e.target.value)}
                        className={cn(inputCls, errors.lastName && "border-red-500/50")} />
                    {errors.lastName && <p className="mt-1.5 text-xs text-red-400">{errors.lastName}</p>}
                </div>
            </div>

            {/* Phone / Email row */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="phone" className={labelCls}>
                        Phone <span className="text-[10px] text-muted-foreground/50 font-normal normal-case tracking-normal">+94XXXXXXXXX</span> <span className="text-red-400/80">*</span>
                    </label>
                    <input id="phone" type="tel" maxLength={15} placeholder="+94771234567" value={data.phone}
                        onChange={e => set("phone", e.target.value)}
                        className={cn(inputCls, errors.phone && "border-red-500/50")} />
                    {errors.phone && <p className="mt-1.5 text-xs text-red-400">{errors.phone}</p>}
                </div>
                <div>
                    <label htmlFor="email" className={labelCls}>Email Address <span className="text-red-400/80">*</span></label>
                    <input id="email" type="email" placeholder="you@company.com" value={data.email}
                        onChange={e => set("email", e.target.value)}
                        className={cn(inputCls, errors.email && "border-red-500/50")} />
                    {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
                </div>
            </div>

            {/* Job Title */}
            <div>
                <label htmlFor="jobTitle" className={labelCls}>Job Title / Designation <span className="text-red-400/80">*</span></label>
                <input id="jobTitle" placeholder="e.g., HR Manager, CEO, Recruiter" value={data.jobTitle}
                    onChange={e => set("jobTitle", e.target.value)}
                    className={cn(inputCls, errors.jobTitle && "border-red-500/50")} />
                {errors.jobTitle && <p className="mt-1.5 text-xs text-red-400">{errors.jobTitle}</p>}
            </div>

            {/* Password */}
            <div>
                <label htmlFor="password" className={labelCls}>Password <span className="text-red-400/80">*</span></label>
                <div className="relative">
                    <input id="password" type={showPassword ? "text" : "password"} placeholder="Create a strong password"
                        value={data.password} onChange={e => set("password", e.target.value)}
                        className={cn(inputCls, "pr-10", errors.password && "border-red-500/50")} />
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
                <p className="mt-1.5 text-[11px] text-muted-foreground/60">Min 8 chars · uppercase · lowercase · number · special character</p>
                {data.password.length > 0 && (
                    <div className="mt-2 space-y-1">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(level => (
                                <div key={level} className={cn(
                                    "h-1 flex-1 rounded-full transition-colors",
                                    level <= passwordStrength ? (strengthBarColor[strengthColor] ?? "bg-primary") : "bg-border",
                                )} />
                            ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground/60">Strength: <span className="font-medium text-foreground/80">{strengthLabel}</span></p>
                    </div>
                )}
            </div>

            {/* Confirm Password */}
            <div>
                <label htmlFor="confirmPassword" className={labelCls}>Confirm Password <span className="text-red-400/80">*</span></label>
                <div className="relative">
                    <input id="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your password" value={data.confirmPassword}
                        onChange={e => set("confirmPassword", e.target.value)}
                        className={cn(
                            inputCls, "pr-16",
                            passwordsMatch && "border-primary/40 focus:ring-primary/30",
                            passwordsDontMatch && "border-red-500/50 focus:ring-red-500/30",
                        )} />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {data.confirmPassword.length > 0 && (
                            <span className={passwordsMatch ? "text-primary" : "text-red-400"}>
                                {passwordsMatch ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            </span>
                        )}
                        <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="text-muted-foreground/50 hover:text-foreground transition-colors">
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
                {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>}
                {data.confirmPassword.length > 0 && !errors.confirmPassword && (
                    <p className={cn("mt-1.5 text-[11px]", passwordsMatch ? "text-primary" : "text-red-400")}>
                        {passwordsMatch ? "Passwords match ✓" : "Passwords do not match"}
                    </p>
                )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
                <button
                    onClick={onPrevious}
                    disabled={isLoading}
                    className={cn(
                        "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",
                        "border border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                    )}
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                    onClick={() => { if (validate()) onSubmit(); }}
                    disabled={isLoading}
                    className={cn(
                        "flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all",
                        "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.99]",
                        "shadow-lg shadow-primary/20",
                        "disabled:opacity-60 disabled:cursor-not-allowed",
                    )}
                >
                    {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating Account…</> : "Create Account"}
                </button>
            </div>
        </div>
    );
}
