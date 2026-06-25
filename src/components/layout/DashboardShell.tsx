"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { PortalHeader } from "./PortalHeader";
import { PortalPageHeader } from "./PortalPageHeader";
import { PageTransitionWrapper } from "./PageTransitionWrapper";
import { Toaster } from "@/components/ui/toaster";

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
                <SidebarInset className="my-2 mr-2 flex min-h-0 flex-col overflow-hidden rounded-xl shadow-sm">
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        <PortalHeader
                            notificationRole={notificationRole}
                            breadcrumbOverride={breadcrumbOverride}
                            scrolled={true}
                        />
                        {children}
                    </div>
                </SidebarInset>
                <Toaster />
            </SidebarProvider>
        );
    }

    // ── Normal pages: document scroll, panel grows with content ────────────
    // SidebarProvider has no fixed height → grows with content → body scrolls.
    // SidebarInset has no overflow-hidden so position:sticky works on header.
    // The white background + shadow follow border-radius without clipping content.
    return (
        <SidebarProvider className="bg-sidebar">
            {sidebar}
            <SidebarInset className="mt-2 mr-2 mb-2 flex flex-col rounded-lg shadow-sm bg-card">
                <PortalHeader
                    notificationRole={notificationRole}
                    breadcrumbOverride={breadcrumbOverride}
                    scrolled={scrolled}
                />
                <PageTransitionWrapper>
                    {/* Content-only container: header/sidebar stay full-width;
                        the page content is padded and centred with a max-width. */}
                    <div className="p-5 md:p-6">
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
