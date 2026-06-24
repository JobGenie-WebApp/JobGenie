"use client";

import { useSearchParams } from "next/navigation";
import { Shield, SlidersHorizontal, Bell, Briefcase, Eye, Users, AlertTriangle } from "lucide-react";
import { AccountSecuritySettings } from "./AccountSecuritySettings";
import { PreferencesSettings } from "./PreferencesSettings";
import { NotificationPreferencesSettings } from "./NotificationPreferencesSettings";
import { HiringPreferencesSettings } from "./HiringPreferencesSettings";
import { PrivacyVisibilitySettings } from "./PrivacyVisibilitySettings";
import { TeamAccessSettings } from "./TeamAccessSettings";
import { DangerZoneSettings } from "./DangerZoneSettings";

type SectionId = "account" | "preferences" | "notifications" | "hiring" | "privacy" | "team" | "danger";

interface Props {
    isSuperAdmin: boolean;
    email: string;
    createdAt: string;
    approvalStatus: string;
    companyName: string | null;
}

/*
 * Section navigation lives in the sidebar ("Settings" collapsible group). The
 * active section is driven by the `?section=` query param so sections are
 * deep-linkable; this component just renders the selected section. Super-admin
 * sections (Privacy & Visibility, Team & Access) are reachable by deep-link and
 * guard themselves; non-super-admins fall back to "account".
 */
export function SettingsClient({ isSuperAdmin, email, createdAt, approvalStatus, companyName }: Props) {
    const searchParams = useSearchParams();

    const NAV_ITEMS: { id: SectionId; label: string; description: string; icon: React.ElementType }[] = [
        { id: "account",       label: "Account & Security",   description: "Password, sessions & account info",       icon: Shield },
        { id: "preferences",   label: "Preferences",          description: "Timezone & appearance",                   icon: SlidersHorizontal },
        { id: "notifications", label: "Notifications",        description: "Control what you're notified about",      icon: Bell },
        { id: "hiring",        label: "Hiring Preferences",   description: "Interview settings & reminders",          icon: Briefcase },
        ...(isSuperAdmin ? [
            { id: "privacy" as SectionId, label: "Privacy & Visibility", description: "Control your company's public visibility", icon: Eye },
            { id: "team" as SectionId,    label: "Team & Access",         description: "Sub-admin permissions",                   icon: Users },
        ] : []),
        { id: "danger",        label: "Danger Zone",          description: "Account and company actions",             icon: AlertTriangle },
    ];

    const param = searchParams.get("section");
    const active: SectionId = NAV_ITEMS.some((n) => n.id === param)
        ? (param as SectionId)
        : "account";
    const activeItem = NAV_ITEMS.find((n) => n.id === active) ?? NAV_ITEMS[0];

    const SECTION_CONTENT: Record<SectionId, React.ReactNode> = {
        "account":       <AccountSecuritySettings email={email} createdAt={createdAt} approvalStatus={approvalStatus} companyName={companyName} isSuperAdmin={isSuperAdmin} />,
        "preferences":   <PreferencesSettings />,
        "notifications": <NotificationPreferencesSettings />,
        "hiring":        <HiringPreferencesSettings />,
        "privacy":       <PrivacyVisibilitySettings isSuperAdmin={isSuperAdmin} />,
        "team":          <TeamAccessSettings isSuperAdmin={isSuperAdmin} />,
        "danger":        <DangerZoneSettings isSuperAdmin={isSuperAdmin} />,
    };

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
