"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Users, Globe, BarChart3, Lock, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PrivacySettings {
    profile_visible: boolean;
    show_company_size: boolean;
    show_company_website: boolean;
}

const DEFAULT: PrivacySettings = {
    profile_visible: true,
    show_company_size: true,
    show_company_website: true,
};

function deepEqual(a: PrivacySettings, b: PrivacySettings) { return JSON.stringify(a) === JSON.stringify(b); }

const TOGGLES: { key: keyof PrivacySettings; label: string; description: string; icon: React.ElementType }[] = [
    { key: "profile_visible",      label: "Company Profile Visible",  description: "Show your company profile in candidate search results",         icon: Eye },
    { key: "show_company_size",    label: "Show Company Size",         description: "Display your company's headcount on the public profile",        icon: BarChart3 },
    { key: "show_company_website", label: "Show Company Website",      description: "Display your website URL on the public profile",                icon: Globe },
];

export function PrivacyVisibilitySettings({ isSuperAdmin }: { isSuperAdmin: boolean }) {
    const [settings, setSettings] = useState<PrivacySettings>(DEFAULT);
    const [savedSettings, setSavedSettings] = useState<PrivacySettings>(DEFAULT);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/employer/settings/privacy").then(r => r.json()).then(d => {
            if (d.success && d.data) { setSettings(d.data); setSavedSettings(d.data); }
        }).catch(() => toast.error("Failed to load privacy settings.")).finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/employer/settings/privacy", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            const data = await res.json();
            if (data.success) { setSavedSettings({ ...settings }); toast.success("Privacy settings saved."); }
            else toast.error(data.error || "Failed to save.");
        } catch { toast.error("Failed to save."); }
        finally { setSaving(false); }
    };

    if (!isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border bg-muted/30 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-sm font-semibold">Super Admin Only</p>
                    <p className="text-xs text-muted-foreground mt-1">Only the company super admin can manage privacy settings.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted" />)}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                {TOGGLES.map(({ key, label, description, icon: Icon }) => {
                    const isOn = settings[key];
                    return (
                        <div key={key} className="rounded-2xl border bg-card p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                                        isOn ? "bg-primary/10" : "bg-muted"
                                    )}>
                                        {key === "profile_visible" && !isOn
                                            ? <EyeOff className="h-4 w-4 text-muted-foreground" />
                                            : <Icon className={cn("h-4 w-4", isOn ? "text-primary" : "text-muted-foreground")} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{label}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                                    </div>
                                </div>
                                <Switch
                                    checked={isOn}
                                    onCheckedChange={(checked) => setSettings(p => ({ ...p, [key]: checked }))}
                                    className="shrink-0"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-between rounded-2xl border bg-card px-5 py-4">
                <p className="text-sm text-muted-foreground">
                    {deepEqual(settings, savedSettings) ? "All changes saved" : "You have unsaved changes"}
                </p>
                <Button size="sm" onClick={handleSave} disabled={saving || deepEqual(settings, savedSettings)}>
                    {saving
                        ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving…</>
                        : <><Save className="mr-2 h-3.5 w-3.5" />Save Settings</>}
                </Button>
            </div>
        </div>
    );
}
