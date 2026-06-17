"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSWRConfig } from "swr";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Loader2, Mail, User, Video, MapPinned, Phone, Briefcase, ExternalLink, Copy, CheckCircle2, X, ChevronDown, LayoutList, Kanban, Pencil, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
    getInvitationJourneyDisplay,
    normalizeEmbeddedOffer,
    journeyVariantToEmployerBadgeProps,
} from "@/lib/invitation-journey-status";

interface TimeSlot {
    date: string;
    time: string;
    order: number;
    is_alternative?: boolean;
}

import { formatUTCTime, formatUTCDate, formatTimestamp } from "@/lib/date-utils";
import { formatIndustry, formatPhoneNumber } from "@/lib/utils";
import { InterviewRoundsDisplay } from "@/components/employer/InterviewRoundsDisplay";
import { InvitationsKanban } from "./InvitationsKanban";

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
            <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground mb-0.5">{label}</p>
                {value && <p className="text-sm font-medium text-foreground">{value}</p>}
                {children}
            </div>
        </div>
    );
}

interface Invitation {
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
        interview_mode: 'online' | 'physical';
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

// ─── Invitation Detail Panel ──────────────────────────────────────────────────

interface InvitationDetailPanelProps {
    selectedInvitation: Invitation;
    selectedBadge: { variant: "default" | "destructive" | "outline" | "secondary"; className: string; label: string } | null;
    hasInterviewOutcome: boolean;
    setHasInterviewOutcome: (v: boolean) => void;
    isConfirming: boolean;
    confirmedTime: string;
    setConfirmedTime: (v: string) => void;
    meetingLink: string;
    setMeetingLink: (v: string) => void;
    interviewAddress: string;
    setInterviewAddress: (v: string) => void;
    mapLink: string;
    setMapLink: (v: string) => void;
    isCanceling: boolean;
    handleConfirmInterview: () => void;
    setShowCancelDialog: (v: boolean) => void;
    fetchInvitations: () => void;
    onBack: () => void;
}

function InvitationDetailPanel({
    selectedInvitation,
    selectedBadge,
    hasInterviewOutcome,
    setHasInterviewOutcome,
    isConfirming,
    confirmedTime,
    setConfirmedTime,
    meetingLink,
    setMeetingLink,
    interviewAddress,
    setInterviewAddress,
    mapLink,
    setMapLink,
    isCanceling,
    handleConfirmInterview,
    setShowCancelDialog,
    fetchInvitations,
    onBack,
}: InvitationDetailPanelProps) {

    const inv = selectedInvitation;
    const isMisRescheduled = !!(inv.mis_rescheduled && inv.invitation_canceled);
    const isConfirmed = (inv.interview_confirmed && !inv.invitation_canceled) || isMisRescheduled;
    const isCanceled = inv.invitation_canceled;
    const needsConfirmation = inv.status === 'accepted' && !inv.invitation_canceled && inv.selected_time_slot && !hasInterviewOutcome && !inv.interview_confirmed;
    const awaitingConfirm = inv.status === 'accepted' && !inv.invitation_canceled && inv.selected_time_slot && !hasInterviewOutcome && inv.interview_confirmed;
    const canEdit = (inv.status === 'pending' || inv.status === 'viewed') && !isCanceled;

    // Edit invitation dialog state
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editSlots, setEditSlots] = useState<{ id: string; date: string; time: string }[]>([]);
    const [editMode, setEditMode] = useState<string>('online');
    const [editMeetingLink, setEditMeetingLink] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editMapLink, setEditMapLink] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

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
                toast.success("Invitation updated successfully");
                setShowEditDialog(false);
                fetchInvitations();
            } else {
                toast.error(data.error || "Failed to update invitation");
            }
        } catch { toast.error("An error occurred"); }
        finally { setIsSavingEdit(false); }
    };

    return (
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-background/50">
            {/* Mobile back */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3 md:hidden shrink-0">
                <button
                    onClick={onBack}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted hover:bg-accent transition-colors"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <span className="text-sm font-semibold">Invitation Details</span>
            </div>

            {/* Main scrollable body — two column on large screens */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="flex flex-col xl:flex-row xl:h-full min-h-0">

                    {/* ── LEFT: current status + action ── */}
                    <div className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6 space-y-5">

                        {/* Candidate hero card */}
                        <div className="flex items-start gap-4 rounded-2xl border border-border bg-card/60 p-4">
                            <Avatar className="h-14 w-14 shrink-0 ring-2 ring-border">
                                <AvatarImage src={inv.candidate.profile_image_url || undefined} />
                                <AvatarFallback className="text-sm font-bold">
                                    {inv.candidate.first_name[0]}{inv.candidate.last_name[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                    <div>
                                        <p className="text-base font-bold leading-snug">
                                            {inv.candidate.first_name} {inv.candidate.last_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{formatIndustry(inv.industry)}</p>
                                    </div>
                                    {selectedBadge && (
                                        <Badge variant={selectedBadge.variant} className={cn(selectedBadge.className, "shrink-0 mt-0.5")}>
                                            {selectedBadge.label}
                                        </Badge>
                                    )}
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

                        {/* ── CURRENT STATUS SECTION ── */}

                        {/* Pending: waiting for candidate */}
                        {inv.status === 'pending' && !isCanceled && (
                            <StatusCard
                                icon={<Clock className="h-5 w-5 text-amber-600" />}
                                color="amber"
                                title="Awaiting Candidate Response"
                                subtitle={`Invitation sent ${formatTimestamp(inv.sent_at)}. The candidate hasn't responded yet.`}
                            >
                                {inv.given_time_slots?.length > 0 && (
                                    <div className="mt-3 space-y-1.5">
                                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wide">Proposed slots</p>
                                        <div className="grid gap-1.5 sm:grid-cols-2">
                                            {inv.given_time_slots.map((slot, i) => (
                                                <div key={i} className="flex items-center gap-2 rounded-lg bg-amber-100/60 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
                                                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                    {formatUTCDate(slot.date)} · {formatUTCTime(slot.date, slot.time)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <Button size="sm" variant="outline" className="mt-3 w-full h-8 text-xs border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20" onClick={openEditDialog}>
                                    <Pencil className="h-3 w-3 mr-1.5" />Edit Invitation
                                </Button>
                            </StatusCard>
                        )}

                        {/* Viewed */}
                        {inv.status === 'viewed' && !isCanceled && !inv.interview_confirmed && (
                            <StatusCard
                                icon={<User className="h-5 w-5 text-blue-600" />}
                                color="blue"
                                title="Candidate Has Viewed the Invitation"
                                subtitle="They haven't responded yet. They may be reviewing the details."
                            >
                                <Button size="sm" variant="outline" className="mt-3 w-full h-8 text-xs border-blue-400 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20" onClick={openEditDialog}>
                                    <Pencil className="h-3 w-3 mr-1.5" />Edit Invitation
                                </Button>
                            </StatusCard>
                        )}

                        {/* Declined with reschedule */}
                        {inv.status === 'declined' && inv.candidate_reschedule_requested && !isCanceled && (
                            <StatusCard
                                icon={<Calendar className="h-5 w-5 text-amber-600" />}
                                color="amber"
                                title="Candidate Requested Reschedule"
                                subtitle="They declined the proposed slots and asked for alternative dates."
                            >
                                {inv.reschedule_request_reason && (
                                    <blockquote className="mt-3 border-l-2 border-amber-400 pl-3 text-xs italic text-amber-800 dark:text-amber-300">
                                        &quot;{inv.reschedule_request_reason}&quot;
                                    </blockquote>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-3 w-full border-amber-500 text-amber-700 hover:bg-amber-500 hover:text-white dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-700 dark:hover:text-amber-100"
                                    onClick={() => toast.info("Please send a new invitation with updated slots.")}
                                >
                                    Review & Send New Slots
                                </Button>
                            </StatusCard>
                        )}

                        {/* Declined flat */}
                        {inv.status === 'declined' && !inv.candidate_reschedule_requested && !isCanceled && (
                            <StatusCard
                                icon={<X className="h-5 w-5 text-red-600" />}
                                color="red"
                                title="Candidate Declined the Invitation"
                                subtitle="The candidate has declined all proposed time slots."
                            />
                        )}

                        {/* Needs confirmation (accepted, not yet confirmed by employer) */}
                        {needsConfirmation && (
                            <div className="rounded-2xl border-2 border-blue-300 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-950/20 p-4 space-y-4">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
                                        <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Action Required: Confirm Interview</p>
                                        <p className="text-xs text-blue-700 dark:text-blue-400">
                                            Candidate accepted for {formatUTCDate(inv.selected_time_slot?.date ?? '', "EEEE, MMM d")}
                                            {!inv.selected_time_slot?.is_alternative && inv.selected_time_slot?.time &&
                                                ` at ${formatUTCTime(inv.selected_time_slot.date, inv.selected_time_slot.time)}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {inv.selected_time_slot?.is_alternative && (
                                        <div>
                                            <label className="text-xs font-semibold mb-2 block text-blue-900 dark:text-blue-200">Select Time Slot *</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"].map(time => (
                                                    <button
                                                        key={time}
                                                        type="button"
                                                        onClick={() => setConfirmedTime(time)}
                                                        className={cn(
                                                            "rounded-lg py-2 text-xs font-medium border transition-all",
                                                            confirmedTime === time
                                                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                                                : "bg-white dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 hover:border-blue-400"
                                                        )}
                                                    >{time}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {inv.interview_mode === 'online' && (
                                        <div>
                                            <label className="text-xs font-semibold mb-1.5 block text-blue-900 dark:text-blue-200">Meeting Link *</label>
                                            <Input type="url" value={meetingLink} onChange={e => setMeetingLink(e.target.value)} className="h-9 text-sm bg-white dark:bg-blue-950/30" placeholder="https://zoom.us/j/... or Google Meet link" />
                                        </div>
                                    )}

                                    {inv.interview_mode === 'physical' && (
                                        <>
                                            <div>
                                                <label className="text-xs font-semibold mb-1.5 block text-blue-900 dark:text-blue-200">Interview Address *</label>
                                                <Input type="text" value={interviewAddress} onChange={e => setInterviewAddress(e.target.value)} className="h-9 text-sm bg-white dark:bg-blue-950/30" placeholder="Full address with city and postal code" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold mb-1.5 block text-blue-900 dark:text-blue-200">Map Link (Optional)</label>
                                                <Input type="url" value={mapLink} onChange={e => setMapLink(e.target.value)} className="h-9 text-sm bg-white dark:bg-blue-950/30" placeholder="https://maps.google.com/..." />
                                            </div>
                                        </>
                                    )}

                                    <div className="flex gap-2">
                                        <Button onClick={handleConfirmInterview} disabled={isConfirming} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                                            {isConfirming ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Confirming...</> : <><CheckCircle2 className="h-4 w-4 mr-2" />Confirm Interview</>}
                                        </Button>
                                        <Button variant="outline" size="sm" className="border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => setShowCancelDialog(true)} disabled={isCanceling}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Confirmed + not yet into rounds */}
                        {awaitingConfirm && !inv.mis_rescheduled && (
                            <StatusCard
                                icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                                color="green"
                                title="Interview Confirmed"
                                subtitle={inv.confirmed_at ? `Confirmed on ${formatTimestamp(inv.confirmed_at)}` : "Interview is set and ready."}
                            >
                                <div className="mt-3 space-y-2">
                                    <div className="grid gap-2 sm:grid-cols-3 text-xs">
                                        {inv.selected_time_slot && (
                                            <>
                                                <div className="flex items-center gap-2 rounded-lg bg-green-100/60 dark:bg-green-900/20 px-3 py-2 text-green-900 dark:text-green-200">
                                                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                    {formatUTCDate(inv.selected_time_slot.date, "MMM d, yyyy")}
                                                </div>
                                                <div className="flex items-center gap-2 rounded-lg bg-green-100/60 dark:bg-green-900/20 px-3 py-2 text-green-900 dark:text-green-200">
                                                    <Clock className="h-3.5 w-3.5 shrink-0" />
                                                    {inv.confirmed_time
                                                        ? formatUTCTime(inv.selected_time_slot.date, inv.confirmed_time)
                                                        : inv.selected_time_slot.time
                                                            ? formatUTCTime(inv.selected_time_slot.date, inv.selected_time_slot.time)
                                                            : "TBD"}
                                                </div>
                                            </>
                                        )}
                                        {inv.interview_mode && (
                                            <div className="flex items-center gap-2 rounded-lg bg-green-100/60 dark:bg-green-900/20 px-3 py-2 text-green-900 dark:text-green-200">
                                                {inv.interview_mode === 'online' ? <Video className="h-3.5 w-3.5 shrink-0" /> : <MapPinned className="h-3.5 w-3.5 shrink-0" />}
                                                {inv.interview_mode === 'online' ? 'Online' : 'Physical'}
                                            </div>
                                        )}
                                    </div>
                                    {inv.interview_mode === 'online' && inv.meeting_link && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Input value={inv.meeting_link} readOnly className="h-8 text-xs flex-1 bg-white/50 dark:bg-green-950/20" />
                                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0" onClick={() => { navigator.clipboard.writeText(inv.meeting_link!); toast.success("Copied!"); }}><Copy className="h-3.5 w-3.5" /></Button>
                                            <Button size="sm" className="h-8 shrink-0" asChild><a href={inv.meeting_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5 mr-1" />Join</a></Button>
                                        </div>
                                    )}
                                    {inv.interview_mode === 'physical' && inv.interview_address && (
                                        <div className="space-y-1 mt-1">
                                            <p className="text-xs text-green-800 dark:text-green-300">{inv.interview_address}</p>
                                            {inv.map_link && (
                                                <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                                                    <a href={inv.map_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1.5" />Open Maps</a>
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                    <div className="pt-2 border-t border-green-200 dark:border-green-800">
                                        <Button variant="outline" size="sm" className="w-full h-8 text-xs border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => setShowCancelDialog(true)}>
                                            <X className="h-3 w-3 mr-1.5" />Cancel Interview
                                        </Button>
                                    </div>
                                </div>
                            </StatusCard>
                        )}

                        {/* MIS Rescheduled — hide once interview has advanced to round 2+ */}
                        {inv.mis_rescheduled && inv.mis_reschedule_data && !(inv.current_round_number && inv.current_round_number > 1) && (
                            <StatusCard
                                icon={<Calendar className="h-5 w-5 text-primary" />}
                                color="primary"
                                title="Rescheduled by MIS"
                                subtitle={inv.mis_rescheduled_at ? `Rescheduled on ${formatTimestamp(inv.mis_rescheduled_at, "MMM d, yyyy")}` : "Interview was rescheduled."}
                            >
                                <div className="mt-3 grid gap-2 sm:grid-cols-3 text-xs">
                                    <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-foreground">
                                        <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
                                        {formatUTCDate(inv.mis_reschedule_data.date, "MMM d, yyyy")}
                                    </div>
                                    <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-foreground">
                                        <Clock className="h-3.5 w-3.5 shrink-0 text-primary" />
                                        {formatUTCTime(inv.mis_reschedule_data.date, inv.mis_reschedule_data.time)}
                                    </div>
                                    <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-foreground">
                                        {inv.mis_reschedule_data.interview_mode === 'online' ? <Video className="h-3.5 w-3.5 shrink-0 text-primary" /> : <MapPinned className="h-3.5 w-3.5 shrink-0 text-primary" />}
                                        {inv.mis_reschedule_data.interview_mode === 'online' ? 'Online' : 'Physical'}
                                    </div>
                                </div>
                                {inv.mis_reschedule_data.meeting_link && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <Input value={inv.mis_reschedule_data.meeting_link} readOnly className="h-8 text-xs flex-1" />
                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0" onClick={() => { navigator.clipboard.writeText(inv.mis_reschedule_data!.meeting_link!); toast.success("Copied!"); }}><Copy className="h-3.5 w-3.5" /></Button>
                                        <Button size="sm" className="h-8 shrink-0" asChild><a href={inv.mis_reschedule_data.meeting_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5 mr-1" />Join</a></Button>
                                    </div>
                                )}
                                {inv.mis_reschedule_data.interview_address && (
                                    <div className="mt-2 space-y-1">
                                        <p className="text-xs text-muted-foreground">{inv.mis_reschedule_data.interview_address}</p>
                                        {inv.mis_reschedule_data.map_link && (
                                            <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                                                <a href={inv.mis_reschedule_data.map_link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3 mr-1.5" />Open Maps</a>
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </StatusCard>
                        )}

                        {/* Canceled */}
                        {isCanceled && (
                            <StatusCard
                                icon={<X className="h-5 w-5 text-red-600" />}
                                color="red"
                                title="Interview Canceled"
                                subtitle={inv.canceled_at ? `Canceled on ${formatTimestamp(inv.canceled_at)}` : "This interview has been canceled."}
                            >
                                <div className="mt-3 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-muted-foreground">Canceled by</span>
                                        <span className="text-xs font-semibold">{inv.canceled_by === 'employer' ? 'You' : 'Candidate'}</span>
                                    </div>
                                    {inv.cancellation_reason && (
                                        <div className="rounded-lg bg-red-100/60 dark:bg-red-950/20 p-3">
                                            <p className="text-xs text-red-800 dark:text-red-300 italic">&quot;{inv.cancellation_reason}&quot;</p>
                                        </div>
                                    )}
                                </div>
                            </StatusCard>
                        )}

                        {/* Your message */}
                        {inv.message && (
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Your Message to Candidate</p>
                                <div className="rounded-xl border border-border bg-muted/40 p-3 text-sm text-foreground/90 italic">
                                    &quot;{inv.message}&quot;
                                </div>
                            </div>
                        )}

                        {/* Interview Rounds — management actions (full width, below status) */}
                        {isConfirmed && (
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Interview Rounds</p>
                                <InterviewRoundsDisplay
                                    invitationId={inv.id}
                                    candidateName={`${inv.candidate.first_name} ${inv.candidate.last_name}`}
                                    jobTitle={inv.job_designation}
                                    onUpdate={fetchInvitations}
                                    onOutcomeFound={setHasInterviewOutcome}
                                    autoSeed={true}
                                    showActiveRoundCard
                                />
                            </div>
                        )}

                        {/* Metadata footer */}
                        <div className="pt-3 border-t border-border text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-0.5">
                            <span>Sent by {inv.employer.first_name} {inv.employer.last_name} · {formatTimestamp(inv.sent_at)}</span>
                            {inv.viewed_at && <span>Viewed {formatTimestamp(inv.viewed_at)}</span>}
                            {inv.responded_at && <span>Responded {formatTimestamp(inv.responded_at)}</span>}
                        </div>
                    </div>

                    {/* ── RIGHT: History Roadmap sidebar ── */}
                    {isConfirmed && (
                        <div className="xl:w-72 shrink-0 border-t xl:border-t-0 xl:border-l border-border overflow-y-auto">
                            <InvitationRoadmapSidebar
                                invitationId={inv.id}
                                onOutcomeFound={setHasInterviewOutcome}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* ── Edit Invitation Dialog ── */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Invitation</DialogTitle>
                        <DialogDescription>Update the time slots or interview details. The candidate will see the updated information.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Time slots */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Time Slots</p>
                                {editSlots.length < 3 && (
                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditSlots([...editSlots, { id: crypto.randomUUID(), date: '', time: '' }])}>
                                        <Plus className="h-3 w-3 mr-1" />Add Slot
                                    </Button>
                                )}
                            </div>
                            {editSlots.map((slot, i) => (
                                <div key={slot.id} className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={slot.date}
                                        onChange={e => setEditSlots(editSlots.map(s => s.id === slot.id ? { ...s, date: e.target.value } : s))}
                                        className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs"
                                    />
                                    <select
                                        value={slot.time}
                                        onChange={e => setEditSlots(editSlots.map(s => s.id === slot.id ? { ...s, time: e.target.value } : s))}
                                        className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs cursor-pointer"
                                    >
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

                        {/* Interview mode */}
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Interview Mode</p>
                            <div className="flex gap-2">
                                {(['online', 'physical'] as const).map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setEditMode(mode)}
                                        className={cn(
                                            "flex-1 h-9 rounded-md border text-xs font-medium capitalize transition-colors",
                                            editMode === mode
                                                ? "border-primary bg-primary/10 text-primary"
                                                : "border-border bg-background text-muted-foreground hover:border-primary/50"
                                        )}
                                    >
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

        </div>
    );
}

// ─── Status card helper ───────────────────────────────────────────────────────

function StatusCard({ icon, color, title, subtitle, children }: {
    icon: React.ReactNode;
    color: "amber" | "blue" | "green" | "red" | "primary";
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
}) {
    const colorMap = {
        amber: "bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
        blue: "bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
        green: "bg-green-50/80 dark:bg-green-950/20 border-green-200 dark:border-green-800",
        red: "bg-red-50/80 dark:bg-red-950/20 border-red-200 dark:border-red-800",
        primary: "bg-primary/5 border-primary/20",
    };
    const iconBgMap = {
        amber: "bg-amber-100 dark:bg-amber-900/40",
        blue: "bg-blue-100 dark:bg-blue-900/40",
        green: "bg-green-100 dark:bg-green-900/40",
        red: "bg-red-100 dark:bg-red-900/40",
        primary: "bg-primary/10",
    };
    return (
        <div className={cn("rounded-2xl border p-4", colorMap[color])}>
            <div className="flex items-start gap-3">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", iconBgMap[color])}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{title}</p>
                    {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
                    {children}
                </div>
            </div>
        </div>
    );
}

// ─── Roadmap sidebar ──────────────────────────────────────────────────────────

interface RoadmapRound {
    id: string;
    round_number: number;
    round_label: string | null;
    status: string;
    outcome: string | null;
    outcome_notes: string | null;
    outcome_at: string | null;
    given_time_slots: { date: string; time?: string }[] | null;
    selected_time_slot: { date?: string; time?: string; is_alternative?: boolean } | null;
    interview_mode: string | null;
    confirmed_time: string | null;
    meeting_link: string | null;
    interview_address: string | null;
    map_link: string | null;
    confirmed_at: string | null;
    sent_at: string;
    round_canceled?: boolean;
    canceled_by?: string | null;
    cancellation_reason?: string | null;
    canceled_at?: string | null;
    mis_rescheduled?: boolean;
    mis_reschedule_data?: { date: string; time: string; interview_mode: string } | null;
}

function InvitationRoadmapSidebar({ invitationId, onOutcomeFound }: { invitationId: string; onOutcomeFound: (v: boolean) => void }) {
    const [rounds, setRounds] = useState<RoadmapRound[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const fetch_ = async () => {
            try {
                const res = await fetch(`/api/employer/invitations/${invitationId}/rounds`);
                const data = await res.json();
                if (data.success && active) {
                    setRounds(data.data);
                    onOutcomeFound(data.data.some((r: RoadmapRound) => r.outcome));
                }
            } catch { /* ignore */ }
            finally { if (active) setLoading(false); }
        };
        fetch_();
        const interval = setInterval(fetch_, 12000);
        return () => { active = false; clearInterval(interval); };
    }, [invitationId]);

    const getStepStyle = (round: RoadmapRound) => {
        if (round.round_canceled) return { dot: "bg-red-400 border-red-300", connector: "bg-red-200 dark:bg-red-900/30", badge: "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" };
        if (round.outcome === 'reject') return { dot: "bg-red-500 border-red-300", connector: "bg-red-200 dark:bg-red-900/30", badge: "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" };
        if (round.outcome === 'offer') return { dot: "bg-blue-500 border-blue-300", connector: "bg-blue-200 dark:bg-blue-900/30", badge: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" };
        if (round.outcome === 'advance') return { dot: "bg-green-500 border-green-300", connector: "bg-green-200 dark:bg-green-900/30", badge: "text-green-600 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" };
        if (round.status === 'confirmed') return { dot: "bg-green-400 border-green-300", connector: "bg-muted", badge: "text-green-700 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" };
        if (round.status === 'accepted') return { dot: "bg-amber-400 border-amber-200", connector: "bg-muted", badge: "text-amber-700 bg-amber-50 dark:bg-amber-950/30 border-amber-200" };
        return { dot: "bg-muted-foreground/40 border-border", connector: "bg-muted", badge: "text-muted-foreground bg-muted border-border" };
    };

    const getStepLabel = (round: RoadmapRound) => {
        if (round.round_canceled) return "Canceled";
        if (round.outcome === 'reject') return "Not Selected";
        if (round.outcome === 'offer') return "Offer Sent";
        if (round.outcome === 'advance') return "Passed";
        if (round.status === 'confirmed') return "Confirmed";
        if (round.status === 'accepted') return "Awaiting Confirmation";
        if (round.status === 'viewed') return "Viewed";
        if (round.status === 'pending') return "Pending";
        return round.status;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (rounds.length === 0) return null;

    return (
        <div className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Interview Journey</p>

            <div className="relative space-y-0">
                {rounds.map((round, idx) => {
                    const style = getStepStyle(round);
                    const label = getStepLabel(round);
                    const isLast = idx === rounds.length - 1;
                    const isExpanded = expandedRoundId === round.id;

                    return (
                        <div key={round.id} className="relative flex gap-3">
                            {/* Vertical connector */}
                            <div className="flex flex-col items-center">
                                <div className={cn("h-4 w-4 rounded-full border-2 shrink-0 mt-1 z-10", style.dot)} />
                                {!isLast && <div className={cn("w-0.5 flex-1 min-h-[2rem] my-1", style.connector)} />}
                            </div>

                            {/* Card */}
                            <div className="flex-1 mb-2 min-w-0">
                                <button
                                    onClick={() => setExpandedRoundId(isExpanded ? null : round.id)}
                                    className={cn(
                                        "w-full text-left rounded-xl border p-2.5 transition-all",
                                        isExpanded
                                            ? "bg-card border-primary/40 shadow-sm rounded-b-none border-b-0"
                                            : "bg-card/60 hover:bg-card hover:border-primary/30 hover:shadow-sm active:scale-[0.98]",
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-1 mb-1">
                                        <span className="text-xs font-semibold text-foreground leading-snug">
                                            {round.round_label || `Round ${round.round_number}`}
                                        </span>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", style.badge)}>
                                                {label}
                                            </span>
                                            <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                                        </div>
                                    </div>
                                    {round.confirmed_at && (
                                        <p className="text-[10px] text-muted-foreground">
                                            {formatTimestamp(round.confirmed_at, "MMM d, yyyy")}
                                        </p>
                                    )}
                                    {round.selected_time_slot && round.outcome !== 'advance' && (
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            {formatUTCDate(round.selected_time_slot.date ?? "", "MMM d")}
                                            {round.selected_time_slot.time && ` · ${formatUTCTime(round.selected_time_slot.date ?? "", round.selected_time_slot.time ?? "")}`}
                                            {round.interview_mode && ` · ${round.interview_mode === 'online' ? 'Online' : 'Physical'}`}
                                        </p>
                                    )}
                                    {!isExpanded && round.outcome_notes && (
                                        <p className="text-[10px] text-muted-foreground mt-1 italic truncate">&quot;{round.outcome_notes}&quot;</p>
                                    )}
                                </button>

                                {/* Inline detail panel */}
                                {isExpanded && (
                                    <div className="rounded-b-xl border border-t-0 border-primary/40 bg-card px-3 pb-3 pt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                                        <RoundDetailModalContent round={round} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Round detail modal content ───────────────────────────────────────────────

function RoundDetailModalContent({ round }: { round: RoadmapRound }) {
    return (
        <div className="space-y-3 text-sm">
            {round.round_canceled && (
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-3 space-y-1">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                        <X className="h-3.5 w-3.5" />
                        Round Canceled {round.canceled_by === 'candidate' ? '(by Candidate)' : '(by Employer)'}
                        {round.canceled_at && ` · ${formatTimestamp(round.canceled_at, "MMM d, yyyy")}`}
                    </p>
                    {round.cancellation_reason && <p className="text-xs text-red-600 dark:text-red-400 italic">&quot;{round.cancellation_reason}&quot;</p>}
                </div>
            )}

            {round.mis_rescheduled && round.mis_reschedule_data && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
                    <p className="text-xs font-semibold text-primary">Rescheduled by MIS</p>
                    <p className="text-xs text-muted-foreground">
                        {formatUTCDate(round.mis_reschedule_data.date, "MMM d, yyyy")} · {formatUTCTime(round.mis_reschedule_data.date, round.mis_reschedule_data.time)}
                        {" · "}{round.mis_reschedule_data.interview_mode === 'online' ? 'Online' : 'Physical'}
                    </p>
                </div>
            )}

            {round.selected_time_slot && round.outcome !== 'advance' && (
                <DetailCard>
                    <DetailRow icon={<Calendar className="h-4 w-4" />} label="Date" value={formatUTCDate(round.selected_time_slot.date ?? "", "EEEE, MMMM d, yyyy")} />
                    {round.selected_time_slot.time && (
                        <DetailRow icon={<Clock className="h-4 w-4" />} label="Time" value={formatUTCTime(round.selected_time_slot.date ?? "", round.selected_time_slot.time ?? "")} />
                    )}
                    {round.interview_mode && (
                        <DetailRow
                            icon={round.interview_mode === 'online' ? <Video className="h-4 w-4" /> : <MapPinned className="h-4 w-4" />}
                            label="Mode"
                            value={round.interview_mode === 'online' ? 'Online Interview' : 'Physical Interview'}
                        />
                    )}
                    {round.confirmed_at && (
                        <DetailRow icon={<CheckCircle2 className="h-4 w-4" />} label="Confirmed" value={formatTimestamp(round.confirmed_at, "MMM d, yyyy 'at' h:mm a")} />
                    )}
                </DetailCard>
            )}

            {round.outcome && (
                <div className={cn(
                    "rounded-lg border-2 p-3",
                    round.outcome === 'advance' && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
                    round.outcome === 'reject' && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
                    round.outcome === 'offer' && "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
                )}>
                    <p className={cn(
                        "text-sm font-semibold",
                        round.outcome === 'advance' && "text-green-800 dark:text-green-200",
                        round.outcome === 'reject' && "text-red-800 dark:text-red-200",
                        round.outcome === 'offer' && "text-blue-800 dark:text-blue-200",
                    )}>
                        {round.outcome === 'advance' && "🎉 Advanced to Next Round"}
                        {round.outcome === 'reject' && "Not Selected"}
                        {round.outcome === 'offer' && "✅ Job Offer Sent"}
                    </p>
                    {round.outcome_at && (
                        <p className="text-xs text-muted-foreground mt-1">Decision on {formatTimestamp(round.outcome_at, "MMM d, yyyy")}</p>
                    )}
                    {round.outcome_notes && (
                        <div className="mt-2 pt-2 border-t border-current/10">
                            <p className="text-xs text-muted-foreground mb-1">Notes</p>
                            <p className="text-xs whitespace-pre-wrap">{round.outcome_notes}</p>
                        </div>
                    )}
                </div>
            )}

            {!round.selected_time_slot && !round.outcome && !round.round_canceled && (
                <p className="text-xs text-muted-foreground text-center py-4">No details available yet.</p>
            )}
        </div>
    );
}

// ─── Main client ──────────────────────────────────────────────────────────────

export default function InvitationsClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { mutate } = useSWRConfig();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmedTime, setConfirmedTime] = useState("");
    const [meetingLink, setMeetingLink] = useState("");
    const [interviewAddress, setInterviewAddress] = useState("");
    const [mapLink, setMapLink] = useState("");
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancellationReason, setCancellationReason] = useState("");
    const [isCanceling, setIsCanceling] = useState(false);
    const [hasInterviewOutcome, setHasInterviewOutcome] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");

    useEffect(() => {
        if (selectedInvitation) {
            const embeddedOffer = normalizeEmbeddedOffer(selectedInvitation.job_offers);
            const hasOffer = !!embeddedOffer;
            setHasInterviewOutcome((!!selectedInvitation.pipeline_status && selectedInvitation.pipeline_status !== 'active') || hasOffer);
        } else {
            setHasInterviewOutcome(false);
        }
    }, [selectedInvitation]);

    useEffect(() => {
        fetchInvitations();
    }, []);

    // Mark invitation as seen when opened (updates sidebar unread count)
    useEffect(() => {
        if (!selectedInvitation?.id) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/employer/invitations/${selectedInvitation.id}/mark-seen`, {
                    method: "POST",
                });
                if (res.ok && !cancelled) {
                    mutate((key) => typeof key === "string" && key.startsWith("/api/employer/"));
                }
            } catch {
                /* ignore */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [selectedInvitation?.id, mutate]);

    // Restore selected invitation from URL or auto-select
    useEffect(() => {
        if (invitations.length === 0) return;

        const invitationId = searchParams.get('id');

        if (invitationId) {
            // Try to find invitation by ID from URL
            const invitation = invitations.find(inv => inv.id === invitationId);
            if (invitation) {
                setSelectedInvitation(invitation);
                return;
            }
        }

        // If no URL param or invitation not found, select first from filtered list
        const filtered = filteredInvitations;
        if (filtered.length > 0 && !selectedInvitation) {
            setSelectedInvitation(filtered[0]);
            updateURLWithInvitation(filtered[0].id);
        }
    }, [invitations, searchParams]);

    const fetchInvitations = async () => {
        try {
            const response = await fetch('/api/employer/invitations');
            const data = await response.json();

            if (data.success) {
                setInvitations(data.data);
                // Don't auto-select here, let the useEffect handle it
            } else {
                toast.error("Failed to load invitations");
            }
        } catch (error) {
            console.error("Error fetching invitations:", error);
            toast.error("An error occurred while loading invitations");
        } finally {
            setLoading(false);
        }
    };

    // Helper function to update URL with invitation ID
    const updateURLWithInvitation = (invitationId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('id', invitationId);
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    // Helper function to handle invitation selection
    const handleSelectInvitation = (invitation: Invitation) => {
        setSelectedInvitation(invitation);
        updateURLWithInvitation(invitation.id);
        // Reset outcome state when switching invitations
        setHasInterviewOutcome(false);
    };

    const filteredInvitations = invitations.filter(inv => {
        if (filter === "all") return true;
        if (filter === "cancelled") return inv.invitation_canceled;
        if (inv.invitation_canceled) return false;
        return inv.status === filter;
    });

    const getInvitationStatusBadge = (invitation: Invitation) => {
        const offer = normalizeEmbeddedOffer(invitation.job_offers);
        const journey = getInvitationJourneyDisplay(
            {
                status: invitation.status,
                invitation_canceled: invitation.invitation_canceled,
                interview_confirmed: invitation.interview_confirmed,
                mis_rescheduled: invitation.mis_rescheduled,
                pipeline_status: invitation.pipeline_status ?? null,
                current_round_number: invitation.current_round_number ?? null,
                candidate_reschedule_requested: invitation.candidate_reschedule_requested,
            },
            offer
        );
        const { variant, className } = journeyVariantToEmployerBadgeProps(journey.variant);
        return { variant, className, label: journey.label };
    };

    const statusCounts = {
        all: invitations.length,
        pending: invitations.filter(i => !i.invitation_canceled && i.status === 'pending').length,
        viewed: invitations.filter(i => !i.invitation_canceled && i.status === 'viewed').length,
        accepted: invitations.filter(i => !i.invitation_canceled && i.status === 'accepted').length,
        declined: invitations.filter(i => !i.invitation_canceled && i.status === 'declined').length,
        cancelled: invitations.filter(i => i.invitation_canceled).length,
    };

    const handleConfirmInterview = async () => {
        if (!selectedInvitation) return;

        const selectedSlot = selectedInvitation.selected_time_slot;
        const isAlternative = selectedSlot?.is_alternative;

        // Validation
        if (isAlternative && !confirmedTime) {
            toast.error("Please provide a time slot for the alternative date");
            return;
        }

        if (selectedInvitation.interview_mode === 'online' && !meetingLink) {
            toast.error("Please provide a meeting link for online interview");
            return;
        }

        if (selectedInvitation.interview_mode === 'physical' && !interviewAddress) {
            toast.error("Please provide an address for physical interview");
            return;
        }

        setIsConfirming(true);
        try {
            // Store confirmed_time as the wall-clock HH:mm the employer entered,
            // matching the format of given_time_slots.time. Display code is
            // responsible for rendering in the viewer's timezone.
            const response = await fetch(`/api/employer/invitations/${selectedInvitation.id}/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    confirmed_time: confirmedTime || null,
                    meeting_link: meetingLink || null,
                    interview_address: interviewAddress || null,
                    map_link: mapLink || null
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Interview confirmed successfully!");
                // Reset form
                setConfirmedTime("");
                setMeetingLink("");
                setInterviewAddress("");
                setMapLink("");
                // Refresh invitations
                fetchInvitations();
            } else {
                toast.error(data.error || "Failed to confirm interview");
            }
        } catch (error) {
            console.error("Error confirming interview:", error);
            toast.error("An error occurred while confirming interview");
        } finally {
            setIsConfirming(false);
        }
    };

    const handleCancelInterview = async () => {
        if (!selectedInvitation) return;

        if (!cancellationReason.trim()) {
            toast.error('Please provide a reason for cancellation');
            return;
        }

        setIsCanceling(true);
        try {
            const response = await fetch(`/api/employer/invitations/${selectedInvitation.id}/cancel-interview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cancellation_reason: cancellationReason
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Interview canceled successfully');
                setShowCancelDialog(false);
                setCancellationReason('');
                // Refresh invitations
                fetchInvitations();
            } else {
                toast.error(data.error || 'Failed to cancel interview');
            }
        } catch (error) {
            console.error('Error canceling interview:', error);
            toast.error('An error occurred while canceling interview');
        } finally {
            setIsCanceling(false);
        }
    };

    const selectedBadge = selectedInvitation
        ? getInvitationStatusBadge(selectedInvitation)
        : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (viewMode === "kanban") {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold leading-tight">Invitations</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {invitations.length} total
                            {statusCounts.pending > 0 && (
                                <> · <span className="text-amber-600 dark:text-amber-400 font-medium">{statusCounts.pending} need action</span></>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={() => setViewMode("list")}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <LayoutList className="h-3.5 w-3.5" />
                        List view
                    </button>
                </div>
                <InvitationsKanban
                    invitations={invitations}
                    fetchInvitations={fetchInvitations}
                />
            </div>
        );
    }

    return (
        <div className={cn(
            "flex overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
            "flex-col",
            "md:flex-row md:h-[calc(100vh-68px-2.5rem*2)] md:min-h-[560px]",
        )}>
            {/* ── Left panel ── */}
            <div className={cn(
                "flex flex-col border-border shrink-0",
                selectedInvitation ? "hidden md:flex" : "flex",
                "w-full md:w-80 md:border-r xl:w-96",
            )}>
                {/* Header */}
                <div className="px-4 pt-4 pb-3 border-b border-border shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className="text-base font-bold leading-tight">Invitations</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {invitations.length} total
                                {statusCounts.pending > 0 && <> · <span className="text-amber-600 dark:text-amber-400 font-medium">{statusCounts.pending} need action</span></>}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {statusCounts.pending > 0 && (
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                                    {statusCounts.pending}
                                </span>
                            )}
                            <button
                                onClick={() => setViewMode("kanban")}
                                title="Switch to Kanban view"
                                className="flex items-center justify-center h-7 w-7 rounded-lg border border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                <Kanban className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                    {/* Filter tabs */}
                    <div className="flex gap-0.5 rounded-lg bg-muted/40 p-0.5">
                        {[
                            { key: 'all', label: 'All' },
                            { key: 'pending', label: 'Pending' },
                            { key: 'accepted', label: 'Accepted' },
                            { key: 'declined', label: 'Declined' },
                            { key: 'cancelled', label: 'Cancelled' },
                        ].map(status => (
                            <button
                                key={status.key}
                                onClick={() => setFilter(status.key)}
                                className={cn(
                                    "flex-1 rounded-md px-1.5 py-1 text-[10px] font-semibold transition-colors",
                                    filter === status.key
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                {status.label}
                                <span className={cn("ml-0.5 opacity-60", filter === status.key && "opacity-100")}>
                                    ({statusCounts[status.key as keyof typeof statusCounts]})
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Card list */}
                <div className="flex-1 overflow-y-auto min-h-[300px] md:min-h-0">
                    {filteredInvitations.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
                            No invitations in this filter.
                        </div>
                    ) : (
                        <div className="divide-y divide-border/60">
                        {filteredInvitations.map((invitation) => {
                            const badge = getInvitationStatusBadge(invitation);
                            const isSelected = selectedInvitation?.id === invitation.id;
                            return (
                                <button
                                    key={invitation.id}
                                    onClick={() => handleSelectInvitation(invitation)}
                                    className={cn(
                                        "w-full text-left px-4 py-3.5 transition-colors relative",
                                        isSelected ? "bg-primary/6 dark:bg-primary/10" : "hover:bg-muted/40"
                                    )}
                                >
                                    {isSelected && (
                                        <div className="absolute inset-y-0 left-0 w-0.5 bg-primary rounded-r-full" />
                                    )}
                                    <div className="flex items-start gap-2.5">
                                        <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                                            <AvatarImage src={invitation.candidate.profile_image_url || undefined} />
                                            <AvatarFallback className="text-xs">
                                                {invitation.candidate.first_name[0]}{invitation.candidate.last_name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "text-[13px] font-semibold leading-snug truncate",
                                                isSelected ? "text-foreground" : "text-foreground/90"
                                            )}>
                                                {invitation.candidate.first_name} {invitation.candidate.last_name}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                                {invitation.job_designation}
                                            </p>
                                            <div className="flex items-center justify-between mt-1.5">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-1.5 py-0.5",
                                                    badge.className
                                                )}>
                                                    <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current opacity-70" />
                                                    {badge.label}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                                                    {formatTimestamp(invitation.sent_at, "MMM d")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Right panel ── */}
            {selectedInvitation ? (
                <InvitationDetailPanel
                    selectedInvitation={selectedInvitation}
                    selectedBadge={selectedBadge}
                    hasInterviewOutcome={hasInterviewOutcome}
                    setHasInterviewOutcome={setHasInterviewOutcome}
                    isConfirming={isConfirming}
                    confirmedTime={confirmedTime}
                    setConfirmedTime={setConfirmedTime}
                    meetingLink={meetingLink}
                    setMeetingLink={setMeetingLink}
                    interviewAddress={interviewAddress}
                    setInterviewAddress={setInterviewAddress}
                    mapLink={mapLink}
                    setMapLink={setMapLink}
                    isCanceling={isCanceling}
                    handleConfirmInterview={handleConfirmInterview}
                    setShowCancelDialog={setShowCancelDialog}
                    fetchInvitations={fetchInvitations}
                    onBack={() => setSelectedInvitation(null)}
                />
            ) : (
                <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-4 text-center p-12 bg-muted/10">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 ring-1 ring-border">
                        <User className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-1 max-w-xs">
                        <p className="text-sm font-semibold text-foreground">No invitation selected</p>
                        <p className="text-xs text-muted-foreground">Pick a thread on the left to view details.</p>
                    </div>
                </div>
            )}


            {/* Cancellation Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Interview</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for canceling this interview. This will be shared with the candidate.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder="Enter your reason for cancellation..."
                            value={cancellationReason}
                            onChange={(e) => setCancellationReason(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCancelDialog(false);
                                setCancellationReason('');
                            }}
                            disabled={isCanceling}
                        >
                            Keep Interview
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancelInterview}
                            disabled={isCanceling || !cancellationReason.trim()}
                        >
                            {isCanceling ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Canceling...
                                </>
                            ) : (
                                'Confirm Cancellation'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
