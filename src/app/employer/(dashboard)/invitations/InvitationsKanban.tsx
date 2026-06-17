"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Mail, Phone, Briefcase, Calendar, Clock, Video, MapPinned, ExternalLink, Copy, CheckCircle2, X, Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimestamp, formatUTCDate, formatUTCTime } from "@/lib/date-utils";
import { formatIndustry, formatPhoneNumber } from "@/lib/utils";
import {
    getInvitationJourneyDisplay,
    normalizeEmbeddedOffer,
    journeyVariantToEmployerBadgeProps,
} from "@/lib/invitation-journey-status";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { InterviewRoundsDisplay } from "@/components/employer/InterviewRoundsDisplay";

const INTERVIEW_TIME_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00",
];
function formatTimeSlotLabel(t: string) {
    const [h, m] = t.split(":").map(Number);
    const ampm = h < 12 ? "AM" : "PM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${m === 0 ? "00" : m} ${ampm}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeSlot {
    date: string;
    time: string;
    order: number;
    is_alternative?: boolean;
}

export interface Invitation {
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
        date: string;
        time: string;
        interview_mode: "online" | "physical";
        meeting_link?: string;
        interview_address?: string;
        map_link?: string;
        notes?: string;
    };
    candidate: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone: string;
        current_position: string;
        profile_image_url: string | null;
    };
    employer: {
        id: string;
        first_name: string;
        last_name: string;
    };
    pipeline_status?: string | null;
    current_round_number?: number | null;
    candidate_reschedule_requested?: boolean;
    reschedule_request_reason?: string | null;
    job_offers?: { id: string; status: string } | { id: string; status: string }[] | null;
    interview_rounds?: {
        round_number: number;
        round_label: string | null;
        status: string;
        outcome: string | null;
        mis_rescheduled?: boolean;
        round_canceled?: boolean;
        given_time_slots?: { date: string; time: string }[] | null;
        selected_time_slot?: { date: string; time: string } | null;
        interview_mode?: string | null;
        meeting_link?: string | null;
        interview_address?: string | null;
        map_link?: string | null;
    }[] | null;
}

// ─── Column logic ─────────────────────────────────────────────────────────────

interface KanbanColumn {
    id: string;
    label: string;
    accent: string; // tailwind bg for dot
    headerCls: string;
    borderCls: string;
    bgCls: string;
    countBg: string;
}

function getColumnId(inv: Invitation): string {
    // Terminal pipeline states take priority regardless of cancellation
    const pipeline = inv.pipeline_status;
    if (pipeline === "hired") return "hired";
    if (pipeline === "rejected") return "rejected";
    if (pipeline === "withdrawn") return "withdrawn";

    const offer = normalizeEmbeddedOffer(inv.job_offers);
    if (offer) {
        if (offer.status === "accepted") return "hired";
        if (offer.status === "declined" || offer.status === "withdrawn" || offer.status === "expired") return "rejected";
        return "offered";
    }
    if (pipeline === "offered") return "offered";

    // For any MIS-rescheduled invitation, current_round_number is always authoritative.
    // The invitation started at round 1 (MIS reschedule of initial interview) but may have
    // advanced to round 2, 3, etc. — always use the latest round number.
    if (inv.mis_rescheduled) {
        const cur = inv.current_round_number;
        if (cur && cur > 0) return `round_${cur}`;
        // Fallback: find the highest round in interview_rounds
        if (inv.interview_rounds && inv.interview_rounds.length > 0) {
            const max = Math.max(...inv.interview_rounds.map(r => r.round_number).filter(n => n > 0));
            if (max > 0) return `round_${max}`;
        }
        return "round_1";
    }

    // Purely cancelled (no MIS reschedule)
    if (inv.invitation_canceled) return "cancelled";

    const round = inv.current_round_number;
    if (round && round > 0) return `round_${round}`;

    return "invited";
}

function buildColumns(invitations: Invitation[]): KanbanColumn[] {
    // Gather round labels from interview_rounds data
    const roundMap = new Map<number, string | null>();
    for (const inv of invitations) {
        if (inv.interview_rounds) {
            for (const r of inv.interview_rounds) {
                if (r.round_number > 0 && !roundMap.has(r.round_number)) {
                    roundMap.set(r.round_number, r.round_label);
                } else if (r.round_number > 0 && !roundMap.get(r.round_number) && r.round_label) {
                    roundMap.set(r.round_number, r.round_label);
                }
            }
        }
        const cr = inv.current_round_number;
        if (cr && cr > 0 && !roundMap.has(cr)) roundMap.set(cr, null);
        // Ensure MIS-rescheduled round columns always appear
        if (inv.interview_rounds) {
            for (const r of inv.interview_rounds) {
                if (r.mis_rescheduled && r.round_number > 0 && !roundMap.has(r.round_number)) {
                    roundMap.set(r.round_number, r.round_label);
                }
            }
        }
        // Invitation-level MIS reschedule: candidate had accepted the initial interview,
        // so it belongs in round_1 regardless of current_round_number being 0
        if (inv.invitation_canceled && inv.mis_rescheduled && !roundMap.has(1)) {
            roundMap.set(1, "Initial Interview");
        }
    }

    const roundCols: KanbanColumn[] = Array.from(roundMap.keys())
        .sort((a, b) => a - b)
        .map((n) => ({
            id: `round_${n}`,
            label: roundMap.get(n) || `Round ${n}`,
            accent: "bg-violet-500",
            headerCls: "text-violet-600 dark:text-violet-300",
            borderCls: "border-violet-200 dark:border-violet-800/60",
            bgCls: "bg-violet-50 dark:bg-violet-950/20",
            countBg: "bg-violet-500",
        }));

    return [
        {
            id: "invited",
            label: "Invited",
            accent: "bg-sky-500",
            headerCls: "text-sky-600 dark:text-sky-300",
            borderCls: "border-sky-200 dark:border-sky-800/60",
            bgCls: "bg-sky-50 dark:bg-sky-950/20",
            countBg: "bg-sky-500",
        },
        ...roundCols,
        {
            id: "offered",
            label: "Offered",
            accent: "bg-amber-500",
            headerCls: "text-amber-600 dark:text-amber-300",
            borderCls: "border-amber-200 dark:border-amber-800/60",
            bgCls: "bg-amber-50 dark:bg-amber-950/20",
            countBg: "bg-amber-500",
        },
        {
            id: "hired",
            label: "Hired",
            accent: "bg-emerald-500",
            headerCls: "text-emerald-600 dark:text-emerald-300",
            borderCls: "border-emerald-200 dark:border-emerald-800/60",
            bgCls: "bg-emerald-50 dark:bg-emerald-950/20",
            countBg: "bg-emerald-500",
        },
        {
            id: "rejected",
            label: "Rejected",
            accent: "bg-rose-500",
            headerCls: "text-rose-600 dark:text-rose-300",
            borderCls: "border-rose-200 dark:border-rose-800/60",
            bgCls: "bg-rose-50 dark:bg-rose-950/20",
            countBg: "bg-rose-500",
        },
        {
            id: "withdrawn",
            label: "Withdrawn",
            accent: "bg-slate-400",
            headerCls: "text-slate-500 dark:text-slate-400",
            borderCls: "border-slate-200 dark:border-slate-700/60",
            bgCls: "bg-slate-50 dark:bg-slate-900/20",
            countBg: "bg-slate-400",
        },
        {
            id: "cancelled",
            label: "Cancelled",
            accent: "bg-zinc-400",
            headerCls: "text-zinc-500 dark:text-zinc-400",
            borderCls: "border-zinc-200 dark:border-zinc-700/60",
            bgCls: "bg-zinc-50 dark:bg-zinc-900/20",
            countBg: "bg-zinc-400",
        },
    ];
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function KanbanCard({ inv, onClick }: { inv: Invitation; onClick: () => void }) {
    const offer = normalizeEmbeddedOffer(inv.job_offers);
    const journey = getInvitationJourneyDisplay(
        {
            status: inv.status,
            invitation_canceled: inv.invitation_canceled,
            interview_confirmed: inv.interview_confirmed,
            mis_rescheduled: inv.mis_rescheduled,
            pipeline_status: inv.pipeline_status ?? null,
            current_round_number: inv.current_round_number ?? null,
            candidate_reschedule_requested: inv.candidate_reschedule_requested,
        },
        offer
    );
    const { className: badgeCls } = journeyVariantToEmployerBadgeProps(journey.variant);

    // Show rescheduled tag only if still at Round 1 and hasn't advanced yet
    const isRescheduled =
        (inv.mis_rescheduled && (!inv.current_round_number || inv.current_round_number <= 1)) ||
        inv.interview_rounds?.some(r => r.mis_rescheduled && r.round_number === 1 && !r.outcome);

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left rounded-xl border bg-card p-3",
                isRescheduled
                    ? "border-amber-300/60 dark:border-amber-600/40"
                    : "border-border",
                "hover:border-primary/30 hover:shadow-md hover:-translate-y-px",
                "active:translate-y-0 transition-all duration-150 cursor-pointer"
            )}
        >
            <div className="flex items-center gap-2.5 mb-2.5">
                <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border">
                    <AvatarImage src={inv.candidate.profile_image_url || undefined} />
                    <AvatarFallback className="text-[10px] font-bold">
                        {inv.candidate.first_name[0]}{inv.candidate.last_name[0]}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold truncate leading-tight">
                        {inv.candidate.first_name} {inv.candidate.last_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{inv.job_designation}</p>
                </div>
            </div>
            <div className="flex items-center justify-between gap-1 flex-wrap">
                <div className="flex items-center gap-1 flex-wrap">
                    {isRescheduled ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold rounded-full px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                            Rescheduled
                        </span>
                    ) : (
                        <span className={cn("inline-flex items-center gap-1 text-[9px] font-semibold rounded-full px-1.5 py-0.5", badgeCls)}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                            {journey.label}
                        </span>
                    )}
                </div>
                <span className="text-[9px] text-muted-foreground/50 tabular-nums">
                    {formatTimestamp(inv.sent_at, "MMM d")}
                </span>
            </div>
        </button>
    );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function InvitationModal({
    inv,
    open,
    onClose,
    fetchInvitations,
}: {
    inv: Invitation | null;
    open: boolean;
    onClose: () => void;
    fetchInvitations: () => void;
}) {
    const [hasOutcome, setHasOutcome] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editSlots, setEditSlots] = useState<{ id: string; date: string; time: string }[]>([]);
    const [editMode, setEditMode] = useState('online');
    const [editMeetingLink, setEditMeetingLink] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editMapLink, setEditMapLink] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    if (!inv) return null;

    const canEdit = (inv.status === 'pending' || inv.status === 'viewed') && !inv.invitation_canceled;

    const openEditDialog = () => {
        setEditSlots((inv.given_time_slots || []).map((s, i) => ({ id: String(i), date: s.date, time: s.time })));
        setEditMode(inv.interview_mode || 'online');
        setEditMeetingLink(inv.meeting_link || '');
        setEditAddress(inv.interview_address || '');
        setEditMapLink(inv.map_link || '');
        setShowEditDialog(true);
    };

    const handleSaveEdit = async () => {
        if (editSlots.length === 0) { toast.error("Add at least one time slot"); return; }
        if (editSlots.some(s => !s.date || !s.time)) { toast.error("Complete all time slots"); return; }
        if (editMode === 'physical' && !editAddress) { toast.error("Interview address is required"); return; }
        setIsSavingEdit(true);
        try {
            const res = await fetch(`/api/employer/invitations/${inv.id}/edit`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timeSlots: editSlots.map((s, i) => ({ date: s.date, time: s.time, order: i + 1 })),
                    interviewMode: editMode,
                    meetingLink: editMeetingLink,
                    interviewAddress: editAddress,
                    mapLink: editMapLink,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Invitation updated");
                setShowEditDialog(false);
                fetchInvitations();
            } else {
                toast.error(data.error || "Failed to update invitation");
            }
        } catch { toast.error("An error occurred"); }
        finally { setIsSavingEdit(false); }
    };

    const offer = normalizeEmbeddedOffer(inv.job_offers);
    const journey = getInvitationJourneyDisplay(
        {
            status: inv.status,
            invitation_canceled: inv.invitation_canceled,
            interview_confirmed: inv.interview_confirmed,
            mis_rescheduled: inv.mis_rescheduled,
            pipeline_status: inv.pipeline_status ?? null,
            current_round_number: inv.current_round_number ?? null,
            candidate_reschedule_requested: inv.candidate_reschedule_requested,
        },
        offer
    );
    const { className: badgeCls } = journeyVariantToEmployerBadgeProps(journey.variant);
    const isCanceled = inv.invitation_canceled && !inv.mis_rescheduled;

    return (
        <>
        <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                {/* Header */}
                <div className="flex items-start gap-4 p-5 border-b border-border">
                    <Avatar className="h-12 w-12 shrink-0 ring-2 ring-border">
                        <AvatarImage src={inv.candidate.profile_image_url || undefined} />
                        <AvatarFallback className="text-sm font-bold">
                            {inv.candidate.first_name[0]}{inv.candidate.last_name[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                                <p className="text-base font-bold">{inv.candidate.first_name} {inv.candidate.last_name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{formatIndustry(inv.industry)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {canEdit && (
                                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={openEditDialog}>
                                        <Pencil className="h-3 w-3" />Edit
                                    </Button>
                                )}
                                <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5", badgeCls)}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                                    {journey.label}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-2">
                            {inv.candidate.current_position && (
                                <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{inv.candidate.current_position}</span>
                            )}
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{inv.candidate.email}</span>
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{formatPhoneNumber(inv.candidate.phone)}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">Applied for</span>
                            <span className="inline-flex items-center rounded-md bg-primary/10 text-primary px-1.5 py-0.5 text-[11px] font-semibold">{inv.job_designation}</span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">

                    {/* Cancelled */}
                    {isCanceled && (
                        <div className="rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/20 p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <X className="h-4 w-4 text-rose-600" />
                                <span className="text-sm font-semibold text-rose-700 dark:text-rose-300">Interview Canceled</span>
                                {inv.canceled_at && <span className="text-xs text-rose-500 ml-auto">{formatTimestamp(inv.canceled_at)}</span>}
                            </div>
                            {inv.cancellation_reason && (
                                <p className="text-xs text-rose-600 dark:text-rose-400 italic mt-1">&quot;{inv.cancellation_reason}&quot;</p>
                            )}
                        </div>
                    )}

                    {/* MIS Rescheduled — hide once interview has advanced to round 2+ */}
                    {inv.mis_rescheduled && inv.mis_reschedule_data && !(inv.current_round_number && inv.current_round_number > 1) && (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="text-sm font-semibold">Rescheduled by MIS</span>
                                {inv.mis_rescheduled_at && (
                                    <span className="text-xs text-muted-foreground ml-auto">
                                        {formatTimestamp(inv.mis_rescheduled_at, "MMM d, yyyy")}
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-2">
                                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                                    {formatUTCDate(inv.mis_reschedule_data.date, "MMM d, yyyy")}
                                </div>
                                <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-2">
                                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                                    {formatUTCTime(inv.mis_reschedule_data.date, inv.mis_reschedule_data.time)}
                                </div>
                                <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-2">
                                    {inv.mis_reschedule_data.interview_mode === "online"
                                        ? <Video className="h-3.5 w-3.5 text-primary shrink-0" />
                                        : <MapPinned className="h-3.5 w-3.5 text-primary shrink-0" />}
                                    {inv.mis_reschedule_data.interview_mode === "online" ? "Online" : "Physical"}
                                </div>
                            </div>
                            {inv.mis_reschedule_data.meeting_link && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="flex-1 text-xs truncate text-muted-foreground border border-border rounded px-2 py-1 bg-background">
                                        {inv.mis_reschedule_data.meeting_link}
                                    </span>
                                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => { navigator.clipboard.writeText(inv.mis_reschedule_data!.meeting_link!); toast.success("Copied!"); }}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" className="h-7 px-2 text-xs" asChild>
                                        <a href={inv.mis_reschedule_data.meeting_link} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-3 w-3 mr-1" />Join
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Confirmed interview */}
                    {inv.interview_confirmed && !isCanceled && !inv.mis_rescheduled && (
                        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/20 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Interview Confirmed</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                {inv.selected_time_slot && (
                                    <>
                                        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 px-2.5 py-2">
                                            <Calendar className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                                            {formatUTCDate(inv.selected_time_slot.date, "MMM d, yyyy")}
                                        </div>
                                        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 px-2.5 py-2">
                                            <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                                            {inv.confirmed_time
                                                ? formatUTCTime(inv.selected_time_slot.date, inv.confirmed_time)
                                                : inv.selected_time_slot.time
                                                    ? formatUTCTime(inv.selected_time_slot.date, inv.selected_time_slot.time)
                                                    : "TBD"}
                                        </div>
                                    </>
                                )}
                                {inv.interview_mode && (
                                    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 px-2.5 py-2">
                                        {inv.interview_mode === "online"
                                            ? <Video className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                                            : <MapPinned className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />}
                                        {inv.interview_mode === "online" ? "Online" : "Physical"}
                                    </div>
                                )}
                            </div>
                            {inv.interview_mode === "online" && inv.meeting_link && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="flex-1 text-xs truncate text-muted-foreground border border-border rounded px-2 py-1 bg-background">
                                        {inv.meeting_link}
                                    </span>
                                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => { navigator.clipboard.writeText(inv.meeting_link!); toast.success("Copied!"); }}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" className="h-7 px-2 text-xs" asChild>
                                        <a href={inv.meeting_link} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-3 w-3 mr-1" />Join
                                        </a>
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pending / Viewed */}
                    {(inv.status === "pending" || inv.status === "viewed") && !isCanceled && (
                        <div className="rounded-xl border border-border bg-muted/30 p-4">
                            <p className="text-xs text-muted-foreground">
                                {inv.status === "pending"
                                    ? `Invitation sent ${formatTimestamp(inv.sent_at)}. Awaiting candidate response.`
                                    : "Candidate has viewed the invitation but hasn't responded yet."}
                            </p>
                            {inv.given_time_slots?.length > 0 && (
                                <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                                    {inv.given_time_slots.map((slot, i) => (
                                        <div key={i} className="flex items-center gap-2 rounded-lg bg-background border border-border px-2.5 py-1.5 text-xs">
                                            <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                                            {formatUTCDate(slot.date)} · {formatUTCTime(slot.date, slot.time)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Declined */}
                    {inv.status === "declined" && !isCanceled && (
                        <div className="rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/20 p-4">
                            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                                {inv.candidate_reschedule_requested
                                    ? "Candidate declined and requested new time slots."
                                    : "Candidate declined the invitation."}
                            </p>
                            {inv.reschedule_request_reason && (
                                <p className="text-xs text-rose-600 dark:text-rose-400 italic mt-1">&quot;{inv.reschedule_request_reason}&quot;</p>
                            )}
                        </div>
                    )}

                    {/* Interview rounds */}
                    {(inv.interview_confirmed || inv.mis_rescheduled) && (
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Interview Rounds</p>
                            <InterviewRoundsDisplay
                                invitationId={inv.id}
                                candidateName={`${inv.candidate.first_name} ${inv.candidate.last_name}`}
                                jobTitle={inv.job_designation}
                                onOutcomeFound={setHasOutcome}
                                onUpdate={fetchInvitations}
                                autoSeed={!!(inv.interview_confirmed || inv.mis_rescheduled)}
                                showActiveRoundCard
                            />
                        </div>
                    )}

                    {/* Message */}
                    {inv.message && (
                        <div className="rounded-xl border border-border bg-muted/30 p-4">
                            <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground mb-1.5">Message</p>
                            <p className="text-sm text-foreground leading-relaxed">{inv.message}</p>
                        </div>
                    )}

                    {/* Footer timestamps */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground/60 pt-1 border-t border-border">
                        <span>Sent {formatTimestamp(inv.sent_at)}</span>
                        {inv.viewed_at && <span>Viewed {formatTimestamp(inv.viewed_at)}</span>}
                        {inv.responded_at && <span>Responded {formatTimestamp(inv.responded_at)}</span>}
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* Edit Invitation Dialog */}

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Edit Invitation</DialogTitle>
                    <DialogDescription>Update time slots or interview details before the candidate responds.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Time Slots</p>
                            {editSlots.length < 3 && (
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditSlots([...editSlots, { id: crypto.randomUUID(), date: '', time: '' }])}>
                                    <Plus className="h-3 w-3 mr-1" />Add Slot
                                </Button>
                            )}
                        </div>
                        {editSlots.map((slot) => (
                            <div key={slot.id} className="flex items-center gap-2">
                                <input type="date" value={slot.date} onChange={e => setEditSlots(editSlots.map(s => s.id === slot.id ? { ...s, date: e.target.value } : s))} className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs" />
                                <select value={slot.time} onChange={e => setEditSlots(editSlots.map(s => s.id === slot.id ? { ...s, time: e.target.value } : s))} className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs cursor-pointer">
                                    <option value="">Select time</option>
                                    {INTERVIEW_TIME_SLOTS.map(t => (
                                        <option key={t} value={t}>{formatTimeSlotLabel(t)}</option>
                                    ))}
                                </select>
                                {editSlots.length > 1 && (
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500" onClick={() => setEditSlots(editSlots.filter(s => s.id !== slot.id))}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Interview Mode</p>
                        <div className="flex gap-2">
                            {(['online', 'physical'] as const).map(mode => (
                                <button key={mode} onClick={() => setEditMode(mode)} className={cn("flex-1 h-9 rounded-md border text-xs font-medium capitalize transition-colors", editMode === mode ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/50")}>
                                    {mode === 'online' ? <><Video className="h-3.5 w-3.5 inline mr-1.5" />Online</> : <><MapPinned className="h-3.5 w-3.5 inline mr-1.5" />Physical</>}
                                </button>
                            ))}
                        </div>
                    </div>
                    {editMode === 'online' && (
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground">Meeting Link (optional)</p>
                            <Input value={editMeetingLink} onChange={e => setEditMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." className="h-8 text-xs" />
                        </div>
                    )}
                    {editMode === 'physical' && (
                        <div className="space-y-2">
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Interview Address *</p>
                                <Input value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="123 Main St, City" className="h-8 text-xs" />
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Map Link (optional)</p>
                                <Input value={editMapLink} onChange={e => setEditMapLink(e.target.value)} placeholder="https://maps.google.com/..." className="h-8 text-xs" />
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
                    <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
                        {isSavingEdit && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}

// ─── Column component ─────────────────────────────────────────────────────────

function KanbanCol({
    col,
    cards,
    onCardClick,
}: {
    col: KanbanColumn;
    cards: Invitation[];
    onCardClick: (inv: Invitation) => void;
}) {
    return (
        <div className={cn(
            "flex flex-col shrink-0 w-60 rounded-2xl border h-full",
            col.bgCls, col.borderCls,
        )}>
            <div className={cn("flex items-center justify-between px-3 py-2.5 border-b shrink-0", col.borderCls)}>
                <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", col.accent)} />
                    <span className={cn("text-[11px] font-bold tracking-wide", col.headerCls)}>{col.label}</span>
                </div>
                <span className={cn(
                    "text-[10px] font-bold tabular-nums rounded-full w-5 h-5 flex items-center justify-center text-white",
                    cards.length > 0 ? col.countBg : "bg-muted text-muted-foreground/40 !text-muted-foreground",
                )}>
                    {cards.length}
                </span>
            </div>
            <div className="flex flex-col gap-2 p-2 overflow-y-auto flex-1 min-h-0">
                {cards.length === 0 ? (
                    <div className="flex items-center justify-center py-10 text-[10px] text-muted-foreground/30 select-none">
                        No candidates
                    </div>
                ) : (
                    cards.map((inv) => (
                        <KanbanCard key={inv.id} inv={inv} onClick={() => onCardClick(inv)} />
                    ))
                )}
            </div>
        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface InvitationsKanbanProps {
    invitations: Invitation[];
    fetchInvitations: () => void;
}

export function InvitationsKanban({ invitations, fetchInvitations }: InvitationsKanbanProps) {
    const [modalInv, setModalInv] = useState<Invitation | null>(null);

    const columns = buildColumns(invitations);

    const grouped = new Map<string, Invitation[]>();
    for (const col of columns) grouped.set(col.id, []);
    for (const inv of invitations) {
        const id = getColumnId(inv);
        if (grouped.has(id)) grouped.get(id)!.push(inv);
        else grouped.get("invited")!.push(inv);
    }

    if (invitations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 ring-1 ring-border">
                    <Users className="h-7 w-7 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-semibold">No invitations yet</p>
                <p className="text-xs text-muted-foreground">Send interview invitations to candidates to see them here.</p>
            </div>
        );
    }

    return (
        <>
            <div
                className="flex gap-3 overflow-x-auto pt-1 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-muted/40 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40 [&::-webkit-scrollbar-thumb]:cursor-pointer"
                style={{ height: "calc(100vh - 68px - 2.5rem * 2 - 56px)", paddingBottom: "12px", cursor: "default" }}
            >
                {columns.map((col) => (
                    <KanbanCol
                        key={col.id}
                        col={col}
                        cards={grouped.get(col.id) ?? []}
                        onCardClick={setModalInv}
                    />
                ))}
            </div>

            <InvitationModal
                inv={modalInv}
                open={modalInv !== null}
                onClose={() => setModalInv(null)}
                fetchInvitations={() => {
                    fetchInvitations();
                    setModalInv(null);
                }}
            />
        </>
    );
}
