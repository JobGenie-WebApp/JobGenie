"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, LockKeyhole, LogIn, Mail } from "lucide-react";
import { toast } from "sonner";
import { universalLogin, type ActionState } from "@/app/actions/universal-auth";
import { cn } from "@/lib/utils";

export function UniversalLoginForm({ returnUrl }: { returnUrl?: string }) {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [state, setState] = useState<ActionState | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            try {
                const result = await universalLogin(null, formData);
                setState(result);
            } catch {
                toast.error("Invalid email or password. Please try again.");
            }
        });
    };

    useEffect(() => {
        if (!state) return;
        if (state.success && state.redirectTo) {
            toast.success(state.message);
            setTimeout(() => router.push(state.redirectTo!), 300);
        } else if (!state.success) {
            toast.error(state.message);
            if (state.redirectTo) setTimeout(() => router.push(state.redirectTo!), 1500);
        }
    }, [state, router]);

    return (
        <form action={handleSubmit} className="space-y-5">
            {returnUrl && <input type="hidden" name="returnUrl" value={returnUrl} />}

            <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                    Email
                </label>
                <div className="group relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" aria-hidden="true" />
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@company.com"
                        required
                        disabled={isPending}
                        autoComplete="email"
                        className={cn(
                            "h-12 w-full rounded-xl border border-border bg-background/70 pl-11 pr-4 text-base text-foreground shadow-sm placeholder:text-muted-foreground/60 sm:text-sm",
                            "outline-none transition-[border-color,box-shadow,background-color] duration-200 focus:border-primary/60 focus:bg-background focus:ring-4 focus:ring-primary/10",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                        Password
                    </label>
                    <Link
                        href="/forgot-password"
                        className="inline-flex min-h-11 items-center rounded px-1 text-xs font-semibold text-primary outline-none transition-opacity hover:opacity-75 focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        Forgot password?
                    </Link>
                </div>
                <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        required
                        disabled={isPending}
                        autoComplete="current-password"
                        className={cn(
                            "h-12 w-full rounded-xl border border-border bg-background/70 pl-11 pr-12 text-base text-foreground shadow-sm placeholder:text-muted-foreground/60 sm:text-sm",
                            "outline-none transition-[border-color,box-shadow,background-color] duration-200 focus:border-primary/60 focus:bg-background focus:ring-4 focus:ring-primary/10",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isPending}
                        className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={isPending}
                className={cn(
                    "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground",
                    "shadow-lg shadow-primary/20 transition-[filter,transform,box-shadow] duration-200 hover:brightness-105 hover:shadow-xl hover:shadow-primary/20 active:scale-[0.99]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                )}
            >
                {isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</>
                ) : (
                    <><LogIn className="h-4 w-4" />Sign In</>
                )}
            </button>
        </form>
    );
}
