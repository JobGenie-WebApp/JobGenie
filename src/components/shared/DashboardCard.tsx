import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared shell for every list-style dashboard widget: icon + title header,
 *  body, and an optional footer link. Keeps the widgets visually identical
 *  without repeating the chrome in each one. */
export function DashboardCard({
    icon: Icon,
    title,
    subtitle,
    badge,
    footerHref,
    footerLabel,
    className,
    children,
}: {
    icon: React.ElementType;
    title: string;
    subtitle?: string;
    badge?: React.ReactNode;
    footerHref?: string;
    footerLabel?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={cn("flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm", className)}>
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-foreground">{title}</h3>
                        {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
                    </div>
                </div>
                {badge}
            </div>

            <div className="flex-1">{children}</div>

            {footerHref && (
                <Link
                    href={footerHref}
                    className="group flex items-center justify-between border-t border-border px-5 py-3 text-xs font-semibold text-primary transition-colors hover:bg-muted/30"
                >
                    {footerLabel ?? "View all"}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
            )}
        </div>
    );
}

/** Consistent empty state for widgets with nothing to show yet. */
export function EmptyState({ icon: Icon, title, hint }: { icon: React.ElementType; title: string; hint?: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                <Icon className="h-5 w-5" />
            </span>
            <p className="mt-1 text-sm font-semibold text-foreground">{title}</p>
            {hint && <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">{hint}</p>}
        </div>
    );
}

/** Small circular avatar with initials fallback — used by applicant/interview rows. */
export function Avatar({ src, name, className }: { src: string | null; name: string; className?: string }) {
    const initials = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";
    return (
        <span
            className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full",
                "bg-primary/10 text-[11px] font-bold text-primary ring-1 ring-border",
                className,
            )}
        >
            {src
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={src} alt="" className="h-full w-full object-cover" />
                : initials}
        </span>
    );
}
