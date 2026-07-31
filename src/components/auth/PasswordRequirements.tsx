import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const requirements = [
    { label: "8 or more characters", test: (password: string) => password.length >= 8 },
    { label: "One uppercase letter", test: (password: string) => /[A-Z]/.test(password) },
    { label: "One lowercase letter", test: (password: string) => /[a-z]/.test(password) },
    { label: "One number", test: (password: string) => /[0-9]/.test(password) },
    { label: "One special character", test: (password: string) => /[^a-zA-Z0-9]/.test(password) },
] as const;

export function PasswordRequirements({ password }: { password: string }) {
    return (
        <div className="mt-2.5 grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2" aria-live="polite">
            {requirements.map((requirement) => {
                const isMet = requirement.test(password);

                return (
                    <div
                        key={requirement.label}
                        className={cn(
                            "flex items-center gap-1.5 text-xs transition-colors duration-200",
                            isMet ? "font-medium text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                        )}
                    >
                        {isMet ? (
                            <Check className="size-3.5 shrink-0" aria-hidden="true" />
                        ) : (
                            <Circle className="size-3.5 shrink-0" aria-hidden="true" />
                        )}
                        <span>{requirement.label}</span>
                        <span className="sr-only">{isMet ? " met" : " not met"}</span>
                    </div>
                );
            })}
        </div>
    );
}
