"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, MapPin, Building2, Loader2, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Application {
    id: string;
    status: string;
    applied_at: string;
    updated_at: string;
    job: {
        id: string;
        job_title: string;
        location: string | null;
        job_type: string;
        status: string;
        company: { company_name: string; logo_url: string | null };
    };
}

const APP_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Applied", variant: "secondary" },
    reviewed: { label: "Under Review", variant: "outline" },
    shortlisted: { label: "Shortlisted", variant: "default" },
    rejected: { label: "Not Progressing", variant: "destructive" },
    hired: { label: "Hired", variant: "default" },
    withdrawn: { label: "Withdrawn", variant: "secondary" },
};

const JOB_TYPE_LABELS: Record<string, string> = {
    full_time: "Full Time", part_time: "Part Time", contract: "Contract",
    internship: "Internship", freelance: "Freelance",
};

function fmt(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function ApplicationsClient() {
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [withdrawing, setWithdrawing] = useState<string | null>(null);

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/candidate/applications");
        if (res.ok) {
            const d = await res.json();
            setApplications(d.applications);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchApplications(); }, [fetchApplications]);

    async function withdraw(appId: string) {
        if (!confirm("Withdraw this application?")) return;
        setWithdrawing(appId);
        try {
            const res = await fetch(`/api/candidate/applications/${appId}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error || "Failed to withdraw"); return; }
            toast.success("Application withdrawn");
            fetchApplications();
        } finally {
            setWithdrawing(null);
        }
    }

    if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">My Applications</h1>
                    <p className="text-muted-foreground text-sm mt-1">{applications.length} application{applications.length !== 1 ? "s" : ""}</p>
                </div>
                <Button variant="outline" onClick={() => router.push("/candidate/jobs")}>
                    Browse Jobs
                </Button>
            </div>

            {applications.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>You haven&apos;t applied to any jobs yet.</p>
                    <Button className="mt-4" onClick={() => router.push("/candidate/jobs")}>Browse Available Jobs</Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {applications.map((app) => {
                        const statusInfo = APP_STATUS[app.status] ?? { label: app.status, variant: "secondary" as const };
                        const job = Array.isArray(app.job) ? app.job[0] : app.job;
                        const company = Array.isArray(job?.company) ? job.company[0] : job?.company;
                        const canWithdraw = ["pending", "reviewed"].includes(app.status);

                        return (
                            <Card key={app.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                {company?.logo_url
                                                    ? <img src={company.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                                                    : <Building2 className="h-5 w-5 text-muted-foreground" />
                                                }
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-sm truncate">{job?.job_title}</h3>
                                                <p className="text-xs text-muted-foreground">{company?.company_name}</p>
                                                <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                                                    {job?.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                                                    {job?.job_type && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{JOB_TYPE_LABELS[job.job_type] ?? job.job_type}</span>}
                                                    <span>Applied {fmt(app.applied_at)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => router.push(`/candidate/jobs/${job?.id}`)}>
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </Button>
                                                {canWithdraw && (
                                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500 hover:text-red-600" onClick={() => withdraw(app.id)} disabled={withdrawing === app.id}>
                                                        {withdrawing === app.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Withdraw"}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
