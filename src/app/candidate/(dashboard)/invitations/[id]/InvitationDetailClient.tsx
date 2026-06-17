"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    Calendar, Clock, Building2, MapPin, Loader2, User, Phone, Globe,
    Check, Mail, Video, MapPinned, Copy, ExternalLink, X, AlertCircle,
    CheckCircle2, TrendingUp, Award, XCircle, MessageSquare, PartyPopper,
    CalendarClock, Send, Ban, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { formatUTCTime, formatUTCDate, formatTimestamp } from "@/lib/date-utils";
import { formatIndustry, formatPhoneNumber, cn } from "@/lib/utils";
import { JobOfferCard } from "@/components/candidate/JobOfferCard";
import { createClient } from "@/lib/supabase/client";
import { getInvitationJourneyDisplay, normalizeEmbeddedOffer } from "@/lib/invitation-journey-status";
import { RoundResponseCard } from "@/components/candidate/RoundResponseCard";
import useSWR from "swr";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TimeSlot {
    date: string;
    time: string;
    order: number;
    is_alternative?: boolean;
}

interface InterviewRound {
    id: string;
    round_number: number;
    round_label: string | null;
    status: string;
    outcome: string | null;
    outcome_notes: string | null;
    outcome_at: string | null;
    given_time_slots: TimeSlot[] | null;
    alternative_dates: TimeSlot[] | null;
    selected_time_slot: TimeSlot | null;
    interview_mode: string | null;
    confirmed_time: string | null;
    meeting_link: string | null;
    interview_address: string | null;
    map_link: string | null;
    confirmed_at: string | null;
    sent_at: string;
    viewed_at: string | null;
    responded_at: string | null;
    interview_confirmed?: boolean;
    round_canceled?: boolean;
    canceled_by?: string | null;
    cancellation_reason?: string | null;
    canceled_at?: string | null;
    mis_rescheduled?: boolean;
    mis_reschedule_data?: {
        date: string; time: string;
        interview_mode: "online" | "physical";
        meeting_link?: string; interview_address?: string;
        map_link?: string; notes?: string;
    } | null;
}

interface InvitationDetail {
    id: string;
    industry: string;
    job_designation: string;
    message: string | null;
    given_time_slots: TimeSlot[];
    alternative_dates: TimeSlot[];
    selected_time_slot: TimeSlot | null;
    interview_mode: string | null;
    status: string;
    sent_at: string;
    viewed_at: string | null;
    responded_at: string | null;
    interview_confirmed: boolean;
    confirmed_time: string | null;
    meeting_link: string | null;
    interview_address: string | null;
    map_link: string | null;
    confirmed_at: string | null;
    invitation_canceled: boolean;
    canceled_by: string | null;
    cancellation_reason: string | null;
    canceled_at: string | null;
    mis_rescheduled?: boolean;
    mis_rescheduled_at?: string;
    mis_reschedule_data?: {
        date: string; time: string;
        interview_mode: "online" | "physical";
        meeting_link?: string; interview_address?: string;
        map_link?: string; notes?: string;
    };
    company: {
        company_name: string; logo_url: string | null;
        industry: string; headoffice_location: string | null;
        bio: string | null; website: string | null; phone: string | null;
    };
    employer: {
        first_name: string; last_name: string;
        designation: string | null; email: string;
        phone: string | null; job_title: string | null;
        department: string | null; profile_image_url: string | null;
    };
    pipeline_status?: string | null;
    current_round_number?: number | null;
    candidate_reschedule_requested?: boolean;
    reschedule_request_reason?: string | null;
    job_offers?: { id: string; status: string } | { id: string; status: string }[] | null;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

// ─── Roadmap builder ──────────────────────────────────────────────────────────
type StepStatus = "completed" | "current" | "error" | "warning" | "upcoming";

interface RoadmapStep {
    key: string;
    label: string;
    sublabel?: string;
    status: StepStatus;
    Icon: React.ComponentType<{ className?: string }>;
    // true = this step should be auto-selected as default when data loads
    isDefaultActive?: boolean;
}

function buildRoadmap(
    inv: InvitationDetail,
    rounds: InterviewRound[],
    jobOffer: { id: string; status: string } | null,
): RoadmapStep[] {
    const steps: RoadmapStep[] = [];

    // 1. Invitation received – always done
    steps.push({
        key: "invite",
        label: "Invitation received",
        sublabel: formatTimestamp(inv.sent_at, "MMM d, yyyy"),
        status: "completed",
        Icon: Send,
    });

    // Terminal: declined
    if (inv.status === "declined") {
        steps.push({
            key: "declined",
            label: "Invitation declined",
            sublabel: inv.responded_at ? formatTimestamp(inv.responded_at, "MMM d, yyyy") : undefined,
            status: "error", Icon: Ban, isDefaultActive: true,
        });
        return steps;
    }

    // Terminal: expired
    if (inv.status === "expired") {
        steps.push({ key: "expired", label: "Invitation expired", status: "error", Icon: AlertCircle, isDefaultActive: true });
        return steps;
    }

    // Pending response
    if (inv.status === "pending" || inv.status === "viewed") {
        steps.push({ key: "pending", label: "Select a time slot", status: "current", Icon: CalendarClock, isDefaultActive: true });
        return steps;
    }

    // Accepted
    steps.push({
        key: "accepted",
        label: "Invitation accepted",
        sublabel: inv.responded_at ? formatTimestamp(inv.responded_at, "MMM d, yyyy") : undefined,
        status: "completed", Icon: CheckCircle2,
    });

    // Awaiting confirmation
    if (!inv.interview_confirmed && !inv.invitation_canceled) {
        steps.push({ key: "awaiting", label: "Awaiting confirmation", status: "warning", Icon: Clock, isDefaultActive: true });
        return steps;
    }

    // Canceled (no reschedule)
    if (inv.invitation_canceled && !inv.mis_rescheduled) {
        steps.push({
            key: "canceled",
            label: "Interview canceled",
            sublabel: inv.canceled_at ? formatTimestamp(inv.canceled_at, "MMM d, yyyy") : undefined,
            status: "error", Icon: XCircle, isDefaultActive: true,
        });
        return steps;
    }

    // Multi-round flow
    if (rounds.length > 0) {
        let foundActive = false;
        for (const r of rounds) {
            const label = r.round_label ?? `Round ${r.round_number}`;
            if (r.outcome === "advance") {
                steps.push({ key: `round-${r.id}`, label, sublabel: "Passed ✓", status: "completed", Icon: TrendingUp });
            } else if (r.round_canceled) {
                steps.push({ key: `round-${r.id}`, label, sublabel: r.mis_rescheduled ? "Rescheduled" : "Cancelled", status: r.mis_rescheduled ? "warning" : "error", Icon: r.mis_rescheduled ? RotateCcw : XCircle, isDefaultActive: !foundActive });
                foundActive = true;
            } else if (r.outcome === "reject") {
                steps.push({ key: `round-${r.id}`, label, sublabel: "Not selected", status: "error", Icon: XCircle, isDefaultActive: !foundActive });
                foundActive = true;
                return steps; // terminal
            } else if (r.outcome === "offer") {
                steps.push({ key: `round-${r.id}`, label, sublabel: "Offer issued", status: "completed", Icon: Award });
            } else if (r.status === "confirmed" || r.confirmed_at) {
                steps.push({ key: `round-${r.id}`, label, sublabel: "Scheduled", status: "current", Icon: CheckCircle2, isDefaultActive: !foundActive });
                foundActive = true;
            } else if (r.status === "accepted") {
                steps.push({ key: `round-${r.id}`, label, sublabel: "Awaiting confirmation", status: "warning", Icon: Clock, isDefaultActive: !foundActive });
                foundActive = true;
            } else {
                steps.push({ key: `round-${r.id}`, label, sublabel: "Response needed", status: "current", Icon: AlertCircle, isDefaultActive: !foundActive });
                foundActive = true;
            }
        }
    } else {
        // Single-interview flow
        if (inv.mis_rescheduled) {
            steps.push({ key: "confirmed", label: "Interview confirmed", status: "completed", Icon: CheckCircle2 });
            steps.push({ key: "rescheduled", label: "Rescheduled", status: "current", Icon: RotateCcw, isDefaultActive: true });
        } else {
            steps.push({
                key: "confirmed",
                label: "Interview confirmed",
                sublabel: inv.confirmed_at ? formatTimestamp(inv.confirmed_at, "MMM d, yyyy") : undefined,
                status: "current", Icon: CheckCircle2, isDefaultActive: true,
            });
        }
    }

    // Job offer – always at the end when present
    if (jobOffer) {
        if (jobOffer.status === "accepted") {
            steps.push({ key: "offer", label: "Offer accepted", status: "completed", Icon: PartyPopper });
        } else if (jobOffer.status === "rejected") {
            steps.push({ key: "offer", label: "Offer declined", status: "error", Icon: XCircle, isDefaultActive: true });
        } else {
            // Pending offer is the most important current step
            steps.push({ key: "offer", label: "Job offer received", status: "current", Icon: Award, isDefaultActive: true });
        }
        // Mark previous default-active steps as non-default since offer takes priority
        steps.forEach((s, i) => {
            if (s.key !== "offer") s.isDefaultActive = false;
        });
    }

    return steps;
}

// ─── Roadmap timeline component ───────────────────────────────────────────────
const stepColors: Record<StepStatus, { dot: string; line: string; label: string; icon: string }> = {
    completed: { dot: "bg-emerald-500 ring-emerald-200 dark:ring-emerald-900", line: "bg-emerald-200 dark:bg-emerald-900", label: "text-muted-foreground", icon: "text-emerald-500" },
    current:   { dot: "bg-primary ring-primary/20", line: "bg-border", label: "text-foreground font-semibold", icon: "text-primary" },
    warning:   { dot: "bg-amber-400 ring-amber-200 dark:ring-amber-900", line: "bg-border", label: "text-foreground", icon: "text-amber-500" },
    error:     { dot: "bg-red-500 ring-red-200 dark:ring-red-900", line: "bg-border", label: "text-muted-foreground", icon: "text-red-500" },
    upcoming:  { dot: "bg-border ring-border", line: "bg-border", label: "text-muted-foreground", icon: "text-muted-foreground" },
};

function JourneyTimeline({ steps, activeKey, onSelect }: { steps: RoadmapStep[]; activeKey: string; onSelect: (k: string) => void }) {
    return (
        <div className="space-y-0">
            {steps.map((step, i) => {
                const isLast = i === steps.length - 1;
                const isActive = step.key === activeKey;
                const colors = stepColors[step.status];
                const { Icon } = step;
                return (
                    <div key={step.key} className="flex gap-3 group">
                        {/* Spine column */}
                        <div className="flex flex-col items-center w-8 flex-shrink-0 pt-0.5">
                            <div className={cn(
                                "relative w-7 h-7 rounded-full ring-4 flex items-center justify-center flex-shrink-0 transition-all duration-150 z-10",
                                colors.dot,
                                isActive && "ring-[5px] scale-110 shadow-md",
                            )}>
                                <Icon className={cn("h-3.5 w-3.5", step.status === "completed" ? "text-white" : isActive ? "text-primary-foreground" : colors.icon)} />
                            </div>
                            {!isLast && <div className={cn("w-0.5 flex-1 mt-1 min-h-[24px]", colors.line)} />}
                        </div>

                        {/* Label */}
                        <button
                            onClick={() => onSelect(step.key)}
                            className={cn(
                                "text-left flex-1 min-w-0 pb-6 pr-1 transition-colors",
                                isActive ? "" : "hover:opacity-80",
                            )}
                        >
                            <p className={cn(
                                "text-[13px] leading-snug transition-colors",
                                colors.label,
                                isActive && "text-foreground font-semibold",
                            )}>
                                {step.label}
                            </p>
                            {step.sublabel && (
                                <p className={cn(
                                    "text-[11px] mt-0.5",
                                    isActive ? "text-muted-foreground" : "text-muted-foreground/70",
                                )}>
                                    {step.sublabel}
                                </p>
                            )}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Detail panels ────────────────────────────────────────────────────────────

function DetailCard({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("rounded-2xl border border-border bg-card/50 overflow-hidden", className)}>
            {children}
        </div>
    );
}

function DetailRow({ icon, label, value, children }: { icon: React.ReactNode; label: string; value?: string; children?: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 py-3 px-4 border-b border-border/60 last:border-b-0">
            <div className="mt-0.5 text-muted-foreground flex-shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground mb-0.5">{label}</p>
                {value && <p className="text-sm font-medium text-foreground">{value}</p>}
                {children}
            </div>
        </div>
    );
}

function StatusBanner({ icon, title, description, variant }: { icon: React.ReactNode; title: string; description?: string; variant: "info" | "success" | "warning" | "error" | "muted" }) {
    const styles = {
        info:    "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200",
        success: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200",
        warning: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200",
        error:   "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200",
        muted:   "bg-muted/60 border-border text-muted-foreground",
    }[variant];
    return (
        <div className={cn("rounded-xl border px-4 py-3 flex items-start gap-3", styles)}>
            <div className="mt-0.5 flex-shrink-0">{icon}</div>
            <div>
                <p className="text-sm font-semibold leading-snug">{title}</p>
                {description && <p className="text-xs mt-0.5 opacity-80 leading-relaxed">{description}</p>}
            </div>
        </div>
    );
}

// Panel: Invitation received / accepted (history view)
function InvitePanel({ inv }: { inv: InvitationDetail }) {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Invitation details</h3>
            <DetailCard>
                <DetailRow icon={<Send className="h-4 w-4" />} label="Received" value={formatTimestamp(inv.sent_at, "MMMM d, yyyy 'at' HH:mm")} />
                {inv.viewed_at && <DetailRow icon={<CheckCircle2 className="h-4 w-4" />} label="Viewed" value={formatTimestamp(inv.viewed_at, "MMMM d, yyyy 'at' HH:mm")} />}
            </DetailCard>
            {inv.message && (
                <div>
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">Message from employer</p>
                    <div className="rounded-xl bg-muted/40 border border-border px-4 py-3">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{inv.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Panel: Pending – select time slot
function PendingPanel({ inv, onAccept, onDecline, isSubmitting, selectedSlot, setSelectedSlot, requestReschedule, setRequestReschedule, rescheduleReason, setRescheduleReason }: {
    inv: InvitationDetail; onAccept: () => void; onDecline: () => void; isSubmitting: boolean;
    selectedSlot: TimeSlot | null; setSelectedSlot: (s: TimeSlot | null) => void;
    requestReschedule: boolean; setRequestReschedule: (v: boolean) => void;
    rescheduleReason: string; setRescheduleReason: (v: string) => void;
}) {
    return (
        <div className="space-y-5">
            <StatusBanner icon={<AlertCircle className="h-4 w-4" />} title="Action required" description="Select a time slot to confirm your interview." variant="info" />

            {/* Interview format */}
            <div>
                <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">Interview format</p>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {inv.interview_mode === "online" ? <Video className="h-4.5 w-4.5 text-primary" /> : <MapPinned className="h-4.5 w-4.5 text-primary" />}
                    </div>
                    <div>
                        <p className="text-sm font-semibold capitalize">{inv.interview_mode} Interview</p>
                        <p className="text-xs text-muted-foreground">{inv.interview_mode === "online" ? "Link will be provided after confirmation" : "In-person at the specified location"}</p>
                    </div>
                </div>
                {inv.interview_mode === "physical" && inv.interview_address && (
                    <div className="mt-2 rounded-xl border border-border bg-card/60 px-4 py-3 space-y-2">
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-foreground/90">{inv.interview_address}</p>
                        </div>
                        {inv.map_link && <Button variant="outline" size="sm" asChild className="h-7 text-xs"><a href={inv.map_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1.5" />Open in Maps</a></Button>}
                    </div>
                )}
            </div>

            {/* Primary slots */}
            {(inv.given_time_slots || []).length > 0 && (
                <div>
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">Proposed times</p>
                    <div className="grid gap-2">
                        {(inv.given_time_slots || []).map((slot, i) => {
                            const sel = selectedSlot?.date === slot.date && selectedSlot?.time === slot.time && !selectedSlot?.is_alternative;
                            return (
                                <button key={i} onClick={() => setSelectedSlot(slot)} className={cn(
                                    "relative w-full rounded-xl border-2 px-4 py-3 text-left transition-all duration-150",
                                    sel ? "border-primary bg-primary/[0.06] shadow-sm" : "border-border hover:border-border/80 hover:bg-muted/40",
                                )}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold">{formatUTCDate(slot.date, "EEEE, MMM d, yyyy")}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Clock className="h-3 w-3" />{formatUTCTime(slot.date, slot.time)}</p>
                                        </div>
                                        <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", sel ? "border-primary bg-primary" : "border-border")}>
                                            {sel && <Check className="h-3 w-3 text-primary-foreground" />}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Alternative dates */}
            {(inv.alternative_dates || []).length > 0 && (
                <div>
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">Alternative dates</p>
                    <div className="grid gap-2">
                        {(inv.alternative_dates || []).map((slot, i) => {
                            const altSlot = { ...slot, is_alternative: true };
                            const sel = selectedSlot?.date === slot.date && selectedSlot?.time === slot.time && selectedSlot?.is_alternative;
                            return (
                                <button key={i} onClick={() => setSelectedSlot(altSlot)} className={cn(
                                    "relative w-full rounded-xl border-2 px-4 py-3 text-left transition-all duration-150",
                                    sel ? "border-emerald-500 bg-emerald-500/[0.06]" : "border-border hover:border-emerald-300 hover:bg-muted/40",
                                )}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold">{formatUTCDate(slot.date, "EEEE, MMM d, yyyy")}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">Time will be set by employer</p>
                                        </div>
                                        <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", sel ? "border-emerald-500 bg-emerald-500" : "border-border")}>
                                            {sel && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Actions */}
            {selectedSlot && (
                <div className="rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-4 space-y-3">
                    <div className="text-xs text-muted-foreground space-y-0.5">
                        <p><span className="font-medium text-foreground">Selected:</span> {formatUTCDate(selectedSlot.date, "EEE, MMM d, yyyy")}{!selectedSlot.is_alternative && ` · ${formatUTCTime(selectedSlot.date, selectedSlot.time)}`}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button className="flex-1 h-9" onClick={onAccept} disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Processing…</> : <><Check className="h-3.5 w-3.5 mr-1.5" />Confirm Selection</>}
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={onDecline} disabled={isSubmitting}>
                            <X className="h-3.5 w-3.5 mr-1.5" />Decline
                        </Button>
                    </div>
                </div>
            )}

            {/* Request reschedule */}
            <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                <div className="flex items-start gap-3">
                    <Checkbox id="rr" checked={requestReschedule} onCheckedChange={v => setRequestReschedule(!!v)} className="mt-0.5" />
                    <div className="flex-1 space-y-1">
                        <Label htmlFor="rr" className="text-sm font-medium cursor-pointer">None of these work for me</Label>
                        <p className="text-xs text-muted-foreground">Request a different date and time from the employer.</p>
                        {requestReschedule && (
                            <>
                                <Textarea placeholder="Suggest your availability, e.g. I'm free Monday afternoon next week…" value={rescheduleReason} onChange={e => setRescheduleReason(e.target.value)} className="text-sm mt-2 min-h-[72px] resize-none" />
                                <Button variant="outline" size="sm" onClick={onDecline} disabled={isSubmitting} className="mt-1 h-8 text-xs">
                                    {isSubmitting ? <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />Sending…</> : "Send Request"}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Panel: Awaiting employer confirmation
function AwaitingPanel({ inv, onCancelAcceptance, isSubmitting }: { inv: InvitationDetail; onCancelAcceptance: () => void; isSubmitting: boolean }) {
    const slot = inv.selected_time_slot;
    return (
        <div className="space-y-4">
            <StatusBanner icon={<Clock className="h-4 w-4" />} title="Awaiting employer confirmation" description="You've accepted this invitation. The employer will confirm the final details shortly." variant="warning" />
            {slot && (
                <div>
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">Your selection</p>
                    <DetailCard>
                        <DetailRow icon={<Calendar className="h-4 w-4" />} label="Date" value={formatUTCDate(slot.date, "EEEE, MMMM d, yyyy")} />
                        <DetailRow icon={<Clock className="h-4 w-4" />} label="Time" value={formatUTCTime(slot.date, slot.time)} />
                        {inv.interview_mode && <DetailRow icon={inv.interview_mode === "online" ? <Video className="h-4 w-4" /> : <MapPinned className="h-4 w-4" />} label="Mode" value={`${inv.interview_mode} Interview`} />}
                    </DetailCard>
                </div>
            )}
            <Button variant="outline" size="sm" className="h-8 text-xs border-border/80 text-muted-foreground hover:text-foreground" onClick={onCancelAcceptance} disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Processing…</> : "Cancel Acceptance"}
            </Button>
        </div>
    );
}

// Panel: Interview confirmed
function ConfirmedPanel({ inv, onCancelInterview, isPast }: { inv: InvitationDetail; onCancelInterview: () => void; isPast?: boolean }) {
    const slot = inv.selected_time_slot;
    const isCanceled = inv.invitation_canceled && !inv.mis_rescheduled;
    // Links disabled when the interview is in the past (pipeline moved on or canceled)
    const linksDisabled = isCanceled || isPast;
    return (
        <div className="space-y-4">
            <StatusBanner
                icon={isCanceled ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                title={isCanceled ? "Interview canceled" : "Interview confirmed"}
                description={isCanceled ? "This interview has been canceled." : "Your interview is scheduled. All details are confirmed."}
                variant={isCanceled ? "error" : "success"}
            />
            {slot && (
                <div>
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">Interview details</p>
                    <DetailCard className={linksDisabled ? "opacity-60" : undefined}>
                        <DetailRow icon={<Calendar className="h-4 w-4" />} label="Date" value={formatUTCDate(slot.date, "EEEE, MMMM d, yyyy")} />
                        <DetailRow icon={<Clock className="h-4 w-4" />} label="Time" value={formatUTCTime(slot.date, inv.confirmed_time || slot.time)} />
                        {inv.interview_mode && (
                            <DetailRow icon={inv.interview_mode === "online" ? <Video className="h-4 w-4" /> : <MapPinned className="h-4 w-4" />} label="Mode" value={`${inv.interview_mode} Interview`} />
                        )}
                        {inv.interview_mode === "online" && inv.meeting_link && (
                            <DetailRow icon={<Video className="h-4 w-4" />} label="Meeting link">
                                <div className="flex gap-2 mt-1">
                                    <Input value={inv.meeting_link} readOnly disabled={linksDisabled} className="flex-1 h-8 text-xs" />
                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 flex-shrink-0" disabled={linksDisabled} onClick={() => { navigator.clipboard.writeText(inv.meeting_link!); toast.success("Copied!"); }}><Copy className="h-3.5 w-3.5" /></Button>
                                    <Button size="sm" className="h-8 flex-shrink-0" disabled={linksDisabled} asChild={!linksDisabled}>
                                        {linksDisabled ? <span><ExternalLink className="h-3.5 w-3.5 mr-1 inline" />Join</span> : <a href={inv.meeting_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5 mr-1" />Join</a>}
                                    </Button>
                                </div>
                            </DetailRow>
                        )}
                        {inv.interview_mode === "physical" && inv.interview_address && (
                            <DetailRow icon={<MapPin className="h-4 w-4" />} label="Location">
                                <p className="text-sm text-foreground/90 mt-0.5">{inv.interview_address}</p>
                                {inv.map_link && (
                                    <Button size="sm" variant="outline" className="h-7 text-xs mt-2" disabled={linksDisabled} asChild={!linksDisabled}>
                                        {linksDisabled ? <span><ExternalLink className="h-3 w-3 mr-1.5 inline" />Open in Maps</span> : <a href={inv.map_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1.5" />Open in Maps</a>}
                                    </Button>
                                )}
                            </DetailRow>
                        )}
                    </DetailCard>
                    {linksDisabled && <p className="text-[11px] text-muted-foreground/60 mt-1.5 text-center">This interview has concluded — links are disabled.</p>}
                </div>
            )}
            {inv.message && (
                <div>
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">Message from employer</p>
                    <div className="rounded-xl bg-muted/40 border border-border px-4 py-3">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{inv.message}</p>
                    </div>
                </div>
            )}
            {!isCanceled && !isPast && (
                <button onClick={onCancelInterview} className="text-xs text-muted-foreground hover:text-red-500 transition-colors underline-offset-2 hover:underline">
                    Cancel this interview
                </button>
            )}
        </div>
    );
}

// Panel: Rescheduled
function RescheduledPanel({ inv }: { inv: InvitationDetail }) {
    const d = inv.mis_reschedule_data;
    if (!d) return null;
    return (
        <div className="space-y-4">
            <StatusBanner icon={<RotateCcw className="h-4 w-4" />} title="Interview rescheduled" description={inv.mis_rescheduled_at ? `Rescheduled on ${formatTimestamp(inv.mis_rescheduled_at, "MMMM d, yyyy")} by the coordinator.` : "Your interview has been rescheduled."} variant="info" />
            <div>
                <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">New schedule</p>
                <DetailCard>
                    <DetailRow icon={<Calendar className="h-4 w-4" />} label="Date" value={formatUTCDate(d.date, "EEEE, MMMM d, yyyy")} />
                    <DetailRow icon={<Clock className="h-4 w-4" />} label="Time" value={formatUTCTime(d.date, d.time)} />
                    <DetailRow icon={d.interview_mode === "online" ? <Video className="h-4 w-4" /> : <MapPinned className="h-4 w-4" />} label="Mode" value={`${d.interview_mode} Interview`} />
                    {d.interview_mode === "online" && d.meeting_link && (
                        <DetailRow icon={<Video className="h-4 w-4" />} label="Meeting link">
                            <div className="flex gap-2 mt-1">
                                <Input value={d.meeting_link} readOnly className="flex-1 h-8 text-xs" />
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 flex-shrink-0" onClick={() => { navigator.clipboard.writeText(d.meeting_link!); toast.success("Copied!"); }}><Copy className="h-3.5 w-3.5" /></Button>
                                <Button size="sm" className="h-8 flex-shrink-0" asChild><a href={d.meeting_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5 mr-1" />Join</a></Button>
                            </div>
                        </DetailRow>
                    )}
                    {d.interview_mode === "physical" && d.interview_address && (
                        <DetailRow icon={<MapPin className="h-4 w-4" />} label="Location">
                            <p className="text-sm text-foreground/90 mt-0.5">{d.interview_address}</p>
                            {d.map_link && <Button size="sm" variant="outline" className="h-7 text-xs mt-2" asChild><a href={d.map_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1.5" />Open in Maps</a></Button>}
                        </DetailRow>
                    )}
                    {d.notes && <DetailRow icon={<MessageSquare className="h-4 w-4" />} label="Notes" value={d.notes} />}
                </DetailCard>
            </div>
        </div>
    );
}

// Panel: Declined
function DeclinedPanel({ inv, onReconsider, isSubmitting }: { inv: InvitationDetail; onReconsider: () => void; isSubmitting: boolean }) {
    return (
        <div className="space-y-4">
            <StatusBanner icon={<Ban className="h-4 w-4" />} title="You declined this invitation" description={inv.responded_at ? `Declined on ${formatTimestamp(inv.responded_at, "MMMM d, yyyy")}` : undefined} variant="error" />
            <p className="text-sm text-muted-foreground">Changed your mind? You can reconsider this invitation and it will return to pending.</p>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onReconsider} disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Processing…</> : "Reconsider Invitation"}
            </Button>
        </div>
    );
}

// Panel: Canceled
function CanceledPanel({ inv }: { inv: InvitationDetail }) {
    return (
        <div className="space-y-4">
            <StatusBanner icon={<XCircle className="h-4 w-4" />} title="Interview canceled" description={inv.canceled_by ? `Canceled by ${inv.canceled_by}${inv.canceled_at ? ` on ${formatTimestamp(inv.canceled_at, "MMMM d, yyyy")}` : ""}` : undefined} variant="error" />
            {inv.cancellation_reason && (
                <div>
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">Reason provided</p>
                    <div className="rounded-xl bg-muted/40 border border-border px-4 py-3">
                        <p className="text-sm text-foreground/90">{inv.cancellation_reason}</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Panel: Single round details
function RoundPanel({ round, invitationId, onRefresh, onCancelRound }: { round: InterviewRound; invitationId: string; onRefresh: () => void; onCancelRound: () => void }) {
    const isPendingResponse = round.status === "pending" || round.status === "viewed";
    const isAwaiting = round.status === "accepted" && !round.confirmed_at;
    const isConfirmed = round.status === "confirmed" || !!round.confirmed_at;
    const slot = round.selected_time_slot;
    const roundLabel = round.round_label ?? `Round ${round.round_number}`;

    // Show cancelled state first
    if (round.round_canceled) {
        const d = round.mis_reschedule_data;
        return (
            <div className="space-y-4">
                <StatusBanner
                    icon={<XCircle className="h-4 w-4" />}
                    title={`${roundLabel} canceled`}
                    description={round.canceled_by ? `Canceled by ${round.canceled_by}${round.canceled_at ? ` on ${formatTimestamp(round.canceled_at, "MMMM d, yyyy")}` : ""}` : undefined}
                    variant="error"
                />
                {round.cancellation_reason && (
                    <div>
                        <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">Reason provided</p>
                        <div className="rounded-xl bg-muted/40 border border-border px-4 py-3">
                            <p className="text-sm text-foreground/90">{round.cancellation_reason}</p>
                        </div>
                    </div>
                )}
                {round.mis_rescheduled && d && (
                    <div className="space-y-3">
                        <StatusBanner icon={<RotateCcw className="h-4 w-4" />} title="Round rescheduled by coordinator" variant="info" />
                        <div>
                            <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">New schedule</p>
                            <DetailCard>
                                <DetailRow icon={<Calendar className="h-4 w-4" />} label="Date" value={formatUTCDate(d.date, "EEEE, MMMM d, yyyy")} />
                                <DetailRow icon={<Clock className="h-4 w-4" />} label="Time" value={formatUTCTime(d.date, d.time)} />
                                <DetailRow icon={d.interview_mode === "online" ? <Video className="h-4 w-4" /> : <MapPinned className="h-4 w-4" />} label="Mode" value={`${d.interview_mode} Interview`} />
                                {d.interview_mode === "online" && d.meeting_link && (
                                    <DetailRow icon={<Video className="h-4 w-4" />} label="Meeting link">
                                        <div className="flex gap-2 mt-1">
                                            <Input value={d.meeting_link} readOnly className="flex-1 h-8 text-xs" />
                                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 flex-shrink-0" onClick={() => { navigator.clipboard.writeText(d.meeting_link!); toast.success("Copied!"); }}><Copy className="h-3.5 w-3.5" /></Button>
                                            <Button size="sm" className="h-8 flex-shrink-0" asChild><a href={d.meeting_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5 mr-1" />Join</a></Button>
                                        </div>
                                    </DetailRow>
                                )}
                                {d.interview_mode === "physical" && d.interview_address && (
                                    <DetailRow icon={<MapPin className="h-4 w-4" />} label="Location">
                                        <p className="text-sm text-foreground/90 mt-0.5">{d.interview_address}</p>
                                        {d.map_link && <Button size="sm" variant="outline" className="h-7 text-xs mt-2" asChild><a href={d.map_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1.5" />Open in Maps</a></Button>}
                                    </DetailRow>
                                )}
                                {d.notes && <DetailRow icon={<MessageSquare className="h-4 w-4" />} label="Notes" value={d.notes} />}
                            </DetailCard>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (isPendingResponse) {
        return (
            <div className="space-y-4">
                <StatusBanner icon={<AlertCircle className="h-4 w-4" />} title={`${round.round_label ?? `Round ${round.round_number}`} — response needed`} description="Select a time slot for this interview round." variant="info" />
                <RoundResponseCard roundId={round.id} roundNumber={round.round_number} roundLabel={round.round_label} interviewMode={round.interview_mode} meetingLink={round.meeting_link} interviewAddress={round.interview_address} mapLink={round.map_link} givenTimeSlots={round.given_time_slots ?? []} onResponse={onRefresh} />
            </div>
        );
    }

    // Interview is over once any outcome is recorded
    const isDone = !!round.outcome;

    const outcomeStyle = {
        advance: { banner: "success" as const, icon: <TrendingUp className="h-4 w-4" />, title: "Congratulations! You've advanced to the next round.", },
        reject:  { banner: "error" as const,   icon: <XCircle className="h-4 w-4" />,   title: "Interview result: Not selected", },
        offer:   { banner: "success" as const,  icon: <Award className="h-4 w-4" />,     title: "Job offer received! Check the offer section.", },
    }[round.outcome ?? ""] ?? null;

    return (
        <div className="space-y-4">
            {isAwaiting && <StatusBanner icon={<Clock className="h-4 w-4" />} title="Awaiting confirmation" description="The employer will confirm the final time for this round shortly." variant="warning" />}
            {isConfirmed && !round.outcome && <StatusBanner icon={<CheckCircle2 className="h-4 w-4" />} title={`${round.round_label ?? `Round ${round.round_number}`} confirmed`} description="Your interview is scheduled." variant="success" />}
            {outcomeStyle && <StatusBanner icon={outcomeStyle.icon} title={outcomeStyle.title} variant={outcomeStyle.banner} />}

            {slot && !isPendingResponse && (
                <div>
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">Interview details</p>
                    <DetailCard className={isDone ? "opacity-60" : undefined}>
                        <DetailRow icon={<Calendar className="h-4 w-4" />} label="Date" value={formatUTCDate(slot.date, "EEEE, MMMM d, yyyy")} />
                        {slot.time && <DetailRow icon={<Clock className="h-4 w-4" />} label="Time" value={formatUTCTime(slot.date, slot.time)} />}
                        {round.interview_mode && <DetailRow icon={round.interview_mode === "online" ? <Video className="h-4 w-4" /> : <MapPinned className="h-4 w-4" />} label="Mode" value={`${round.interview_mode} Interview`} />}
                        {round.interview_mode === "online" && round.meeting_link && (
                            <DetailRow icon={<Video className="h-4 w-4" />} label="Meeting link">
                                <div className="flex gap-2 mt-1">
                                    <Input value={round.meeting_link} readOnly disabled={isDone} className="flex-1 h-8 text-xs" />
                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 flex-shrink-0" disabled={isDone} onClick={() => { navigator.clipboard.writeText(round.meeting_link!); toast.success("Copied!"); }}><Copy className="h-3.5 w-3.5" /></Button>
                                    <Button size="sm" className="h-8 flex-shrink-0" disabled={isDone} asChild={!isDone}>
                                        {isDone ? <span><ExternalLink className="h-3.5 w-3.5 mr-1 inline" />Join</span> : <a href={round.meeting_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5 mr-1" />Join</a>}
                                    </Button>
                                </div>
                            </DetailRow>
                        )}
                        {round.interview_mode === "physical" && round.interview_address && (
                            <DetailRow icon={<MapPin className="h-4 w-4" />} label="Location">
                                <p className="text-sm text-foreground/90 mt-0.5">{round.interview_address}</p>
                                {round.map_link && <Button size="sm" variant="outline" className="h-7 text-xs mt-2" disabled={isDone} asChild={!isDone}>
                                    {isDone ? <span><ExternalLink className="h-3 w-3 mr-1.5 inline" />Open in Maps</span> : <a href={round.map_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1.5" />Open in Maps</a>}
                                </Button>}
                            </DetailRow>
                        )}
                    </DetailCard>
                    {isDone && <p className="text-[11px] text-muted-foreground/60 mt-1.5 text-center">This interview has concluded — links are disabled.</p>}
                </div>
            )}

            {round.outcome_notes && (
                <div>
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground mb-2">Feedback from employer</p>
                    <div className="rounded-xl bg-muted/40 border border-border px-4 py-3">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{round.outcome_notes}</p>
                    </div>
                </div>
            )}
            {isConfirmed && !isDone && !round.round_canceled && (
                <button onClick={onCancelRound} className="text-xs text-muted-foreground hover:text-red-500 transition-colors underline-offset-2 hover:underline">
                    Cancel this round
                </button>
            )}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function InvitationDetailClient({ invitationId, onMutateList }: { invitationId: string; onMutateList?: () => void }) {
    const router = useRouter();
    const { data: invitationData, isLoading: invitationLoading, mutate: mutateInvitation } = useSWR(`/api/candidate/invitations/${invitationId}`, fetcher);
    const { data: offerData, mutate: mutateOffer } = useSWR(`/api/candidate/invitations/${invitationId}/offer`, fetcher);
    const { data: roundsData, mutate: mutateRounds } = useSWR(`/api/candidate/invitations/${invitationId}/rounds`, fetcher);

    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [requestReschedule, setRequestReschedule] = useState(false);
    const [rescheduleReason, setRescheduleReason] = useState("");
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");
    const [showRoundCancelDialog, setShowRoundCancelDialog] = useState<string | null>(null); // roundId
    const [roundCancellationReason, setRoundCancellationReason] = useState("");
    const [activeKey, setActiveKey] = useState<string>("");

    const invitation: InvitationDetail | null = invitationData?.success ? invitationData.data : null;
    const jobOffer = offerData?.success ? offerData.offer : null;
    const rounds: InterviewRound[] = roundsData?.success ? roundsData.data : [];

    // Real-time
    useEffect(() => {
        const supabase = createClient();
        const ch = supabase
            .channel(`inv-detail-${invitationId}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "job_invitations", filter: `id=eq.${invitationId}` }, () => { mutateInvitation(); mutateOffer(); mutateRounds(); })
            .on("postgres_changes", { event: "*", schema: "public", table: "job_offers", filter: `invitation_id=eq.${invitationId}` }, () => { mutateOffer(); mutateInvitation(); })
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [invitationId, mutateInvitation, mutateOffer, mutateRounds]);

    const roadmap = invitation ? buildRoadmap(invitation, rounds, jobOffer) : [];
    const roadmapKey = roadmap.map(s => `${s.key}:${s.status}`).join("|");

    // Set default active key whenever the roadmap shape changes (new invitation loaded or data arrives)
    useEffect(() => {
        if (!roadmap.length) return;
        const def = roadmap.find(s => s.isDefaultActive) ?? roadmap[roadmap.length - 1];
        setActiveKey(def.key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roadmapKey]);

    // Action handlers
    const handleAccept = async () => {
        if (!selectedSlot) { toast.error("Please select a time slot"); return; }
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/candidate/invitations/${invitationId}/respond`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "accept", selected_time_slot: selectedSlot }) });
            const d = await res.json();
            if (d.success) { toast.success("Invitation accepted!"); mutateInvitation(); onMutateList?.(); } else toast.error(d.error || "Failed to accept");
        } catch { toast.error("An error occurred"); } finally { setIsSubmitting(false); }
    };

    const handleDecline = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/candidate/invitations/${invitationId}/respond`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "decline", request_reschedule: requestReschedule, reschedule_reason: rescheduleReason }) });
            const d = await res.json();
            if (d.success) {
                toast.success("Invitation declined");
                mutateInvitation();
                onMutateList?.();
                if (!onMutateList) router.push("/candidate/invitations");
            } else toast.error(d.error || "Failed to decline");
        } catch { toast.error("An error occurred"); } finally { setIsSubmitting(false); }
    };

    const handleCancelAcceptance = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/candidate/invitations/${invitationId}/respond`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) });
            const d = await res.json();
            if (d.success) { toast.success("Acceptance cancelled"); mutateInvitation(); onMutateList?.(); } else toast.error(d.error || "Failed");
        } catch { toast.error("An error occurred"); } finally { setIsSubmitting(false); }
    };

    const handleCancelInterview = async () => {
        if (!cancellationReason.trim()) { toast.error("Please provide a reason"); return; }
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/candidate/invitations/${invitationId}/cancel-interview`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cancellation_reason: cancellationReason }) });
            const d = await res.json();
            if (d.success) { toast.success("Interview canceled"); setShowCancelDialog(false); setCancellationReason(""); mutateInvitation(); onMutateList?.(); } else toast.error(d.error || "Failed");
        } catch { toast.error("An error occurred"); } finally { setIsSubmitting(false); }
    };

    const handleCancelRound = async () => {
        if (!roundCancellationReason.trim()) { toast.error("Please provide a reason"); return; }
        if (!showRoundCancelDialog) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/candidate/interview-rounds/${showRoundCancelDialog}/cancel-round`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cancellation_reason: roundCancellationReason }) });
            const d = await res.json();
            if (d.success) { toast.success("Round canceled"); setShowRoundCancelDialog(null); setRoundCancellationReason(""); mutateRounds(); mutateInvitation(); onMutateList?.(); } else toast.error(d.error || "Failed to cancel round");
        } catch { toast.error("An error occurred"); } finally { setIsSubmitting(false); }
    };

    if (invitationLoading) {
        return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    if (!invitation) {
        return (
            <div className="flex items-center justify-center py-24 text-center">
                <div className="space-y-3">
                    <p className="font-semibold">Invitation not found</p>
                    {!onMutateList && <Button size="sm" onClick={() => router.push("/candidate/invitations")}>Back to Invitations</Button>}
                </div>
            </div>
        );
    }

    const embeddedOffer = normalizeEmbeddedOffer(invitation.job_offers);
    const offerForJourney = jobOffer ? { status: jobOffer.status } : embeddedOffer;
    const journey = getInvitationJourneyDisplay({
        status: invitation.status,
        invitation_canceled: invitation.invitation_canceled,
        interview_confirmed: invitation.interview_confirmed,
        mis_rescheduled: invitation.mis_rescheduled,
        pipeline_status: invitation.pipeline_status ?? null,
        current_round_number: invitation.current_round_number ?? null,
        candidate_reschedule_requested: invitation.candidate_reschedule_requested,
    }, offerForJourney);

    const journeyPill: Record<typeof journey.variant, string> = {
        pending: "bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-500/20",
        info:    "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 ring-indigo-500/20",
        success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20",
        danger:  "bg-red-500/10 text-red-700 dark:text-red-400 ring-red-500/20",
        muted:   "bg-muted text-muted-foreground ring-border",
    };

    const renderPanel = () => {
        if (!activeKey) return null;
        if (activeKey === "invite" || activeKey === "accepted") return <InvitePanel inv={invitation} />;
        if (activeKey === "pending") return <PendingPanel inv={invitation} onAccept={handleAccept} onDecline={handleDecline} isSubmitting={isSubmitting} selectedSlot={selectedSlot} setSelectedSlot={setSelectedSlot} requestReschedule={requestReschedule} setRequestReschedule={setRequestReschedule} rescheduleReason={rescheduleReason} setRescheduleReason={setRescheduleReason} />;
        if (activeKey === "awaiting") return <AwaitingPanel inv={invitation} onCancelAcceptance={handleCancelAcceptance} isSubmitting={isSubmitting} />;
        if (activeKey === "confirmed") {
            // isPast: the confirmed interview is historical — pipeline moved to rounds or invitation is canceled
            const isPast = rounds.length > 0 || !!invitation.invitation_canceled;
            return <ConfirmedPanel inv={invitation} onCancelInterview={() => setShowCancelDialog(true)} isPast={isPast} />;
        }
        if (activeKey === "rescheduled") return <RescheduledPanel inv={invitation} />;
        if (activeKey === "canceled" || activeKey === "expired") return <CanceledPanel inv={invitation} />;
        if (activeKey === "declined") return <DeclinedPanel inv={invitation} onReconsider={handleCancelAcceptance} isSubmitting={isSubmitting} />;
        if (activeKey === "offer" && jobOffer) return (
            <div className="space-y-4">
                <StatusBanner icon={<PartyPopper className="h-4 w-4" />} title="You've received a job offer!" description={`${invitation.company.company_name} has extended a formal offer for this position.`} variant="success" />
                <JobOfferCard invitationId={invitationId} offer={jobOffer} companyName={invitation.company.company_name} jobDesignation={invitation.job_designation} onRefresh={() => { void mutateOffer(); void mutateInvitation(); }} />
            </div>
        );
        if (activeKey.startsWith("round-")) {
            const roundId = activeKey.replace("round-", "");
            const round = rounds.find(r => r.id === roundId);
            if (round) return <RoundPanel round={round} invitationId={invitationId} onRefresh={() => { mutateRounds(); mutateInvitation(); }} onCancelRound={() => setShowRoundCancelDialog(round.id)} />;
        }
        return null;
    };

    return (
        <div className={cn("space-y-5 pb-8", !onMutateList && "max-w-5xl mx-auto")}>
            {/* ── Hero card ── */}
            <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
                {/* Top gradient strip */}
                <div className="h-1.5 bg-gradient-to-r from-primary via-primary/60 to-primary/20" />

                <div className="p-6 md:p-7">
                    <div className="flex items-start gap-5">
                        {/* Logo */}
                        <div className={cn(
                            "h-16 w-16 rounded-2xl bg-white dark:bg-zinc-800 border border-border shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0",
                            !invitation.company.logo_url && "bg-primary/5",
                        )}>
                            {invitation.company.logo_url
                                ? <img src={invitation.company.logo_url} alt={invitation.company.company_name} className="h-12 w-12 object-contain" />
                                : <Building2 className="h-7 w-7 text-primary/40" />
                            }
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div>
                                    <h1 className="text-xl font-bold leading-tight tracking-tight">{invitation.job_designation}</h1>
                                    <p className="text-sm text-muted-foreground mt-0.5 font-medium">{invitation.company.company_name}</p>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />{formatIndustry(invitation.industry)}
                                        </span>
                                        {invitation.company.headoffice_location && (
                                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />{invitation.company.headoffice_location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 flex-shrink-0", journeyPill[journey.variant])}>
                                    {journey.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Company bio */}
                    {invitation.company.bio && (
                        <>
                            <Separator className="my-4" />
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{invitation.company.bio}</p>
                            <div className="flex flex-wrap gap-4 mt-2">
                                {invitation.company.website && <a href={invitation.company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline"><Globe className="h-3.5 w-3.5" />Website</a>}
                                {invitation.company.phone && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3.5 w-3.5" />{invitation.company.phone}</span>}
                            </div>
                        </>
                    )}

                    {/* Contact */}
                    <Separator className="my-4" />
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/8 ring-1 ring-border flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-primary/70" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-tight">{invitation.employer.first_name} {invitation.employer.last_name}</p>
                            <p className="text-xs text-muted-foreground">{[invitation.employer.designation, invitation.employer.job_title, invitation.employer.department].filter(Boolean).join(" · ")}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {invitation.employer.email && (
                                <a href={`mailto:${invitation.employer.email}`} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted/50 transition-colors" title={invitation.employer.email}>
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                </a>
                            )}
                            {invitation.employer.phone && (
                                <a href={`tel:${invitation.employer.phone}`} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted/50 transition-colors" title={formatPhoneNumber(invitation.employer.phone)}>
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Content + Journey ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4 items-start">
                {/* Detail panel */}
                <div className="rounded-2xl border border-border bg-card p-6 min-h-[180px]">
                    {renderPanel() ?? <div className="flex items-center justify-center h-24"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
                </div>

                {/* Journey timeline */}
                <div className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-4">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Your journey</p>
                        <span className="text-[10px] text-muted-foreground/60">{roadmap.filter(s => s.status === "completed").length}/{roadmap.length}</span>
                    </div>
                    <JourneyTimeline steps={roadmap} activeKey={activeKey} onSelect={setActiveKey} />
                </div>
            </div>

            {/* Cancel interview dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Interview</DialogTitle>
                        <DialogDescription>Please provide a reason. This will be shared with the employer.</DialogDescription>
                    </DialogHeader>
                    <Textarea placeholder="Reason for cancellation…" value={cancellationReason} onChange={e => setCancellationReason(e.target.value)} rows={4} className="resize-none" />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowCancelDialog(false); setCancellationReason(""); }} disabled={isSubmitting}>Keep Interview</Button>
                        <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleCancelInterview} disabled={isSubmitting || !cancellationReason.trim()}>
                            {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Canceling…</> : "Confirm Cancellation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel round dialog */}
            <Dialog open={!!showRoundCancelDialog} onOpenChange={(open) => { if (!open) { setShowRoundCancelDialog(null); setRoundCancellationReason(""); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Interview Round</DialogTitle>
                        <DialogDescription>Please provide a reason. This will be shared with the employer.</DialogDescription>
                    </DialogHeader>
                    <Textarea placeholder="Reason for cancellation…" value={roundCancellationReason} onChange={e => setRoundCancellationReason(e.target.value)} rows={4} className="resize-none" />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowRoundCancelDialog(null); setRoundCancellationReason(""); }} disabled={isSubmitting}>Keep Round</Button>
                        <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleCancelRound} disabled={isSubmitting || !roundCancellationReason.trim()}>
                            {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Canceling…</> : "Confirm Cancellation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
