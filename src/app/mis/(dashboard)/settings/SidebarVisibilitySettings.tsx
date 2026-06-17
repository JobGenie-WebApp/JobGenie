"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PortalType = "candidate" | "employer";

interface SidebarItem {
    key: string;
    label: string;
    canHide: boolean; // dashboard is always visible
}

const CANDIDATE_ITEMS: SidebarItem[] = [
    { key: "dashboard", label: "Dashboard", canHide: false },
    { key: "browse-jobs", label: "Browse Jobs", canHide: true },
    { key: "applications", label: "Applications", canHide: true },
    { key: "invitations", label: "Invitations", canHide: true },
    { key: "calendar", label: "Calendar", canHide: true },
    { key: "my-profile", label: "My Profile", canHide: true },
    { key: "my-resumes", label: "My Resumes", canHide: true },
    { key: "settings", label: "Settings", canHide: true },
];

const EMPLOYER_ITEMS: SidebarItem[] = [
    { key: "dashboard", label: "Dashboard", canHide: false },
    { key: "job-postings", label: "Job Postings", canHide: true },
    { key: "applications", label: "Applications", canHide: true },
    { key: "candidates", label: "Candidates", canHide: true },
    { key: "invitations", label: "Invitations", canHide: true },
    { key: "calendar", label: "Calendar", canHide: true },
    { key: "company-profile", label: "Company Profile", canHide: true },
    { key: "company-admins", label: "Company Admins", canHide: true },
    { key: "settings", label: "Settings", canHide: true },
];

type VisibilityMap = Record<string, boolean>;

function buildDefaults(items: SidebarItem[]): VisibilityMap {
    return Object.fromEntries(items.map((i) => [i.key, true]));
}

interface PanelProps {
    label: string;
    portalType: PortalType;
    items: SidebarItem[];
    visibility: VisibilityMap;
    saving: boolean;
    onChange: (key: string, value: boolean) => void;
    onSave: () => void;
    onReset: () => void;
}

function PortalPanel({
    label,
    items,
    visibility,
    saving,
    onChange,
    onSave,
    onReset,
}: PanelProps) {
    const hiddenCount = items.filter(
        (i) => i.canHide && !visibility[i.key]
    ).length;

    return (
        <div className="rounded-xl border bg-card p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h3 className="text-base font-semibold">{label} Portal</h3>
                    <p className="text-sm text-muted-foreground">
                        Control which sidebar items are visible to {label.toLowerCase()}s
                    </p>
                </div>
                {hiddenCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                        {hiddenCount} hidden
                    </Badge>
                )}
            </div>

            {/* Item list */}
            <div className="space-y-1">
                {items.map((item) => {
                    const isVisible = visibility[item.key] ?? true;
                    const isLocked = !item.canHide;

                    return (
                        <div
                            key={item.key}
                            className={cn(
                                "flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors",
                                isLocked
                                    ? "bg-muted/40"
                                    : isVisible
                                    ? "hover:bg-accent/40"
                                    : "bg-destructive/5 hover:bg-destructive/10"
                            )}
                        >
                            <div className="flex items-center gap-2.5">
                                {isVisible ? (
                                    <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                                ) : (
                                    <EyeOff className="h-4 w-4 text-destructive/70 shrink-0" />
                                )}
                                <span
                                    className={cn(
                                        "text-sm font-medium",
                                        !isVisible && "text-muted-foreground line-through"
                                    )}
                                >
                                    {item.label}
                                </span>
                                {isLocked && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                        Always visible
                                    </Badge>
                                )}
                            </div>
                            <Switch
                                checked={isVisible}
                                disabled={isLocked}
                                onCheckedChange={(checked) => onChange(item.key, checked)}
                                aria-label={`Toggle ${item.label} visibility`}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
                <Button
                    size="sm"
                    onClick={onSave}
                    disabled={saving}
                    className="gap-1.5"
                >
                    <Save className="h-3.5 w-3.5" />
                    {saving ? "Saving…" : "Save Changes"}
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onReset}
                    disabled={saving}
                    className="gap-1.5 text-muted-foreground"
                >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset to Default
                </Button>
            </div>
        </div>
    );
}

export function SidebarVisibilitySettings() {
    const [loading, setLoading] = useState(true);
    const [savingCandidate, setSavingCandidate] = useState(false);
    const [savingEmployer, setSavingEmployer] = useState(false);

    const [candidateVisibility, setCandidateVisibility] = useState<VisibilityMap>(
        buildDefaults(CANDIDATE_ITEMS)
    );
    const [employerVisibility, setEmployerVisibility] = useState<VisibilityMap>(
        buildDefaults(EMPLOYER_ITEMS)
    );

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/mis/settings/sidebar-visibility");
                const data = await res.json();
                if (data.success) {
                    setCandidateVisibility({
                        ...buildDefaults(CANDIDATE_ITEMS),
                        ...data.settings.candidate,
                    });
                    setEmployerVisibility({
                        ...buildDefaults(EMPLOYER_ITEMS),
                        ...data.settings.employer,
                    });
                } else {
                    toast.error(data.error || "Failed to load sidebar visibility settings");
                }
            } catch {
                toast.error("Failed to load sidebar visibility settings");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const save = async (
        portalType: PortalType,
        visibility: VisibilityMap,
        setSaving: (v: boolean) => void
    ) => {
        setSaving(true);
        try {
            const res = await fetch("/api/mis/settings/sidebar-visibility", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ portal_type: portalType, visibility_config: visibility }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(
                    `${portalType === "candidate" ? "Candidate" : "Employer"} sidebar visibility saved`
                );
            } else {
                toast.error(data.error || "Failed to save settings");
            }
        } catch {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2">
                {[0, 1].map((i) => (
                    <div key={i} className="rounded-xl border bg-card p-6 space-y-4 animate-pulse">
                        <div className="h-5 w-40 rounded bg-muted" />
                        <div className="space-y-2">
                            {Array.from({ length: 6 }).map((_, j) => (
                                <div key={j} className="h-10 rounded-lg bg-muted" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <PortalPanel
                label="Candidate"
                portalType="candidate"
                items={CANDIDATE_ITEMS}
                visibility={candidateVisibility}
                saving={savingCandidate}
                onChange={(key, value) =>
                    setCandidateVisibility((prev) => ({ ...prev, [key]: value }))
                }
                onSave={() => save("candidate", candidateVisibility, setSavingCandidate)}
                onReset={() => {
                    setCandidateVisibility(buildDefaults(CANDIDATE_ITEMS));
                    toast.info("Reset to defaults — click Save to apply");
                }}
            />
            <PortalPanel
                label="Employer"
                portalType="employer"
                items={EMPLOYER_ITEMS}
                visibility={employerVisibility}
                saving={savingEmployer}
                onChange={(key, value) =>
                    setEmployerVisibility((prev) => ({ ...prev, [key]: value }))
                }
                onSave={() => save("employer", employerVisibility, setSavingEmployer)}
                onReset={() => {
                    setEmployerVisibility(buildDefaults(EMPLOYER_ITEMS));
                    toast.info("Reset to defaults — click Save to apply");
                }}
            />
        </div>
    );
}
