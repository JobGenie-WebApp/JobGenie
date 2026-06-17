"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, MapPin, Video, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatUTCDate, formatUTCTime } from "@/lib/date-utils";

interface RoundConfirmDialogProps {
    roundId: string;
    roundNumber: number;
    roundLabel: string | null;
    candidateName: string;
    interviewMode: string | null;
    selectedTimeSlot: { date: string; time: string; is_alternative?: boolean } | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function RoundConfirmDialog({
    roundId,
    roundNumber,
    roundLabel,
    candidateName,
    interviewMode,
    selectedTimeSlot,
    isOpen,
    onClose,
    onSuccess,
}: RoundConfirmDialogProps) {
    const [meetingLink, setMeetingLink] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const isOnline = interviewMode === "online";

    const handleSubmit = async () => {
        if (isOnline && !meetingLink.trim()) {
            toast.error("Please provide a meeting link");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/employer/interview-rounds/${roundId}/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    meeting_link: meetingLink.trim() || null,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Interview round confirmed!");
                onSuccess();
                handleClose();
            } else {
                toast.error(data.error || "Failed to confirm interview round");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setMeetingLink("");
        onClose();
    };

    const label = roundLabel || `Round ${roundNumber}`;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle>Confirm {label}</DialogTitle>
                    <DialogDescription>
                        Confirming interview for {candidateName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Selected slot summary */}
                    {selectedTimeSlot && (
                        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-1.5">
                            <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground mb-1">Interview details</p>
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="font-medium">{formatUTCDate(selectedTimeSlot.date, "EEEE, MMM d, yyyy")}</span>
                            </div>
                            {selectedTimeSlot.time && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span>{formatUTCTime(selectedTimeSlot.date, selectedTimeSlot.time)}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                                {isOnline
                                    ? <Video className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    : <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                }
                                <span className="capitalize">{interviewMode} Interview</span>
                            </div>
                        </div>
                    )}

                    {/* Online only: meeting link */}
                    {isOnline && (
                        <div className="space-y-1.5">
                            <Label htmlFor="meetingLink">Meeting Link <span className="text-destructive">*</span></Label>
                            <Input
                                id="meetingLink"
                                type="url"
                                placeholder="https://meet.google.com/abc-defg-hij"
                                value={meetingLink}
                                onChange={e => setMeetingLink(e.target.value)}
                                disabled={submitting}
                            />
                            <p className="text-xs text-muted-foreground">Google Meet, Zoom, Teams, or any video call link</p>
                        </div>
                    )}

                    {/* Physical: no extra input needed */}
                    {!isOnline && (
                        <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                            <p className="text-sm text-muted-foreground">
                                Location details were already shared with the candidate. Confirming will notify them the interview is set.
                            </p>
                        </div>
                    )}

                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 dark:bg-blue-950/20 dark:border-blue-800 px-4 py-3">
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                            The candidate will receive a confirmation email with all interview details.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting || (isOnline && !meetingLink.trim())}>
                        {submitting
                            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Confirming…</>
                            : <><CheckCircle2 className="h-4 w-4 mr-2" />Confirm Interview</>
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
