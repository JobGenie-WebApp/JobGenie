import { cn } from "@/lib/utils";

type PortalVariant = "candidate" | "employer";

export function PortalMain({
    variant,
    children,
    className,
}: {
    variant: PortalVariant;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "portal-main relative min-h-full overflow-x-hidden",
                variant === "candidate" ? "portal-main--candidate" : "portal-main--employer",
                className
            )}
        >
            <div className="portal-main-noise pointer-events-none absolute inset-0" aria-hidden />
            <div className="portal-main-vignette pointer-events-none absolute inset-0" aria-hidden />
            <div className="portal-main-grid pointer-events-none absolute inset-0" aria-hidden />
            <div className="relative z-[1]">{children}</div>
        </div>
    );
}
