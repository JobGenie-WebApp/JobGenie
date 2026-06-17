"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { requestPasswordReset, type ActionState } from "@/app/actions/auth";

export function ForgotPasswordForm() {
    const [state, setState] = useState<ActionState | null>(null);
    const [isPending, startTransition] = useTransition();
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            try {
                const result = await requestPasswordReset(null, formData);
                setState(result);
            } catch {
                toast.error("Something went wrong. Please try again.");
            }
        });
    };

    useEffect(() => {
        if (!state) return;
        if (state.success) {
            setSubmitted(true);
        } else {
            toast.error(state.message);
        }
    }, [state]);

    if (submitted) {
        return (
            <div className="space-y-4 text-center">
                <div className="flex justify-center">
                    <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 text-primary">
                        <MailCheck className="h-10 w-10" />
                    </div>
                </div>
                <h2 className="text-xl font-semibold">Check Your Email</h2>
                <p className="text-sm text-muted-foreground">
                    If an account with that email exists, we&apos;ve sent a password reset link. It expires in <strong>1 hour</strong>.
                </p>
                <p className="text-xs text-muted-foreground">
                    Didn&apos;t receive it? Check your spam folder or try again.
                </p>
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSubmitted(false)}
                >
                    Try a different email
                </Button>
            </div>
        );
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                    disabled={isPending}
                    autoComplete="email"
                />
            </div>

            <Button type="submit" variant="gradient" className="w-full" disabled={isPending}>
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                        Sending Reset Link...
                    </>
                ) : (
                    "Send Reset Link"
                )}
            </Button>
        </form>
    );
}
