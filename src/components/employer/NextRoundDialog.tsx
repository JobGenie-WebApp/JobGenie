"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Calendar, Video, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TimeSlot {
    id: string;
    date: string;
    time: string;
}

interface NextRoundDialogProps {
    previousRoundId: string;
    nextRoundNumber: number;
    candidateName: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const TIME_OPTIONS: string[] = (() => {
    const times: string[] = [];
    for (let h = 9; h <= 17; h++) {
        for (const m of [0, 30]) {
            if (h === 17 && m > 0) break;
            times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
        }
    }
    return times;
})();

function formatTimeLabel(t: string) {
    const [h, m] = t.split(":").map(Number);
    const ampm = h < 12 ? "AM" : "PM";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${m === 0 ? "00" : m} ${ampm}`;
}

export function NextRoundDialog({
    previousRoundId,
    nextRoundNumber,
    candidateName,
    isOpen,
    onClose,
    onSuccess,
}: NextRoundDialogProps) {
    const [roundLabel, setRoundLabel] = useState(`Round ${nextRoundNumber}`);
    const [interviewMode, setInterviewMode] = useState<"online" | "physical">("online");
    const [interviewAddress, setInterviewAddress] = useState("");
    const [mapLink, setMapLink] = useState("");
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([{ id: crypto.randomUUID(), date: "", time: "" }]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRoundLabel(`Round ${nextRoundNumber}`);
            setInterviewMode("online");
            setInterviewAddress("");
            setMapLink("");
            setTimeSlots([{ id: crypto.randomUUID(), date: "", time: "" }]);
        }
    }, [isOpen, nextRoundNumber]);

    const today = new Date().toISOString().split("T")[0];

    const addTimeSlot = () => {
        if (timeSlots.length < 3) {
            setTimeSlots(prev => [...prev, { id: crypto.randomUUID(), date: "", time: "" }]);
        }
    };

    const removeTimeSlot = (id: string) => {
        if (timeSlots.length > 1) setTimeSlots(prev => prev.filter(s => s.id !== id));
    };

    const updateSlot = (id: string, field: "date" | "time", value: string) => {
        setTimeSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleSubmit = async () => {
        if (timeSlots.some(s => !s.date || !s.time)) {
            toast.error("Please complete all time slots");
            return;
        }
        if (interviewMode === "physical" && !interviewAddress.trim()) {
            toast.error("Please provide the interview address");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/employer/interview-rounds/next-round", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    previous_round_id: previousRoundId,
                    round_label: roundLabel.trim() || `Round ${nextRoundNumber}`,
                    interview_mode: interviewMode,
                    interview_address: interviewMode === "physical" ? interviewAddress.trim() : null,
                    map_link: interviewMode === "physical" && mapLink.trim() ? mapLink.trim() : null,
                    time_slots: timeSlots.map((s, i) => ({ date: s.date, time: s.time, order: i + 1 })),
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Next interview round scheduled!");
                onSuccess();
                onClose();
            } else {
                toast.error(data.error || "Failed to create next round");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const isFormValid =
        timeSlots.every(s => s.date && s.time) &&
        (interviewMode !== "physical" || interviewAddress.trim().length > 0);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Schedule Next Interview Round</DialogTitle>
                    <DialogDescription>
                        Schedule round {nextRoundNumber} for {candidateName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Round label */}
                    <div className="space-y-1.5">
                        <Label htmlFor="roundLabel">Round Label</Label>
                        <Input
                            id="roundLabel"
                            value={roundLabel}
                            onChange={e => setRoundLabel(e.target.value)}
                            placeholder="e.g., Technical Interview, Culture Fit, Final Round"
                            maxLength={100}
                            disabled={submitting}
                        />
                        <p className="text-xs text-muted-foreground">Give this round a descriptive name (optional)</p>
                    </div>

                    {/* Interview mode */}
                    <div className="space-y-1.5">
                        <Label>Interview Mode <span className="text-destructive">*</span></Label>
                        <div className="grid grid-cols-2 gap-3">
                            {(["online", "physical"] as const).map(mode => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setInterviewMode(mode)}
                                    disabled={submitting}
                                    className={cn(
                                        "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                                        interviewMode === mode
                                            ? "border-primary bg-primary/6"
                                            : "border-border hover:border-border/80 hover:bg-muted/40",
                                    )}
                                >
                                    <div className={cn(
                                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                        interviewMode === mode ? "bg-primary/10" : "bg-muted",
                                    )}>
                                        {mode === "online"
                                            ? <Video className={cn("h-4 w-4", interviewMode === mode ? "text-primary" : "text-muted-foreground")} />
                                            : <MapPin className={cn("h-4 w-4", interviewMode === mode ? "text-primary" : "text-muted-foreground")} />
                                        }
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold capitalize">{mode}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {mode === "online" ? "Video call" : "In-person"}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Physical location fields */}
                    {interviewMode === "physical" && (
                        <div className="space-y-3 rounded-xl border border-border bg-muted/20 px-4 py-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="address">Interview Address <span className="text-destructive">*</span></Label>
                                <Textarea
                                    id="address"
                                    placeholder="Company office address..."
                                    value={interviewAddress}
                                    onChange={e => setInterviewAddress(e.target.value)}
                                    rows={2}
                                    maxLength={500}
                                    disabled={submitting}
                                    className="resize-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="mapLink">Map Link <span className="text-muted-foreground text-xs font-normal">(Optional)</span></Label>
                                <Input
                                    id="mapLink"
                                    type="url"
                                    placeholder="https://maps.google.com/..."
                                    value={mapLink}
                                    onChange={e => setMapLink(e.target.value)}
                                    disabled={submitting}
                                />
                                <p className="text-xs text-muted-foreground">Google Maps link to help the candidate find the location</p>
                            </div>
                        </div>
                    )}

                    {/* Time slots */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Time Slots <span className="text-destructive">*</span></Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addTimeSlot}
                                disabled={timeSlots.length >= 3 || submitting}
                                className="h-7 text-xs gap-1"
                            >
                                <Plus className="h-3.5 w-3.5" />Add Time Slot
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {timeSlots.map((slot, i) => (
                                <div key={slot.id} className="flex items-end gap-2 rounded-xl border border-border bg-card px-3 py-3">
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Date <span className="text-destructive">*</span></Label>
                                        <Input
                                            type="date"
                                            value={slot.date}
                                            onChange={e => updateSlot(slot.id, "date", e.target.value)}
                                            min={today}
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div className="w-36 space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Time <span className="text-destructive">*</span></Label>
                                        <Select
                                            value={slot.time}
                                            onValueChange={v => updateSlot(slot.id, "time", v)}
                                            disabled={submitting}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIME_OPTIONS.map(t => (
                                                    <SelectItem key={t} value={t}>{formatTimeLabel(t)}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => removeTimeSlot(slot.id)}
                                        disabled={timeSlots.length === 1 || submitting}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{timeSlots.length} of 3 time slots added</p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!isFormValid || submitting}>
                        {submitting
                            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</>
                            : <><Calendar className="h-4 w-4 mr-2" />Schedule Next Round</>
                        }
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
