"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { PortalHeader } from "./PortalHeader";
import { PortalPageHeader } from "./PortalPageHeader";
import { PageTransitionWrapper } from "./PageTransitionWrapper";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
    /** The portal's own sidebar element (keeps per-portal logic intact). */
    sidebar: React.ReactNode;
    children: React.ReactNode;
    pageTitle?: string;
    pageDescription?: string;
    /** Right-aligned action buttons in the content title row. */
    headerActions?: React.ReactNode;
    /** Overrides the last breadcrumb label (for id-based detail routes). */
    breadcrumbOverride?: string;
    /** When true, suppresses document scroll so the page manages its own
     *  scroll columns (calendar, kanban, chat panes, etc.). */
    fullHeight?: boolean;
    /** fullHeight only: wrap content in a max-width bordered card (split-pane
     *  pages). Set false for full-width bare content like the kanban board. */
    fullHeightBordered?: boolean;
    notificationRole?: "candidate" | "employer";
}

export function DashboardShell({
    sidebar,
    children,
    pageTitle,
    pageDescription,
    headerActions,
    breadcrumbOverride,
    fullHeight,
    fullHeightBordered = true,
    notificationRole,
}: DashboardShellProps) {
    const [scrolled, setScrolled] = useState(false);

    // Normal pages: detect window scroll so the sticky header shows its shadow.
    // fullHeight pages manage their own inner scroll — header shadow is always on.
    // Threshold of 10px mirrors ClassPass so a tiny scroll nudge doesn't flicker the shadow.
    useEffect(() => {
        if (fullHeight) return;
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [fullHeight]);

    // ── fullHeight pages: fixed viewport, inner scroll ─────────────────────
    if (fullHeight) {
        return (
            <SidebarProvider className="bg-sidebar h-dvh! min-h-0! overflow-hidden">
                {sidebar}
                <SidebarInset className="portal-shell my-2 mr-2 flex min-h-0 flex-col overflow-hidden rounded-xl bg-background">
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        <PortalHeader
                            notificationRole={notificationRole}
                            breadcrumbOverride={breadcrumbOverride}
                            scrolled={true}
                        />
                        {/* Content inset: center the content at the same max-width as normal
                            pages so split-pane pages get visible left/right side space — no border. */}
                        <div className="portal-content flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-4 md:px-6 md:pt-5">
                            <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden pb-2">
                                <PortalPageHeader
                                    title={pageTitle}
                                    description={pageDescription}
                                    actions={headerActions}
                                />
                                <div className={cn(
                                    "flex min-h-0 flex-1 overflow-hidden",
                                    fullHeightBordered && "rounded-t-xl border border-b-0 bg-card",
                                )}>
                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
                <Toaster />
            </SidebarProvider>
        );
    }

    // ── Normal pages: document scroll, panel grows with content ────────────
    // SidebarProvider has no fixed height → grows with content → body scrolls.
    // SidebarInset has no overflow-hidden so position:sticky works on header.
    // The portal canvas + shell shadow follow border-radius without clipping content.
    return (
        <SidebarProvider className="bg-sidebar">
            {sidebar}
            <SidebarInset className="portal-shell mt-2 mr-2 mb-2 flex flex-col rounded-lg bg-background">
                <PortalHeader
                    notificationRole={notificationRole}
                    breadcrumbOverride={breadcrumbOverride}
                    scrolled={scrolled}
                />
                <PageTransitionWrapper>
                    {/* Content-only container: header/sidebar stay full-width;
                        the page content is padded and centred with a max-width. */}
                    <div className="portal-content min-h-[calc(100svh-4.5rem)] p-5 md:p-7 lg:p-8">
                        <div className="mx-auto w-full max-w-7xl">
                            <PortalPageHeader
                                title={pageTitle}
                                description={pageDescription}
                                actions={headerActions}
                            />
                            {children}
                        </div>
                    </div>
                </PageTransitionWrapper>
            </SidebarInset>
            <Toaster />
        </SidebarProvider>
    );
}
