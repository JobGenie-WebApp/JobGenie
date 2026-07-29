"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft, MapPin, Briefcase, Clock, Users, Building2,
    Loader2, Pause, Play, Zap, Trash2, RotateCcw, Pencil,
} from "lucide-react";
import { toast } from "sonner";

const MDXViewer = dynamic(
    () => import("@/components/employer/MdxViewer").then((m) => m.MdxViewer),
    { ssr: false }
);

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "Draft", variant: "secondary" },
    published: { label: "Published", variant: "default" },
    paused: { label: "Paused", variant: "outline" },
    expired: { label: "Expired", variant: "destructive" },
    deleted: { label: "Deleted", variant: "destructive" },
};

const APP_STATUS_OPTIONS = ["pending", "reviewed", "shortlisted", "rejected", "hired", "withdrawn"];
const APP_STATUS_LABELS: Record<string, string> = {
    pending: "Pending", reviewed: "Reviewed", shortlisted: "Shortlisted",
    rejected: "Rejected", hired: "Hired", withdrawn: "Withdrawn",
};

function fmt(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface Job {
    id: string; job_title: string; location: string | null; industry: string | null;
    job_type: string; status: string; description: string | null; deadline: string | null;
    expires_at: string | null; validity_days: number; published_at: string | null;
    salary_min: number | null; salary_max: number | null; salary_currency: string | null;
    experience_level: string | null; positions_available: number | null;
    is_deleted: boolean; deleted_at: string | null; created_at: string;
    company: { company_name: string; logo_url: string | null };
    employer: { first_name: string; last_name: string; email: string };
    job_applications: Application[];
    payment_requests: PaymentRequest[];
}

interface Application {
    id: string; status: string; applied_at: string; notes: string | null;
    candidate: { id: string; first_name: string; last_name: string; email: string; current_position: string | null };
}

interface PaymentRequest {
    id: string; status: string; amount: number; currency: string; created_at: string;
    payment_types: { code: string; label: string };
    payment_proofs: { status: string; uploaded_at: string; reviewed_at: string | null; review_notes: string | null; file_url: string | null; file_name: string | null }[];
}

export function MisJobDetailClient({ jobId }: { jobId: string }) {
    const router = useRouter();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [publishDays, setPublishDays] = useState("30");
    const [updatingApp, setUpdatingApp] = useState<string | null>(null);

    const fetchJob = useCallback(async () => {
        setLoading(true);
        const res = await fetch(`/api/mis/jobs/${jobId}`);
        if (res.ok) { const d = await res.json(); setJob(d.job); }
        else { toast.error("Job not found"); router.push("/mis/jobs"); }
        setLoading(false);
    }, [jobId, router]);

    useEffect(() => { fetchJob(); }, [fetchJob]);

    async function statusAction(action: string, validity_days?: number) {
        setActionLoading(action);
        try {
            const res = await fetch(`/api/mis/jobs/${jobId}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, ...(validity_days ? { validity_days } : {}) }),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error || "Action failed"); return; }
            toast.success("Status updated");
            fetchJob();
        } finally { setActionLoading(null); }
    }

    async function updateApplicationStatus(appId: string, status: string) {
        setUpdatingApp(appId);
        try {
            const res = await fetch(`/api/mis/jobs/${jobId}/applications/${appId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error || "Failed"); return; }
            toast.success("Application status updated");
            fetchJob();
        } finally { setUpdatingApp(null); }
    }

    const isL = (k: string) => actionLoading === k;

    if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    if (!job) return null;

    const statusInfo = STATUS_LABELS[job.status] ?? { label: job.status, variant: "secondary" as const };
    const company = Array.isArray(job.company) ? job.company[0] : job.company;
    const employer = Array.isArray(job.employer) ? job.employer[0] : job.employer;
    const appCount = job.job_applications?.length ?? 0;

    return (
        <div className="space-y-6">
            <Button variant="ghost" size="sm" onClick={() => router.push("/mis/jobs")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> All Jobs
            </Button>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-xl font-bold">{job.job_title}</h1>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{company?.company_name}</span>
                        {job.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>}
                        {job.expires_at && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Expires {fmt(job.expires_at)}</span>}
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{appCount} application{appCount !== 1 ? "s" : ""}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Posted by {employer?.first_name} {employer?.last_name} · {employer?.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push(`/mis/jobs/${jobId}/edit`)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
            </div>

            {/* Admin Status Controls */}
            <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Admin Status Controls</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {job.status === "draft" && (
                            <div className="flex items-center gap-2">
                                <Select value={publishDays} onValueChange={setPublishDays}>
                                    <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="30">30 days</SelectItem>
                                        <SelectItem value="60">60 days</SelectItem>
                                        <SelectItem value="90">90 days</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button size="sm" onClick={() => statusAction("publish", parseInt(publishDays))} disabled={isL("publish")}>
                                    {isL("publish") ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Zap className="h-4 w-4 mr-1" />}
                                    Force Publish
                                </Button>
                            </div>
                        )}
                        {job.status === "published" && (
                            <Button variant="outline" size="sm" onClick={() => statusAction("pause")} disabled={isL("pause")}>
                                {isL("pause") ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
                                Pause
                            </Button>
                        )}
                        {job.status === "paused" && (
                            <Button variant="outline" size="sm" onClick={() => statusAction("resume")} disabled={isL("resume")}>
                                {isL("resume") ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                                Resume
                            </Button>
                        )}
                        {["published", "paused"].includes(job.status) && (
                            <Button variant="outline" size="sm" onClick={() => statusAction("expire")} disabled={isL("expire")}>
                                {isL("expire") ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Clock className="h-4 w-4 mr-1" />}
                                Force Expire
                            </Button>
                        )}
                        {job.is_deleted && (
                            <Button variant="outline" size="sm" onClick={() => statusAction("restore")} disabled={isL("restore")}>
                                {isL("restore") ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RotateCcw className="h-4 w-4 mr-1" />}
                                Restore
                            </Button>
                        )}
                        {!job.is_deleted && (
                            <Button variant="destructive" size="sm" onClick={async () => {
                                if (!confirm("Delete this job?")) return;
                                setActionLoading("delete");
                                const res = await fetch(`/api/mis/jobs/${jobId}/status`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ action: "delete" }),
                                });
                                if (res.ok) { toast.success("Job deleted"); fetchJob(); }
                                else toast.error("Failed");
                                setActionLoading(null);
                            }} disabled={isL("delete")}>
                                {isL("delete") ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
                                Delete
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="details">
                <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="applications">Applications ({appCount})</TabsTrigger>
                    <TabsTrigger value="payments">Payment History</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: "Job Type", value: job.job_type?.replace(/_/g, " ") ?? "—" },
                            { label: "Experience", value: job.experience_level || "—" },
                            { label: "Positions", value: String(job.positions_available ?? "—") },
                            { label: "Validity", value: `${job.validity_days} days` },
                            { label: "Published", value: fmt(job.published_at) },
                            { label: "Expires", value: fmt(job.expires_at) },
                            { label: "Deadline", value: fmt(job.deadline) },
                            { label: "Created", value: fmt(job.created_at) },
                        ].map((item) => (
                            <div key={item.label} className="bg-muted/40 rounded-lg p-3">
                                <p className="text-xs text-muted-foreground">{item.label}</p>
                                <p className="text-sm font-medium mt-0.5 capitalize">{item.value}</p>
                            </div>
                        ))}
                    </div>
                    {job.description && (
                        <Card>
                            <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                            <CardContent><MDXViewer markdown={job.description} /></CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="applications" className="mt-4">
                    {appCount === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">No applications yet.</div>
                    ) : (
                        <div className="space-y-3">
                            {job.job_applications.map((app) => (
                                <Card key={app.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="font-medium text-sm">{app.candidate.first_name} {app.candidate.last_name}</p>
                                                <p className="text-xs text-muted-foreground">{app.candidate.current_position || app.candidate.email} · Applied {fmt(app.applied_at)}</p>
                                                {app.notes && <p className="text-xs text-muted-foreground mt-1 italic">{app.notes}</p>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={app.status}
                                                    onValueChange={(v) => updateApplicationStatus(app.id, v)}
                                                    disabled={updatingApp === app.id}
                                                >
                                                    <SelectTrigger className="w-36 h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {APP_STATUS_OPTIONS.map((s) => (
                                                            <SelectItem key={s} value={s}>{APP_STATUS_LABELS[s]}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {updatingApp === app.id && <Loader2 className="h-4 w-4 animate-spin" />}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="payments" className="mt-4">
                    {!job.payment_requests || job.payment_requests.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">No payment history.</div>
                    ) : (
                        <div className="space-y-3">
                            {job.payment_requests.map((pr) => (
                                <Card key={pr.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium text-sm">{pr.payment_types?.label}</p>
                                                <p className="text-xs text-muted-foreground">{fmt(pr.created_at)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-sm">{pr.currency} {Number(pr.amount).toLocaleString()}</p>
                                                <Badge variant={pr.status === "verified" ? "default" : pr.status === "rejected" ? "destructive" : "secondary"} className="text-xs">
                                                    {pr.status.replace(/_/g, " ")}
                                                </Badge>
                                            </div>
                                        </div>
                                        {pr.payment_proofs && pr.payment_proofs.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                                {pr.payment_proofs.map((proof, i) => (
                                                    <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                                                        <span>Proof uploaded {fmt(proof.uploaded_at)}</span>
                                                        <Badge variant={proof.status === "approved" ? "default" : proof.status === "rejected" ? "destructive" : "secondary"} className="text-xs">
                                                            {proof.status}
                                                        </Badge>
                                                        {proof.review_notes && <span>· {proof.review_notes}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
