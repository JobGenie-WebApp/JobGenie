"use client";

import { useActionState, useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyEmail, resendVerificationCode, type ActionState } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import { maskEmail } from "@/lib/utils/client";

interface VerifyEmailFormProps {
    email: string;
}

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState<ActionState | null, FormData>(
        verifyEmail,
        null
    );

    // OTP input state
    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Resend cooldown state
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isResending, startResendTransition] = useTransition();
    const [resendMessage, setResendMessage] = useState<string | null>(null);

    // Handle redirect on success
    useEffect(() => {
        if (state?.success && state.redirectTo) {
            // Small delay to show success message
            const timer = setTimeout(() => {
                router.push(state.redirectTo!);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [state, router]);

    // Cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    // Handle OTP input change
    const handleChange = (index: number, value: string) => {
        // Only allow single digits
        if (value.length > 1) {
            value = value.slice(-1);
        }

        // Only allow digits
        if (value && !/^\d$/.test(value)) {
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Handle backspace
    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Handle paste
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, 6);

        if (!/^\d+$/.test(pastedData)) {
            return;
        }

        const newOtp = [...otp];
        for (let i = 0; i < pastedData.length && i < 6; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);

        // Focus appropriate input
        const nextEmptyIndex = Math.min(pastedData.length, 5);
        inputRefs.current[nextEmptyIndex]?.focus();
    };

    // Handle resend
    const handleResend = () => {
        if (resendCooldown > 0 || isResending) return;

        startResendTransition(async () => {
            const result = await resendVerificationCode(email);
            setResendMessage(result.message);
            if (result.success) {
                setResendCooldown(60); // 60 second cooldown
                setOtp(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            }
            // Clear message after 5 seconds
            setTimeout(() => setResendMessage(null), 5000);
        });
    };

    const code = otp.join("");
    const isCodeComplete = code.length === 6;

    return (
        <div className="space-y-6">
            {/* Email display */}
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Code sent to <strong className="text-foreground">{maskEmail(email)}</strong></span>
            </div>

            {/* Success/Error Message */}
            {(state?.message || resendMessage) && (
                <div
                    className={cn(
                        "rounded-lg p-3 text-sm text-center",
                        state?.success
                            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : resendMessage && !state?.message
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                                : "bg-destructive/10 text-destructive"
                    )}
                >
                    {state?.message || resendMessage}
                </div>
            )}

            {/* OTP Input Form */}
            <form action={formAction} className="space-y-6">
                <input type="hidden" name="email" value={email} />
                <input type="hidden" name="code" value={code} />

                {/* OTP Inputs */}
                <div className="flex justify-center gap-2 sm:gap-3">
                    {otp.map((digit, index) => (
                        <Input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            className={cn(
                                "h-12 w-10 sm:h-14 sm:w-12 text-center text-xl font-semibold",
                                "focus:ring-2 focus:ring-primary/50"
                            )}
                            disabled={isPending}
                            aria-label={`Digit ${index + 1}`}
                        />
                    ))}
                </div>

                {/* Verify Button */}
                <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={!isCodeComplete || isPending}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        "Verify Email"
                    )}
                </Button>
            </form>

            {/* Resend Code */}
            <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                    Didn&apos;t receive the code?
                </p>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isResending}
                    className="gap-2"
                >
                    {isResending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                        </>
                    ) : resendCooldown > 0 ? (
                        <>
                            <RefreshCw className="h-4 w-4" />
                            Resend in {resendCooldown}s
                        </>
                    ) : (
                        <>
                            <RefreshCw className="h-4 w-4" />
                            Resend Code
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
