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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CheckCircle2, XCircle, ArrowRight, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InterviewFeedbackDialogProps {
    roundId: string;
    roundNumber: number;
    candidateName: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type Outcome = 'advance' | 'reject' | 'offer' | 'no_decision';

export function InterviewFeedbackDialog({
    roundId,
    roundNumber,
    candidateName,
    isOpen,
    onClose,
    onSuccess
}: InterviewFeedbackDialogProps) {
    const [outcome, setOutcome] = useState<Outcome>('no_decision');
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (outcome === 'no_decision') {
            toast.error("Please select an outcome");
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`/api/employer/interview-rounds/${roundId}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    outcome: outcome,
                    outcome_notes: notes.trim() || null
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Interview feedback saved successfully!");
                onSuccess();
                handleClose();
            } else {
                toast.error(data.error || "Failed to save feedback");
            }
        } catch (error) {
            console.error("Error saving feedback:", error);
            toast.error("An error occurred while saving feedback");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setOutcome('no_decision');
        setNotes("");
        onClose();
    };

    const outcomes = [
        {
            value: 'advance',
            label: 'Advance to Next Round',
            description: 'Candidate passed this round and will proceed to the next interview',
            icon: ArrowRight,
            iconColor: 'text-green-600 dark:text-green-400',
            labelClass: 'text-green-900 dark:text-green-50',
            descClass: 'text-green-800 dark:text-green-200',
            bgColor:
                'bg-green-50 hover:bg-green-100 border-green-200 dark:bg-green-950/55 dark:hover:bg-green-950/75 dark:border-green-700',
            selectedBg: 'bg-green-100 border-green-500 dark:bg-green-950 dark:border-green-400'
        },
        {
            value: 'reject',
            label: 'Reject Candidate',
            description: 'Candidate did not meet the requirements for this position',
            icon: XCircle,
            iconColor: 'text-red-600 dark:text-red-400',
            labelClass: 'text-red-900 dark:text-red-50',
            descClass: 'text-red-800 dark:text-red-200',
            bgColor:
                'bg-red-50 hover:bg-red-100 border-red-200 dark:bg-red-950/55 dark:hover:bg-red-950/75 dark:border-red-800',
            selectedBg: 'bg-red-100 border-red-500 dark:bg-red-950 dark:border-red-400'
        },
        {
            value: 'offer',
            label: 'Offer Job',
            description: 'Candidate passed all rounds and is ready to receive a job offer',
            icon: Briefcase,
            iconColor: 'text-blue-600 dark:text-blue-400',
            labelClass: 'text-blue-900 dark:text-blue-50',
            descClass: 'text-blue-800 dark:text-blue-200',
            bgColor:
                'bg-blue-50 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/55 dark:hover:bg-blue-950/75 dark:border-blue-800',
            selectedBg: 'bg-blue-100 border-blue-500 dark:bg-blue-950 dark:border-blue-400'
        }
    ] as const;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Interview Feedback - Round {roundNumber}</DialogTitle>
                    <DialogDescription>
                        Provide feedback for {candidateName}&apos;s interview performance
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Outcome Selection */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Interview Outcome *</Label>
                        <RadioGroup value={outcome} onValueChange={(value) => setOutcome(value as Outcome)}>
                            {outcomes.map((option) => {
                                const Icon = option.icon;
                                const isSelected = outcome === option.value;
                                return (
                                    <div key={option.value} className="relative">
                                        <RadioGroupItem
                                            value={option.value}
                                            id={option.value}
                                            className="sr-only"
                                        />
                                        <label
                                            htmlFor={option.value}
                                            className={cn(
                                                "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                                                option.bgColor,
                                                isSelected && option.selectedBg
                                            )}
                                        >
                                            <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", option.iconColor)} />
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("font-semibold text-sm", option.labelClass)}>
                                                    {option.label}
                                                </p>
                                                <p className={cn("text-xs mt-1 leading-relaxed", option.descClass)}>
                                                    {option.description}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <CheckCircle2 className={cn("h-5 w-5 flex-shrink-0", option.iconColor)} />
                                            )}
                                        </label>
                                    </div>
                                );
                            })}
                        </RadioGroup>
                    </div>

                    {/* Feedback Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Feedback Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Provide detailed feedback about the candidate's performance, strengths, areas for improvement..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={6}
                            maxLength={2000}
                            disabled={submitting}
                            className="placeholder:text-muted-foreground/80 dark:placeholder:text-zinc-400"
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {notes.length}/2000 characters
                        </p>
                    </div>

                    {/* Action-specific hints */}
                    {outcome === 'advance' && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3 dark:bg-green-950/45 dark:border-green-800">
                            <p className="text-sm text-green-800 dark:text-green-100">
                                After saving, you&apos;ll be able to schedule the next interview round for this candidate.
                            </p>
                        </div>
                    )}
                    {outcome === 'reject' && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3 dark:bg-red-950/45 dark:border-red-800">
                            <p className="text-sm text-red-800 dark:text-red-100">
                                This candidate will be marked as rejected. The candidate will be notified about the decision.
                            </p>
                        </div>
                    )}
                    {outcome === 'offer' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 dark:bg-blue-950/45 dark:border-blue-800">
                            <p className="text-sm text-blue-800 dark:text-blue-100">
                                After saving, you&apos;ll be able to create and send a formal job offer to this candidate.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || outcome === 'no_decision'}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Save Feedback
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
