"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Loader2, FileText, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { JobCard, type JobCardData } from "./JobCard";
import {
    getInvitationJourneyDisplay,
    journeyVariantToCandidateClasses,
    normalizeEmbeddedOffer,
    type JourneyDisplay,
} from "@/lib/invitation-journey-status";

interface LinkedInvitation {
    id: string;
    status: string;
    pipeline_status: string | null;
    interview_confirmed: boolean;
    invitation_canceled: boolean;
    current_round_number: number | null;
    mis_rescheduled: boolean;
    job_offers?: { id: string; status: string }[];
}

interface Application {
    id: string;
    status: string;
    applied_at: string;
    job: JobCardData | JobCardData[] | null;
    job_invitation?: LinkedInvitation | null;
}

const APP_STATUS: Record<string, JourneyDisplay> = {
    pending: { label: "Applied", variant: "pending" },
    reviewed: { label: "Under Review", variant: "info" },
    shortlisted: { label: "Shortlisted", variant: "info" },
    rejected: { label: "Not Progressing", variant: "danger" },
    hired: { label: "Hired", variant: "success" },
    withdrawn: { label: "Withdrawn", variant: "muted" },
};

// Prefer the live interview-invitation stage; fall back to the coarse application status.
function stageDisplay(app: Application): JourneyDisplay {
    const inv = app.job_invitation;
    const terminalApp = ["rejected", "hired", "withdrawn"].includes(app.status);
    if (inv && !terminalApp) {
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
    return APP_STATUS[app.status] ?? { label: app.status, variant: "pending" };
}

function hasActiveInvitation(inv: LinkedInvitation | null | undefined): inv is LinkedInvitation {
    if (!inv) return false;
    if (inv.invitation_canceled || inv.status === "declined") return false;
    return !["rejected", "withdrawn", "expired"].includes(inv.pipeline_status ?? "active");
}

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
                    const stage = stageDisplay(app);
                    const active = hasActiveInvitation(app.job_invitation);
                    // Once an interview is underway, withdrawing an application no longer applies.
                    const canWithdraw = !active && ["pending", "reviewed"].includes(app.status);
                    return (
                        <JobCard
                            key={app.id}
                            job={job}
                            extraBadges={
                                <Badge variant="outline" className={`text-xs ${journeyVariantToCandidateClasses(stage.variant)}`}>
                                    {stage.label}
                                </Badge>
                            }
                            footer={
                                active ? (
                                    <Button
                                        size="sm"
                                        className="w-full"
                                        onClick={() => router.push(`/candidate/invitations/${app.job_invitation!.id}`)}
                                    >
                                        View Interview
                                        <ArrowRight className="ml-1 h-4 w-4" />
                                    </Button>
                                ) : (
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
                                )
                            }
                        />
                    );
                })}
            </div>
        </div>
    );
}
