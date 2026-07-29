"use client";

import { useSearchParams } from "next/navigation";
import { Shield, SlidersHorizontal, Bell, Briefcase, AlertTriangle } from "lucide-react";
import { AccountSecuritySettings } from "./AccountSecuritySettings";
import { PreferencesSettings } from "./PreferencesSettings";
import { NotificationPreferencesSettings } from "./NotificationPreferencesSettings";
import { JobPreferencesSettings } from "./JobPreferencesSettings";
import { DangerZoneSettings } from "./DangerZoneSettings";

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
 * Section navigation lives in the sidebar ("Settings" collapsible group). The
 * active section is driven by the `?section=` query param so sections are
 * deep-linkable; this component just renders the selected section.
 */
export function SettingsClient() {
    const searchParams = useSearchParams();
    const param = searchParams.get("section");
    const active: SectionId = NAV_ITEMS.some((n) => n.id === param)
        ? (param as SectionId)
        : "account";
    const activeItem = NAV_ITEMS.find((n) => n.id === active)!;

    return (
        <>
            {/* Section header */}
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

            {/* Section content — keyed so it re-animates when the section changes */}
            <div key={active} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
                {SECTION_CONTENT[active]}
            </div>
        </>
    );
}
