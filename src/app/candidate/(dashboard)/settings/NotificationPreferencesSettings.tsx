"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Save, Loader2, Mail, CalendarCheck, CalendarClock, AlarmClock, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type NotifKey = "invitation_received" | "interview_scheduled" | "interview_rescheduled" | "interview_reminder" | "offer_result_updates";
type PrefsMap = Record<NotifKey, boolean>;

const NOTIFICATION_OPTIONS: { key: NotifKey; label: string; description: string; icon: React.ElementType }[] = [
    { key: "invitation_received", label: "Invitation Received", description: "When an employer sends you a new job invitation", icon: Mail },
    { key: "interview_scheduled", label: "Interview Scheduled", description: "When a new interview round is added to your calendar", icon: CalendarCheck },
    { key: "interview_rescheduled", label: "Interview Rescheduled", description: "When an existing interview time is changed", icon: CalendarClock },
    { key: "interview_reminder", label: "Interview Reminder", description: "Advance reminders before your scheduled interviews", icon: AlarmClock },
    { key: "offer_result_updates", label: "Offer & Result Updates", description: "Job offers received, accepted, declined, or withdrawn", icon: Award },
];

const DEFAULT_PREFS: PrefsMap = {
    invitation_received: true, interview_scheduled: true, interview_rescheduled: true,
    interview_reminder: true, offer_result_updates: true,
};

export function NotificationPreferencesSettings() {
    const [prefs, setPrefs] = useState<PrefsMap>({ ...DEFAULT_PREFS });
    const [savedPrefs, setSavedPrefs] = useState<PrefsMap>({ ...DEFAULT_PREFS });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/user/notification-preferences").then(r => r.json()).then(d => {
            if (d.success && d.preferences) { const m = { ...DEFAULT_PREFS, ...d.preferences } as PrefsMap; setPrefs(m); setSavedPrefs(m); }
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/user/notification-preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ preferences: prefs }) });
            const data = await res.json();
            if (data.success) { setSavedPrefs({ ...prefs }); toast.success("Notification preferences saved."); }
            else toast.error(data.error || "Failed to save.");
        } catch { toast.error("Failed to save preferences."); }
        finally { setSaving(false); }
    };

    const hasChanges = NOTIFICATION_OPTIONS.some(({ key }) => prefs[key] !== savedPrefs[key]);
    const enabledCount = NOTIFICATION_OPTIONS.filter(({ key }) => prefs[key]).length;

    return (
        <div className="space-y-6">
            {/* Summary banner */}
            <div className="flex items-center justify-between rounded-2xl border bg-card px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                        enabledCount > 0 ? "bg-primary/10" : "bg-muted")}>
                        {enabledCount > 0
                            ? <Bell className="h-4 w-4 text-primary" />
                            : <BellOff className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div>
                        <p className="text-sm font-semibold">
                            {enabledCount === NOTIFICATION_OPTIONS.length
                                ? "All notifications enabled"
                                : enabledCount === 0
                                ? "All notifications disabled"
                                : `${enabledCount} of ${NOTIFICATION_OPTIONS.length} notifications enabled`}
                        </p>
                        <p className="text-xs text-muted-foreground">Toggle individual notifications below</p>
                    </div>
                </div>
                <Button size="sm" onClick={handleSave} disabled={saving || loading || !hasChanges}>
                    {saving
                        ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving…</>
                        : <><Save className="mr-2 h-3.5 w-3.5" />Save</>}
                </Button>
            </div>

            {/* Notification toggles grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="rounded-2xl border bg-card p-5 space-y-3 animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-muted" />
                                <div className="space-y-1.5 flex-1">
                                    <div className="h-4 w-32 rounded bg-muted" />
                                    <div className="h-3 w-44 rounded bg-muted" />
                                </div>
                            </div>
                            <div className="h-6 w-11 rounded-full bg-muted ml-auto" />
                        </div>
                    ))
                    : NOTIFICATION_OPTIONS.map(({ key, label, description, icon: Icon }) => {
                        const isOn = prefs[key];
                        return (
                            <div key={key} className={cn(
                                "rounded-2xl border bg-card p-5 transition-all duration-150 cursor-pointer group",
                                isOn ? "border-primary/20 shadow-sm" : "opacity-70 hover:opacity-90"
                            )} onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors mt-0.5",
                                            isOn ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                        )}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold leading-none">{label}</p>
                                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
                                        </div>
                                    </div>
                                    <Switch
                                        id={`notif-${key}`}
                                        checked={isOn}
                                        onCheckedChange={(checked) => setPrefs(p => ({ ...p, [key]: checked }))}
                                        onClick={e => e.stopPropagation()}
                                        className="shrink-0 mt-0.5"
                                    />
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
