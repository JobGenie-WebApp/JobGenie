"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun, Globe, Palette, Save, Loader2, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TIMEZONE_OPTIONS = (
    typeof Intl !== "undefined" && "supportedValuesOf" in Intl
        ? (Intl as { supportedValuesOf: (key: string) => string[] }).supportedValuesOf("timeZone")
        : []
).map((tz) => ({ value: tz, label: tz.replace(/_/g, " ") }));

const THEME_OPTIONS = [
    { value: "light", label: "Light", icon: Sun, description: "Clean white background" },
    { value: "dark", label: "Dark", icon: Moon, description: "Easy on the eyes at night" },
    { value: "system", label: "System", icon: Monitor, description: "Follows your OS setting" },
] as const;

export function PreferencesSettings() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [timezone, setTimezone] = useState("");
    const [savedTimezone, setSavedTimezone] = useState("");
    const [loadingTz, setLoadingTz] = useState(true);
    const [savingTz, setSavingTz] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        fetch("/api/user/timezone").then(r => r.json()).then(d => {
            if (d.success && d.timezone) { setTimezone(d.timezone); setSavedTimezone(d.timezone); }
        }).catch(() => {}).finally(() => setLoadingTz(false));
    }, []);

    const handleSaveTimezone = async () => {
        if (!timezone) { toast.error("Please select a timezone."); return; }
        setSavingTz(true);
        try {
            const res = await fetch("/api/user/timezone", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ timezone }) });
            const data = await res.json();
            if (data.success) { setSavedTimezone(timezone); toast.success("Timezone saved."); }
            else toast.error(data.error || "Failed to save timezone.");
        } catch { toast.error("Failed to save timezone."); }
        finally { setSavingTz(false); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Timezone ── */}
            <div className="rounded-2xl border bg-card p-6 space-y-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                        <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Timezone</h3>
                        <p className="text-xs text-muted-foreground">Used for interview times and calendar events</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Your Timezone</Label>
                        <Combobox
                            options={TIMEZONE_OPTIONS}
                            value={timezone}
                            onValueChange={setTimezone}
                            placeholder="Select timezone…"
                            searchPlaceholder="Search timezones…"
                            disabled={loadingTz}
                        />
                    </div>

                    {timezone && savedTimezone && (
                        <p className="text-xs text-muted-foreground">
                            Currently saved: <span className="font-medium text-foreground">{savedTimezone.replace(/_/g, " ")}</span>
                        </p>
                    )}

                    <Button size="sm" onClick={handleSaveTimezone}
                        disabled={savingTz || loadingTz || timezone === savedTimezone}
                        className="w-full sm:w-auto">
                        {savingTz
                            ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving…</>
                            : <><Save className="mr-2 h-3.5 w-3.5" />Save Timezone</>}
                    </Button>
                </div>
            </div>

            {/* ── Appearance ── */}
            <div className="rounded-2xl border bg-card p-6 space-y-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                        <Palette className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">Appearance</h3>
                        <p className="text-xs text-muted-foreground">Choose your preferred color theme</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                    {THEME_OPTIONS.map(({ value, label, icon: Icon, description }) => {
                        const isActive = mounted && theme === value;
                        return (
                            <button
                                key={value}
                                onClick={() => setTheme(value)}
                                disabled={!mounted}
                                className={cn(
                                    "relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all duration-150",
                                    isActive
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "border-border hover:border-muted-foreground/30 hover:bg-accent/40",
                                    !mounted && "opacity-50 cursor-default"
                                )}
                            >
                                {isActive && (
                                    <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                    </span>
                                )}
                                <div className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                                    isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                )}>
                                    <Icon className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                    <p className={cn("text-xs font-semibold", isActive ? "text-primary" : "text-foreground")}>{label}</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight hidden sm:block">{description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {mounted && (
                    <p className="text-xs text-muted-foreground">
                        Active: <span className="font-medium text-foreground capitalize">{theme}</span> mode
                    </p>
                )}
            </div>
        </div>
    );
}
