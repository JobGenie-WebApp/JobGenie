"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowRight,
    Briefcase,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Loader2,
    MessageSquare,
    Video,
    MapPinned
} from "lucide-react";
import { toast } from "sonner";
import { formatUTCDate, formatUTCTime, formatTimestamp } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { InterviewFeedbackDialog } from "./InterviewFeedbackDialog";
import { NextRoundDialog } from "./NextRoundDialog";
import { JobOfferDialog } from "./JobOfferDialog";
import { RoundConfirmDialog } from "./RoundConfirmDialog";

interface JobOffer {
    id: string;
    job_title: string;
    salary_amount: number | null;
    salary_currency: string | null;
    salary_period: string | null;
    start_date: string | null;
    expiry_date: string | null;
    offer_letter_url: string | null;
    description: string | null;
    status: string;
    created_at: string;
}

interface InterviewTimeSlot {
    date: string;
    time: string;
    is_alternative?: boolean;
    interview_mode?: string | null;
    meeting_link?: string | null;
    interview_address?: string | null;
}

interface InterviewRound {
    id: string;
    round_number: number;
    round_label: string | null;
    status: string;
    outcome: string | null;
    outcome_notes: string | null;
    outcome_at: string | null;
    outcome_by: string | null;
    confirmed_at: string | null;
    interview_confirmed?: boolean;
    selected_time_slot: InterviewTimeSlot | null;
    interview_mode: string | null;
    confirmed_time: string | null;
    meeting_link: string | null;
    interview_address: string | null;
    map_link?: string | null;
    given_time_slots?: InterviewTimeSlot[] | null;
    round_canceled?: boolean;
    canceled_by?: string | null;
    cancellation_reason?: string | null;
    canceled_at?: string | null;
    mis_rescheduled?: boolean;
    mis_reschedule_data?: InterviewTimeSlot | null;
}

interface InterviewRoundsDisplayProps {
    invitationId: string;
    candidateName: string;
    jobTitle: string;
    onUpdate?: () => void;
    onOutcomeFound?: (hasOutcome: boolean) => void;
    /** When true and no rounds exist, automatically seed round 1 without showing the manual button */
    autoSeed?: boolean;
    /** When true, renders the current active round's details as a top card (like the MIS card) */
    showActiveRoundCard?: boolean;
}

function NoRoundsState({
    invitationId,
    onCreated,
}: {
    invitationId: string;
    candidateName: string;
    jobTitle: string;
    onCreated: () => void;
}) {
    const [loading, setLoading] = useState(false);

    const handleSeed = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/employer/invitations/${invitationId}/seed-round`, { method: "POST" });
            const data = await res.json();
            if (data.success) {
                toast.success("Round 1 created successfully");
                onCreated();
            } else {
                toast.error(data.error || "Failed to create round");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60">
                <MessageSquare className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <div>
                <p className="text-sm font-medium text-foreground">No interview rounds yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">Initialize Round 1 from the confirmed interview details.</p>
            </div>
            <Button size="sm" onClick={handleSeed} disabled={loading}>
                {loading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Initialize Round 1
            </Button>
        </div>
    );
}

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

export function InterviewRoundsDisplay({
    invitationId,
    candidateName,
    jobTitle,
    onUpdate,
    onOutcomeFound,
    autoSeed = false,
    showActiveRoundCard = false,
}: InterviewRoundsDisplayProps) {
    const [rounds, setRounds] = useState<InterviewRound[]>([]);
    const [loading, setLoading] = useState(true);
    const [autoSeeding, setAutoSeeding] = useState(false);
    const [offerExists, setOfferExists] = useState(false);
    const [offerDetails, setOfferDetails] = useState<JobOffer | null>(null);
    const [showOfferDetails, setShowOfferDetails] = useState(false);
    
    // Dialog states
    const [feedbackDialog, setFeedbackDialog] = useState<{
        isOpen: boolean;
        roundId: string;
        roundNumber: number;
    }>({ isOpen: false, roundId: "", roundNumber: 0 });
    
    const [nextRoundDialog, setNextRoundDialog] = useState<{
        isOpen: boolean;
        previousRoundId: string;
        nextRoundNumber: number;
    }>({ isOpen: false, previousRoundId: "", nextRoundNumber: 0 });
    
    const [offerDialog, setOfferDialog] = useState<{
        isOpen: boolean;
        roundId: string;
    }>({ isOpen: false, roundId: "" });
    
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        roundId: string;
        roundNumber: number;
        roundLabel: string | null;
        interviewMode: string | null;
        selectedTimeSlot: InterviewTimeSlot | null;
    }>({
        isOpen: false,
        roundId: "",
        roundNumber: 0,
        roundLabel: null,
        interviewMode: null,
        selectedTimeSlot: null
    });

    const [cancelRoundDialog, setCancelRoundDialog] = useState<{
        isOpen: boolean;
        roundId: string;
        roundLabel: string;
    }>({ isOpen: false, roundId: "", roundLabel: "" });
    const [cancelRoundReason, setCancelRoundReason] = useState("");

    const [editRoundDialog, setEditRoundDialog] = useState<{
        isOpen: boolean;
        roundId: string;
        roundLabel: string;
    }>({ isOpen: false, roundId: "", roundLabel: "" });
    const [editRoundSlots, setEditRoundSlots] = useState<{ id: string; date: string; time: string }[]>([]);
    const [editRoundMode, setEditRoundMode] = useState("online");
    const [editRoundMeetingLink, setEditRoundMeetingLink] = useState("");
    const [editRoundAddress, setEditRoundAddress] = useState("");
    const [editRoundMapLink, setEditRoundMapLink] = useState("");
    const [isSavingEditRound, setIsSavingEditRound] = useState(false);
    const [isCancelingRound, setIsCancelingRound] = useState(false);

    useEffect(() => {
        fetchRounds();
    }, [invitationId]);

    const fetchRounds = async () => {
        try {
            const response = await fetch(`/api/employer/invitations/${invitationId}/rounds`);
            const data = await response.json();

            if (data.success) {
                // If autoSeed and no rounds exist yet, seed round 1 automatically
                if (autoSeed && data.data.length === 0) {
                    setAutoSeeding(true);
                    try {
                        const seedRes = await fetch(`/api/employer/invitations/${invitationId}/seed-round`, { method: "POST" });
                        const seedData = await seedRes.json();
                        if (seedData.success || seedRes.status === 409) {
                            // 409 = round already exists (race), either way re-fetch
                            const retry = await fetch(`/api/employer/invitations/${invitationId}/rounds`);
                            const retryData = await retry.json();
                            if (retryData.success) {
                                setRounds(retryData.data);
                                if (retryData.data.length > 0) {
                                }
                                const hasOutcome = retryData.data.some((r: InterviewRound) => r.outcome);
                                onOutcomeFound?.(hasOutcome);
                            }
                        } else {
                            setRounds([]);
                            onOutcomeFound?.(false);
                        }
                    } finally {
                        setAutoSeeding(false);
                    }
                } else {
                    setRounds(data.data);
                    if (data.data.length > 0) {
                    }
                    const hasOutcome = data.data.some((r: InterviewRound) => r.outcome);
                    onOutcomeFound?.(hasOutcome);
                }
            } else {
                toast.error("Failed to load interview rounds");
                onOutcomeFound?.(false);
            }
        } catch (error) {
            console.error("Error fetching rounds:", error);
            toast.error("An error occurred while loading interview rounds");
            onOutcomeFound?.(false);
        } finally {
            setLoading(false);
        }
    };

    const checkOfferExists = async () => {
        try {
            const response = await fetch(`/api/employer/invitations/${invitationId}/check-offer`);
            const data = await response.json();
            if (data.success) {
                setOfferExists(data.exists);
                setOfferDetails(data.offer);
            }
        } catch (error) {
            console.error("Error checking offer:", error);
        }
    };

    useEffect(() => {
        checkOfferExists();
    }, [invitationId]);

    const handleFeedbackSuccess = () => {
        fetchRounds();
        if (onUpdate) onUpdate();
    };

    const handleNextRoundSuccess = () => {
        fetchRounds();
        if (onUpdate) onUpdate();
    };

    const handleOfferSuccess = () => {
        fetchRounds();
        checkOfferExists();
        if (onUpdate) onUpdate();
    };

    const handleConfirmSuccess = () => {
        fetchRounds();
        if (onUpdate) onUpdate();
    };

    const handleCancelRound = async () => {
        if (!cancelRoundReason.trim()) { toast.error("Please provide a reason"); return; }
        setIsCancelingRound(true);
        try {
            const res = await fetch(`/api/employer/interview-rounds/${cancelRoundDialog.roundId}/cancel-round`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cancellation_reason: cancelRoundReason })
            });
            const d = await res.json();
            if (d.success) {
                toast.success("Round canceled successfully");
                setCancelRoundDialog({ isOpen: false, roundId: "", roundLabel: "" });
                setCancelRoundReason("");
                fetchRounds();
                if (onUpdate) onUpdate();
            } else {
                toast.error(d.error || "Failed to cancel round");
            }
        } catch { toast.error("An error occurred"); } finally { setIsCancelingRound(false); }
    };

    const openEditRoundDialog = (round: InterviewRound) => {
        setEditRoundSlots((round.given_time_slots || []).map((s, i) => ({ id: String(i), date: s.date, time: s.time })));
        setEditRoundMode(round.interview_mode || "online");
        setEditRoundMeetingLink(round.meeting_link || "");
        setEditRoundAddress(round.interview_address || "");
        setEditRoundMapLink(round.map_link || "");
        setEditRoundDialog({ isOpen: true, roundId: round.id, roundLabel: round.round_label || `Round ${round.round_number}` });
    };

    const handleSaveEditRound = async () => {
        if (editRoundSlots.length === 0) { toast.error("Add at least one time slot"); return; }
        if (editRoundSlots.some(s => !s.date || !s.time)) { toast.error("Complete all time slots"); return; }
        if (editRoundMode === "physical" && !editRoundAddress) { toast.error("Interview address is required"); return; }
        setIsSavingEditRound(true);
        try {
            const res = await fetch(`/api/employer/interview-rounds/${editRoundDialog.roundId}/edit`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    timeSlots: editRoundSlots.map((s, i) => ({ date: s.date, time: s.time, order: i + 1 })),
                    interviewMode: editRoundMode,
                    meetingLink: editRoundMeetingLink,
                    interviewAddress: editRoundAddress,
                    mapLink: editRoundMapLink,
                }),
            });
            const d = await res.json();
            if (d.success) {
                toast.success("Round updated successfully");
                setEditRoundDialog({ isOpen: false, roundId: "", roundLabel: "" });
                fetchRounds();
                if (onUpdate) onUpdate();
            } else {
                toast.error(d.error || "Failed to update round");
            }
        } catch { toast.error("An error occurred"); } finally { setIsSavingEditRound(false); }
    };

    const getOutcomeInfo = (outcome: string | null) => {
        switch (outcome) {
            case 'advance':
                return {
                    label: 'Advanced to Next Round',
                    icon: ArrowRight,
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200'
                };
            case 'reject':
                return {
                    label: 'Rejected',
                    icon: XCircle,
                    color: 'text-red-600',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200'
                };
            case 'offer':
                return {
                    label: 'Job Offer Sent',
                    icon: Briefcase,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200'
                };
            default:
                return null;
        }
    };

    if (loading || autoSeeding) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    if (rounds.length === 0) {
        return (
            <NoRoundsState
                invitationId={invitationId}
                candidateName={candidateName}
                jobTitle={jobTitle}
                onCreated={() => { fetchRounds(); onUpdate?.(); }}
            />
        );
    }

    // Find the current active round (highest round_number with no outcome and not canceled)
    const activeRound = showActiveRoundCard
        ? [...rounds].sort((a, b) => b.round_number - a.round_number).find(r => !r.outcome && !r.round_canceled)
        : null;

    return (
        <>
            {/* Active round card — shown above the rounds list when showActiveRoundCard=true */}
            {activeRound && activeRound.round_number > 1 && (() => {
                const slot = activeRound.selected_time_slot;
                const slots = activeRound.given_time_slots;
                const mode = activeRound.interview_mode;
                const label = activeRound.round_label || `Round ${activeRound.round_number}`;
                return (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold">{label}</span>
                            <span className="ml-auto text-xs text-muted-foreground capitalize">{activeRound.status}</span>
                        </div>
                        {slot ? (
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-2">
                                    <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                                    {formatUTCDate(slot.date, "MMM d, yyyy")}
                                </div>
                                <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-2">
                                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                                    {formatUTCTime(slot.date, slot.time)}
                                </div>
                                {mode && (
                                    <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-2">
                                        {mode === "online" ? <Video className="h-3.5 w-3.5 text-primary shrink-0" /> : <MapPinned className="h-3.5 w-3.5 text-primary shrink-0" />}
                                        {mode === "online" ? "Online" : "Physical"}
                                    </div>
                                )}
                            </div>
                        ) : slots && slots.length > 0 ? (
                            <div className="space-y-1.5">
                                <p className="text-xs text-muted-foreground mb-1">Offered time slots — awaiting candidate response</p>
                                <div className="grid gap-1.5">
                                    {slots.map((s, i) => (
                                        <div key={i} className="flex items-center gap-2 rounded-lg bg-primary/10 px-2.5 py-2 text-xs">
                                            <span className="text-muted-foreground w-3">{i + 1}.</span>
                                            <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                                            <span>{formatUTCDate(s.date, "MMM d, yyyy")}</span>
                                            <Clock className="h-3.5 w-3.5 text-primary shrink-0 ml-1" />
                                            <span>{formatUTCTime(s.date, s.time)}</span>
                                        </div>
                                    ))}
                                </div>
                                {mode && (
                                    <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-2 text-xs mt-1 w-fit">
                                        {mode === "online" ? <Video className="h-3.5 w-3.5 text-primary shrink-0" /> : <MapPinned className="h-3.5 w-3.5 text-primary shrink-0" />}
                                        {mode === "online" ? "Online" : "Physical"}
                                    </div>
                                )}
                            </div>
                        ) : null}
                        {mode === "online" && activeRound.meeting_link && (
                            <div className="flex items-center gap-2 mt-2">
                                <span className="flex-1 text-xs truncate text-muted-foreground border border-border rounded px-2 py-1 bg-background">{activeRound.meeting_link}</span>
                                <button onClick={() => { navigator.clipboard.writeText(activeRound.meeting_link!); }} className="h-7 w-7 flex items-center justify-center rounded border border-border bg-background hover:bg-muted transition-colors">
                                    <ExternalLink className="h-3 w-3" />
                                </button>
                            </div>
                        )}
                        {mode === "physical" && activeRound.interview_address && (
                            <div className="flex items-start gap-2 mt-2 text-xs text-muted-foreground">
                                <MapPinned className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <span>{activeRound.interview_address}</span>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Job Offer Status Banner */}
            {offerExists && offerDetails && (
                <div className={cn(
                    "border-2 rounded-lg p-4 mb-4",
                    offerDetails.status === 'accepted' 
                        ? "bg-gradient-to-r from-green-50 to-green-100 border-green-300 dark:from-green-950/60 dark:to-green-900/40 dark:border-green-700"
                        : offerDetails.status === 'declined'
                            ? "bg-gradient-to-r from-red-50 to-red-100 border-red-300 dark:from-red-950/60 dark:to-red-900/40 dark:border-red-700"
                            : "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 dark:from-blue-950/60 dark:to-blue-900/40 dark:border-blue-700"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0",
                            offerDetails.status === 'accepted' ? "bg-green-500" : offerDetails.status === 'declined' ? "bg-red-500" : "bg-blue-500"
                        )}>
                            {offerDetails.status === 'accepted' ? (
                                <CheckCircle2 className="h-6 w-6 text-white" />
                            ) : offerDetails.status === 'declined' ? (
                                <XCircle className="h-6 w-6 text-white" />
                            ) : (
                                <Briefcase className="h-6 w-6 text-white" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h4 className={cn(
                                    "font-semibold",
                                    offerDetails.status === 'accepted' ? "text-green-900 dark:text-green-50" : offerDetails.status === 'declined' ? "text-red-900 dark:text-red-50" : "text-blue-900 dark:text-blue-50"
                                )}>
                                    {offerDetails.status === 'accepted' ? "Job Offer Accepted" : offerDetails.status === 'declined' ? "Job Offer Declined" : "Job Offer Sent"}
                                </h4>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={cn(
                                        "h-7 text-xs",
                                        offerDetails.status === 'accepted' ? "text-green-700 hover:bg-green-200 dark:text-green-300 dark:hover:bg-green-900/40" : offerDetails.status === 'declined' ? "text-red-700 hover:bg-red-200 dark:text-red-300 dark:hover:bg-red-900/40" : "text-blue-700 hover:bg-blue-200 dark:text-blue-300 dark:hover:bg-blue-900/40"
                                    )}
                                    onClick={() => setShowOfferDetails(!showOfferDetails)}
                                >
                                    {showOfferDetails ? "Hide Details" : "View Offer Details"}
                                    {showOfferDetails ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
                                </Button>
                            </div>
                            <p className={cn(
                                "text-sm mt-0.5",
                                offerDetails.status === 'accepted' ? "text-green-800 dark:text-green-200" : offerDetails.status === 'declined' ? "text-red-800 dark:text-red-200" : "text-blue-800 dark:text-blue-200"
                            )}>
                                {offerDetails.status === 'accepted' 
                                    ? `🎊 Great news! ${candidateName} has accepted the job offer.` 
                                    : offerDetails.status === 'declined'
                                        ? `${candidateName} has declined the job offer.`
                                        : `A formal job offer has been sent to ${candidateName}. Awaiting candidate response.`
                                }
                            </p>
                        </div>
                        {offerDetails.status === 'accepted' ? (
                            <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                        ) : offerDetails.status === 'declined' ? (
                            <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                        ) : (
                            <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        )}
                    </div>

                    {showOfferDetails && offerDetails && (
                        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider">Position</p>
                                        <p className="font-semibold text-blue-900 dark:text-blue-100">{offerDetails.job_title}</p>
                                    </div>
                                    {offerDetails.salary_amount && (
                                        <div>
                                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider">Salary</p>
                                            <p className="font-semibold text-blue-900 dark:text-blue-100">
                                                {offerDetails.salary_currency} {offerDetails.salary_amount.toLocaleString()} / {offerDetails.salary_period}
                                            </p>
                                        </div>
                                    )}
                                    {offerDetails.start_date && (
                                        <div>
                                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider">Proposed Start Date</p>
                                            <p className="font-semibold text-blue-900 dark:text-blue-100">
                                                {formatTimestamp(offerDetails.start_date, "MMMM d, yyyy")}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {offerDetails.expiry_date && (
                                        <div>
                                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider">Offer Expiry</p>
                                            <p className="font-semibold text-blue-900 dark:text-blue-100">
                                                {formatTimestamp(offerDetails.expiry_date, "MMMM d, yyyy")}
                                            </p>
                                        </div>
                                    )}
                                    {offerDetails.offer_letter_url && (
                                        <div>
                                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider">Offer Letter</p>
                                            <a 
                                                href={offerDetails.offer_letter_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline mt-1"
                                            >
                                                View Document <ExternalLink className="ml-1 h-3 w-3" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {offerDetails.description && (
                                <div className="mt-4">
                                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">Additional Details</p>
                                    <p className="text-sm text-blue-900 dark:text-blue-100 bg-blue-200/30 dark:bg-blue-900/20 p-3 rounded-md whitespace-pre-wrap">
                                        {offerDetails.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interview Rounds ({rounds.length})</h3>
                </div>

                {rounds.map((round, index) => {
                    const outcomeInfo = getOutcomeInfo(round.outcome);
                    const isCanceled = !!round.round_canceled;
                    // MIS-rescheduled rounds are always confirmed — allow feedback regardless of status field
                    const isConfirmedOrRescheduled = round.status === 'confirmed' || (!!round.mis_rescheduled && !!round.mis_reschedule_data);
                    const isPending = round.status === 'pending' || round.status === 'viewed' || round.status === 'accepted';
                    const canAddFeedback = (isConfirmedOrRescheduled || isPending) && !round.outcome && !isCanceled;
                    const needsConfirmation = round.status === 'accepted' && !round.confirmed_at && !isCanceled;
                    // Cancel allowed for any active round (pending, confirmed, etc.)
                    const canCancelRound = (isConfirmedOrRescheduled || isPending) && !round.outcome && !isCanceled;
                    // Edit allowed before candidate accepts (pending/viewed)
                    const canEditRound = isPending && !round.outcome && !isCanceled;
                    
                    // Check if next round exists (to hide "Schedule Next Round" button)
                    const nextRoundExists = rounds.some(r => r.round_number === round.round_number + 1);
                    
                    // Hide interview details if this round was advanced (outcome = 'advance')
                    const shouldShowInterviewDetails = round.outcome !== 'advance';
                    // Dim completed/canceled rounds so the active round stands out
                    const isDone = !!round.outcome || isCanceled;

                    return (
                        <Card key={round.id} className="overflow-hidden">
                            <div className="px-3 py-1 space-y-1">
                                {/* Round header + outcome — dimmed when done */}
                                <div className={cn(isDone && "opacity-50")}>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-sm">
                                            {round.round_label || `Round ${round.round_number}`}
                                        </h4>
                                        <Badge variant="outline" className="text-xs">{round.status}</Badge>
                                    </div>

                                    {outcomeInfo && (
                                        <div className={`mt-1 px-2 py-1 rounded-md ${outcomeInfo.bgColor} border ${outcomeInfo.borderColor}`}>
                                            <div className="flex items-center gap-2">
                                                <outcomeInfo.icon className={`h-3.5 w-3.5 ${outcomeInfo.color}`} />
                                                <span className={`text-xs font-medium ${outcomeInfo.color}`}>{outcomeInfo.label}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                        {/* Details section — dimmed when done */}
                                        <div className={cn(isDone && "opacity-50")}>
                                        {/* Cancelled state */}
                                        {isCanceled && (
                                            <div className="rounded-md bg-red-50 border border-red-200 p-3 space-y-1 dark:bg-red-950/20 dark:border-red-800">
                                                <p className="text-xs font-medium text-red-700 dark:text-red-300">
                                                    Round canceled by {round.canceled_by === "candidate" ? "Candidate" : "Employer"}
                                                    {round.canceled_at && (
                                                        <span className="font-normal ml-1">· {formatTimestamp(round.canceled_at, "MMM d, yyyy")}</span>
                                                    )}
                                                </p>
                                                {round.cancellation_reason && (
                                                    <p className="text-xs text-red-600 dark:text-red-400">{round.cancellation_reason}</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Interview Details — hidden for MIS-rescheduled rounds and for active round when top card is shown */}
                                        {shouldShowInterviewDetails && !round.mis_rescheduled && !(showActiveRoundCard && isDone === false && round.round_number > 1) && (() => {
                                            const slot = round.selected_time_slot;
                                            const mis = round.mis_reschedule_data;
                                            // Confirmed round: show selected slot
                                            if (slot || mis) {
                                                const date = slot?.date ?? mis?.date;
                                                const time = slot?.time ?? mis?.time;
                                                const mode = round.interview_mode ?? mis?.interview_mode;
                                                const meetingLink = round.meeting_link ?? mis?.meeting_link;
                                                const address = round.interview_address ?? mis?.interview_address;
                                                return (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-muted-foreground">Interview Details</p>
                                                        <div className="grid gap-2 text-sm">
                                                            {date && (
                                                                <div className="flex items-center gap-2">
                                                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    <span>{formatUTCDate(date)}</span>
                                                                </div>
                                                            )}
                                                            {date && time && (
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    <span>{formatUTCTime(date, time)}</span>
                                                                </div>
                                                            )}
                                                            {mode && (
                                                                <div className="flex items-center gap-2">
                                                                    {mode === 'online' ? (
                                                                        <Video className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    ) : (
                                                                        <MapPinned className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    )}
                                                                    <span className="capitalize">{mode} Interview</span>
                                                                </div>
                                                            )}
                                                            {mode === 'online' && meetingLink && (
                                                                <div className="flex items-center gap-2">
                                                                    <a href={meetingLink} target="_blank" rel="noopener noreferrer"
                                                                        className="text-xs text-primary underline underline-offset-2 truncate flex items-center gap-1">
                                                                        <ExternalLink className="h-3 w-3 shrink-0" />
                                                                        {meetingLink}
                                                                    </a>
                                                                </div>
                                                            )}
                                                            {mode === 'physical' && address && (
                                                                <div className="flex items-start gap-2">
                                                                    <MapPinned className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                                                    <span className="text-xs">{address}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            // Pending round (no selected slot yet): show offered time slots
                                            if (round.given_time_slots && round.given_time_slots.length > 0) {
                                                const mode = round.interview_mode;
                                                const meetingLink = round.meeting_link;
                                                const address = round.interview_address;
                                                return (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-muted-foreground">Offered Time Slots</p>
                                                        <div className="space-y-1.5">
                                                            {round.given_time_slots.map((s, i) => (
                                                                <div key={i} className="flex items-center gap-3 text-sm">
                                                                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                                                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                                    <span>{formatUTCDate(s.date)}</span>
                                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                                    <span>{formatUTCTime(s.date, s.time)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {mode && (
                                                            <div className="flex items-center gap-2 text-sm">
                                                                {mode === 'online' ? (
                                                                    <Video className="h-3.5 w-3.5 text-muted-foreground" />
                                                                ) : (
                                                                    <MapPinned className="h-3.5 w-3.5 text-muted-foreground" />
                                                                )}
                                                                <span className="capitalize">{mode} Interview</span>
                                                            </div>
                                                        )}
                                                        {mode === 'online' && meetingLink && (
                                                            <a href={meetingLink} target="_blank" rel="noopener noreferrer"
                                                                className="text-xs text-primary underline underline-offset-2 truncate flex items-center gap-1">
                                                                <ExternalLink className="h-3 w-3 shrink-0" />
                                                                {meetingLink}
                                                            </a>
                                                        )}
                                                        {mode === 'physical' && address && (
                                                            <div className="flex items-start gap-2">
                                                                <MapPinned className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                                                <span className="text-xs">{address}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}

                                        {/* Feedback/Outcome */}
                                        {round.outcome_notes && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                    Interview Feedback
                                                </p>
                                                <div className="bg-muted/50 rounded p-2.5 text-sm">
                                                    <p className="whitespace-pre-wrap">{round.outcome_notes}</p>
                                                    {round.outcome_at && (
                                                        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                                                            {formatTimestamp(round.outcome_at, "MMM d, yyyy 'at' h:mm a")}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        </div>{/* end details opacity wrapper */}

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {needsConfirmation && (
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmDialog({
                                                            isOpen: true,
                                                            roundId: round.id,
                                                            roundNumber: round.round_number,
                                                            roundLabel: round.round_label,
                                                            interviewMode: round.interview_mode,
                                                            selectedTimeSlot: round.selected_time_slot
                                                        });
                                                    }}
                                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                                    Confirm Interview
                                                </Button>
                                            )}

                                            {canAddFeedback && (
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFeedbackDialog({
                                                            isOpen: true,
                                                            roundId: round.id,
                                                            roundNumber: round.round_number
                                                        });
                                                    }}
                                                    className="flex-1"
                                                >
                                                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                                                    Add Feedback
                                                </Button>
                                            )}

                                            {round.outcome === 'advance' && !nextRoundExists && (
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setNextRoundDialog({
                                                            isOpen: true,
                                                            previousRoundId: round.id,
                                                            nextRoundNumber: round.round_number + 1
                                                        });
                                                    }}
                                                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                                                >
                                                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                                    Schedule Next Round
                                                </Button>
                                            )}
                                            
                                            {round.outcome === 'advance' && nextRoundExists && (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center dark:bg-green-950/20 dark:border-green-800">
                                                    <p className="text-sm text-green-800 dark:text-green-200 flex items-center justify-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Next round has been scheduled
                                                    </p>
                                                </div>
                                            )}

                                            {round.outcome === 'offer' && !offerExists && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOfferDialog({
                                                            isOpen: true,
                                                            roundId: round.id
                                                        });
                                                    }}
                                                    className="flex-1"
                                                >
                                                    <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                                                    Create Job Offer
                                                </Button>
                                            )}

                                            {round.outcome === 'offer' && offerExists && offerDetails && (
                                                <div className={cn(
                                                    "rounded-lg p-3 text-center border",
                                                    offerDetails.status === 'accepted' ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" :
                                                    offerDetails.status === 'declined' ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800" :
                                                    "bg-blue-50 border-blue-200 dark:bg-blue-950/45 dark:border-blue-800"
                                                )}>
                                                    <p className={cn(
                                                        "text-sm flex items-center justify-center gap-2 mb-2",
                                                        offerDetails.status === 'accepted' ? "text-green-800 dark:text-green-200" :
                                                        offerDetails.status === 'declined' ? "text-red-800 dark:text-red-200" :
                                                        "text-blue-800 dark:text-blue-100"
                                                    )}>
                                                        {offerDetails.status === 'accepted' ? (
                                                            <>
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                Candidate has accepted the job offer
                                                            </>
                                                        ) : offerDetails.status === 'declined' ? (
                                                            <>
                                                                <XCircle className="h-4 w-4" />
                                                                Candidate has declined the job offer
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                Job offer has been sent to candidate
                                                            </>
                                                        )}
                                                    </p>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="h-7 text-xs bg-white dark:bg-gray-900"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowOfferDetails(!showOfferDetails);
                                                            // Scroll to top where the banner is
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                    >
                                                        {showOfferDetails ? "Hide Details" : "View Offer Details"}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        {(canEditRound || canCancelRound) && (
                                            <div className="flex items-center gap-1.5 pt-1 border-t border-border">
                                                {canEditRound && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={(e) => { e.stopPropagation(); openEditRoundDialog(round); }}
                                                        className="h-6 text-xs gap-1 px-2 cursor-pointer hover:bg-accent"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                                                        Edit
                                                    </Button>
                                                )}
                                                {canCancelRound && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCancelRoundDialog({
                                                                isOpen: true,
                                                                roundId: round.id,
                                                                roundLabel: round.round_label || `Round ${round.round_number}`
                                                            });
                                                        }}
                                                        className="h-6 text-xs gap-1 px-2 cursor-pointer text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10 dark:hover:bg-destructive/20"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                                                        Cancel Round
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                        </Card>
                    );
                })}
            </div>

            {/* Dialogs */}
            <InterviewFeedbackDialog
                roundId={feedbackDialog.roundId}
                roundNumber={feedbackDialog.roundNumber}
                candidateName={candidateName}
                isOpen={feedbackDialog.isOpen}
                onClose={() => setFeedbackDialog({ isOpen: false, roundId: "", roundNumber: 0 })}
                onSuccess={handleFeedbackSuccess}
            />

            <NextRoundDialog
                previousRoundId={nextRoundDialog.previousRoundId}
                nextRoundNumber={nextRoundDialog.nextRoundNumber}
                candidateName={candidateName}
                isOpen={nextRoundDialog.isOpen}
                onClose={() => setNextRoundDialog({ isOpen: false, previousRoundId: "", nextRoundNumber: 0 })}
                onSuccess={handleNextRoundSuccess}
            />

            <JobOfferDialog
                roundId={offerDialog.roundId}
                candidateName={candidateName}
                jobTitle={jobTitle}
                isOpen={offerDialog.isOpen}
                onClose={() => setOfferDialog({ isOpen: false, roundId: "" })}
                onSuccess={handleOfferSuccess}
            />

            <RoundConfirmDialog
                roundId={confirmDialog.roundId}
                roundNumber={confirmDialog.roundNumber}
                roundLabel={confirmDialog.roundLabel}
                candidateName={candidateName}
                interviewMode={confirmDialog.interviewMode}
                selectedTimeSlot={confirmDialog.selectedTimeSlot}
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({
                    isOpen: false,
                    roundId: "",
                    roundNumber: 0,
                    roundLabel: null,
                    interviewMode: null,
                    selectedTimeSlot: null
                })}
                onSuccess={handleConfirmSuccess}
            />

            {/* Edit round dialog */}
            <Dialog open={editRoundDialog.isOpen} onOpenChange={(open) => { if (!open) setEditRoundDialog({ isOpen: false, roundId: "", roundLabel: "" }); }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit {editRoundDialog.roundLabel}</DialogTitle>
                        <DialogDescription>Update time slots or interview details before the candidate responds.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Time Slots</p>
                                {editRoundSlots.length < 3 && (
                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditRoundSlots([...editRoundSlots, { id: crypto.randomUUID(), date: "", time: "" }])}>
                                        <span className="mr-1">+</span>Add Slot
                                    </Button>
                                )}
                            </div>
                            {editRoundSlots.map((slot) => (
                                <div key={slot.id} className="flex items-center gap-2">
                                    <input type="date" value={slot.date} onChange={e => setEditRoundSlots(editRoundSlots.map(s => s.id === slot.id ? { ...s, date: e.target.value } : s))} className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs" />
                                    <select value={slot.time} onChange={e => setEditRoundSlots(editRoundSlots.map(s => s.id === slot.id ? { ...s, time: e.target.value } : s))} className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs cursor-pointer">
                                        <option value="">Select time</option>
                                        {INTERVIEW_TIME_SLOTS.map(t => (
                                            <option key={t} value={t}>{formatTimeSlotLabel(t)}</option>
                                        ))}
                                    </select>
                                    {editRoundSlots.length > 1 && (
                                        <button onClick={() => setEditRoundSlots(editRoundSlots.filter(s => s.id !== slot.id))} className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors">
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Interview Mode</p>
                            <div className="flex gap-2">
                                {(["online", "physical"] as const).map(mode => (
                                    <button key={mode} onClick={() => setEditRoundMode(mode)} className={cn("flex-1 h-9 rounded-md border text-xs font-medium capitalize transition-colors", editRoundMode === mode ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:border-primary/50")}>
                                        {mode === "online" ? <><Video className="h-3.5 w-3.5 inline mr-1.5" />Online</> : <><MapPinned className="h-3.5 w-3.5 inline mr-1.5" />Physical</>}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {editRoundMode === "online" && (
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">Meeting Link (optional)</p>
                                <input type="url" value={editRoundMeetingLink} onChange={e => setEditRoundMeetingLink(e.target.value)} placeholder="https://meet.google.com/..." className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs" />
                            </div>
                        )}
                        {editRoundMode === "physical" && (
                            <div className="space-y-2">
                                <div className="space-y-1.5">
                                    <p className="text-xs font-medium text-muted-foreground">Interview Address *</p>
                                    <input type="text" value={editRoundAddress} onChange={e => setEditRoundAddress(e.target.value)} placeholder="123 Main St, City" className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs" />
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-xs font-medium text-muted-foreground">Map Link (optional)</p>
                                    <input type="url" value={editRoundMapLink} onChange={e => setEditRoundMapLink(e.target.value)} placeholder="https://maps.google.com/..." className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs" />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditRoundDialog({ isOpen: false, roundId: "", roundLabel: "" })}>Cancel</Button>
                        <Button onClick={handleSaveEditRound} disabled={isSavingEditRound}>
                            {isSavingEditRound && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel round dialog */}
            <Dialog open={cancelRoundDialog.isOpen} onOpenChange={(open) => { if (!open) { setCancelRoundDialog({ isOpen: false, roundId: "", roundLabel: "" }); setCancelRoundReason(""); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel {cancelRoundDialog.roundLabel}</DialogTitle>
                        <DialogDescription>Please provide a reason. This will be shared with the candidate.</DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Reason for cancellation…"
                        value={cancelRoundReason}
                        onChange={e => setCancelRoundReason(e.target.value)}
                        rows={4}
                        className="resize-none"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setCancelRoundDialog({ isOpen: false, roundId: "", roundLabel: "" }); setCancelRoundReason(""); }} disabled={isCancelingRound}>Keep Round</Button>
                        <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleCancelRound} disabled={isCancelingRound || !cancelRoundReason.trim()}>
                            {isCancelingRound ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Canceling…</> : "Confirm Cancellation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
