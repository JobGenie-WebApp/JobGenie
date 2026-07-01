"use client";

import { useState, useEffect } from "react";
import { Send, Loader2, Plus, Trash2, Video, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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

interface ScheduleInterviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Endpoint that receives the POST with the scheduling payload. */
    endpoint: string;
    /** Shown in the dialog subtitle, e.g. "Software Engineer". */
    positionLabel?: string;
    /** Extra fields merged into the request body (e.g. candidateId, industry, jobDesignation). */
    extraPayload?: Record<string, unknown>;
    /** Optional pre-submit validation; return an error message to block submit. */
    validateBeforeSubmit?: () => string | null;
    /** Called after a successful schedule. */
    onSuccess?: (data: unknown) => void;
}

// All time options from 9 AM to 4:30 PM in 30-minute intervals
const ALL_TIME_OPTIONS: { label: string; hour: number; minute: number }[] = (() => {
    const times = [];
    for (let hour = 9; hour <= 16; hour++) {
        for (let min = 0; min < 60; min += 30) {
            if (hour === 16 && min > 30) break;
            const h = hour.toString().padStart(2, "0");
            const m = min.toString().padStart(2, "0");
            times.push({ label: `${h}:${m}`, hour, minute: min });
        }
    }
    return times;
})();

function getAvailableTimeOptions(dateStr: string): string[] {
    if (!dateStr) return ALL_TIME_OPTIONS.map((t) => t.label);
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    if (dateStr !== today) return ALL_TIME_OPTIONS.map((t) => t.label);
    return ALL_TIME_OPTIONS
        .filter((t) => {
            const slotTime = new Date(dateStr);
            slotTime.setHours(t.hour, t.minute, 0, 0);
            return slotTime.getTime() > now.getTime() + 30 * 60 * 1000;
        })
        .map((t) => t.label);
}

export function ScheduleInterviewDialog({
    open,
    onOpenChange,
    endpoint,
    positionLabel,
    extraPayload,
    validateBeforeSubmit,
    onSuccess,
}: ScheduleInterviewDialogProps) {
    const [message, setMessage] = useState("");
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [sending, setSending] = useState(false);
    const [interviewMode, setInterviewMode] = useState<"online" | "physical">("online");
    const [interviewAddress, setInterviewAddress] = useState("");
    const [mapLink, setMapLink] = useState("");

    // Initialize with one empty time slot when dialog opens
    useEffect(() => {
        if (open && timeSlots.length === 0) {
            addTimeSlot();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const addTimeSlot = () => {
        setTimeSlots((prev) =>
            prev.length < 3
                ? [...prev, { id: crypto.randomUUID(), date: "", time: "" }]
                : prev
        );
    };

    const removeTimeSlot = (id: string) => {
        setTimeSlots(timeSlots.filter((slot) => slot.id !== id));
    };

    const updateSlotDate = (id: string, date: string) => {
        setTimeSlots(
            timeSlots.map((slot) => {
                if (slot.id !== id) return slot;
                const available = getAvailableTimeOptions(date);
                const time = available.includes(slot.time) ? slot.time : "";
                return { ...slot, date, time };
            })
        );
    };

    const updateSlotTime = (id: string, time: string) => {
        setTimeSlots(timeSlots.map((slot) => (slot.id === id ? { ...slot, time } : slot)));
    };

    const resetForm = () => {
        setTimeSlots([]);
        setMessage("");
        setInterviewAddress("");
        setMapLink("");
        setInterviewMode("online");
    };

    const handleSubmit = async () => {
        if (timeSlots.length === 0) {
            toast.error("Please add at least one time slot");
            return;
        }
        const incompleteSlots = timeSlots.filter((s) => !s.date || !s.time);
        if (incompleteSlots.length > 0) {
            toast.error("Please complete all time slots");
            return;
        }
        if (interviewMode === "physical" && !interviewAddress.trim()) {
            toast.error("Please provide an interview address for physical interviews");
            return;
        }
        const customError = validateBeforeSubmit?.();
        if (customError) {
            toast.error(customError);
            return;
        }

        setSending(true);
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...extraPayload,
                    message: message.trim() || undefined,
                    timeSlots: timeSlots.map((slot, index) => ({
                        date: slot.date,
                        time: slot.time,
                        order: index + 1,
                    })),
                    interviewMode,
                    interviewAddress:
                        interviewMode === "physical" ? interviewAddress.trim() : undefined,
                    mapLink: interviewMode === "physical" ? mapLink.trim() : undefined,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Interview scheduled — invitation sent to the candidate.");
                onOpenChange(false);
                resetForm();
                onSuccess?.(data.data);
            } else {
                toast.error(data.error || "Failed to schedule interview");
            }
        } catch (error) {
            console.error("Error scheduling interview:", error);
            toast.error("An error occurred while scheduling the interview");
        } finally {
            setSending(false);
        }
    };

    const today = new Date().toISOString().split("T")[0];
    const isFormValid =
        timeSlots.length > 0 &&
        timeSlots.every((s) => s.date && s.time) &&
        (interviewMode === "online" ||
            (interviewMode === "physical" && interviewAddress.trim().length > 0));

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) resetForm();
                onOpenChange(next);
            }}
        >
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Schedule Interview</DialogTitle>
                    <DialogDescription>
                        {positionLabel
                            ? `Propose interview time slots for ${positionLabel}.`
                            : "Propose interview time slots for the candidate."}
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
                                                    return opts.length === 0 ? (
                                                        <div className="px-3 py-2 text-sm text-muted-foreground">
                                                            No slots available for today
                                                        </div>
                                                    ) : (
                                                        opts.map((t) => (
                                                            <SelectItem key={t} value={t}>
                                                                {t}
                                                            </SelectItem>
                                                        ))
                                                    );
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
                                variant={interviewMode === "online" ? "default" : "outline"}
                                className={cn(
                                    "flex items-center gap-2 h-12",
                                    interviewMode === "online" && "ring-2 ring-primary ring-offset-2"
                                )}
                                onClick={() => setInterviewMode("online")}
                                disabled={sending}
                            >
                                <Video className="h-4 w-4" />
                                Online
                            </Button>
                            <Button
                                type="button"
                                variant={interviewMode === "physical" ? "default" : "outline"}
                                className={cn(
                                    "flex items-center gap-2 h-12",
                                    interviewMode === "physical" && "ring-2 ring-primary ring-offset-2"
                                )}
                                onClick={() => setInterviewMode("physical")}
                                disabled={sending}
                            >
                                <MapPinned className="h-4 w-4" />
                                Physical
                            </Button>
                        </div>

                        {interviewMode === "physical" && (
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
                        onClick={() => onOpenChange(false)}
                        disabled={sending}
                    >
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSubmit} disabled={!isFormValid || sending}>
                        {sending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Scheduling...
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
