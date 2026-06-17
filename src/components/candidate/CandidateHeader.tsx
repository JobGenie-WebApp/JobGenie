"use client";

import { useSidebar } from "@/components/ui/sidebar";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PanelLeft } from "lucide-react";

interface CandidateHeaderProps {
    user: {
        firstName: string;
        lastName: string;
        email: string;
        profileImage?: string;
        membershipNo?: string;
    };
    pageTitle?: string;
    pageDescription?: string;
}

export function CandidateHeader({ user, pageTitle, pageDescription }: CandidateHeaderProps) {
    const { toggleSidebar } = useSidebar();

    const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
        toggleSidebar();
        e.currentTarget.blur();
    };

    return (
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/60 bg-background/95 px-4 backdrop-blur-sm md:px-5"
            style={{ boxShadow: "0 2px 8px 0 oklch(0 0 0 / 0.06), 0 4px 20px 0 oklch(0 0 0 / 0.04)" }}>
            <button
                onClick={handleToggle}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Toggle sidebar"
            >
                <PanelLeft className="h-4 w-4" />
            </button>

            {pageTitle ? (
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-base font-semibold text-foreground leading-tight">
                        {pageTitle}
                    </h1>
                    {pageDescription && (
                        <p className="hidden truncate text-xs text-muted-foreground sm:block">{pageDescription}</p>
                    )}
                </div>
            ) : (
                <div className="flex-1" />
            )}

            <div className="flex shrink-0 items-center gap-1.5">
                <ThemeToggle />
                <NotificationBell role="candidate" />
                <UserMenu user={user} />
            </div>
        </header>
    );
}
