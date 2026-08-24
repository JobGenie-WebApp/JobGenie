"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Check, X, UserPlus } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    candidateRegistrationSchema,
} from "@/lib/validations/candidate-schema";
import { registerCandidate, type ActionState } from "@/app/actions/auth";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { PolicyConsent } from "@/components/auth/PolicyConsent";
import { DateField } from "@/components/ui/date-field";
import { cn } from "@/lib/utils";

// ── Shared input style ────────────────────────────────────────────────────────
const inputCls = cn(
    "min-h-12 w-full rounded-xl border border-border/80 bg-background/70 px-4 text-base text-foreground shadow-sm placeholder:text-muted-foreground/60 sm:text-sm",
    "outline-none transition-[border-color,box-shadow,background-color] duration-200 focus:border-primary/60 focus:bg-background focus:ring-4 focus:ring-primary/10",
    "disabled:cursor-not-allowed disabled:opacity-50",
);

const labelCls = "mb-2 block text-sm font-semibold text-foreground";

function Field({ label, id, error, children, required = true }: {
    label: React.ReactNode; id: string; error?: string[]; children: React.ReactNode; required?: boolean;
}) {
    return (
        <div className="space-y-0">
            <label htmlFor={id} className={labelCls}>
                {label}{required && <span className="ml-1 text-destructive">*</span>}
            </label>
            {children}
            {error?.[0] && <p className="mt-1.5 text-xs text-destructive" role="alert">{error[0]}</p>}
        </div>
    );
}

export function CandidateSignupForm() {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(registerCandidate, null);

    useEffect(() => {
        if (state?.success && state.redirectTo) {
            localStorage.removeItem("candidate-signup-form");
            const t = setTimeout(() => router.push(state.redirectTo!), 1500);
            return () => clearTimeout(t);
        }
    }, [state, router]);

    const [formData, setFormData] = useState({
        firstName: "", lastName: "", nicPassport: "", gender: "",
        dateOfBirth: "", address: "", contactNo: "", email: "",
        password: "", confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptedPolicies, setAcceptedPolicies] = useState(false);
    const [clientErrors, setClientErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        const saved = localStorage.getItem("candidate-signup-form");
        if (!saved) return;
        const timer = window.setTimeout(() => {
            try { setFormData(JSON.parse(saved)); } catch {}
        }, 0);
        return () => window.clearTimeout(timer);
    }, []);
    useEffect(() => {
        localStorage.setItem("candidate-signup-form", JSON.stringify(formData));
    }, [formData]);

    const set = (field: string, value: string) =>
        setFormData(prev => ({ ...prev, [field]: value }));

    const validateField = (name: string, value: string) => {
        try {
            const schema = candidateRegistrationSchema;
            const fieldSchema = schema.shape[name as keyof typeof schema.shape];
            if (fieldSchema) {
                fieldSchema.parse(value);
                setClientErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
            }
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'issues' in err) {
                const z = err as { issues: { message: string }[] };
                setClientErrors(prev => ({ ...prev, [name]: z.issues.map(i => i.message) }));
            }
        }
    };

    const errors = { ...clientErrors, ...state?.errors };
    const passwordsMatch = formData.password.length > 0 && formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;
    const passwordsDontMatch = formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

    return (
        <form action={formAction} className="space-y-4">
            {state?.message && (
                <div className={cn(
                    "rounded-xl border px-4 py-3 text-sm",
                    state.success
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-destructive/30 bg-destructive/10 text-destructive",
                )}>
                    {state.message}
                </div>
            )}

            {/* Name row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="First Name" id="firstName" error={errors.firstName}>
                    <input id="firstName" name="firstName" placeholder="John" value={formData.firstName}
                        onChange={e => set("firstName", e.target.value)} onBlur={e => validateField("firstName", e.target.value)}
                        className={cn(inputCls, errors.firstName && "border-red-500/50 focus:ring-red-500/30")} />
                </Field>
                <Field label="Last Name" id="lastName" error={errors.lastName}>
                    <input id="lastName" name="lastName" placeholder="Doe" value={formData.lastName}
                        onChange={e => set("lastName", e.target.value)} onBlur={e => validateField("lastName", e.target.value)}
                        className={cn(inputCls, errors.lastName && "border-red-500/50 focus:ring-red-500/30")} />
                </Field>
            </div>

            {/* NIC / Gender row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="NIC / Passport" id="nicPassport" error={errors.nicPassport}>
                    <input id="nicPassport" name="nicPassport" placeholder="123456789V" maxLength={12}
                        value={formData.nicPassport} onChange={e => set("nicPassport", e.target.value)}
                        onBlur={e => validateField("nicPassport", e.target.value)}
                        className={cn(inputCls, errors.nicPassport && "border-red-500/50 focus:ring-red-500/30")} />
                </Field>
                <Field label="Gender" id="gender" error={errors.gender}>
                    <input type="hidden" name="gender" value={formData.gender} />
                    <Select value={formData.gender} onValueChange={v => set("gender", v)}>
                        <SelectTrigger id="gender" className={cn(
                            "h-12 w-full rounded-xl border border-border/80 bg-background/70 px-4 text-base text-foreground shadow-sm data-[size=default]:h-12 sm:text-sm",
                            "focus:border-primary/60 focus:ring-4 focus:ring-primary/10",
                            !formData.gender && "[&>span]:text-muted-foreground/60",
                            errors.gender && "border-red-500/50",
                        )}>
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </Field>
            </div>

            {/* Date of birth / Address row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Date of Birth" id="dateOfBirth" error={errors.dateOfBirth}>
                    <DateField id="dateOfBirth" name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={v => set("dateOfBirth", v)}
                        onBlur={v => validateField("dateOfBirth", v)}
                        placeholder="Select date of birth"
                        disableFuture
                        error={!!errors.dateOfBirth}
                        triggerClassName={cn("h-12 rounded-xl border-border/80 bg-background/70 px-4 shadow-sm focus-visible:border-primary/60 focus-visible:ring-4 focus-visible:ring-primary/10", errors.dateOfBirth && "border-red-500/50 focus-visible:ring-red-500/20")} />
                </Field>
                <Field label="Residential Address" id="address" error={errors.address}>
                    <input id="address" name="address" placeholder="123 Main Street, City"
                        value={formData.address} onChange={e => set("address", e.target.value)}
                        onBlur={e => validateField("address", e.target.value)}
                        className={cn(inputCls, errors.address && "border-red-500/50 focus:ring-red-500/30")} />
                </Field>
            </div>

            {/* Contact / Email row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={<>Contact Number <span className="text-xs font-normal normal-case tracking-normal text-muted-foreground">+94XXXXXXXXX</span></>} id="contactNo" error={errors.contactNo}>
                    <input id="contactNo" name="contactNo" type="tel" maxLength={15} placeholder="+94771234567"
                        value={formData.contactNo} onChange={e => set("contactNo", e.target.value)}
                        onBlur={e => validateField("contactNo", e.target.value)}
                        className={cn(inputCls, errors.contactNo && "border-red-500/50 focus:ring-red-500/30")} />
                </Field>
                <Field label="Email" id="email" error={errors.email}>
                    <input id="email" name="email" type="email" placeholder="you@example.com"
                        value={formData.email} onChange={e => set("email", e.target.value)}
                        onBlur={e => validateField("email", e.target.value)}
                        className={cn(inputCls, errors.email && "border-red-500/50 focus:ring-red-500/30")} />
                </Field>
            </div>

            {/* Password / Confirm password row */}
            <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
                <Field label="Password" id="password" error={errors.password}>
                    <div className="relative">
                        <input id="password" name="password" type={showPassword ? "text" : "password"}
                            placeholder="••••••••" value={formData.password}
                            onChange={e => set("password", e.target.value)} onBlur={e => validateField("password", e.target.value)}
                            className={cn(inputCls, "pr-12", errors.password && "border-red-500/50 focus:ring-red-500/30")} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label={showPassword ? "Hide password" : "Show password"}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <PasswordRequirements password={formData.password} />
                </Field>

                <Field label="Confirm Password" id="confirmPassword" error={errors.confirmPassword}>
                    <div className="relative">
                        <input id="confirmPassword" name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••" value={formData.confirmPassword}
                            onChange={e => set("confirmPassword", e.target.value)}
                            className={cn(
                                inputCls, "pr-16",
                                passwordsMatch && "border-primary/40 focus:ring-primary/30",
                                passwordsDontMatch && "border-red-500/50 focus:ring-red-500/30",
                            )} />
                        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                            {formData.confirmPassword.length > 0 && (
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
                    {formData.confirmPassword.length > 0 && (
                        <p className={cn("mt-1.5 text-xs", passwordsMatch ? "text-primary" : "text-destructive")}>
                            {passwordsMatch ? "Passwords match ✓" : "Passwords do not match"}
                        </p>
                    )}
                </Field>
            </div>

            <PolicyConsent
                id="candidate-policy-consent"
                name="acceptPolicies"
                checked={acceptedPolicies}
                onCheckedChange={setAcceptedPolicies}
                error={errors.acceptPolicies?.[0]}
                disabled={isPending}
            />

            {/* Submit */}
            <button
                type="submit"
                disabled={isPending || !acceptedPolicies}
                className={cn(
                    "mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground",
                    "shadow-lg shadow-primary/20 transition-[filter,transform,box-shadow] duration-200 hover:brightness-105 hover:shadow-xl active:scale-[0.99]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                )}
            >
                {isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Creating Account…</>
                ) : (
                    <><UserPlus className="h-4 w-4" />Create Account</>
                )}
            </button>
        </form>
    );
}
