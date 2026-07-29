"use client";

import { useEffect, useState } from "react";
import { Clock, Video, MapPin, Layers, Bell, BellOff, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface HiringPrefs {
    default_interview_duration: number;
    interview_mode: string;
    auto_send_reminders: boolean;
}

const DEFAULT: HiringPrefs = {
    default_interview_duration: 60,
    interview_mode: "online",
    auto_send_reminders: true,
};

const DURATION_OPTIONS = [
    { value: 30, label: "30 min" },
    { value: 45, label: "45 min" },
    { value: 60, label: "60 min" },
    { value: 90, label: "90 min" },
];

const MODE_OPTIONS = [
    { value: "online",     label: "Online",     icon: Video },
    { value: "in_person",  label: "In-person",  icon: MapPin },
    { value: "hybrid",     label: "Hybrid",     icon: Layers },
];

function deepEqual(a: HiringPrefs, b: HiringPrefs) { return JSON.stringify(a) === JSON.stringify(b); }

export function HiringPreferencesSettings() {
    const [prefs, setPrefs] = useState<HiringPrefs>(DEFAULT);
    const [savedPrefs, setSavedPrefs] = useState<HiringPrefs>(DEFAULT);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/employer/settings/hiring-preferences").then(r => r.json()).then(d => {
            if (d.success && d.data) { setPrefs(d.data); setSavedPrefs(d.data); }
        }).catch(() => toast.error("Failed to load hiring preferences.")).finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/employer/settings/hiring-preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(prefs),
            });
            const data = await res.json();
            if (data.success) { setSavedPrefs({ ...prefs }); toast.success("Hiring preferences saved."); }
            else toast.error(data.error || "Failed to save.");
        } catch { toast.error("Failed to save."); }
        finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-40 rounded-2xl bg-muted" />
                    <div className="h-40 rounded-2xl bg-muted" />
                </div>
                <div className="h-24 rounded-2xl bg-muted" />
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* ── Duration + Mode row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Default Interview Duration */}
                <div className="rounded-2xl border bg-card p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">Default Interview Duration</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {DURATION_OPTIONS.map(({ value, label }) => {
                            const isActive = prefs.default_interview_duration === value;
                            return (
                                <button key={value} type="button"
                                    onClick={() => setPrefs(p => ({ ...p, default_interview_duration: value }))}
                                    className={cn(
                                        "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all duration-150",
                                        isActive
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-border hover:border-muted-foreground/30 hover:bg-accent/40"
                                    )}>
                                    <Clock className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                                    <span className={cn("text-xs font-semibold", isActive ? "text-primary" : "text-foreground")}>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-muted-foreground">Used as the default when scheduling new interviews</p>
                </div>

                {/* Interview Mode Preference */}
                <div className="rounded-2xl border bg-card p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">Interview Mode Preference</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {MODE_OPTIONS.map(({ value, label, icon: Icon }) => {
                            const isActive = prefs.interview_mode === value;
                            return (
                                <button key={value} type="button"
                                    onClick={() => setPrefs(p => ({ ...p, interview_mode: value }))}
                                    className={cn(
                                        "flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all duration-150",
                                        isActive
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-border hover:border-muted-foreground/30 hover:bg-accent/40"
                                    )}>
                                    <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                                    <span className={cn("text-xs font-semibold", isActive ? "text-primary" : "text-foreground")}>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-muted-foreground">Your preferred format for conducting interviews</p>
                </div>
            </div>

            {/* ── Auto-send Reminders ── */}
            <div className="rounded-2xl border bg-card p-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                            prefs.auto_send_reminders ? "bg-primary/10" : "bg-muted"
                        )}>
                            {prefs.auto_send_reminders
                                ? <Bell className="h-4 w-4 text-primary" />
                                : <BellOff className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Auto-send Interview Reminders</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Automatically send reminders to candidates before scheduled interviews</p>
                        </div>
                    </div>
                    <Switch
                        checked={prefs.auto_send_reminders}
                        onCheckedChange={(checked) => setPrefs(p => ({ ...p, auto_send_reminders: checked }))}
                        className="shrink-0"
                    />
                </div>
            </div>

            {/* ── Save bar ── */}
            <div className="flex items-center justify-between rounded-2xl border bg-card px-5 py-4">
                <p className="text-sm text-muted-foreground">
                    {deepEqual(prefs, savedPrefs) ? "All changes saved" : "You have unsaved changes"}
                </p>
                <Button size="sm" onClick={handleSave} disabled={saving || deepEqual(prefs, savedPrefs)}>
                    {saving
                        ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving…</>
                        : <><Save className="mr-2 h-3.5 w-3.5" />Save Preferences</>}
                </Button>
            </div>
        </div>
    );
}
