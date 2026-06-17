"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft, Loader2, Save, MapPin, Briefcase, Clock,
    DollarSign, Users, Building2, Eye, ChevronsUpDown, Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MdxEditor = dynamic(
    () => import("@/components/employer/MdxEditor").then((m) => m.MdxEditor),
    { ssr: false, loading: () => <div className="border rounded-md h-48 bg-muted animate-pulse" /> }
);

const MDXViewer = dynamic(
    () => import("@/components/employer/MdxViewer").then((m) => m.MdxViewer),
    { ssr: false, loading: () => <div className="h-24 bg-muted animate-pulse rounded" /> }
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface Industry { industry_id: number; industry_name: string; }
interface Designation { designation_id: number; designation_name: string; }

interface JobFormData {
    job_title: string;
    location: string;
    industry_id: string;
    industry_name: string;
    job_type: string;
    description: string;
    salary_min: string;
    salary_max: string;
    salary_currency: string;
    experience_level: string;
    positions_available: string;
    validity_type: "preset" | "custom";  // "preset" = 30/60/90 days, "custom" = date range
    validity_days: string;               // used when validity_type = "preset"
    custom_start_date: string;           // ISO date string, used when validity_type = "custom"
    custom_end_date: string;             // ISO date string, used when validity_type = "custom"
    advertisement_link: string;
}

const INITIAL: JobFormData = {
    job_title: "", location: "", industry_id: "", industry_name: "",
    job_type: "full_time", description: "", salary_min: "", salary_max: "",
    salary_currency: "LKR", experience_level: "", positions_available: "1",
    validity_type: "preset", validity_days: "30",
    custom_start_date: "", custom_end_date: "",
    advertisement_link: "",
};

interface Props { mode: "create" | "edit"; jobId?: string; }

const JOB_TYPES: Record<string, string> = {
    full_time: "Full Time", part_time: "Part Time", contract: "Contract",
    internship: "Internship", freelance: "Freelance",
};

// ── Salary formatter ───────────────────────────────────────────────────────────

function formatSalary(min: string, max: string, currency: string) {
    if (!min && !max) return null;
    const fmt = (v: string) => Number(v).toLocaleString();
    if (min && max) return `${currency} ${fmt(min)} – ${fmt(max)}`;
    if (min) return `${currency} ${fmt(min)}+`;
    return `Up to ${currency} ${fmt(max)}`;
}

// ── Live Preview ───────────────────────────────────────────────────────────────

function JobAdPreview({ form, companyName }: { form: JobFormData; companyName: string }) {
    const salary = formatSalary(form.salary_min, form.salary_max, form.salary_currency);
    const jobTypeLabel = JOB_TYPES[form.job_type] ?? form.job_type;
    const hasContent = form.job_title || form.location || form.industry_name || form.description;

    if (!hasContent) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground gap-3">
                <Eye className="h-10 w-10 opacity-20" />
                <p className="text-sm">Start filling in the form to see a live preview of how candidates will see your job ad.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-lg font-bold leading-tight">
                        {form.job_title || <span className="text-muted-foreground italic">Job title</span>}
                    </h2>
                    <p className="text-sm text-muted-foreground">{companyName}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{jobTypeLabel}</Badge>
                {form.experience_level && <Badge variant="outline">{form.experience_level}</Badge>}
                {form.industry_name && <Badge variant="outline">{form.industry_name}</Badge>}
            </div>

            <div className="space-y-1.5 text-sm text-muted-foreground">
                {form.location && (
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" /><span>{form.location}</span>
                    </div>
                )}
                {salary && (
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 shrink-0" /><span>{salary}</span>
                    </div>
                )}
                {form.positions_available && Number(form.positions_available) > 0 && (
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 shrink-0" />
                        <span>{form.positions_available} position{Number(form.positions_available) !== 1 ? "s" : ""} available</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0" />
                    {form.validity_type === "custom" && form.custom_start_date && form.custom_end_date ? (
                        <span>{new Date(form.custom_start_date).toLocaleDateString()} – {new Date(form.custom_end_date).toLocaleDateString()}</span>
                    ) : (
                        <span>Active for {form.validity_days} days after publishing</span>
                    )}
                </div>
            </div>

            {form.description && (
                <>
                    <Separator />
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Job Description</p>
                        <MDXViewer markdown={form.description} />
                    </div>
                </>
            )}

            <Separator />
            <Button className="w-full" disabled>
                <Briefcase className="h-4 w-4 mr-2" /> Apply Now
            </Button>
        </div>
    );
}

// ── Searchable designation combobox ───────────────────────────────────────────

function DesignationCombobox({
    value, onChange, industryId, disabled,
}: {
    value: string;
    onChange: (v: string) => void;
    industryId: string;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [designations, setDesignations] = useState<Designation[]>([]);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!industryId) { setDesignations([]); return; }
        setLoading(true);
        fetch(`/api/job-designations?industryId=${industryId}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.success && Array.isArray(d.data)) {
                    const seen = new Set<string>();
                    const unique = d.data.filter((des: Designation) => {
                        const key = des.designation_name.toLowerCase();
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    });
                    setDesignations(unique);
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [industryId]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    const filtered = search
        ? designations.filter((d) => d.designation_name.toLowerCase().includes(search.toLowerCase()))
        : designations;

    const isDisabled = disabled || !industryId;

    function handleSelect(name: string) {
        onChange(name);
        setOpen(false);
        setSearch("");
    }

    return (
        <div ref={wrapperRef} className="relative">
            {/* Trigger button */}
            <button
                type="button"
                disabled={isDisabled}
                onClick={() => {
                    if (isDisabled) return;
                    setOpen((o) => !o);
                    setTimeout(() => inputRef.current?.focus(), 10);
                }}
                className={cn(
                    "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    !value && "text-muted-foreground"
                )}
            >
                <span className="truncate">
                    {value || (industryId ? "Search job title..." : "Choose industry first")}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </button>

            {/* Dropdown — plain absolute div, no portal */}
            {open && (
                <div className="absolute left-0 top-full z-[9999] mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
                    {/* Search input */}
                    <div className="flex items-center border-b px-3">
                        <svg className="mr-2 h-4 w-4 shrink-0 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search job title..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex h-9 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                        />
                    </div>

                    {/* List */}
                    <div className="max-h-56 overflow-y-auto p-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-2 px-2 text-sm text-muted-foreground">
                                {search ? (
                                    <button
                                        type="button"
                                        className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                        onMouseDown={(e) => { e.preventDefault(); handleSelect(search); }}
                                    >
                                        Use &ldquo;{search}&rdquo; as job title
                                    </button>
                                ) : "No designations found."}
                            </div>
                        ) : (
                            filtered.map((d) => (
                                <button
                                    key={d.designation_id}
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); handleSelect(d.designation_name); }}
                                    className={cn(
                                        "flex w-full items-center rounded px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                                        value === d.designation_name && "bg-accent font-medium"
                                    )}
                                >
                                    <Check className={cn("mr-2 h-4 w-4 shrink-0", value === d.designation_name ? "opacity-100" : "opacity-0")} />
                                    {d.designation_name}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function JobFormClient({ mode, jobId }: Props) {
    const router = useRouter();
    const [form, setForm] = useState<JobFormData>(INITIAL);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(mode === "edit");
    const [companyName, setCompanyName] = useState("Your Company");
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [hasDraft, setHasDraft] = useState(false);
    const storageKey = mode === "create" ? "job_form_draft_new" : `job_form_draft_${jobId}`;
    const isInitialLoad = useRef(true);


    // Fetch company name + industries in parallel
    useEffect(() => {
        fetch("/api/employer/company")
            .then((r) => r.json())
            .then((d) => { if (d?.data?.company_name) setCompanyName(d.data.company_name); })
            .catch(() => {});

        fetch("/api/industries")
            .then((r) => r.json())
            .then((d) => { if (d.success && Array.isArray(d.data)) setIndustries(d.data); })
            .catch(() => {});
    }, []);

    // Restore draft (create mode)
    useEffect(() => {
        if (mode === "create") {
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    setForm(JSON.parse(saved) as JobFormData);
                    setHasDraft(true);
                    toast.info("Draft restored from your last session.", { duration: 4000 });
                }
            } catch { /* ignore */ }
            isInitialLoad.current = false;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load existing job (edit mode) + check for local draft
    useEffect(() => {
        if (mode === "edit" && jobId) {
            fetch(`/api/employer/jobs/${jobId}`)
                .then((r) => r.json())
                .then(({ job }) => {
                    if (!job) return;
                    const loaded: JobFormData = {
                        job_title: job.job_title ?? "",
                        location: job.location ?? "",
                        industry_id: job.industry_id?.toString() ?? "",
                        industry_name: job.industry_name ?? job.industry ?? "",
                        job_type: job.job_type ?? "full_time",
                        description: job.description ?? "",
                        salary_min: job.salary_min?.toString() ?? "",
                        salary_max: job.salary_max?.toString() ?? "",
                        salary_currency: job.salary_currency ?? "LKR",
                        experience_level: job.experience_level ?? "",
                        positions_available: job.positions_available?.toString() ?? "1",
                        validity_type: job.custom_start_date ? "custom" : "preset",
                        validity_days: job.validity_days?.toString() ?? "30",
                        custom_start_date: job.custom_start_date ? job.custom_start_date.slice(0, 10) : "",
                        custom_end_date: job.custom_end_date ? job.custom_end_date.slice(0, 10) : "",
                        advertisement_link: job.advertisement_link ?? "",
                    };
                    try {
                        const saved = localStorage.getItem(storageKey);
                        if (saved) {
                            setForm(JSON.parse(saved) as JobFormData);
                            setHasDraft(true);
                            toast.info("Unsaved draft restored. Save to keep changes.", { duration: 5000 });
                        } else {
                            setForm(loaded);
                        }
                    } catch { setForm(loaded); }
                    isInitialLoad.current = false;
                })
                .finally(() => setLoading(false));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, jobId]);

    // Auto-save to localStorage
    useEffect(() => {
        if (isInitialLoad.current) return;
        try { localStorage.setItem(storageKey, JSON.stringify(form)); } catch { /* ignore */ }
    }, [form, storageKey]);

    const set = useCallback(<K extends keyof JobFormData>(field: K, value: JobFormData[K]) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    }, []);

    function clearDraft() {
        try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
        setForm(INITIAL);
        setHasDraft(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.job_title.trim()) { toast.error("Job title is required"); return; }
        if (!form.industry_id) { toast.error("Please select an industry"); return; }
        if (form.validity_type === "custom") {
            if (!form.custom_start_date || !form.custom_end_date) { toast.error("Please select both start and end dates"); return; }
            const days = Math.round((new Date(form.custom_end_date).getTime() - new Date(form.custom_start_date).getTime()) / (1000 * 60 * 60 * 24));
            if (days <= 0) { toast.error("End date must be after start date"); return; }
        }

        setSubmitting(true);
        try {
            // Compute validity_days from date range if custom mode
            let computedValidityDays = parseInt(form.validity_days) || 30;
            let customStartDate: string | null = null;
            let customEndDate: string | null = null;
            if (form.validity_type === "custom" && form.custom_start_date && form.custom_end_date) {
                const start = new Date(form.custom_start_date);
                const end = new Date(form.custom_end_date);
                computedValidityDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                customStartDate = form.custom_start_date;
                customEndDate = form.custom_end_date;
            }

            const payload = {
                job_title: form.job_title,
                location: form.location || null,
                industry: form.industry_name || null,
                job_type: form.job_type,
                description: form.description || null,
                salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
                salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
                salary_currency: form.salary_currency,
                experience_level: form.experience_level || null,
                positions_available: parseInt(form.positions_available) || 1,
                validity_days: computedValidityDays,
                custom_start_date: customStartDate,
                custom_end_date: customEndDate,
                advertisement_link: form.advertisement_link || null,
            };

            const url = mode === "create" ? "/api/employer/jobs" : `/api/employer/jobs/${jobId}`;
            const method = mode === "create" ? "POST" : "PATCH";
            const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const data = await res.json();

            if (!res.ok) { toast.error(data.error || "Failed to save job"); return; }

            try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
            toast.success(mode === "create" ? "Job created as draft" : "Job updated");
            if (mode === "create" && data.job_id) router.push(`/employer/jobs/${data.job_id}`);
            else router.push(`/employer/jobs/${jobId}`);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
        </div>
    );

    // The EmployerLayout renders with fullHeight prop which gives us:
    //   <div class="flex-1 min-h-0 overflow-hidden">   ← exact height of viewport minus header
    // We fill it with a flex column: top bar (fixed) + columns row (fills rest).
    // Each column has its own overflow-y-auto — completely independent scrolling.
    // The MDX editor lives in the left column and grows naturally with content.
    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

            {/* ── Top bar — fixed height ── */}
            <div style={{ flexShrink: 0 }} className="flex items-center gap-3 px-5 md:px-6 h-14 border-b bg-background">
                <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <h1 className="text-xl font-bold">{mode === "create" ? "Post New Job" : "Edit Job"}</h1>
                {hasDraft && (
                    <span className="ml-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Draft restored
                        <button type="button" className="underline hover:no-underline" onClick={clearDraft}>Clear</button>
                    </span>
                )}
            </div>

            {/* ── Two columns — each scrolls independently ── */}
            <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

                {/* LEFT: Form — scrolls independently */}
                <div style={{ flex: 2, overflowY: "auto", minWidth: 0, borderRight: "1px solid var(--border)" }}>
                    <form onSubmit={handleSubmit} className="space-y-5 p-5 md:p-6">

                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
                            <CardContent className="space-y-4">

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label>Industry <span className="text-destructive">*</span></Label>
                                        <Select
                                            value={form.industry_id || ""}
                                            onValueChange={(v) => {
                                                const ind = industries.find((i) => String(i.industry_id) === v);
                                                set("industry_id", v);
                                                set("industry_name", ind?.industry_name ?? "");
                                                set("job_title", "");
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={industries.length === 0 ? "Loading..." : "Choose industry"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {industries.map((ind) => (
                                                    <SelectItem key={ind.industry_id} value={String(ind.industry_id)}>
                                                        {ind.industry_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Job Title <span className="text-destructive">*</span></Label>
                                        <DesignationCombobox
                                            value={form.job_title}
                                            onChange={(v) => set("job_title", v)}
                                            industryId={form.industry_id}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="location">Location</Label>
                                        <Input id="location" value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Colombo, Sri Lanka" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Job Type</Label>
                                        <Select value={form.job_type} onValueChange={(v) => set("job_type", v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(JOB_TYPES).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label>Experience Level</Label>
                                        <Select value={form.experience_level || "__none__"} onValueChange={(v) => set("experience_level", v === "__none__" ? "" : v)}>
                                            <SelectTrigger><SelectValue placeholder="Not specified" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">Not specified</SelectItem>
                                                {["Entry Level", "Junior", "Mid Level", "Senior", "Lead", "Executive"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="positions_available">Number of Positions</Label>
                                        <Input id="positions_available" type="number" min="1" value={form.positions_available} onChange={(e) => set("positions_available", e.target.value)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Salary & Compensation</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <Label>Currency</Label>
                                        <Select value={form.salary_currency} onValueChange={(v) => set("salary_currency", v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {["LKR", "USD", "EUR", "GBP"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="salary_min">Min Salary</Label>
                                        <Input id="salary_min" type="number" min="0" step="1000" value={form.salary_min} onChange={(e) => set("salary_min", e.target.value)} placeholder="e.g. 100000" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="salary_max">Max Salary</Label>
                                        <Input id="salary_max" type="number" min="0" step="1000" value={form.salary_max} onChange={(e) => set("salary_max", e.target.value)} placeholder="e.g. 200000" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Job Description</CardTitle></CardHeader>
                            <CardContent className="space-y-1.5">
                                <Label>Description <span className="text-muted-foreground font-normal">(Markdown supported)</span></Label>
                                <MdxEditor
                                    value={form.description}
                                    onChange={(v) => set("description", v)}
                                    placeholder="Describe the role, responsibilities, requirements, benefits..."
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Advertisement Settings</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label>Ad Validity Period <span className="text-destructive">*</span></Label>
                                        <Select
                                            value={form.validity_type === "custom" ? "custom" : form.validity_days}
                                            onValueChange={(v) => {
                                                if (v === "custom") {
                                                    set("validity_type", "custom");
                                                } else {
                                                    set("validity_type", "preset");
                                                    set("validity_days", v);
                                                    set("custom_start_date", "");
                                                    set("custom_end_date", "");
                                                }
                                            }}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="30">30 days</SelectItem>
                                                <SelectItem value="60">60 days</SelectItem>
                                                <SelectItem value="90">90 days</SelectItem>
                                                <SelectItem value="custom">Custom date range</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {form.validity_type === "custom" ? (
                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Start Date</Label>
                                                    <Input
                                                        type="date"
                                                        value={form.custom_start_date}
                                                        min={new Date().toISOString().slice(0, 10)}
                                                        onChange={(e) => set("custom_start_date", e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">End Date</Label>
                                                    <Input
                                                        type="date"
                                                        value={form.custom_end_date}
                                                        min={form.custom_start_date || new Date().toISOString().slice(0, 10)}
                                                        onChange={(e) => set("custom_end_date", e.target.value)}
                                                    />
                                                </div>
                                                {form.custom_start_date && form.custom_end_date && (() => {
                                                    const days = Math.round((new Date(form.custom_end_date).getTime() - new Date(form.custom_start_date).getTime()) / (1000 * 60 * 60 * 24));
                                                    return days > 0 ? (
                                                        <p className="col-span-2 text-xs text-muted-foreground">
                                                            Duration: <span className="font-medium text-foreground">{days} days</span>
                                                        </p>
                                                    ) : days <= 0 ? (
                                                        <p className="col-span-2 text-xs text-destructive">End date must be after start date</p>
                                                    ) : null;
                                                })()}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">Ad stays live for this duration after payment is confirmed.</p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="advertisement_link">External Link <span className="text-muted-foreground font-normal">(optional)</span></Label>
                                        <Input id="advertisement_link" value={form.advertisement_link} onChange={(e) => set("advertisement_link", e.target.value)} placeholder="https://..." />
                                        <p className="text-xs text-muted-foreground">Link to apply on your own careers page.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-3 pb-8">
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                {mode === "create" ? "Save as Draft" : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* RIGHT: Preview — scrolls independently */}
                <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }} className="hidden lg:block bg-muted/30">
                    <div className="p-5 space-y-3">
                        <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Candidate Preview</span>
                        </div>
                        <Card className="border-dashed">
                            <CardContent className="p-5">
                                <JobAdPreview form={form} companyName={companyName} />
                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>
        </div>
    );
}
