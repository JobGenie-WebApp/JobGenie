"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const PRESETS_HOURS = [24, 6, 1];

function minutesToHoursLabel(m: number): string {
    if (m % 60 !== 0) return String(m / 60);
    return String(m / 60);
}

export function InterviewRemindersSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [forbidden, setForbidden] = useState(false);
    const [enabled, setEnabled] = useState(false);
    /** Editable rows: hours as decimal string (e.g. "6" or "0.5" for 30 min — we also allow integer minutes via separate flow) */
    const [offsetHours, setOffsetHours] = useState<string[]>(["24", "6"]);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/mis/settings/interview-reminders");
            if (res.status === 403) {
                setForbidden(true);
                return;
            }
            const data = await res.json();
            if (!data.success) {
                toast.error(data.error || "Failed to load reminder settings");
                return;
            }
            const mins: number[] = data.settings?.offsets_minutes ?? [];
            setEnabled(Boolean(data.settings?.enabled));
            if (mins.length === 0) {
                setOffsetHours(["24", "6"]);
            } else {
                setOffsetHours(mins.map((m) => minutesToHoursLabel(m)));
            }
        } catch {
            toast.error("Failed to load reminder settings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const parseOffsetsMinutes = (): number[] | null => {
        const out: number[] = [];
        for (const row of offsetHours) {
            const t = row.trim();
            if (!t) continue;
            const n = parseFloat(t);
            if (Number.isNaN(n) || n <= 0) return null;
            const minutes = Math.round(n * 60);
            if (minutes < 15 || minutes > 10080) return null;
            out.push(minutes);
        }
        return Array.from(new Set(out)).sort((a, b) => a - b);
    };

    const save = async () => {
        const offsets = parseOffsetsMinutes();
        if (!offsets) {
            toast.error("Each reminder must be a positive number of hours (minimum 0.25 for 15 minutes, maximum 168 for 7 days).");
            return;
        }
        if (offsets.length > 8) {
            toast.error("At most 8 reminder rounds.");
            return;
        }
        if (enabled && offsets.length === 0) {
            toast.error("Add at least one reminder time, or turn reminders off.");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/mis/settings/interview-reminders", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled, offsets_minutes: offsets }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                toast.error(data.error || "Save failed");
                return;
            }
            toast.success("Interview reminder settings saved");
            setEnabled(Boolean(data.settings?.enabled));
            const mins: number[] = data.settings?.offsets_minutes ?? [];
            setOffsetHours(mins.map((m) => minutesToHoursLabel(m)));
        } catch {
            toast.error("Save failed");
        } finally {
            setSaving(false);
        }
    };

    if (forbidden) {
        return (
            <p className="text-sm text-muted-foreground">
                You do not have permission to configure interview reminders. Ask a super admin to grant{" "}
                <code className="text-xs">interviews.configure_reminders</code> on your role.
            </p>
        );
    }

    if (loading) {
        return <p className="text-sm text-muted-foreground">Loading…</p>;
    }

    return (
        <div className="space-y-6 max-w-xl">
            <p className="text-sm text-muted-foreground">
                Reminder emails go to the candidate only. Each time is measured backward from the scheduled interview
                start (using the candidate&apos;s profile timezone). For example, an interview at 10:00 with a 6-hour
                reminder sends at 04:00 that day in that timezone.
            </p>

            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <Label htmlFor="reminders-enabled" className="text-base">
                        Enable reminders
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                        Requires a scheduled job calling <code className="text-xs">/api/cron/interview-reminders</code>
                    </p>
                </div>
                <Switch id="reminders-enabled" checked={enabled} onCheckedChange={setEnabled} />
            </div>

            <div className="space-y-3">
                <Label>Reminder rounds (hours before start)</Label>
                {offsetHours.map((val, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                        <Input
                            type="text"
                            inputMode="decimal"
                            className="max-w-[140px]"
                            value={val}
                            onChange={(e) => {
                                const next = [...offsetHours];
                                next[idx] = e.target.value;
                                setOffsetHours(next);
                            }}
                            placeholder="e.g. 24"
                        />
                        <span className="text-sm text-muted-foreground">hours before</span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => setOffsetHours(offsetHours.filter((_, i) => i !== idx))}
                            aria-label="Remove row"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setOffsetHours([...offsetHours, "1"])}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Add round
                    </Button>
                    {PRESETS_HOURS.map((h) => (
                        <Button
                            key={h}
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                const label = String(h);
                                if (offsetHours.includes(label)) return;
                                setOffsetHours([...offsetHours, label]);
                            }}
                        >
                            + {h}h
                        </Button>
                    ))}
                </div>
            </div>

            <Button onClick={save} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving…" : "Save"}
            </Button>
        </div>
    );
}
