"use client";

import { useState } from "react";
import { Shield, SlidersHorizontal, Bell, Briefcase, ChevronRight, AlertTriangle } from "lucide-react";
import { AccountSecuritySettings } from "./AccountSecuritySettings";
import { PreferencesSettings } from "./PreferencesSettings";
import { NotificationPreferencesSettings } from "./NotificationPreferencesSettings";
import { JobPreferencesSettings } from "./JobPreferencesSettings";
import { DangerZoneSettings } from "./DangerZoneSettings";
import { cn } from "@/lib/utils";

type SectionId = "account" | "preferences" | "notifications" | "job-preferences" | "danger";

const NAV_ITEMS: { id: SectionId; label: string; description: string; icon: React.ElementType }[] = [
    { id: "account",         label: "Account & Security", description: "Password, sessions & account info",  icon: Shield },
    { id: "preferences",     label: "Preferences",        description: "Timezone & appearance",               icon: SlidersHorizontal },
    { id: "notifications",   label: "Notifications",      description: "Control what you're notified about",  icon: Bell },
    { id: "job-preferences", label: "Job Preferences",    description: "Availability, salary & job type",     icon: Briefcase },
    { id: "danger",          label: "Danger Zone",        description: "Account deletion and data removal",   icon: AlertTriangle },
];

const SECTION_CONTENT: Record<SectionId, React.ReactNode> = {
    "account":         <AccountSecuritySettings />,
    "preferences":     <PreferencesSettings />,
    "notifications":   <NotificationPreferencesSettings />,
    "job-preferences": <JobPreferencesSettings />,
    "danger":          <DangerZoneSettings />,
};

/*
 * Height budget (desktop only):
 *   100dvh
 *   − header:           4.25rem
 *   − PortalMain p-8:   2 × 2rem   = 4rem   → md total: 8.25rem
 *   − PortalMain p-10:  2 × 2.5rem = 5rem   → lg total: 9.25rem
 * The container is locked to this height so the outer CandidateLayout scroll
 * container never needs to scroll on the settings page. Only the right content
 * panel scrolls independently.
 */

export function SettingsClient() {
    const [active, setActive] = useState<SectionId>("account");
    const activeItem = NAV_ITEMS.find((n) => n.id === active)!;

    return (
        <>
            {/* Mobile pill tab bar — sits in normal flow above content */}
            <div className="md:hidden flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-none mb-4">
                {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
                    const isActive = active === id;
                    return (
                        <button key={id} onClick={() => setActive(id)}
                            className={cn(
                                "flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-2 text-xs font-medium transition-all",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}>
                            <Icon className="h-3.5 w-3.5" />{label}
                        </button>
                    );
                })}
            </div>

            {/* Main layout — on desktop: exact viewport height so only right panel scrolls */}
            <div className={cn(
                "flex gap-6",
                /* mobile: column, no height lock */
                "flex-col",
                /* desktop: row, height-locked */
                "md:flex-row md:h-[calc(100dvh-8.25rem)]",
                "lg:h-[calc(100dvh-9.25rem)]",
            )}>

                {/* Left nav — desktop only, no overflow, never scrolls */}
                <aside className="hidden md:flex flex-col w-56 lg:w-64 shrink-0">
                    <nav className="space-y-1">
                        {NAV_ITEMS.map(({ id, label, description, icon: Icon }) => {
                            const isActive = active === id;
                            return (
                                <button key={id} onClick={() => setActive(id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 group",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "hover:bg-accent text-muted-foreground hover:text-foreground"
                                    )}>
                                    <div className={cn(
                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                                        isActive ? "bg-primary-foreground/15" : "bg-muted group-hover:bg-accent-foreground/10"
                                    )}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium leading-none truncate">{label}</p>
                                        <p className={cn(
                                            "text-[11px] mt-0.5 leading-tight truncate",
                                            isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                                        )}>{description}</p>
                                    </div>
                                    {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 opacity-60" />}
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Right content — independently scrollable on desktop */}
                <div className="flex-1 min-w-0 md:overflow-y-auto">

                    {/* Section header — inside scroll panel so it scrolls away on small content */}
                    <div className="mb-6 pb-5 border-b">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                                <activeItem.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold leading-none">{activeItem.label}</h2>
                                <p className="text-sm text-muted-foreground mt-1">{activeItem.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Section content with enter animation */}
                    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
                        {SECTION_CONTENT[active]}
                    </div>

                    {/* Bottom breathing room */}
                    <div className="h-8" />
                </div>
            </div>
        </>
    );
}
