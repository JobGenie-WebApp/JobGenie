"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    ArrowLeft, Pencil, Pause, Play, RefreshCw, Trash2,
    CreditCard, MapPin, Briefcase, Calendar, Clock, Users, Loader2,
    ShieldAlert, Upload, FileText
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PaymentModal } from "./PaymentModal";
import {
    ApplicantDetailModal,
    type ApplicantApplication,
    type ApplicantLinkedInvitation,
} from "@/components/employer/ApplicantDetailModal";
import {
    getInvitationJourneyDisplay,
    journeyVariantToEmployerBadgeProps,
    normalizeEmbeddedOffer,
    type JourneyDisplay,
} from "@/lib/invitation-journey-status";

const MDXViewer = dynamic(
    () => import("@/components/employer/MdxViewer").then((m) => m.MdxViewer),
    { ssr: false }
);

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "Draft", variant: "secondary" },
    published: { label: "Published", variant: "default" },
    paused: { label: "Paused", variant: "outline" },
    expired: { label: "Expired", variant: "destructive" },
};

const APP_STAGE: Record<string, JourneyDisplay> = {
    pending: { label: "Applied", variant: "pending" },
    reviewed: { label: "Under Review", variant: "info" },
    shortlisted: { label: "Shortlisted", variant: "info" },
    rejected: { label: "Not Selected", variant: "danger" },
    hired: { label: "Hired", variant: "success" },
    withdrawn: { label: "Withdrawn", variant: "muted" },
};

function normalizeInvitation(raw: Application["job_invitation"]): ApplicantLinkedInvitation | null {
    if (!raw) return null;
    return (Array.isArray(raw) ? raw[0] ?? null : raw) as ApplicantLinkedInvitation | null;
}

// Live stage: prefer the linked interview-invitation journey; else the coarse application status.
function applicantStage(app: Application): JourneyDisplay {
    const inv = normalizeInvitation(app.job_invitation);
    const terminal = ["rejected", "hired", "withdrawn"].includes(app.status);
    if (inv && !terminal) {
        return getInvitationJourneyDisplay(
            {
                status: inv.status,
                invitation_canceled: inv.invitation_canceled,
                interview_confirmed: inv.interview_confirmed,
                mis_rescheduled: inv.mis_rescheduled,
                pipeline_status: inv.pipeline_status,
                current_round_number: inv.current_round_number,
            },
            normalizeEmbeddedOffer(inv.job_offers)
        );
    }
    return APP_STAGE[app.status] ?? { label: app.status, variant: "pending" };
}

const JOB_TYPE_LABELS: Record<string, string> = {
    full_time: "Full Time", part_time: "Part Time", contract: "Contract",
    internship: "Internship", freelance: "Freelance",
};

interface Job {
    id: string; job_title: string; location: string | null; industry: string | null;
    job_type: string; status: string; description: string | null; deadline: string | null;
    expires_at: string | null; salary_min: number | null; salary_max: number | null;
    salary_currency: string | null; experience_level: string | null; positions_available: number | null;
    published_at: string | null; created_at: string;
    mis_pause_locked?: boolean;
    compliance_flags?: ComplianceFlag[];
    job_applications: Application[];
    payment_requests: PaymentRequest[];
}

interface ComplianceFlag {
    id: string; status: string; reason: string; flagged_at: string;
    employer_doc_url: string | null; employer_doc_name: string | null;
    employer_note: string | null; resubmitted_at: string | null;
    resolution_notes: string | null; resolved_at: string | null;
}

interface Application {
    id: string; status: string; applied_at: string;
    cover_letter: string | null; resume_url: string | null; notes: string | null;
    ats_score: number | null; ats_status: string | null; ats_error: string | null;
    candidate: { id: string; first_name: string; last_name: string; email: string; current_position: string | null; profile_image_url: string | null };
    job_invitation: ApplicantLinkedInvitation | ApplicantLinkedInvitation[] | null;
}

interface PaymentRequest {
    id: string; status: string; amount: number; currency: string; created_at: string;
    payment_types: { code: string; label: string };
    payment_proofs: { id: string; status: string; uploaded_at: string; review_notes: string | null }[];
}

function fmt(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Colour-coded ATS score chip for an applicant. Handles the three states:
// scored (coloured score), failed ("ATS failed" + Check again), and pending.
function AtsBadge({
    app,
    onRecheck,
    rechecking,
}: {
    app: Application;
    onRecheck: (id: string) => void;
    rechecking: boolean;
}) {
    if (app.ats_status === "scored" && typeof app.ats_score === "number") {
        const score = Math.round(app.ats_score);
        const cls =
            score >= 75
                ? "bg-green-100 text-green-800 border-green-200"
                : score >= 50
                ? "bg-amber-100 text-amber-800 border-amber-200"
                : "bg-red-100 text-red-700 border-red-200";
        return (
            <span className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold ${cls}`} title="ATS match score">
                ATS {score}
            </span>
        );
    }

    if (app.ats_status === "failed") {
        return (
            <span className="flex items-center gap-1 shrink-0">
                <span className="rounded-md border border-muted bg-muted px-2 py-0.5 text-xs text-muted-foreground" title={app.ats_error ?? "Scoring failed"}>
                    ATS failed
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    disabled={rechecking}
                    onClick={(e) => { e.stopPropagation(); onRecheck(app.id); }}
                >
                    {rechecking ? <Loader2 className="h-3 w-3 animate-spin" /> : "Check again"}
                </Button>
            </span>
        );
    }

    return (
        <span className="shrink-0 rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground" title="ATS score pending">
            Not scored
        </span>
    );
}

export function JobDetailClient({ jobId }: { jobId: string }) {
    const router = useRouter();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [extendDays, setExtendDays] = useState("30");
    const [paymentModal, setPaymentModal] = useState<{ mode: "publish" | "extend"; validityDays?: number } | null>(null);
    const [republishFile, setRepublishFile] = useState<File | null>(null);
    const [republishNote, setRepublishNote] = useState("");
    const [republishSubmitting, setRepublishSubmitting] = useState(false);
    const [selectedApp, setSelectedApp] = useState<ApplicantApplication | null>(null);
    // Applicant list controls: sort by application date + ATS score cutoff.
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
    const [minScore, setMinScore] = useState("");
    const [recheckingId, setRecheckingId] = useState<string | null>(null);

    const fetchJob = useCallback(async () => {
        setLoading(true);
        const res = await fetch(`/api/employer/jobs/${jobId}`);
        if (res.ok) { const d = await res.json(); setJob(d.job); }
        setLoading(false);
    }, [jobId]);

    useEffect(() => { fetchJob(); }, [fetchJob]);

    // Open the applicant profile; a still-"pending" application is auto-marked reviewed.
    const openApplicant = (app: Application) => {
        if (!job) return;
        setSelectedApp({
            id: app.id,
            status: app.status,
            cover_letter: app.cover_letter,
            resume_url: app.resume_url,
            notes: app.notes,
            applied_at: app.applied_at,
            job: { id: job.id, job_title: job.job_title, industry: job.industry },
            candidate: { id: app.candidate.id, first_name: app.candidate.first_name, last_name: app.candidate.last_name },
            job_invitation: normalizeInvitation(app.job_invitation),
        });
        if (app.status === "pending") {
            fetch(`/api/employer/applications/${app.id}/review`, { method: "POST" })
                .then((r) => r.json())
                .then((d) => { if (d.success) fetchJob(); })
                .catch(() => {});
        }
    };

    // Employer "Check again": re-run ATS scoring for an application whose apply-time score failed.
    const recheckAts = async (appId: string) => {
        setRecheckingId(appId);
        try {
            const res = await fetch(`/api/employer/applications/${appId}/ats-recompute`, { method: "POST" });
            const d = await res.json();
            if (d.success) toast.success("ATS score updated");
            else toast.error(d.error || "Still couldn't score this résumé");
            await fetchJob();
        } catch {
            toast.error("Failed to recompute ATS score");
        } finally {
            setRecheckingId(null);
        }
    };

    // The extend panel is driven purely by job.status — a job is only extendable
    // once the expiry cron has marked it expired, which is also the only state
    // handleJobAdPaymentAction will apply a paid JOB_AD_EXTEND to. (`?extend=1`
    // used to be read here but was inert; the panel's own status check overrode it.)

    async function doAction(endpoint: string, method = "POST", body?: object) {
        setActionLoading(endpoint);
        try {
            const res = await fetch(`/api/employer/jobs/${jobId}/${endpoint}`, {
                method,
                headers: body ? { "Content-Type": "application/json" } : undefined,
                body: body ? JSON.stringify(body) : undefined,
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error || "Action failed"); return false; }
            toast.success("Done");
            await fetchJob();
            return true;
        } finally {
            setActionLoading(null);
        }
    }

    function openPublishModal() {
        setPaymentModal({ mode: "publish" });
    }

    function openExtendModal() {
        setPaymentModal({ mode: "extend", validityDays: parseInt(extendDays) });
    }

    async function submitRepublishRequest() {
        if (!republishFile) { toast.error("Please attach a document."); return; }
        setRepublishSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("file", republishFile);
            if (republishNote.trim()) fd.append("note", republishNote.trim());
            const res = await fetch(`/api/employer/jobs/${jobId}/republish-request`, { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error || "Failed to submit"); return; }
            toast.success("Document submitted. JobGenie will review your request.");
            setRepublishFile(null); setRepublishNote("");
            await fetchJob();
        } finally {
            setRepublishSubmitting(false);
        }
    }

    async function deleteJob() {
        if (!confirm("Delete this job ad?")) return;
        const ok = await doAction("", "DELETE");
        if (ok) router.push("/employer/jobs");
    }

    if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    if (!job) return <div className="text-center py-16 text-muted-foreground">Job not found.</div>;

    const statusInfo = STATUS_LABELS[job.status] ?? { label: job.status, variant: "secondary" as const };
    const pendingPr = job.payment_requests?.find((r) => ["pending_payment", "under_review"].includes(r.status));
    const openFlag = job.mis_pause_locked
        ? job.compliance_flags?.find((f) => ["paused", "resubmitted"].includes(f.status))
        : undefined;
    const isL = (k: string) => actionLoading === k;
    const appCount = job.job_applications?.length ?? 0;
    const canEdit =
        ["published", "paused", "expired"].includes(job.status) ||
        (job.status === "draft" && !pendingPr);

    // Apply the ATS cutoff + date sort for the applicant list.
    const cutoff = minScore.trim() === "" ? null : Number(minScore);
    const visibleApps = [...(job.job_applications ?? [])]
        .filter((a) => cutoff == null || Number.isNaN(cutoff) || (typeof a.ats_score === "number" && a.ats_score >= cutoff))
        .sort((a, b) => {
            const da = new Date(a.applied_at).getTime();
            const db = new Date(b.applied_at).getTime();
            return sortOrder === "newest" ? db - da : da - db;
        });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-3">
                <Button variant="ghost" size="sm" onClick={() => router.push("/employer/jobs")}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Jobs
                </Button>
            </div>

            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold">{job.job_title}</h1>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                        {job.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>}
                        <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{JOB_TYPE_LABELS[job.job_type] ?? job.job_type}</span>
                        {job.expires_at && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Expires {fmt(job.expires_at)}</span>}
                        {job.deadline && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Deadline {fmt(job.deadline)}</span>}
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{appCount} application{appCount !== 1 ? "s" : ""}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {canEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/employer/jobs/${jobId}/edit`)}
                        >
                            <Pencil className="h-4 w-4 mr-1" /> Edit
                        </Button>
                    )}
                    {job.status === "draft" && !pendingPr && (
                        <Button size="sm" onClick={openPublishModal}>
                            <CreditCard className="h-4 w-4 mr-1" />
                            Pay &amp; Publish
                        </Button>
                    )}
                    {job.status === "draft" && pendingPr && (
                        <Button variant="outline" size="sm" onClick={() => router.push("/employer/payments")}>
                            <Clock className="h-4 w-4 mr-1" /> Awaiting Confirmation
                        </Button>
                    )}
                    {job.status === "published" && (
                        <Button variant="outline" size="sm" onClick={() => doAction("pause")} disabled={isL("pause")}>
                            {isL("pause") ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
                            Pause
                        </Button>
                    )}
                    {job.status === "paused" && !job.mis_pause_locked && (
                        <Button variant="outline" size="sm" onClick={() => doAction("resume")} disabled={isL("resume")}>
                            {isL("resume") ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                            Resume
                        </Button>
                    )}
                    {job.status !== "deleted" && (
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={deleteJob} disabled={isL("")}>
                            {isL("") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                    )}
                </div>
            </div>

            {/* MIS compliance pause — fake/invalid document */}
            {openFlag && (
                <Card className="border-red-300 bg-red-50/50">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-2">
                            <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-red-800">This advertisement was paused by JobGenie.</p>
                                <p className="text-sm text-red-700 mt-0.5">Reason: {openFlag.reason}</p>
                                <p className="text-xs text-red-600/80 mt-1">
                                    Only JobGenie can republish this advertisement. Submit a corrected document below to request republication.
                                </p>
                            </div>
                        </div>

                        {openFlag.status === "resubmitted" ? (
                            <div className="rounded-md border border-red-200 bg-white p-3 text-sm">
                                <p className="font-medium text-foreground">Document submitted — awaiting review.</p>
                                {openFlag.employer_doc_url && (
                                    <a href={openFlag.employer_doc_url} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-primary hover:underline text-xs mt-1">
                                        <FileText className="h-3.5 w-3.5" />{openFlag.employer_doc_name ?? "View document"}
                                    </a>
                                )}
                                {openFlag.resubmitted_at && (
                                    <p className="text-xs text-muted-foreground mt-1">Submitted {fmt(openFlag.resubmitted_at)}</p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2 rounded-md border border-red-200 bg-white p-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Corrected document *</Label>
                                    <Input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        onChange={(e) => setRepublishFile(e.target.files?.[0] ?? null)}
                                    />
                                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG, WEBP — max 10 MB</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Note (optional)</Label>
                                    <Input
                                        placeholder="Add a note for the reviewer"
                                        value={republishNote}
                                        onChange={(e) => setRepublishNote(e.target.value)}
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button size="sm" onClick={submitRepublishRequest} disabled={!republishFile || republishSubmitting}>
                                        {republishSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                                        Submit &amp; Request
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Extend panel */}
            {job.status === "expired" && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-4">
                        <p className="text-sm font-medium text-amber-800 mb-3">This advertisement has expired. Extend it to continue accepting applications.</p>
                        <div className="flex items-center gap-3">
                            <Select value={extendDays} onValueChange={setExtendDays}>
                                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">30 days</SelectItem>
                                    <SelectItem value="60">60 days</SelectItem>
                                    <SelectItem value="90">90 days</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button size="sm" onClick={openExtendModal}>
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Extend Advertisement
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Description (left) + Applications (right) */}
            <div className="grid gap-6 lg:grid-cols-2 items-start">
                <div className="space-y-6">
                    {/* Description */}
                    {job.description && (
                        <Card>
                            <CardHeader><CardTitle>Job Description</CardTitle></CardHeader>
                            <CardContent>
                                <MDXViewer markdown={job.description} />
                            </CardContent>
                        </Card>
                    )}

                    {/* Payment history */}
                    {job.payment_requests && job.payment_requests.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                {job.payment_requests.map((pr) => (
                                    <div key={pr.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium">{pr.payment_types?.label}</p>
                                            <p className="text-xs text-muted-foreground">{fmt(pr.created_at)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium">{pr.currency} {Number(pr.amount).toLocaleString()}</p>
                                            <Badge variant={pr.status === "verified" ? "default" : pr.status === "rejected" ? "destructive" : "secondary"} className="text-xs">
                                                {pr.status.replace(/_/g, " ")}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Applications */}
                <Card>
                    <CardHeader>
                        <CardTitle>Applicants ({appCount})</CardTitle>
                        {appCount > 0 && (
                            <div className="flex flex-wrap items-center gap-2 pt-2">
                                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}>
                                    <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newest">Newest applied</SelectItem>
                                        <SelectItem value="oldest">Oldest applied</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="flex items-center gap-1">
                                    <Label htmlFor="ats-cutoff" className="text-xs whitespace-nowrap text-muted-foreground">Min ATS</Label>
                                    <Input
                                        id="ats-cutoff"
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={minScore}
                                        onChange={(e) => setMinScore(e.target.value)}
                                        placeholder="0"
                                        className="h-8 w-16 text-xs"
                                    />
                                </div>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {appCount === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No applications yet.</p>
                        ) : visibleApps.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No applicants match this ATS cutoff.</p>
                        ) : (
                            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                                {visibleApps.map((app) => {
                                    const stage = applicantStage(app);
                                    const badge = journeyVariantToEmployerBadgeProps(stage.variant);
                                    return (
                                        <div
                                            key={app.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => openApplicant(app)}
                                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openApplicant(app); } }}
                                            className="flex w-full items-center justify-between gap-2 rounded-lg border p-3 text-left cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/40"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{app.candidate.first_name} {app.candidate.last_name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{app.candidate.current_position || app.candidate.email} · Applied {fmt(app.applied_at)}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <AtsBadge app={app} onRecheck={recheckAts} rechecking={recheckingId === app.id} />
                                                <Badge variant={badge.variant} className={`shrink-0 ${badge.className}`}>{stage.label}</Badge>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ApplicantDetailModal
                app={selectedApp}
                onClose={() => setSelectedApp(null)}
                onRefresh={fetchJob}
            />

            {paymentModal && (
                <PaymentModal
                    open={true}
                    mode={paymentModal.mode}
                    jobId={jobId}
                    validityDays={paymentModal.validityDays}
                    onClose={() => setPaymentModal(null)}
                    onSuccess={() => { setPaymentModal(null); fetchJob(); }}
                />
            )}
        </div>
    );
}
