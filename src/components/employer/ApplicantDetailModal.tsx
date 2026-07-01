"use client";

import { useState } from "react";
import { CalendarPlus, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScheduleInterviewDialog } from "@/components/employer/ScheduleInterviewDialog";
import { CandidateDetailModal } from "@/app/employer/(dashboard)/candidates/CandidateDetailModal";

export interface ApplicantLinkedInvitation {
    id: string;
    status: string;
    pipeline_status: string | null;
    interview_confirmed: boolean;
    invitation_canceled: boolean;
    current_round_number: number | null;
    mis_rescheduled: boolean;
    job_offers?: { id: string; status: string }[];
}

export interface ApplicantApplication {
    id: string;
    status: string;
    cover_letter: string | null;
    resume_url: string | null;
    notes: string | null;
    applied_at: string;
    job: { id: string; job_title: string; industry: string | null } | null;
    candidate: { id: string; first_name: string; last_name: string } | null;
    job_invitation: ApplicantLinkedInvitation | null;
}

function fmt(dateStr: string): string {
    try {
        return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch {
        return dateStr;
    }
}

const STATUS_LABEL: Record<string, string> = {
    pending: "Applied",
    reviewed: "Under Review",
    shortlisted: "Shortlisted",
    rejected: "Not Selected",
    withdrawn: "Withdrawn",
    hired: "Hired",
};

export function hasActiveInvitation(inv: ApplicantLinkedInvitation | null | undefined): inv is ApplicantLinkedInvitation {
    if (!inv) return false;
    if (inv.invitation_canceled || inv.status === "declined") return false;
    return !["rejected", "withdrawn", "expired"].includes(inv.pipeline_status ?? "active");
}

// ─── Actions injected into the candidate profile modal ───────────────────────────

function ApplicationActions({
    app,
    onRefresh,
    onClose,
}: {
    app: ApplicantApplication;
    onRefresh: () => void;
    onClose: () => void;
}) {
    const router = useRouter();
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [rejecting, setRejecting] = useState(false);

    const activeInv = hasActiveInvitation(app.job_invitation);
    const terminal = ["rejected", "hired", "withdrawn"].includes(app.status);
    const canAct = !activeInv && !terminal;

    const handleReject = async () => {
        setRejecting(true);
        try {
            const res = await fetch(`/api/employer/applications/${app.id}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: rejectReason.trim() || undefined }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Applicant rejected");
                setShowReject(false);
                setRejectReason("");
                onRefresh();
                onClose();
            } else {
                toast.error(data.error || "Failed to reject");
            }
        } finally {
            setRejecting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Application</h3>
                <span className="text-xs text-muted-foreground">Applied {fmt(app.applied_at)}</span>
            </div>

            {app.cover_letter && (
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Cover letter</Label>
                    <div className="max-h-48 overflow-y-auto rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                        {app.cover_letter}
                    </div>
                </div>
            )}

            {canAct ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Button className="flex-1 cursor-pointer" onClick={() => setScheduleOpen(true)}>
                        <CalendarPlus className="mr-1 h-4 w-4" />
                        Schedule Interview
                    </Button>
                    <Button
                        variant="outline"
                        className="text-destructive hover:text-destructive cursor-pointer"
                        onClick={() => { setRejectReason(""); setShowReject(true); }}
                    >
                        <XCircle className="mr-1 h-4 w-4" />
                        Reject
                    </Button>
                </div>
            ) : activeInv ? (
                <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 p-3">
                    <p className="text-sm text-muted-foreground">
                        In the interview pipeline. Manage rounds and offers on the board.
                    </p>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/employer/invitations?id=${app.job_invitation!.id}`)}
                    >
                        Open
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">
                    {STATUS_LABEL[app.status] ?? app.status}
                    {app.status === "rejected" && app.notes ? ` — ${app.notes}` : ""}
                </p>
            )}

            {/* Schedule interview — posts to the application-linked route */}
            <ScheduleInterviewDialog
                open={scheduleOpen}
                onOpenChange={setScheduleOpen}
                endpoint={`/api/employer/applications/${app.id}/schedule-interview`}
                positionLabel={app.job?.job_title}
                onSuccess={() => { setScheduleOpen(false); onRefresh(); onClose(); }}
            />

            {/* Reject confirmation */}
            <AlertDialog open={showReject} onOpenChange={setShowReject}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reject this applicant?</AlertDialogTitle>
                        <AlertDialogDescription>
                            The candidate will be notified that they were not selected. You can add an optional note shared with them.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="app-reject-reason" className="text-sm">Reason (optional)</Label>
                        <Textarea
                            id="app-reject-reason"
                            placeholder="e.g. We're looking for more experience with…"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            maxLength={500}
                            rows={3}
                            disabled={rejecting}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={rejecting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleReject(); }}
                            disabled={rejecting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {rejecting ? "Rejecting..." : "Reject Applicant"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ─── Applicant detail modal: full candidate profile + application actions ────────

export function ApplicantDetailModal({
    app,
    onClose,
    onRefresh,
}: {
    app: ApplicantApplication | null;
    onClose: () => void;
    onRefresh: () => void;
}) {
    if (!app || !app.candidate) return null;

    return (
        <CandidateDetailModal
            candidateId={app.candidate.id}
            onClose={onClose}
            actionsSlot={<ApplicationActions app={app} onRefresh={onRefresh} onClose={onClose} />}
        />
    );
}
