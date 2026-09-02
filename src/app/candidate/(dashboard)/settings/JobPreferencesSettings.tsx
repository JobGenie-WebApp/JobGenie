"use client";

import { useEffect, useMemo, useState } from "react";
import {
    CheckCircle2, CircleDot, MinusCircle, Briefcase, Clock,
    DollarSign, Tag, X, Save, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Combobox } from "@/components/ui/combobox";
import { currencySelectOptions, DEFAULT_CURRENCY } from "@/lib/currencies";

type AvailabilityStatus = "available" | "open_to_opportunities" | "not_looking";
type EmploymentType = "full_time" | "part_time" | "contract" | "internship" | "freelance" | "volunteer";

interface JobPrefs {
    availability_status: AvailabilityStatus | null;
    employment_type: EmploymentType | null;
    notice_period: string | null;
    expected_monthly_salary: number | null;
    expected_salary_currency: string;
    expected_positions: string[];
}

const AVAILABILITY_OPTIONS = [
    { value: "available" as const, label: "Available", description: "Actively looking for new opportunities", icon: CheckCircle2, iconColor: "text-green-600 dark:text-green-400", activeBg: "bg-green-500/10 dark:bg-green-500/10", activeBorder: "border-green-500/50", activeText: "text-green-700 dark:text-green-400" },
    { value: "open_to_opportunities" as const, label: "Open to Offers", description: "Not searching but open to the right role", icon: CircleDot, iconColor: "text-amber-600 dark:text-amber-400", activeBg: "bg-amber-500/10", activeBorder: "border-amber-500/50", activeText: "text-amber-700 dark:text-amber-400" },
    { value: "not_looking" as const, label: "Not Looking", description: "Not interested in new positions right now", icon: MinusCircle, iconColor: "text-muted-foreground", activeBg: "bg-muted/70", activeBorder: "border-border", activeText: "text-foreground" },
];

const EMPLOYMENT_OPTIONS: { value: EmploymentType; label: string }[] = [
    { value: "full_time", label: "Full-time" }, { value: "part_time", label: "Part-time" },
    { value: "contract", label: "Contract" }, { value: "internship", label: "Internship" },
    { value: "freelance", label: "Freelance" }, { value: "volunteer", label: "Volunteer" },
];

const NOTICE_PERIODS = [
    { value: "immediate", label: "Immediate" }, { value: "2 weeks", label: "2 Weeks" },
    { value: "1 month", label: "1 Month" }, { value: "2 months", label: "2 Months" },
    { value: "3 months", label: "3 Months" }, { value: "negotiable", label: "Negotiable" },
];

/** Sentinel for the Select only - what gets stored is "<n> days". */
const CUSTOM_NOTICE = "__custom__";
const customNoticeDays = (value: string | null) => value?.match(/^(\d+) days$/)?.[1] ?? "";

const DEFAULT: JobPrefs = { availability_status: null, employment_type: null, notice_period: null, expected_monthly_salary: null, expected_salary_currency: DEFAULT_CURRENCY, expected_positions: [] };

function deepEqual(a: JobPrefs, b: JobPrefs) { return JSON.stringify(a) === JSON.stringify(b); }

export function JobPreferencesSettings() {
    const [prefs, setPrefs] = useState<JobPrefs>(DEFAULT);
    const [savedPrefs, setSavedPrefs] = useState<JobPrefs>(DEFAULT);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [posInput, setPosInput] = useState("");
    const [customNotice, setCustomNotice] = useState(false);
    const currencies = useMemo(currencySelectOptions, []);

    useEffect(() => {
        fetch("/api/candidate/job-preferences").then(r => r.json()).then(d => {
            if (d.success && d.data) {
                const p: JobPrefs = { availability_status: d.data.availability_status ?? null, employment_type: d.data.employment_type ?? null, notice_period: d.data.notice_period ?? null, expected_monthly_salary: d.data.expected_monthly_salary ? Number(d.data.expected_monthly_salary) : null, expected_salary_currency: d.data.expected_salary_currency ?? DEFAULT_CURRENCY, expected_positions: d.data.expected_positions ?? [] };
                setPrefs(p); setSavedPrefs(p); setCustomNotice(Boolean(customNoticeDays(p.notice_period)));
            }
        }).catch(() => toast.error("Failed to load job preferences.")).finally(() => setLoading(false));
    }, []);

    const addPosition = () => {
        const t = posInput.trim();
        if (!t) return;
        if (prefs.expected_positions.length >= 3) { toast.error("Maximum 3 positions."); return; }
        if (prefs.expected_positions.includes(t)) { toast.error("Already added."); return; }
        setPrefs(p => ({ ...p, expected_positions: [...p.expected_positions, t] }));
        setPosInput("");
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/candidate/job-preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(prefs) });
            const data = await res.json();
            if (data.success) {
                const u: JobPrefs = { availability_status: data.data.availability_status ?? null, employment_type: data.data.employment_type ?? null, notice_period: data.data.notice_period ?? null, expected_monthly_salary: data.data.expected_monthly_salary ? Number(data.data.expected_monthly_salary) : null, expected_salary_currency: data.data.expected_salary_currency ?? DEFAULT_CURRENCY, expected_positions: data.data.expected_positions ?? [] };
                setSavedPrefs(u); setPrefs(u); toast.success("Job preferences saved.");
            } else toast.error(data.error || "Failed to save.");
        } catch { toast.error("Failed to save."); }
        finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-muted" />)}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted" />)}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* ── Availability Status ── */}
            <div className="rounded-2xl border bg-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Availability Status</h3>
                    <span className="text-xs text-muted-foreground ml-auto">How visible are you to employers?</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {AVAILABILITY_OPTIONS.map(({ value, label, description, icon: Icon, iconColor, activeBg, activeBorder, activeText }) => {
                        const isActive = prefs.availability_status === value;
                        return (
                            <button key={value} type="button" onClick={() => setPrefs(p => ({ ...p, availability_status: value }))}
                                className={cn("flex flex-col items-start gap-2.5 rounded-xl border-2 p-4 text-left transition-all duration-150",
                                    isActive ? cn(activeBg, activeBorder) : "border-border hover:bg-accent/40 hover:border-border")}>
                                <Icon className={cn("h-5 w-5", isActive ? iconColor : "text-muted-foreground")} />
                                <div>
                                    <p className={cn("text-sm font-semibold", isActive ? activeText : "text-foreground")}>{label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Employment & Notice ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Employment type */}
                <div className="rounded-2xl border bg-card p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">Preferred Employment Type</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {EMPLOYMENT_OPTIONS.map(({ value, label }) => {
                            const isActive = prefs.employment_type === value;
                            return (
                                <button key={value} type="button"
                                    onClick={() => setPrefs(p => ({ ...p, employment_type: isActive ? null : value }))}
                                    className={cn("rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-150",
                                        isActive ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background hover:bg-accent hover:border-muted-foreground/30")}>
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Notice period */}
                <div className="rounded-2xl border bg-card p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">Notice Period</h3>
                    </div>
                    <Select
                        value={customNotice ? CUSTOM_NOTICE : (prefs.notice_period ?? "")}
                        onValueChange={v => {
                            setCustomNotice(v === CUSTOM_NOTICE);
                            setPrefs(p => ({ ...p, notice_period: v === CUSTOM_NOTICE ? null : (v || null) }));
                        }}
                    >
                        <SelectTrigger><SelectValue placeholder="Select notice period…" /></SelectTrigger>
                        <SelectContent>
                            {NOTICE_PERIODS.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                            <SelectItem value={CUSTOM_NOTICE}>Custom (days)</SelectItem>
                        </SelectContent>
                    </Select>
                    {customNotice && (
                        <div className="flex items-center gap-2">
                            <Input type="number" min={1} max={365} placeholder="e.g. 45" className="w-32"
                                value={customNoticeDays(prefs.notice_period)}
                                onChange={e => {
                                    const days = e.target.value.replace(/\D/g, "").slice(0, 3);
                                    setPrefs(p => ({ ...p, notice_period: days ? `${days} days` : null }));
                                }} />
                            <span className="text-sm text-muted-foreground">days</span>
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground">How soon can you start after accepting an offer?</p>
                </div>
            </div>

            {/* ── Salary & Positions ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Expected salary */}
                <div className="rounded-2xl border bg-card p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">Expected Monthly Salary</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <Combobox
                            options={currencies}
                            value={prefs.expected_salary_currency}
                            onValueChange={v => setPrefs(p => ({ ...p, expected_salary_currency: v }))}
                            placeholder="Currency"
                            searchPlaceholder="Search currencies…"
                            emptyMessage="No currency found."
                            className="h-10 w-32 shrink-0 px-3"
                        />
                        <MoneyInput
                            placeholder="e.g. 150,000"
                            value={prefs.expected_monthly_salary ?? ""}
                            onChange={v => setPrefs(p => ({ ...p, expected_monthly_salary: v ? Number(v) : null }))}
                            className="flex-1"
                        />
                        {prefs.expected_monthly_salary !== null && (
                            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0"
                                onClick={() => setPrefs(p => ({ ...p, expected_monthly_salary: null }))}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">Leave empty to keep your expectations private</p>
                </div>

                {/* Expected positions */}
                <div className="rounded-2xl border bg-card p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">Expected Positions</h3>
                        <span className={cn("ml-auto text-xs font-medium tabular-nums", prefs.expected_positions.length >= 3 ? "text-amber-500" : "text-muted-foreground")}>
                            {prefs.expected_positions.length}/3
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Input placeholder="e.g. Senior Software Engineer" value={posInput}
                            onChange={e => setPosInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPosition(); } }}
                            disabled={prefs.expected_positions.length >= 3} maxLength={100}
                            className="flex-1" />
                        <Button type="button" variant="outline" size="sm" onClick={addPosition}
                            disabled={prefs.expected_positions.length >= 3 || !posInput.trim()}>
                            Add
                        </Button>
                    </div>
                    {prefs.expected_positions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {prefs.expected_positions.map(pos => (
                                <Badge key={pos} variant="secondary" className="gap-1.5 pl-2.5 pr-1.5 py-1 text-xs">
                                    {pos}
                                    <button type="button" onClick={() => setPrefs(p => ({ ...p, expected_positions: p.expected_positions.filter(x => x !== pos) }))}
                                        className="rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors" aria-label={`Remove ${pos}`}>
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">Add up to 3 roles you&apos;re targeting</p>
                    )}
                </div>
            </div>

            {/* ── Save bar ── */}
            <div className="flex items-center justify-between rounded-2xl border bg-card px-5 py-4">
                <p className="text-sm text-muted-foreground">
                    {deepEqual(prefs, savedPrefs) ? "All changes saved" : "You have unsaved changes"}
                </p>
                <Button size="sm" onClick={handleSave} disabled={saving || deepEqual(prefs, savedPrefs)}>
                    {saving ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving…</> : <><Save className="mr-2 h-3.5 w-3.5" />Save Preferences</>}
                </Button>
            </div>
        </div>
    );
}
