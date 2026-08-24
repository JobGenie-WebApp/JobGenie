"use client";

import { useActionState, useState, useEffect, useMemo } from "react";
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
import { Combobox } from "@/components/ui/combobox";
import type { CountryOption } from "@/lib/countries";
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

export function CandidateSignupForm({ countries }: { countries: CountryOption[] }) {
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
        firstName: "", lastName: "", gender: "",
        dateOfBirth: "", address: "", country: "", dialCountry: "", phoneLocal: "", email: "",
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
            try { setFormData(prev => ({ ...prev, ...JSON.parse(saved) })); } catch {}
        }, 0);
        return () => window.clearTimeout(timer);
    }, []);
    useEffect(() => {
        localStorage.setItem("candidate-signup-form", JSON.stringify(formData));
    }, [formData]);

    // Dial code follows the selected country until the user picks a different one.
    const dialOptions = useMemo(
        () => countries.filter(c => c.calling_code).map(c => ({
            value: c.code, label: `${c.flag_emoji} ${c.calling_code}`, keywords: c.name,
        })),
        [countries],
    );
    const dialCode = countries.find(c => c.code === formData.dialCountry)?.calling_code ?? "";
    const composeContactNo = (local: string) => dialCode + local.replace(/\D/g, "");

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

            {/* Gender / Date of birth row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            </div>

            {/* Address / Country row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Residential Address" id="address" error={errors.address}>
                    <input id="address" name="address" placeholder="123 Main Street, City"
                        value={formData.address} onChange={e => set("address", e.target.value)}
                        onBlur={e => validateField("address", e.target.value)}
                        className={cn(inputCls, errors.address && "border-red-500/50 focus:ring-red-500/30")} />
                </Field>
                <Field label="Country" id="country" error={errors.country}>
                    <input type="hidden" name="country" value={formData.country} />
                    <Combobox
                        id="country"
                        options={countries.map(c => ({ value: c.name, label: `${c.flag_emoji} ${c.name}` }))}
                        value={formData.country}
                        onValueChange={v => {
                            set("country", v);
                            validateField("country", v);
                            const picked = countries.find(c => c.name === v);
                            if (picked?.calling_code) set("dialCountry", picked.code);
                        }}
                        placeholder="Select country"
                        searchPlaceholder="Search countries..."
                        emptyMessage="No country found."
                        className={cn(
                            "h-12 w-full rounded-xl border-border/80 bg-background/70 px-4 text-base shadow-sm sm:text-sm",
                            !formData.country && "text-muted-foreground/60",
                            errors.country && "border-red-500/50",
                        )}
                    />
                </Field>
            </div>

            {/* Contact / Email row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Contact Number" id="contactNo" error={errors.contactNo}>
                    <input type="hidden" name="contactNo" value={composeContactNo(formData.phoneLocal)} />
                    <div className="flex gap-2">
                        <Combobox
                            options={dialOptions}
                            value={formData.dialCountry}
                            onValueChange={v => set("dialCountry", v)}
                            placeholder="Code"
                            searchPlaceholder="Country or code..."
                            emptyMessage="No country found."
                            className={cn(
                                "h-12 w-32 shrink-0 rounded-xl border-border/80 bg-background/70 px-3 text-base shadow-sm sm:text-sm",
                                errors.contactNo && "border-red-500/50",
                            )}
                        />
                        <input id="contactNo" type="tel" inputMode="tel" maxLength={14} placeholder="771234567"
                            value={formData.phoneLocal} onChange={e => set("phoneLocal", e.target.value)}
                            onBlur={e => validateField("contactNo", composeContactNo(e.target.value))}
                            className={cn(inputCls, "flex-1", errors.contactNo && "border-red-500/50 focus:ring-red-500/30")} />
                    </div>
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
