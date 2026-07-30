"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import { PortalBreadcrumb } from "./PortalBreadcrumb";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PanelLeft } from "lucide-react";

interface PortalHeaderProps {
    /** When set, renders a notification bell wired to this role. MIS omits it. */
    notificationRole?: "candidate" | "employer";
    breadcrumbOverride?: string;
    /** Passed from DashboardShell; true once content div scrolls past 0. */
    scrolled?: boolean;
}

export function PortalHeader({ notificationRole, breadcrumbOverride, scrolled }: PortalHeaderProps) {
    const { toggleSidebar } = useSidebar();

    const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
        toggleSidebar();
        e.currentTarget.blur();
    };

    return (
        <header className={cn(
            // sticky so the header stays pinned while the document scrolls (ClassPass model).
            // On scroll: shadow + a frosted translucent backdrop, matching ClassPass's after:backdrop-blur.
            "sticky top-0 z-40 flex h-14 items-center gap-3 rounded-t-lg border-b border-border/60 px-4 transition-[box-shadow,background-color] duration-200 md:px-5",
            scrolled ? "bg-background/88 shadow-sm backdrop-blur-lg" : "bg-background"
        )}>
            <button
                onClick={handleToggle}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Toggle sidebar"
            >
                <PanelLeft className="h-4 w-4" />
            </button>

            <div className="min-w-0 flex-1">
                <PortalBreadcrumb breadcrumbOverride={breadcrumbOverride} />
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
                <ThemeToggle />
                {notificationRole && <NotificationBell role={notificationRole} />}
            </div>
        </header>
    );
}
