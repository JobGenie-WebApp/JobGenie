"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Check, X, Loader2, Video, MapPin, ExternalLink, Copy, Lock } from "lucide-react";
import { toast } from "sonner";
import { formatUTCDate, formatUTCTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

interface TimeSlot {
    date: string;
    time: string;
    order: number;
    is_alternative?: boolean;
}

interface RoundResponseCardProps {
    roundId: string;
    roundNumber: number;
    roundLabel: string | null;
    interviewMode: string | null;
    meetingLink: string | null;
    interviewAddress: string | null;
    mapLink: string | null;
    givenTimeSlots: TimeSlot[];
    onResponse: () => void;
}

export function RoundResponseCard({
    roundId,
    roundNumber,
    roundLabel,
    interviewMode,
    meetingLink,
    interviewAddress,
    mapLink,
    givenTimeSlots,
    onResponse,
}: RoundResponseCardProps) {
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const slots = (givenTimeSlots || []).sort((a, b) => a.order - b.order);

    const handleAccept = async () => {
        if (!selectedSlot) {
            toast.error("Please select a time slot");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/candidate/interview-rounds/${roundId}/respond`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "accept",
                    selected_time_slot: selectedSlot,
                    interview_mode: interviewMode ?? "online",
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Interview round accepted!");
                onResponse();
            } else {
                toast.error(data.error || "Failed to accept interview round");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDecline = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/candidate/interview-rounds/${roundId}/respond`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "decline" }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Interview round declined");
                onResponse();
            } else {
                toast.error(data.error || "Failed to decline");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Interview mode + location details */}
            {interviewMode && (
                <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
                    {/* Mode header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            {interviewMode === "online"
                                ? <Video className="h-4 w-4 text-primary" />
                                : <MapPin className="h-4 w-4 text-primary" />
                            }
                        </div>
                        <div>
                            <p className="text-sm font-semibold capitalize">{interviewMode} Interview</p>
                        </div>
                    </div>

                    {/* Physical: show address */}
                    {interviewMode === "physical" && interviewAddress && (
                        <div className="px-4 py-3 space-y-2">
                            <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground">Location</p>
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                <p className="text-sm text-foreground/90 leading-snug">{interviewAddress}</p>
                            </div>
                            {mapLink && (
                                <Button variant="outline" size="sm" className="h-7 text-xs mt-1" asChild>
                                    <a href={mapLink} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-3 w-3 mr-1.5" />Open in Maps
                                    </a>
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Physical: no address yet */}
                    {interviewMode === "physical" && !interviewAddress && (
                        <div className="px-4 py-3">
                            <p className="text-xs text-muted-foreground">Location details will be shared after confirmation.</p>
                        </div>
                    )}

                    {/* Online: meeting link locked until accepted */}
                    {interviewMode === "online" && (
                        <div className="px-4 py-3 space-y-1.5">
                            <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground">Meeting link</p>
                            {meetingLink ? (
                                <div className="flex gap-2">
                                    <Input value={meetingLink} readOnly className="flex-1 h-8 text-xs" />
                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0"
                                        onClick={() => { navigator.clipboard.writeText(meetingLink); toast.success("Copied!"); }}>
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button size="sm" className="h-8 shrink-0" asChild>
                                        <a href={meetingLink} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-3.5 w-3.5 mr-1" />Join
                                        </a>
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2">
                                    <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <p className="text-xs text-muted-foreground">Meeting link will be visible after you accept the interview.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Time slot selection */}
            {slots.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200 text-center">
                    No time slots available. Please contact the employer.
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">Select a time slot</p>
                    <div className="grid gap-2">
                        {slots.map((slot, i) => {
                            const sel = selectedSlot?.date === slot.date && selectedSlot?.time === slot.time;
                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={cn(
                                        "relative w-full rounded-xl border-2 px-4 py-3 text-left transition-all duration-150",
                                        sel
                                            ? "border-primary bg-primary/6 shadow-sm"
                                            : "border-border hover:border-border/80 hover:bg-muted/40",
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold">
                                                    {formatUTCDate(slot.date, "EEEE, MMM d, yyyy")}
                                                </p>
                                                {slot.time && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatUTCTime(slot.date, slot.time)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                                            sel ? "border-primary bg-primary" : "border-border",
                                        )}>
                                            {sel && <Check className="h-3 w-3 text-primary-foreground" />}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
                <Button
                    className="flex-1 h-9"
                    onClick={handleAccept}
                    disabled={!selectedSlot || isSubmitting}
                >
                    {isSubmitting
                        ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Processing…</>
                        : <><Check className="h-3.5 w-3.5 mr-1.5" />Accept Interview</>
                    }
                </Button>
                <Button
                    variant="outline"
                    className="h-9 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 dark:border-red-800 dark:text-red-400"
                    onClick={handleDecline}
                    disabled={isSubmitting}
                >
                    <X className="h-3.5 w-3.5 mr-1.5" />Decline
                </Button>
            </div>
        </div>
    );
}
