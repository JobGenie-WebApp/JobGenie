"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { JobCard, type JobCardData } from "./JobCard";

interface Application {
    id: string;
    status: string;
    applied_at: string;
    job: JobCardData | JobCardData[] | null;
}

const APP_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "Applied", variant: "secondary" },
    reviewed: { label: "Under Review", variant: "outline" },
    shortlisted: { label: "Shortlisted", variant: "default" },
    rejected: { label: "Not Progressing", variant: "destructive" },
    hired: { label: "Hired", variant: "default" },
    withdrawn: { label: "Withdrawn", variant: "secondary" },
};

export function AppliedJobsView() {
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

    const withdraw = async (appId: string) => {
        setWithdrawing(appId);
        try {
            const res = await fetch(`/api/candidate/applications/${appId}`, { method: "DELETE" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { toast.error(data.error || "Failed to withdraw"); return; }
            toast.success("Application withdrawn");
            setApplications((list) => list.filter((a) => a.id !== appId));
        } finally {
            setWithdrawing(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (applications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="text-muted-foreground mb-4 h-12 w-12 opacity-30" />
                <h3 className="mb-2 text-xl font-semibold">No applications yet</h3>
                <p className="text-muted-foreground mb-6">Jobs you apply for will appear here so you can track their status.</p>
                <Button onClick={() => router.push("/candidate/jobs")}>
                    <Briefcase className="mr-2 h-4 w-4" />Browse Jobs
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <p className="text-muted-foreground text-sm">{applications.length} application{applications.length !== 1 ? "s" : ""}</p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {applications.map((app) => {
                    const job = Array.isArray(app.job) ? app.job[0] : app.job;
                    if (!job) return null;
                    const statusInfo = APP_STATUS[app.status] ?? { label: app.status, variant: "secondary" as const };
                    const canWithdraw = ["pending", "reviewed"].includes(app.status);
                    return (
                        <JobCard
                            key={app.id}
                            job={job}
                            extraBadges={<Badge variant={statusInfo.variant} className="text-xs">{statusInfo.label}</Badge>}
                            footer={
                                <>
                                    <Button variant="outline" size="sm" className={canWithdraw ? "w-1/2" : "w-full"} onClick={() => router.push(`/candidate/jobs/${job.id}`)}>
                                        View Details
                                    </Button>
                                    {canWithdraw && (
                                        <Button variant="ghost" size="sm" className="w-1/2 text-red-500 hover:text-red-600" onClick={() => withdraw(app.id)} disabled={withdrawing === app.id}>
                                            {withdrawing === app.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Withdraw"}
                                        </Button>
                                    )}
                                </>
                            }
                        />
                    );
                })}
            </div>
        </div>
    );
}
