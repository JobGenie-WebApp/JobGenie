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
import { DateField } from "@/components/ui/date-field";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Calendar, Video, MapPin, ClipboardCheck, Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { localWallTimeToUTC } from "@/lib/date-utils";

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
    const [interviewMode, setInterviewMode] = useState<"online" | "physical" | "assessment">("online");
    const [meetingLink, setMeetingLink] = useState("");
    const [interviewAddress, setInterviewAddress] = useState("");
    const [mapLink, setMapLink] = useState("");
    const [assessmentDeliveryMode, setAssessmentDeliveryMode] = useState<"online" | "physical">("online");
    const [assessmentLink, setAssessmentLink] = useState("");
    const [assessmentDeadlineDate, setAssessmentDeadlineDate] = useState("");
    const [assessmentDeadlineTime, setAssessmentDeadlineTime] = useState("");
    const [assessmentStartDate, setAssessmentStartDate] = useState("");
    const [assessmentStartTime, setAssessmentStartTime] = useState("");
    const [assessmentEndTime, setAssessmentEndTime] = useState("");
    const [assessmentAttachment, setAssessmentAttachment] = useState<File | null>(null);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([{ id: crypto.randomUUID(), date: "", time: "" }]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRoundLabel(`Round ${nextRoundNumber}`);
            setInterviewMode("online");
            setMeetingLink("");
            setInterviewAddress("");
            setMapLink("");
            setAssessmentDeliveryMode("online");
            setAssessmentLink("");
            setAssessmentDeadlineDate("");
            setAssessmentDeadlineTime("");
            setAssessmentStartDate("");
            setAssessmentStartTime("");
            setAssessmentEndTime("");
            setAssessmentAttachment(null);
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
        if (interviewMode !== "assessment" && timeSlots.some(s => !s.date || !s.time)) {
            toast.error("Please complete all time slots");
            return;
        }
        const isPhysical = interviewMode === "physical" || (interviewMode === "assessment" && assessmentDeliveryMode === "physical");
        if (isPhysical && !interviewAddress.trim()) {
            toast.error("Please provide the interview address");
            return;
        }
        const assessmentDeadline = interviewMode === "assessment" && assessmentDeliveryMode === "online"
            ? localWallTimeToUTC(assessmentDeadlineDate, assessmentDeadlineTime)
            : null;
        const assessmentStartAt = interviewMode === "assessment" && assessmentDeliveryMode === "physical"
            ? localWallTimeToUTC(assessmentStartDate, assessmentStartTime)
            : null;
        const assessmentEndAt = interviewMode === "assessment" && assessmentDeliveryMode === "physical"
            ? localWallTimeToUTC(assessmentStartDate, assessmentEndTime)
            : null;
        if (interviewMode === "assessment" && assessmentDeliveryMode === "online" && !assessmentDeadline) {
            toast.error("Please provide the assessment deadline");
            return;
        }
        if (assessmentDeadline && new Date(assessmentDeadline) <= new Date()) {
            toast.error("Assessment deadline must be in the future");
            return;
        }
        if (interviewMode === "assessment" && assessmentDeliveryMode === "physical") {
            if (!assessmentStartAt || !assessmentEndAt) {
                toast.error("Please provide the assessment start and end time");
                return;
            }
            if (new Date(assessmentStartAt) <= new Date()) {
                toast.error("Assessment start time must be in the future");
                return;
            }
            if (new Date(assessmentEndAt) <= new Date(assessmentStartAt)) {
                toast.error("Assessment end time must be after the start time");
                return;
            }
        }

        setSubmitting(true);
        try {
            const payload = {
                previous_round_id: previousRoundId,
                round_label: roundLabel.trim() || `Round ${nextRoundNumber}`,
                interview_mode: interviewMode,
                meeting_link: interviewMode === "online" && meetingLink.trim() ? meetingLink.trim() : null,
                interview_address: isPhysical ? interviewAddress.trim() : null,
                map_link: isPhysical && mapLink.trim() ? mapLink.trim() : null,
                time_slots: interviewMode === "assessment"
                    ? []
                    : timeSlots.map((s, i) => ({ date: s.date, time: s.time, order: i + 1 })),
                assessment_delivery_mode: interviewMode === "assessment" ? assessmentDeliveryMode : null,
                assessment_deadline: assessmentDeadline,
                assessment_start_at: assessmentStartAt,
                assessment_end_at: assessmentEndAt,
                assessment_link: interviewMode === "assessment" && assessmentLink.trim() ? assessmentLink.trim() : null,
            };
            const formData = new FormData();
            formData.append("payload", JSON.stringify(payload));
            if (interviewMode === "assessment" && assessmentAttachment) {
                formData.append("assessment_attachment", assessmentAttachment);
            }
            const res = await fetch("/api/employer/interview-rounds/next-round", {
                method: "POST",
                body: formData,
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
        (interviewMode === "assessment"
            ? assessmentDeliveryMode === "online"
                ? assessmentDeadlineDate.length > 0 && assessmentDeadlineTime.length > 0
                : assessmentStartDate.length > 0 && assessmentStartTime.length > 0 && assessmentEndTime.length > 0
            : timeSlots.every(s => s.date && s.time)) &&
        (interviewMode !== "physical" || interviewAddress.trim().length > 0) &&
        (interviewMode !== "assessment" || assessmentDeliveryMode !== "physical" || interviewAddress.trim().length > 0);

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
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {(["online", "physical", "assessment"] as const).map(mode => (
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
                                        {mode === "online" && <Video className={cn("h-4 w-4", interviewMode === mode ? "text-primary" : "text-muted-foreground")} />}
                                        {mode === "physical" && <MapPin className={cn("h-4 w-4", interviewMode === mode ? "text-primary" : "text-muted-foreground")} />}
                                        {mode === "assessment" && <ClipboardCheck className={cn("h-4 w-4", interviewMode === mode ? "text-primary" : "text-muted-foreground")} />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold capitalize">{mode}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {mode === "online" ? "Video call" : mode === "physical" ? "In-person" : "Test or task"}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Online meeting link (optional at scheduling; can also be added at confirm) */}
                    {interviewMode === "online" && (
                        <div className="space-y-1.5 rounded-xl border border-border bg-muted/20 px-4 py-4">
                            <Label htmlFor="meetingLink">Meeting Link <span className="text-muted-foreground text-xs font-normal">(Optional)</span></Label>
                            <Input
                                id="meetingLink"
                                type="url"
                                placeholder="https://meet.google.com/... or Zoom/Teams link"
                                value={meetingLink}
                                onChange={e => setMeetingLink(e.target.value)}
                                disabled={submitting}
                            />
                            <p className="text-xs text-muted-foreground">Add it now or when you confirm the round. The candidate sees it once the round is confirmed.</p>
                        </div>
                    )}

                    {/* Assessment details */}
                    {interviewMode === "assessment" && (
                        <div className="space-y-4 rounded-xl border border-border bg-muted/20 px-4 py-4">
                            <div className="space-y-1.5">
                                <Label>Assessment Delivery <span className="text-destructive">*</span></Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(["online", "physical"] as const).map(mode => (
                                        <button
                                            key={mode}
                                            type="button"
                                            onClick={() => setAssessmentDeliveryMode(mode)}
                                            disabled={submitting}
                                            className={cn(
                                                "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors",
                                                assessmentDeliveryMode === mode
                                                    ? "border-primary bg-primary/10 text-foreground"
                                                    : "border-border bg-card hover:bg-muted/50",
                                            )}
                                        >
                                            {mode === "online" ? <Video className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-primary" />}
                                            <span className="text-sm font-medium capitalize">{mode}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {assessmentDeliveryMode === "online" ? (
                                <>
                                    <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                                        <div className="space-y-1.5">
                                            <Label>Deadline Date <span className="text-destructive">*</span></Label>
                                            <DateField
                                                value={assessmentDeadlineDate}
                                                onChange={setAssessmentDeadlineDate}
                                                placeholder="Select deadline"
                                                minDate={today}
                                                disabled={submitting}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="assessmentDeadlineTime">Time <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="assessmentDeadlineTime"
                                                type="time"
                                                value={assessmentDeadlineTime}
                                                onChange={e => setAssessmentDeadlineTime(e.target.value)}
                                                disabled={submitting}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">The candidate can submit files and links until this deadline.</p>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-1.5">
                                        <Label>Assessment Date <span className="text-destructive">*</span></Label>
                                        <DateField
                                            value={assessmentStartDate}
                                            onChange={setAssessmentStartDate}
                                            placeholder="Select assessment date"
                                            minDate={today}
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="assessmentStartTime">Start Time <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="assessmentStartTime"
                                                type="time"
                                                value={assessmentStartTime}
                                                onChange={e => setAssessmentStartTime(e.target.value)}
                                                disabled={submitting}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="assessmentEndTime">End Time <span className="text-destructive">*</span></Label>
                                            <Input
                                                id="assessmentEndTime"
                                                type="time"
                                                value={assessmentEndTime}
                                                onChange={e => setAssessmentEndTime(e.target.value)}
                                                disabled={submitting}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">The start and end time are saved using your current timezone.</p>
                                </>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="assessmentLink">Assessment Link <span className="text-muted-foreground text-xs font-normal">(Optional)</span></Label>
                                <Input
                                    id="assessmentLink"
                                    type="url"
                                    placeholder="https://app.testgorilla.com/..."
                                    value={assessmentLink}
                                    onChange={e => setAssessmentLink(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="assessmentAttachment">Instructions or Test Document <span className="text-muted-foreground text-xs font-normal">(Optional)</span></Label>
                                <label
                                    htmlFor="assessmentAttachment"
                                    className={cn(
                                        "flex min-h-20 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border bg-card px-4 py-3 text-center transition-colors hover:border-primary/60 hover:bg-primary/5",
                                        submitting && "pointer-events-none opacity-50",
                                    )}
                                >
                                    {assessmentAttachment ? (
                                        <div className="flex w-full items-center gap-3 text-left">
                                            <FileText className="h-5 w-5 shrink-0 text-primary" />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{assessmentAttachment.name}</p>
                                                <p className="text-xs text-muted-foreground">{(assessmentAttachment.size / (1024 * 1024)).toFixed(1)} MB</p>
                                            </div>
                                            <button
                                                type="button"
                                                aria-label="Remove attachment"
                                                onClick={e => { e.preventDefault(); setAssessmentAttachment(null); }}
                                                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground" />
                                            <p className="text-sm font-medium">Choose a document</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">PDF, DOC, DOCX, XLS, XLSX or TXT · max 10 MB</p>
                                        </div>
                                    )}
                                </label>
                                <input
                                    id="assessmentAttachment"
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                                    className="hidden"
                                    disabled={submitting}
                                    onChange={e => {
                                        const file = e.target.files?.[0] ?? null;
                                        if (file && file.size > 10 * 1024 * 1024) {
                                            toast.error("Attachment must be 10 MB or smaller");
                                            e.target.value = "";
                                            return;
                                        }
                                        setAssessmentAttachment(file);
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Physical location fields */}
                    {(interviewMode === "physical" || (interviewMode === "assessment" && assessmentDeliveryMode === "physical")) && (
                        <div className="space-y-3 rounded-xl border border-border bg-muted/20 px-4 py-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="address">{interviewMode === "assessment" ? "Assessment Address" : "Interview Address"} <span className="text-destructive">*</span></Label>
                                <Textarea
                                    id="address"
                                    placeholder="Company office or assessment venue address..."
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
                    {interviewMode !== "assessment" && <div className="space-y-3">
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
                            {timeSlots.map(slot => (
                                <div key={slot.id} className="flex items-end gap-2 rounded-xl border border-border bg-card px-3 py-3">
                                    <div className="flex-1 space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">Date <span className="text-destructive">*</span></Label>
                                        <DateField
                                            value={slot.date}
                                            onChange={v => updateSlot(slot.id, "date", v)}
                                            placeholder="Select date"
                                            minDate={today}
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
                    </div>}
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
