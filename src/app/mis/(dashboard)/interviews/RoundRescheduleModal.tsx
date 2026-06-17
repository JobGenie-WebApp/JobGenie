"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface RoundRescheduleModalProps {
    roundId: string;
    roundLabel: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ALL_TIME_SLOTS = (() => {
    const slots: { label: string; hour: number; minute: number }[] = [];
    for (let hour = 9; hour <= 17; hour++) {
        for (const minute of [0, 30]) {
            if (hour === 17 && minute === 30) break;
            const period = hour >= 12 ? "PM" : "AM";
            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            slots.push({ label: `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`, hour, minute });
        }
    }
    return slots;
})();

function getAvailableTimeSlots(selectedDate: Date | undefined): string[] {
    if (!selectedDate) return ALL_TIME_SLOTS.map(s => s.label);
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    if (!isToday) return ALL_TIME_SLOTS.map(s => s.label);
    return ALL_TIME_SLOTS
        .filter(s => {
            const slotTime = new Date(selectedDate);
            slotTime.setHours(s.hour, s.minute, 0, 0);
            return slotTime.getTime() > now.getTime() + 30 * 60 * 1000;
        })
        .map(s => s.label);
}

export function RoundRescheduleModal({ roundId, roundLabel, isOpen, onClose, onSuccess }: RoundRescheduleModalProps) {
    const [date, setDate] = useState<Date>();
    const [time, setTime] = useState<string>("");

    const availableTimeSlots = getAvailableTimeSlots(date);

    const handleDateSelect = (d: Date | undefined) => {
        setDate(d);
        if (d && time) {
            const slots = getAvailableTimeSlots(d);
            if (!slots.includes(time)) setTime("");
        }
    };
    const [interviewMode, setInterviewMode] = useState<"online" | "physical">("online");
    const [meetingLink, setMeetingLink] = useState("");
    const [interviewAddress, setInterviewAddress] = useState("");
    const [mapLink, setMapLink] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReset = () => {
        setDate(undefined);
        setTime("");
        setInterviewMode("online");
        setMeetingLink("");
        setInterviewAddress("");
        setMapLink("");
        setNotes("");
        setError(null);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!date) {
            setError("Please select an interview date");
            return;
        }

        if (!time) {
            setError("Please select an interview time");
            return;
        }

        if (interviewMode === "online" && !meetingLink.trim()) {
            setError("Meeting link is required for online interviews");
            return;
        }

        if (interviewMode === "physical" && !interviewAddress.trim()) {
            setError("Interview address is required for physical interviews");
            return;
        }

        if (interviewMode === "online") {
            try {
                new URL(meetingLink);
            } catch {
                setError("Please enter a valid meeting link URL");
                return;
            }
        }

        if (mapLink.trim()) {
            try {
                new URL(mapLink);
            } catch {
                setError("Please enter a valid map link URL");
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/mis/interview-rounds/${roundId}/reschedule`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    date: format(date, "yyyy-MM-dd"),
                    time,
                    interview_mode: interviewMode,
                    ...(interviewMode === "online" && { meeting_link: meetingLink }),
                    ...(interviewMode === "physical" && {
                        interview_address: interviewAddress,
                        ...(mapLink.trim() && { map_link: mapLink })
                    }),
                    ...(notes.trim() && { notes: notes.trim() })
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to reschedule round");
            }

            handleReset();
            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to reschedule round");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Reschedule {roundLabel}</DialogTitle>
                    <DialogDescription>
                        Provide new interview details to reschedule this cancelled round.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="round-date">Interview Date *</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="round-date"
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : "Select date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={handleDateSelect}
                                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="round-time">Interview Time *</Label>
                        <Select value={time} onValueChange={setTime}>
                            <SelectTrigger id="round-time">
                                <SelectValue placeholder="Select time slot" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTimeSlots.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">No slots available for today</div>
                                ) : (
                                    availableTimeSlots.map((slot) => (
                                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Interview Mode *</Label>
                        <RadioGroup value={interviewMode} onValueChange={(value) => setInterviewMode(value as "online" | "physical")}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="online" id="round-online" />
                                <Label htmlFor="round-online" className="font-normal cursor-pointer">Online</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="physical" id="round-physical" />
                                <Label htmlFor="round-physical" className="font-normal cursor-pointer">Physical</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {interviewMode === "online" && (
                        <div className="space-y-2">
                            <Label htmlFor="round-meeting-link">Meeting Link *</Label>
                            <Input
                                id="round-meeting-link"
                                type="url"
                                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                            />
                        </div>
                    )}

                    {interviewMode === "physical" && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="round-address">Interview Address *</Label>
                                <Textarea
                                    id="round-address"
                                    placeholder="Enter the physical interview location"
                                    rows={3}
                                    value={interviewAddress}
                                    onChange={(e) => setInterviewAddress(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="round-map-link">Map Link (Optional)</Label>
                                <Input
                                    id="round-map-link"
                                    type="url"
                                    placeholder="https://maps.google.com/?q=..."
                                    value={mapLink}
                                    onChange={(e) => setMapLink(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="round-notes">Additional Notes (Optional)</Label>
                        <Textarea
                            id="round-notes"
                            placeholder="Any additional information about the rescheduled round"
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reschedule Round
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
