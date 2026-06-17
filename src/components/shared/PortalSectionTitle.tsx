import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PortalTone = "candidate" | "employer" | "neutral";

const toneBorder: Record<PortalTone, string> = {
    candidate: "border-l-primary",
    employer: "border-l-accent",
    neutral: "border-l-primary/80",
};

const toneEyebrow: Record<PortalTone, string> = {
    candidate: "text-primary",
    employer: "text-accent",
    neutral: "text-primary",
};

export function PortalSectionTitle({
    eyebrow,
    title,
    description,
    tone = "neutral",
    className,
    action,
}: {
    eyebrow?: string;
    title: string;
    description?: string;
    tone?: PortalTone;
    className?: string;
    action?: ReactNode;
}) {
    return (
        <div
            className={cn(
                "mb-5 flex flex-col gap-3 border-l-2 pl-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between",
                toneBorder[tone],
                className
            )}
        >
            <div className="min-w-0 space-y-1">
                {eyebrow ? (
                    <p
                        className={cn(
                            "text-[10px] font-bold uppercase tracking-[0.22em]",
                            toneEyebrow[tone]
                        )}
                    >
                        {eyebrow}
                    </p>
                ) : null}
                <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">{title}</h2>
                {description ? (
                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                        {description}
                    </p>
                ) : null}
            </div>
            {action ? <div className="shrink-0 sm:pl-4">{action}</div> : null}
        </div>
    );
}
