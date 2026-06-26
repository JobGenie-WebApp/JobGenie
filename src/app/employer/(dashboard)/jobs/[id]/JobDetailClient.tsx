"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
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

const APP_STATUS_LABELS: Record<string, string> = {
    pending: "Pending", reviewed: "Reviewed", shortlisted: "Shortlisted",
    rejected: "Rejected", hired: "Hired", withdrawn: "Withdrawn",
};

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
    candidate: { id: string; first_name: string; last_name: string; email: string; current_position: string | null; profile_image_url: string | null };
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

export function JobDetailClient({ jobId }: { jobId: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [extendDays, setExtendDays] = useState("30");
    const [paymentModal, setPaymentModal] = useState<{ mode: "publish" | "extend"; validityDays?: number } | null>(null);
    const [republishFile, setRepublishFile] = useState<File | null>(null);
    const [republishNote, setRepublishNote] = useState("");
    const [republishSubmitting, setRepublishSubmitting] = useState(false);

    const fetchJob = useCallback(async () => {
        setLoading(true);
        const res = await fetch(`/api/employer/jobs/${jobId}`);
        if (res.ok) { const d = await res.json(); setJob(d.job); }
        setLoading(false);
    }, [jobId]);

    useEffect(() => { fetchJob(); }, [fetchJob]);

    // Show extend dialog if ?extend=1
    const showExtend = searchParams.get("extend") === "1";

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
                    {job.status === "draft" && !pendingPr && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => router.push(`/employer/jobs/${jobId}/edit`)}>
                                <Pencil className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button size="sm" onClick={openPublishModal}>
                                <CreditCard className="h-4 w-4 mr-1" />
                                Pay &amp; Publish
                            </Button>
                        </>
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
                                        className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs mt-1">
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
            {(job.status === "expired" || showExtend) && job.status === "expired" && (
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

            {/* Applications */}
            <Card>
                <CardHeader><CardTitle>Applications ({appCount})</CardTitle></CardHeader>
                <CardContent>
                    {appCount === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No applications yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {job.job_applications.map((app) => (
                                <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm">{app.candidate.first_name} {app.candidate.last_name}</p>
                                        <p className="text-xs text-muted-foreground">{app.candidate.current_position || app.candidate.email} · Applied {fmt(app.applied_at)}</p>
                                    </div>
                                    <Badge variant="secondary">{APP_STATUS_LABELS[app.status] ?? app.status}</Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

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
