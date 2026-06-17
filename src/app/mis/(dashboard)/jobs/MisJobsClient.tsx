"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    MapPin, Users, Clock, Loader2, Search, Building2,
    DollarSign, Calendar, ChevronRight, FileText, Briefcase,
    CheckCircle2, XCircle, Eye, AlertCircle, UserCheck,
    Pause, Play, Zap, Trash2, RotateCcw, Pencil, ChevronDown, X,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MDXViewer = dynamic(
    () => import("@/components/employer/MdxViewer").then((m) => m.MdxViewer),
    { ssr: false, loading: () => <div className="h-24 bg-muted animate-pulse rounded" /> }
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface EmployerOption {
    id: string;
    first_name: string;
    last_name: string;
    company_name: string;
}

interface JobListItem {
    id: string;
    job_title: string;
    location: string | null;
    industry: string | null;
    job_type: string;
    status: string;
    expires_at: string | null;
    published_at: string | null;
    created_at: string;
    is_deleted: boolean;
    company: { id: string; company_name: string; logo_url: string | null };
    employer: { first_name: string; last_name: string };
    job_applications: { count: number }[];
    payment_requests: { status: string; payment_types: { code: string } }[];
}

interface JobDetail {
    id: string;
    job_title: string;
    location: string | null;
    industry: string | null;
    job_type: string;
    status: string;
    description: string | null;
    deadline: string | null;
    expires_at: string | null;
    validity_days: number;
    published_at: string | null;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string | null;
    experience_level: string | null;
    positions_available: number | null;
    is_deleted: boolean;
    deleted_at: string | null;
    created_at: string;
    advertisement_link: string | null;
    company: { company_name: string; logo_url: string | null };
    employer: { first_name: string; last_name: string; email: string };
    job_applications: Application[];
    payment_requests: PaymentRequest[];
}

interface Application {
    id: string;
    status: string;
    applied_at: string;
    notes: string | null;
    candidate: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        profile_image_url: string | null;
        current_position: string | null;
        years_of_experience: number | null;
    };
}

interface PaymentRequest {
    id: string;
    status: string;
    amount: number;
    currency: string;
    created_at: string;
    payment_types: { code: string; label: string };
    payment_proofs: {
        status: string;
        uploaded_at: string;
        reviewed_at: string | null;
        review_notes: string | null;
        file_url: string | null;
        file_name: string | null;
    }[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    draft:     { label: "Draft",     color: "bg-muted text-muted-foreground",     dot: "bg-muted-foreground" },
    published: { label: "Published", color: "bg-primary/10 text-primary",         dot: "bg-primary" },
    paused:    { label: "Paused",    color: "bg-amber-500/10 text-amber-600",     dot: "bg-amber-500" },
    expired:   { label: "Expired",   color: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
    deleted:   { label: "Deleted",   color: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
};

const APP_STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    pending:     { label: "Pending",     icon: <Clock className="h-3.5 w-3.5" />,        color: "text-muted-foreground" },
    reviewed:    { label: "Reviewed",    icon: <Eye className="h-3.5 w-3.5" />,          color: "text-blue-500" },
    shortlisted: { label: "Shortlisted", icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-primary" },
    rejected:    { label: "Rejected",    icon: <XCircle className="h-3.5 w-3.5" />,      color: "text-destructive" },
    hired:       { label: "Hired",       icon: <UserCheck className="h-3.5 w-3.5" />,    color: "text-emerald-600" },
    withdrawn:   { label: "Withdrawn",   icon: <AlertCircle className="h-3.5 w-3.5" />,  color: "text-muted-foreground" },
};

const JOB_TYPE_LABELS: Record<string, string> = {
    full_time: "Full Time", part_time: "Part Time", contract: "Contract",
    internship: "Internship", freelance: "Freelance",
};

const STATUS_OPTIONS = [
    { value: "__all__", label: "All Statuses" },
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
    { value: "paused", label: "Paused" },
    { value: "expired", label: "Expired" },
    { value: "deleted", label: "Deleted" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d: string | null, opts?: Intl.DateTimeFormatOptions) {
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-GB", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

function salaryLabel(min: number | null, max: number | null, currency: string | null) {
    const c = currency ?? "LKR";
    const f = (v: number) => v.toLocaleString();
    if (min && max) return `${c} ${f(min)} – ${f(max)}`;
    if (min) return `${c} ${f(min)}+`;
    if (max) return `Up to ${c} ${f(max)}`;
    return null;
}

function getCompany(job: JobListItem | JobDetail) {
    return Array.isArray(job.company) ? job.company[0] : job.company;
}

function getEmployer(job: JobListItem | JobDetail) {
    return Array.isArray(job.employer) ? job.employer[0] : job.employer;
}

// ── Left panel: Job card ───────────────────────────────────────────────────────

function JobCard({ job, selected, onClick }: { job: JobListItem; selected: boolean; onClick: () => void }) {
    const appCount = job.job_applications?.[0]?.count ?? 0;
    const cfg = STATUS_CONFIG[job.is_deleted ? "deleted" : job.status] ?? STATUS_CONFIG.draft;
    const company = getCompany(job);

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left px-4 py-3.5 border-b border-border transition-colors group",
                selected
                    ? "bg-primary/8 border-l-2 border-l-primary"
                    : "hover:bg-muted/50 border-l-2 border-l-transparent"
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate leading-tight">{job.job_title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {company?.company_name ?? (job.industry ?? JOB_TYPE_LABELS[job.job_type] ?? job.job_type)}
                    </p>
                </div>
                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-1", cfg.color)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                    {cfg.label}
                </span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                {job.location && (
                    <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />{job.location}
                    </span>
                )}
                <span className="flex items-center gap-1 shrink-0">
                    <Users className="h-3 w-3" />{appCount}
                </span>
                <span className="shrink-0 ml-auto">{fmt(job.created_at, { day: "numeric", month: "short" })}</span>
            </div>
        </button>
    );
}

// ── Middle panel: Job detail ───────────────────────────────────────────────────

function JobDetailPanel({
    job, onStatusAction, actionLoading, onRefresh,
}: {
    job: JobDetail;
    onStatusAction: (action: string, validity_days?: number) => void;
    actionLoading: string | null;
    onRefresh: () => void;
}) {
    const router = useRouter();
    const salary = salaryLabel(job.salary_min, job.salary_max, job.salary_currency);
    const cfg = STATUS_CONFIG[job.is_deleted ? "deleted" : job.status] ?? STATUS_CONFIG.draft;
    const isL = (k: string) => actionLoading === k;
    const company = getCompany(job);
    const employer = getEmployer(job) as { first_name: string; last_name: string; email: string };
    const [publishDays, setPublishDays] = useState("30");

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border shrink-0">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                            {company?.logo_url
                                ? <img src={company.logo_url} alt="" className="h-10 w-10 object-cover" />
                                : <Building2 className="h-5 w-5 text-muted-foreground" />
                            }
                        </div>
                        <div className="min-w-0">
                            <h2 className="font-bold text-base leading-tight truncate">{job.job_title}</h2>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <Badge variant="secondary">{JOB_TYPE_LABELS[job.job_type] ?? job.job_type}</Badge>
                                {job.experience_level && <Badge variant="outline">{job.experience_level}</Badge>}
                                {job.industry && <Badge variant="outline">{job.industry}</Badge>}
                                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1", cfg.color)}>
                                    <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                                    {cfg.label}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {company?.company_name} · {employer?.first_name} {employer?.last_name}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/mis/jobs/${job.id}/edit`)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                        {job.status === "draft" && !job.is_deleted && (
                            <div className="flex items-center gap-1.5">
                                <Select value={publishDays} onValueChange={setPublishDays}>
                                    <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="30">30 days</SelectItem>
                                        <SelectItem value="60">60 days</SelectItem>
                                        <SelectItem value="90">90 days</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button size="sm" className="h-7 text-xs" onClick={() => onStatusAction("publish", parseInt(publishDays))} disabled={isL("publish")}>
                                    {isL("publish") ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Zap className="h-3.5 w-3.5 mr-1" />}
                                    Force Publish
                                </Button>
                            </div>
                        )}
                        {job.status === "published" && !job.is_deleted && (
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onStatusAction("pause")} disabled={isL("pause")}>
                                {isL("pause") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pause className="h-3.5 w-3.5 mr-1" />}
                                Pause
                            </Button>
                        )}
                        {job.status === "paused" && !job.is_deleted && (
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onStatusAction("resume")} disabled={isL("resume")}>
                                {isL("resume") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                                Resume
                            </Button>
                        )}
                        {["published", "paused"].includes(job.status) && !job.is_deleted && (
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onStatusAction("expire")} disabled={isL("expire")}>
                                {isL("expire") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5 mr-1" />}
                                Expire
                            </Button>
                        )}
                        {job.is_deleted ? (
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onStatusAction("restore")} disabled={isL("restore")}>
                                {isL("restore") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 mr-1" />}
                                Restore
                            </Button>
                        ) : (
                            <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" onClick={async () => {
                                if (!confirm("Delete this job?")) return;
                                onStatusAction("delete");
                            }} disabled={isL("delete")}>
                                {isL("delete") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
                    {job.location && (
                        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                    )}
                    {salary && (
                        <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />{salary}</span>
                    )}
                    {job.positions_available && (
                        <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{job.positions_available} position{job.positions_available !== 1 ? "s" : ""}</span>
                    )}
                    {job.expires_at && (
                        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Expires {fmt(job.expires_at)}</span>
                    )}
                </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
                {job.description ? (
                    <>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Job Description</p>
                        <MDXViewer markdown={job.description} />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <FileText className="h-10 w-10 opacity-20 mb-2" />
                        <p className="text-sm">No description added.</p>
                    </div>
                )}

                {job.advertisement_link && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <a href={job.advertisement_link} target="_blank" rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1.5">
                            <ChevronRight className="h-4 w-4" /> Apply on company site
                        </a>
                    </div>
                )}

                {/* Payment history */}
                {job.payment_requests && job.payment_requests.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Payment History</p>
                        <div className="space-y-2">
                            {job.payment_requests.map((pr) => (
                                <div key={pr.id} className="bg-muted/40 rounded-lg p-3 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">{pr.payment_types?.label}</span>
                                        <span>{pr.currency} {Number(pr.amount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1 text-muted-foreground">
                                        <span>{fmt(pr.created_at)}</span>
                                        <Badge variant={pr.status === "verified" ? "default" : pr.status === "rejected" ? "destructive" : "secondary"} className="text-[10px]">
                                            {pr.status.replace(/_/g, " ")}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Right panel: Applications ─────────────────────────────────────────────────

function ApplicationsPanel({ job, onUpdateStatus }: { job: JobDetail; onUpdateStatus: (appId: string, status: string) => void }) {
    const apps = Array.isArray(job.job_applications) ? job.job_applications as Application[] : [];
    const [filter, setFilter] = useState<string>("all");
    const [updatingApp, setUpdatingApp] = useState<string | null>(null);

    const filtered = filter === "all" ? apps : apps.filter((a) => a.status === filter);

    const counts = apps.reduce<Record<string, number>>((acc, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1;
        return acc;
    }, {});

    async function handleStatusChange(appId: string, status: string) {
        setUpdatingApp(appId);
        await onUpdateStatus(appId, status);
        setUpdatingApp(null);
    }

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3.5 border-b border-border shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">Applications</p>
                    <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">{apps.length}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    <button
                        onClick={() => setFilter("all")}
                        className={cn("text-[11px] px-2 py-0.5 rounded-full border transition-colors",
                            filter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}
                    >
                        All {apps.length > 0 && `(${apps.length})`}
                    </button>
                    {Object.entries(APP_STATUS_CONFIG).map(([key, cfg]) => {
                        const c = counts[key] ?? 0;
                        if (c === 0) return null;
                        return (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={cn("text-[11px] px-2 py-0.5 rounded-full border transition-colors",
                                    filter === key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted")}
                            >
                                {cfg.label} ({c})
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Users className="h-10 w-10 opacity-20 mb-2" />
                        <p className="text-sm">No applications yet.</p>
                    </div>
                ) : (
                    filtered.map((app) => {
                        const appCfg = APP_STATUS_CONFIG[app.status] ?? APP_STATUS_CONFIG.pending;
                        const name = `${app.candidate.first_name} ${app.candidate.last_name}`;
                        const initials = `${app.candidate.first_name[0] ?? ""}${app.candidate.last_name[0] ?? ""}`.toUpperCase();

                        return (
                            <div key={app.id} className="flex items-start gap-3 px-4 py-3 border-b border-border hover:bg-muted/30 transition-colors">
                                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                                    {initials}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-medium truncate">{name}</p>
                                        <span className={cn("flex items-center gap-1 text-[11px] shrink-0", appCfg.color)}>
                                            {appCfg.icon}{appCfg.label}
                                        </span>
                                    </div>
                                    {app.candidate.current_position && (
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">{app.candidate.current_position}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <Select
                                            value={app.status}
                                            onValueChange={(v) => handleStatusChange(app.id, v)}
                                            disabled={updatingApp === app.id}
                                        >
                                            <SelectTrigger className="h-6 text-[11px] w-28">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(APP_STATUS_CONFIG).map(([key, cfg]) => (
                                                    <SelectItem key={key} value={key} className="text-xs">{cfg.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {updatingApp === app.id && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                        <span className="text-[11px] text-muted-foreground ml-auto">{fmt(app.applied_at, { day: "numeric", month: "short" })}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

// ── Employer combobox ─────────────────────────────────────────────────────────

function EmployerCombobox({
    employers, value, onChange,
}: {
    employers: EmployerOption[];
    value: string;
    onChange: (id: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const selected = employers.find(e => e.id === value) ?? null;
    const filtered = employers.filter(e =>
        `${e.first_name} ${e.last_name} ${e.company_name}`.toLowerCase().includes(search.toLowerCase())
    );

    function select(id: string) {
        onChange(id);
        setOpen(false);
        setSearch("");
    }

    function clear(ev: React.MouseEvent) {
        ev.stopPropagation();
        onChange("");
        setSearch("");
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button className={cn(
                    "w-full flex items-center justify-between gap-1.5 h-8 px-2.5 rounded-md border text-xs transition-colors",
                    value
                        ? "border-primary/50 bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                )}>
                    <span className="truncate">
                        {selected
                            ? `${selected.first_name} ${selected.last_name}`
                            : "All Employers"}
                    </span>
                    <span className="flex items-center gap-0.5 shrink-0">
                        {value && (
                            <span onClick={clear} className="hover:text-destructive rounded p-0.5">
                                <X className="h-3 w-3" />
                            </span>
                        )}
                        <ChevronDown className="h-3 w-3 opacity-50" />
                    </span>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
                <div className="p-2 border-b border-border">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input
                            className="pl-6 h-7 text-xs"
                            placeholder="Search employer or company..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                    <button
                        onClick={() => select("")}
                        className={cn(
                            "w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-muted",
                            !value && "bg-primary/8 text-primary font-medium"
                        )}
                    >
                        All Employers
                    </button>
                    {filtered.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">No employers found.</p>
                    ) : (
                        filtered.map(e => (
                            <button
                                key={e.id}
                                onClick={() => select(e.id)}
                                className={cn(
                                    "w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-muted",
                                    value === e.id && "bg-primary/8 text-primary font-medium"
                                )}
                            >
                                <span className="block truncate">{e.first_name} {e.last_name}</span>
                                {e.company_name && (
                                    <span className="block truncate text-[10px] text-muted-foreground">{e.company_name}</span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function MisJobsClient() {
    const [jobs, setJobs] = useState<JobListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("__all__");
    const [includeDeleted, setIncludeDeleted] = useState(false);
    const [employerFilter, setEmployerFilter] = useState("");
    const [employers, setEmployers] = useState<EmployerOption[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const limit = 50;

    useEffect(() => {
        fetch("/api/mis/employers")
            .then(r => r.json())
            .then(d => setEmployers(d.employers ?? []));
    }, []);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.set("search", search);
        if (statusFilter !== "__all__") params.set("status", statusFilter);
        if (includeDeleted) params.set("include_deleted", "true");
        if (employerFilter) params.set("employer_id", employerFilter);

        const res = await fetch(`/api/mis/jobs?${params}`);
        if (res.ok) {
            const d = await res.json();
            setJobs(d.jobs);
            setTotal(d.pagination.total);
            if (d.jobs.length > 0 && !selectedId) {
                setSelectedId(d.jobs[0].id);
            }
        }
        setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, statusFilter, page, includeDeleted, employerFilter]);

    useEffect(() => { setPage(1); }, [search, statusFilter, includeDeleted, employerFilter]);
    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    const fetchDetail = useCallback(async (id: string) => {
        setDetailLoading(true);
        const res = await fetch(`/api/mis/jobs/${id}`);
        if (res.ok) {
            const d = await res.json();
            setJobDetail(d.job ?? null);
        } else {
            setJobDetail(null);
        }
        setDetailLoading(false);
    }, []);

    useEffect(() => {
        if (!selectedId) { setJobDetail(null); return; }
        fetchDetail(selectedId);
    }, [selectedId, fetchDetail]);

    async function statusAction(action: string, validity_days?: number) {
        if (!selectedId) return;
        setActionLoading(action);
        try {
            const res = await fetch(`/api/mis/jobs/${selectedId}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, ...(validity_days ? { validity_days } : {}) }),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error || "Action failed"); return; }
            toast.success("Status updated");
            fetchJobs();
            fetchDetail(selectedId);
        } finally { setActionLoading(null); }
    }

    async function updateApplicationStatus(appId: string, status: string) {
        if (!selectedId) return;
        const res = await fetch(`/api/mis/jobs/${selectedId}/applications/${appId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error || "Failed"); return; }
        toast.success("Application status updated");
        fetchDetail(selectedId);
    }

    return (
        <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

            {/* ── LEFT: Job list ── */}
            <div style={{ width: 280, minWidth: 240, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div className="px-3 py-3 border-b border-border space-y-2 shrink-0">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Job Advertisements</p>
                        <span className="text-xs text-muted-foreground">{total}</span>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            className="pl-8 h-8 text-xs"
                            placeholder="Search jobs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <EmployerCombobox
                        employers={employers}
                        value={employerFilter}
                        onChange={(id) => { setEmployerFilter(id); setSelectedId(null); }}
                    />
                    <div className="flex gap-1 flex-wrap">
                        {STATUS_OPTIONS.map((s) => (
                            <button
                                key={s.value}
                                onClick={() => { setStatusFilter(s.value); setSelectedId(null); }}
                                className={cn(
                                    "text-[11px] px-2 py-0.5 rounded-full border transition-colors",
                                    statusFilter === s.value
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "border-border text-muted-foreground hover:bg-muted"
                                )}
                            >
                                {s.label === "All Statuses" ? "All" : s.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => { setIncludeDeleted(!includeDeleted); setSelectedId(null); }}
                        className={cn(
                            "text-[11px] px-2 py-0.5 rounded-full border transition-colors",
                            includeDeleted
                                ? "bg-destructive/10 text-destructive border-destructive/30"
                                : "border-border text-muted-foreground hover:bg-muted"
                        )}
                    >
                        {includeDeleted ? "Hide Deleted" : "Show Deleted"}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground px-4 text-center">
                            <Briefcase className="h-8 w-8 opacity-20 mb-2" />
                            <p className="text-xs">No jobs found.</p>
                        </div>
                    ) : (
                        <>
                            {jobs.map((job) => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    selected={selectedId === job.id}
                                    onClick={() => setSelectedId(job.id)}
                                />
                            ))}
                            {total > limit && (
                                <div className="flex justify-center gap-2 p-3 border-t border-border">
                                    <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                                    <span className="flex items-center text-xs text-muted-foreground">{page}/{Math.ceil(total / limit)}</span>
                                    <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>Next</Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── MIDDLE: Job detail ── */}
            <div style={{ flex: 1, minWidth: 0, borderRight: "1px solid var(--border)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {detailLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : jobDetail ? (
                    <JobDetailPanel
                        job={jobDetail}
                        onStatusAction={statusAction}
                        actionLoading={actionLoading}
                        onRefresh={() => { fetchJobs(); if (selectedId) fetchDetail(selectedId); }}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Briefcase className="h-12 w-12 opacity-20 mb-3" />
                        <p className="text-sm">Select a job to view details</p>
                    </div>
                )}
            </div>

            {/* ── RIGHT: Applications ── */}
            <div style={{ width: 300, minWidth: 260, flexShrink: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {jobDetail ? (
                    <ApplicationsPanel job={jobDetail} onUpdateStatus={updateApplicationStatus} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Users className="h-10 w-10 opacity-20 mb-2" />
                        <p className="text-sm">Applications will appear here</p>
                    </div>
                )}
            </div>

        </div>
    );
}
