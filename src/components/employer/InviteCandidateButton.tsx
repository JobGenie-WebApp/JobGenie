"use client";

import { useState, useEffect } from "react";
import { Send, Loader2, Plus, Trash2, XCircle, Lock, Video, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    getInvitationJourneyDisplay,
    journeyVariantToEmployerBadgeProps,
} from "@/lib/invitation-journey-status";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


interface TimeSlot {
    id: string;
    date: string;
    time: string;
}

interface InviteCandidateButtonProps {
    candidateId: string;
    suggestedIndustry?: string;
    suggestedDesignation?: string;
    isInvited?: boolean;
    isHiredElsewhere?: boolean;
    // Invitation journey fields — used to lock the cancel button after acceptance
    invitationStatus?: string | null;
    invitationPipelineStatus?: string | null;
    invitationInterviewConfirmed?: boolean;
    invitationCurrentRound?: number | null;
    invitationMisRescheduled?: boolean;
    onInvitationChange?: () => void;  // Callback to refresh data
}

// All time options from 9 AM to 4:30 PM in 30-minute intervals
const ALL_TIME_OPTIONS: { label: string; hour: number; minute: number }[] = (() => {
    const times = [];
    for (let hour = 9; hour <= 16; hour++) {
        for (let min = 0; min < 60; min += 30) {
            if (hour === 16 && min > 30) break;
            const h = hour.toString().padStart(2, '0');
            const m = min.toString().padStart(2, '0');
            times.push({ label: `${h}:${m}`, hour, minute: min });
        }
    }
    return times;
})();

function getAvailableTimeOptions(dateStr: string): string[] {
    if (!dateStr) return ALL_TIME_OPTIONS.map(t => t.label);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    if (dateStr !== today) return ALL_TIME_OPTIONS.map(t => t.label);
    return ALL_TIME_OPTIONS
        .filter(t => {
            const slotTime = new Date(dateStr);
            slotTime.setHours(t.hour, t.minute, 0, 0);
            return slotTime.getTime() > now.getTime() + 30 * 60 * 1000;
        })
        .map(t => t.label);
}

export function InviteCandidateButton({
    candidateId,
    suggestedIndustry,
    suggestedDesignation,
    isInvited = false,
    isHiredElsewhere = false,
    invitationStatus,
    invitationPipelineStatus,
    invitationInterviewConfirmed,
    invitationCurrentRound,
    invitationMisRescheduled,
    onInvitationChange
}: InviteCandidateButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [message, setMessage] = useState("");
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [sending, setSending] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [interviewMode, setInterviewMode] = useState<'online' | 'physical'>('online');
    const [interviewAddress, setInterviewAddress] = useState("");
    const [mapLink, setMapLink] = useState("");

    // Initialize with one empty time slot when dialog opens
    useEffect(() => {
        if (isOpen && timeSlots.length === 0 && !isInvited) {
            addTimeSlot();
        }
    }, [isOpen, isInvited]);

    const addTimeSlot = () => {
        if (timeSlots.length < 3) {
            setTimeSlots([...timeSlots, {
                id: crypto.randomUUID(),
                date: "",
                time: ""
            }]);
        }
    };

    const removeTimeSlot = (id: string) => {
        setTimeSlots(timeSlots.filter(slot => slot.id !== id));
    };

    const updateSlotDate = (id: string, date: string) => {
        setTimeSlots(timeSlots.map(slot => {
            if (slot.id !== id) return slot;
            // Clear time if it's no longer valid for the new date
            const available = getAvailableTimeOptions(date);
            const time = available.includes(slot.time) ? slot.time : "";
            return { ...slot, date, time };
        }));
    };

    const updateSlotTime = (id: string, time: string) => {
        setTimeSlots(timeSlots.map(slot =>
            slot.id === id ? { ...slot, time } : slot
        ));
    };

    const handleSendInvitation = async () => {
        // Validation
        if (timeSlots.length === 0) {
            toast.error("Please add at least one time slot");
            return;
        }

        const incompleteSlots = timeSlots.filter(s => !s.date || !s.time);
        if (incompleteSlots.length > 0) {
            toast.error("Please complete all time slots");
            return;
        }

        if (!suggestedIndustry || !suggestedDesignation) {
            toast.error("Missing job position information");
            return;
        }

        if (interviewMode === 'physical' && !interviewAddress.trim()) {
            toast.error("Please provide an interview address for physical interviews");
            return;
        }

        setSending(true);
        try {
            const response = await fetch("/api/employer/invitations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    candidateId,
                    industry: suggestedIndustry,
                    jobDesignation: suggestedDesignation,
                    message: message.trim() || undefined,
                    timeSlots: timeSlots.map((slot, index) => ({
                        date: slot.date,
                        time: slot.time,
                        order: index + 1
                    })),
                    interviewMode,
                    interviewAddress: interviewMode === 'physical' ? interviewAddress.trim() : undefined,
                    mapLink: interviewMode === 'physical' ? mapLink.trim() : undefined
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Invitation sent successfully!");
                setIsOpen(false);
                setTimeSlots([]);
                setMessage("");
                setInterviewAddress("");
                setMapLink("");
                setInterviewMode('online');
                // Trigger refresh
                if (onInvitationChange) {
                    onInvitationChange();
                } else {
                    // Fallback: reload page
                    window.location.reload();
                }
            } else {
                toast.error(data.error || "Failed to send invitation");
            }
        } catch (error) {
            console.error("Error sending invitation:", error);
            toast.error("An error occurred while sending invitation");
        } finally {
            setSending(false);
        }
    };

    const handleCancelInvitation = async () => {
        setCancelling(true);
        try {
            const response = await fetch(`/api/employer/invitations/cancel?candidateId=${candidateId}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Invitation cancelled successfully!");
                setShowCancelDialog(false);
                // Trigger refresh
                if (onInvitationChange) {
                    onInvitationChange();
                } else {
                    // Fallback: reload page
                    window.location.reload();
                }
            } else {
                toast.error(data.error || "Failed to cancel invitation");
            }
        } catch (error) {
            console.error("Error cancelling invitation:", error);
            toast.error("An error occurred while cancelling invitation");
        } finally {
            setCancelling(false);
        }
    };

    const today = new Date().toISOString().split('T')[0];
    const isFormValid = timeSlots.length > 0 && 
                       timeSlots.every(s => s.date && s.time) &&
                       (interviewMode === 'online' || (interviewMode === 'physical' && interviewAddress.trim().length > 0));

    // Determine if the Cancel Invitation button should be locked.
    // Cancellation is only allowed while the candidate hasn't acted on the invitation
    // (i.e. status is pending or viewed). Once accepted, the pipeline is underway.
    const canCancelInvitation = !invitationStatus ||
        invitationStatus === 'pending' ||
        invitationStatus === 'viewed';

    // Compute the human-readable journey label to display when locked
    const journeyDisplay = (!canCancelInvitation && invitationStatus)
        ? getInvitationJourneyDisplay({
            status: invitationStatus,
            invitation_canceled: false,
            interview_confirmed: invitationInterviewConfirmed ?? false,
            mis_rescheduled: invitationMisRescheduled ?? false,
            pipeline_status: invitationPipelineStatus ?? null,
            current_round_number: invitationCurrentRound ?? null,
        })
        : null;

    const journeyBadgeProps = journeyDisplay
        ? journeyVariantToEmployerBadgeProps(journeyDisplay.variant)
        : null;

    // If hired by another company, show locked state — cannot invite
    if (isHiredElsewhere) {
        return (
            <div className="space-y-2">
                <Button className="w-full" size="lg" variant="outline" disabled>
                    <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Invite for an Interview</span>
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                    This candidate has accepted an offer from another company.
                </p>
            </div>
        );
    }

    // If already invited by this company, show cancel button (or locked status if accepted)
    if (isInvited) {
        return (
            <>
                {canCancelInvitation ? (
                    /* Candidate hasn't accepted yet — allow cancellation */
                    <Button
                        className="w-full cursor-pointer"
                        size="lg"
                        variant="destructive"
                        onClick={() => setShowCancelDialog(true)}
                        disabled={cancelling}
                    >
                        {cancelling ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Cancelling...
                            </>
                        ) : (
                            <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Invitation
                            </>
                        )}
                    </Button>
                ) : (
                    /* Candidate has accepted — disable and show current status */
                    <div className="space-y-2">
                        <Button
                            className="w-full"
                            size="lg"
                            variant="outline"
                            disabled
                        >
                            <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground">Cancel Invitation</span>
                        </Button>
                        {journeyDisplay && journeyBadgeProps && (
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <span>Candidate status:</span>
                                <Badge
                                    variant={journeyBadgeProps.variant}
                                    className={journeyBadgeProps.className}
                                >
                                    {journeyDisplay.label}
                                </Badge>
                            </div>
                        )}
                    </div>
                )}

                <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to cancel this interview invitation? The candidate will no longer see this invitation as active. You can send a new invitation later if needed.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={cancelling}>No, Keep It</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleCancelInvitation}
                                disabled={cancelling}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {cancelling ? "Cancelling..." : "Yes, Cancel Invitation"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        );
    }

    // Otherwise show normal invite button
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="w-full" size="lg">
                    <Send className="h-4 w-4 mr-2" />
                    Invite for an Interview
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Invite Candidate for Interview</DialogTitle>
                    <DialogDescription>
                        Position: {suggestedIndustry} - {suggestedDesignation}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Time Slots Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Available Time Slots *</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addTimeSlot}
                                disabled={timeSlots.length >= 3 || sending}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Time Slot
                            </Button>
                        </div>

                        {timeSlots.map((slot, index) => (
                            <Card key={slot.id} className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <Label className="font-medium">Time Slot {index + 1}</Label>
                                    {timeSlots.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeTimeSlot(slot.id)}
                                            disabled={sending}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Date *</Label>
                                        <Input
                                            type="date"
                                            value={slot.date}
                                            onChange={(e) => updateSlotDate(slot.id, e.target.value)}
                                            min={today}
                                            disabled={sending}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Time Slot *</Label>
                                        <Select
                                            value={slot.time}
                                            onValueChange={(v) => updateSlotTime(slot.id, v)}
                                            disabled={sending}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select time" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(() => {
                                                    const opts = getAvailableTimeOptions(slot.date);
                                                    return opts.length === 0
                                                        ? <div className="px-3 py-2 text-sm text-muted-foreground">No slots available for today</div>
                                                        : opts.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>);
                                                })()}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </Card>
                        ))}

                        <p className="text-xs text-muted-foreground">
                            {timeSlots.length} of 3 time slots added
                        </p>
                    </div>

                    {/* Interview Mode Section */}
                    <div className="space-y-3">
                        <Label>Interview Mode *</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                type="button"
                                variant={interviewMode === 'online' ? 'default' : 'outline'}
                                className={cn(
                                    "flex items-center gap-2 h-12",
                                    interviewMode === 'online' && "ring-2 ring-primary ring-offset-2"
                                )}
                                onClick={() => setInterviewMode('online')}
                                disabled={sending}
                            >
                                <Video className="h-4 w-4" />
                                Online
                            </Button>
                            <Button
                                type="button"
                                variant={interviewMode === 'physical' ? 'default' : 'outline'}
                                className={cn(
                                    "flex items-center gap-2 h-12",
                                    interviewMode === 'physical' && "ring-2 ring-primary ring-offset-2"
                                )}
                                onClick={() => setInterviewMode('physical')}
                                disabled={sending}
                            >
                                <MapPinned className="h-4 w-4" />
                                Physical
                            </Button>
                        </div>

                        {interviewMode === 'physical' && (
                            <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label className="text-xs">Interview Address *</Label>
                                    <Input
                                        placeholder="Enter the full address for the interview..."
                                        value={interviewAddress}
                                        onChange={(e) => setInterviewAddress(e.target.value)}
                                        disabled={sending}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Google Maps Link (Optional)</Label>
                                    <Input
                                        placeholder="Paste Google Maps URL here..."
                                        value={mapLink}
                                        onChange={(e) => setMapLink(e.target.value)}
                                        disabled={sending}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Optional Message */}
                    <div className="space-y-2">
                        <Label>Personal Message (Optional)</Label>
                        <Textarea
                            placeholder="Add a personal message to make your invitation more appealing..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={500}
                            rows={3}
                            disabled={sending}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {message.length}/500 characters
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={sending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSendInvitation}
                        disabled={!isFormValid || sending}
                    >
                        {sending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                Send Invitation
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
