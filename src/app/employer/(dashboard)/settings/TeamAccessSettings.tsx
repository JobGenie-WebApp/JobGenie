"use client";

import { useEffect, useState } from "react";
import { Briefcase, Users, ShieldCheck, Lock, Save, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TeamSettings {
    sub_admin_can_post_jobs: boolean;
    sub_admin_can_invite_candidates: boolean;
    require_super_admin_approval_for_posts: boolean;
}

const DEFAULT: TeamSettings = {
    sub_admin_can_post_jobs: true,
    sub_admin_can_invite_candidates: true,
    require_super_admin_approval_for_posts: false,
};

function deepEqual(a: TeamSettings, b: TeamSettings) { return JSON.stringify(a) === JSON.stringify(b); }

const TOGGLES: { key: keyof TeamSettings; label: string; description: string; icon: React.ElementType }[] = [
    { key: "sub_admin_can_post_jobs",              label: "Sub-admins Can Post Jobs",     description: "Allow sub-admins to create and publish job postings",                     icon: Briefcase },
    { key: "sub_admin_can_invite_candidates",      label: "Sub-admins Can Invite Candidates", description: "Allow sub-admins to send invitations to candidates",                icon: Users },
    { key: "require_super_admin_approval_for_posts", label: "Require Approval for Job Posts", description: "Job posts from sub-admins need your approval before going live",   icon: ShieldCheck },
];

export function TeamAccessSettings({ isSuperAdmin }: { isSuperAdmin: boolean }) {
    const [settings, setSettings] = useState<TeamSettings>(DEFAULT);
    const [savedSettings, setSavedSettings] = useState<TeamSettings>(DEFAULT);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/employer/settings/team").then(r => r.json()).then(d => {
            if (d.success && d.data) { setSettings(d.data); setSavedSettings(d.data); }
        }).catch(() => toast.error("Failed to load team settings.")).finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/employer/settings/team", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            const data = await res.json();
            if (data.success) { setSavedSettings({ ...settings }); toast.success("Team settings saved."); }
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
                    <p className="text-xs text-muted-foreground mt-1">Only the company super admin can manage team access settings.</p>
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
                                        <Icon className={cn("h-4 w-4", isOn ? "text-primary" : "text-muted-foreground")} />
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

            {/* Contextual callout when approval required is on */}
            {settings.require_super_admin_approval_for_posts && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                    <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                        Sub-admin job posts will be saved as drafts until you review and approve them from the Job Postings page.
                    </p>
                </div>
            )}

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
