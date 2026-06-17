"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Plus, MapPin, Briefcase, Users, Clock, Pencil, Pause,
    Play, RefreshCw, Trash2, CreditCard, Loader2, Search,
    Building2, DollarSign, Calendar, ChevronRight, FileText,
    CheckCircle2, XCircle, Eye, AlertCircle, UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MDXViewer = dynamic(
    () => import("@/components/employer/MdxViewer").then((m) => m.MdxViewer),
    { ssr: false, loading: () => <div className="h-24 bg-muted animate-pulse rounded" /> }
);

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentRequest = { id: string; status: string; payment_types: { code: string } };

interface JobBase {
    id: string;
    job_title: string;
    location: string | null;
    industry: string | null;
    job_type: string;
    status: string;
    deadline: string | null;
    expires_at: string | null;
    published_at: string | null;
    created_at: string;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string | null;
    positions_available: number | null;
    payment_requests: PaymentRequest[];
}

interface Job extends JobBase {
    job_applications: { count: number }[];
}

interface JobDetail extends JobBase {
    description: string | null;
    experience_level: string | null;
    advertisement_link: string | null;
    custom_start_date: string | null;
    custom_end_date: string | null;
    validity_days: number;
    job_applications: Application[];
}

interface Application {
    id: string;
    status: string;
    applied_at: string;
    candidate: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        profile_image_url: string | null;
        current_position: string | null;
        industry: string | null;
        years_of_experience: number | null;
    };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    draft:     { label: "Draft",     color: "bg-muted text-muted-foreground",          dot: "bg-muted-foreground" },
    published: { label: "Published", color: "bg-primary/10 text-primary",              dot: "bg-primary" },
    paused:    { label: "Paused",    color: "bg-amber-500/10 text-amber-600",          dot: "bg-amber-500" },
    expired:   { label: "Expired",   color: "bg-destructive/10 text-destructive",      dot: "bg-destructive" },
    deleted:   { label: "Deleted",   color: "bg-destructive/10 text-destructive",      dot: "bg-destructive" },
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

type TabValue = "all" | "draft" | "published" | "paused" | "expired";

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

function getPendingPaymentId(job: JobBase): string | null {
    const pr = job.payment_requests?.find(
        (r) => ["pending_payment", "under_review"].includes(r.status) &&
            ["JOB_AD_PUBLISH", "JOB_AD_EXTEND"].includes(r.payment_types?.code)
    );
    return pr?.id ?? null;
}

// ── Left panel: Job card ───────────────────────────────────────────────────────

function JobCard({ job, selected, onClick }: { job: Job; selected: boolean; onClick: () => void }) {
    const appCount = job.job_applications?.[0]?.count ?? 0;
    const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.draft;

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
                        {job.industry ?? JOB_TYPE_LABELS[job.job_type] ?? job.job_type}
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

function JobDetail({
    job, onAction, actionLoading, onRequestPayment, onDelete,
}: {
    job: JobDetail;
    onAction: (jobId: string, endpoint: string, method?: string) => void;
    actionLoading: string | null;
    onRequestPayment: (jobId: string) => void;
    onDelete: (jobId: string) => void;
}) {
    const router = useRouter();
    const salary = salaryLabel(job.salary_min, job.salary_max, job.salary_currency);
    const pendingPaymentId = getPendingPaymentId(job);
    const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.draft;
    const isLoading = (suffix: string) => actionLoading === job.id + suffix;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border shrink-0">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="h-5 w-5 text-primary" />
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
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {job.status === "draft" && !pendingPaymentId && (
                            <>
                                <Button variant="ghost" size="sm" onClick={() => router.push(`/employer/jobs/${job.id}/edit`)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="sm" onClick={() => onRequestPayment(job.id)} disabled={isLoading("payment")}>
                                    {isLoading("payment") ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4 mr-1" />}
                                    Publish
                                </Button>
                            </>
                        )}
                        {job.status === "draft" && pendingPaymentId && (
                            <Button variant="outline" size="sm" onClick={() => router.push("/employer/payments")}>
                                <CreditCard className="h-4 w-4 mr-1" /> View Payment
                            </Button>
                        )}
                        {job.status === "published" && (
                            <Button variant="outline" size="sm" onClick={() => onAction(job.id, "pause")} disabled={isLoading("pause")}>
                                {isLoading("pause") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4 mr-1" />}
                                Pause
                            </Button>
                        )}
                        {job.status === "paused" && (
                            <Button variant="outline" size="sm" onClick={() => onAction(job.id, "resume")} disabled={isLoading("resume")}>
                                {isLoading("resume") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
                                Resume
                            </Button>
                        )}
                        {job.status === "expired" && (
                            <Button size="sm" onClick={() => router.push(`/employer/jobs/${job.id}?extend=1`)}>
                                <RefreshCw className="h-4 w-4 mr-1" /> Extend
                            </Button>
                        )}
                        {job.status !== "deleted" && (
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(job.id)} disabled={isLoading("delete")}>
                                {isLoading("delete") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
            </div>
        </div>
    );
}

// ── Right panel: Applications ─────────────────────────────────────────────────

function ApplicationsPanel({ job }: { job: JobDetail }) {
    const apps = Array.isArray(job.job_applications) ? job.job_applications as Application[] : [];
    const [filter, setFilter] = useState<string>("all");

    const filtered = filter === "all" ? apps : apps.filter((a) => a.status === filter);

    const counts = apps.reduce<Record<string, number>>((acc, a) => {
        acc[a.status] = (acc[a.status] ?? 0) + 1;
        return acc;
    }, {});

    return (
        <div className="flex flex-col h-full">
            <div className="px-4 py-3.5 border-b border-border shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold">Applications</p>
                    <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">{apps.length}</span>
                </div>
                {/* Status filter chips */}
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
                                <Avatar className="h-9 w-9 shrink-0">
                                    <AvatarImage src={app.candidate.profile_image_url ?? undefined} />
                                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                                </Avatar>
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
                                    <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                                        {app.candidate.years_of_experience != null && (
                                            <span>{app.candidate.years_of_experience}y exp</span>
                                        )}
                                        <span>· {fmt(app.applied_at, { day: "numeric", month: "short" })}</span>
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

// ── Main ──────────────────────────────────────────────────────────────────────

export function JobsClient() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabValue>("all");
    const [search, setSearch] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        const params = activeTab !== "all" ? `?status=${activeTab}` : "";
        const res = await fetch(`/api/employer/jobs${params}`);
        if (res.ok) {
            const data = await res.json();
            setJobs(data.jobs);
            // Auto-select first job
            if (data.jobs.length > 0 && !selectedId) {
                setSelectedId(data.jobs[0].id);
            }
        }
        setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    // Fetch detail when selection changes
    useEffect(() => {
        if (!selectedId) { setJobDetail(null); return; }
        setDetailLoading(true);
        fetch(`/api/employer/jobs/${selectedId}`)
            .then((r) => r.json())
            .then((d) => setJobDetail(d.job ?? null))
            .catch(() => setJobDetail(null))
            .finally(() => setDetailLoading(false));
    }, [selectedId]);

    async function doAction(jobId: string, endpoint: string, method = "POST") {
        setActionLoading(jobId + endpoint);
        try {
            const res = await fetch(`/api/employer/jobs/${jobId}/${endpoint}`, { method });
            if (!res.ok) { const e = await res.json(); toast.error(e.error || "Action failed"); }
            else { toast.success("Done"); fetchJobs(); }
        } finally { setActionLoading(null); }
    }

    async function requestPayment(jobId: string) {
        setActionLoading(jobId + "payment");
        try {
            const res = await fetch(`/api/employer/jobs/${jobId}/request-payment`, { method: "POST" });
            const data = await res.json();
            if (!res.ok) toast.error(data.error || "Failed");
            else { toast.success("Payment request created"); router.push("/employer/payments"); }
        } finally { setActionLoading(null); }
    }

    async function deleteJob(jobId: string) {
        if (!confirm("Delete this job? This cannot be undone.")) return;
        setActionLoading(jobId + "delete");
        try {
            const res = await fetch(`/api/employer/jobs/${jobId}`, { method: "DELETE" });
            if (!res.ok) toast.error("Failed to delete");
            else {
                toast.success("Job deleted");
                setSelectedId(null);
                setJobDetail(null);
                fetchJobs();
            }
        } finally { setActionLoading(null); }
    }

    const TABS: { value: TabValue; label: string }[] = [
        { value: "all", label: "All" },
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
        { value: "paused", label: "Paused" },
        { value: "expired", label: "Expired" },
    ];

    const filtered = jobs.filter((j) =>
        j.job_title.toLowerCase().includes(search.toLowerCase()) ||
        (j.location ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (j.industry ?? "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

            {/* ── LEFT: Job list ── */}
            <div style={{ width: 280, minWidth: 240, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

                {/* Top bar */}
                <div className="px-3 py-3 border-b border-border space-y-2 shrink-0">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Job Postings</p>
                        <Button size="sm" onClick={() => router.push("/employer/jobs/new")} className="h-7 px-2 text-xs">
                            <Plus className="h-3.5 w-3.5 mr-1" /> New
                        </Button>
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
                    {/* Tab filters */}
                    <div className="flex gap-1 flex-wrap">
                        {TABS.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => { setActiveTab(t.value); setSelectedId(null); }}
                                className={cn(
                                    "text-[11px] px-2 py-0.5 rounded-full border transition-colors",
                                    activeTab === t.value
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "border-border text-muted-foreground hover:bg-muted"
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground px-4 text-center">
                            <Briefcase className="h-8 w-8 opacity-20 mb-2" />
                            <p className="text-xs">No jobs found.</p>
                            <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => router.push("/employer/jobs/new")}>
                                Post your first job
                            </Button>
                        </div>
                    ) : (
                        filtered.map((job) => (
                            <JobCard
                                key={job.id}
                                job={job}
                                selected={selectedId === job.id}
                                onClick={() => setSelectedId(job.id)}
                            />
                        ))
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
                    <JobDetail
                        job={jobDetail}
                        onAction={doAction}
                        actionLoading={actionLoading}
                        onRequestPayment={requestPayment}
                        onDelete={deleteJob}
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
                    <ApplicationsPanel job={jobDetail} />
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
