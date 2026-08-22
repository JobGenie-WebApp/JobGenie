"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface PolicyConsentProps {
    id: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    name?: string;
    error?: string;
    disabled?: boolean;
}

export function PolicyConsent({
    id,
    checked,
    onCheckedChange,
    name,
    error,
    disabled = false,
}: PolicyConsentProps) {
    return (
        <div>
            {name && <input type="hidden" name={name} value={checked ? "true" : "false"} />}
            <div
                className={cn(
                    "flex items-start gap-3 rounded-xl border bg-muted/20 px-4 py-3.5 transition-colors",
                    checked ? "border-primary/30 bg-primary/[0.06]" : "border-border/80",
                    error && "border-destructive/50 bg-destructive/[0.04]",
                )}
            >
                <Checkbox
                    id={id}
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(value) => onCheckedChange(value === true)}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${id}-error` : undefined}
                    className="mt-0.5 size-5 rounded-md"
                />
                <label htmlFor={id} className="cursor-pointer text-sm leading-5 text-muted-foreground">
                    I have read and agreed to the{" "}
                    <Link
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary"
                    >
                        Terms &amp; Conditions
                    </Link>{" "}
                    and consent to having my profile stored for future job opportunities in accordance with the{" "}
                    <Link
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary"
                    >
                        Privacy Policy
                    </Link>
                    .
                </label>
            </div>
            {error && (
                <p id={`${id}-error`} className="mt-1.5 text-xs text-destructive" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
