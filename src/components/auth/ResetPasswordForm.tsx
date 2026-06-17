"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { resetPassword, type ActionState } from "@/app/actions/auth";

interface ResetPasswordFormProps {
    token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
    const router = useRouter();
    const [state, setState] = useState<ActionState | null>(null);
    const [isPending, startTransition] = useTransition();
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = (formData: FormData) => {
        // Inject the token from props (not from URL directly — safer)
        formData.set("token", token);
        startTransition(async () => {
            try {
                const result = await resetPassword(null, formData);
                setState(result);
            } catch {
                toast.error("Something went wrong. Please try again.");
            }
        });
    };

    useEffect(() => {
        if (!state) return;
        if (state.success) {
            toast.success(state.message);
            setTimeout(() => {
                router.push("/login");
            }, 1500);
        } else {
            toast.error(state.message);
        }
    }, [state, router]);

    return (
        <form action={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                    <Input
                        id="newPassword"
                        name="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        required
                        disabled={isPending}
                        autoComplete="new-password"
                        className="pr-10"
                        minLength={8}
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                        disabled={isPending}
                    >
                        {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
                {/* Password requirements hint */}
                <p className="text-xs text-muted-foreground">
                    Must contain uppercase, lowercase, a number, and a special character (e.g. <span className="font-mono">!@#$%</span>).
                </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your new password"
                        required
                        disabled={isPending}
                        autoComplete="new-password"
                        className="pr-10"
                        minLength={8}
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                        disabled={isPending}
                    >
                        {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                        ) : (
                            <Eye className="h-4 w-4" />
                        )}
                    </button>
                </div>
            </div>

            <Button type="submit" variant="gradient" className="w-full" disabled={isPending}>
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                        Updating Password...
                    </>
                ) : (
                    "Set New Password"
                )}
            </Button>
        </form>
    );
}
