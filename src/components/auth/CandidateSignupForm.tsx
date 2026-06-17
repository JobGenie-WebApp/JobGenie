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
    calculatePasswordStrength,
    getStrengthLabel,
    getStrengthColor,
} from "@/lib/validations/candidate-schema";
import { registerCandidate, type ActionState } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

// ── Shared input style ────────────────────────────────────────────────────────
const inputCls = cn(
    "w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60",
    "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 focus:bg-background",
    "disabled:opacity-50 transition-all",
);

const labelCls = "block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5";

function Field({ label, id, error, children, required = true }: {
    label: React.ReactNode; id: string; error?: string[]; children: React.ReactNode; required?: boolean;
}) {
    return (
        <div className="space-y-0">
            <label htmlFor={id} className={labelCls}>
                {label}{required && <span className="ml-1 text-red-400/80">*</span>}
            </label>
            {children}
            {error?.[0] && <p className="mt-1.5 text-xs text-red-400">{error[0]}</p>}
        </div>
    );
}

const strengthBarColor: Record<string, string> = {
    "bg-red-500":    "bg-red-500",
    "bg-orange-500": "bg-orange-500",
    "bg-yellow-500": "bg-yellow-500",
    "bg-lime-500":   "bg-lime-500",
    "bg-green-500":  "bg-green-500",
};

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
    const [clientErrors, setClientErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        const saved = localStorage.getItem("candidate-signup-form");
        if (saved) { try { setFormData(JSON.parse(saved)); } catch {} }
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
    const passwordStrength = calculatePasswordStrength(formData.password);
    const strengthLabel = getStrengthLabel(passwordStrength);
    const strengthColor = getStrengthColor(passwordStrength);
    const passwordsMatch = formData.password.length > 0 && formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;
    const passwordsDontMatch = formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

    return (
        <form action={formAction} className="space-y-4">
            {state?.message && (
                <div className={cn(
                    "rounded-xl border px-4 py-3 text-sm",
                    state.success
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-red-500/30 bg-red-500/10 text-red-400",
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
                            "rounded-xl border border-border bg-muted/40 text-sm text-foreground h-[42px]",
                            "focus:ring-2 focus:ring-primary/40 focus:border-primary/60",
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

            {/* Date of Birth */}
            <Field label="Date of Birth" id="dateOfBirth" error={errors.dateOfBirth}>
                <input id="dateOfBirth" name="dateOfBirth" type="date" max="9999-12-31"
                    value={formData.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)}
                    onBlur={e => validateField("dateOfBirth", e.target.value)}
                    className={cn(inputCls, "[color-scheme:dark]", errors.dateOfBirth && "border-red-500/50 focus:ring-red-500/30")} />
            </Field>

            {/* Address */}
            <Field label="Residential Address" id="address" error={errors.address}>
                <input id="address" name="address" placeholder="123 Main Street, City"
                    value={formData.address} onChange={e => set("address", e.target.value)}
                    onBlur={e => validateField("address", e.target.value)}
                    className={cn(inputCls, errors.address && "border-red-500/50 focus:ring-red-500/30")} />
            </Field>

            {/* Contact / Email row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={<>Contact No <span className="text-[10px] text-muted-foreground/50 font-normal normal-case tracking-normal">+94XXXXXXXXX</span></>} id="contactNo" error={errors.contactNo}>
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

            {/* Password */}
            <Field label="Password" id="password" error={errors.password}>
                <div className="relative">
                    <input id="password" name="password" type={showPassword ? "text" : "password"}
                        placeholder="••••••••" value={formData.password}
                        onChange={e => set("password", e.target.value)} onBlur={e => validateField("password", e.target.value)}
                        className={cn(inputCls, "pr-10", errors.password && "border-red-500/50 focus:ring-red-500/30")} />
                    <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground/60">
                    Min 8 chars · uppercase · lowercase · number · special character
                </p>
                {formData.password.length > 0 && (
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
            </Field>

            {/* Confirm Password */}
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
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {formData.confirmPassword.length > 0 && (
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
                {formData.confirmPassword.length > 0 && (
                    <p className={cn("mt-1.5 text-[11px]", passwordsMatch ? "text-primary" : "text-red-400")}>
                        {passwordsMatch ? "Passwords match ✓" : "Passwords do not match"}
                    </p>
                )}
            </Field>

            {/* Submit */}
            <button
                type="submit"
                disabled={isPending}
                className={cn(
                    "w-full rounded-xl py-2.5 px-4 text-sm font-semibold transition-all mt-2",
                    "bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.99]",
                    "shadow-lg shadow-primary/20 flex items-center justify-center gap-2",
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
