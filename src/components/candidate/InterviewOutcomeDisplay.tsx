"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
    CheckCircle2, 
    XCircle, 
    Briefcase,
    Calendar,
    Clock,
    Loader2,
    ArrowRight,
    MessageSquare
} from "lucide-react";
import { formatTimestamp, formatUTCDate, formatUTCTime } from "@/lib/date-utils";
import { toast } from "sonner";

interface InterviewRound {
    id: string;
    round_number: number;
    round_label: string | null;
    status: string;
    outcome: string | null;
    outcome_notes: string | null;
    outcome_at: string | null;
    selected_time_slot: { date?: string; time?: string; is_alternative?: boolean } | null;
    interview_mode: string | null;
    confirmed_time: string | null;
    meeting_link: string | null;
    interview_address: string | null;
    map_link: string | null;
    confirmed_at: string | null;
    sent_at: string;
}

interface InterviewOutcomeDisplayProps {
    invitationId: string;
    onOutcomeFound?: (hasOutcome: boolean) => void;
}

export function InterviewOutcomeDisplay({ invitationId, onOutcomeFound }: InterviewOutcomeDisplayProps) {
    const [rounds, setRounds] = useState<InterviewRound[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRounds();
    }, [invitationId]);

    const fetchRounds = async () => {
        try {
            const response = await fetch(`/api/candidate/invitations/${invitationId}/rounds`);
            const data = await response.json();

            if (data.success) {
                setRounds(data.data);
                
                // Check if any round has an outcome
                const hasOutcome = data.data.some((r: InterviewRound) => r.outcome);
                if (onOutcomeFound) {
                    onOutcomeFound(hasOutcome);
                }
            } else {
                console.error("Failed to load interview rounds");
                if (onOutcomeFound) {
                    onOutcomeFound(false);
                }
            }
        } catch (error) {
            console.error("Error fetching rounds:", error);
            if (onOutcomeFound) {
                onOutcomeFound(false);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    if (rounds.length === 0) {
        return null;
    }

    // Get the latest round with an outcome
    const latestRoundWithOutcome = [...rounds].reverse().find(r => r.outcome);

    if (!latestRoundWithOutcome || !latestRoundWithOutcome.outcome) {
        return null;
    }

    const getOutcomeConfig = (outcome: string) => {
        switch (outcome) {
            case 'advance':
                return {
                    icon: ArrowRight,
                    color: 'bg-green-500',
                    bgColor: 'bg-green-50 dark:bg-green-950/20',
                    borderColor: 'border-green-200 dark:border-green-800',
                    textColor: 'text-green-900 dark:text-green-100',
                    mutedColor: 'text-green-700 dark:text-green-300',
                    title: '🎉 Great News - You\'ve Advanced!',
                    message: 'Congratulations! You\'ve successfully passed this interview round and are proceeding to the next stage.'
                };
            case 'reject':
                return {
                    icon: XCircle,
                    color: 'bg-red-500',
                    bgColor: 'bg-red-50 dark:bg-red-950/20',
                    borderColor: 'border-red-200 dark:border-red-800',
                    textColor: 'text-red-900 dark:text-red-100',
                    mutedColor: 'text-red-700 dark:text-red-300',
                    title: 'Interview Result',
                    message: 'Unfortunately, you were not selected to move forward at this time. We encourage you to continue pursuing other opportunities.'
                };
            case 'offer':
                return {
                    icon: Briefcase,
                    color: 'bg-blue-500',
                    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
                    borderColor: 'border-blue-200 dark:border-blue-800',
                    textColor: 'text-blue-900 dark:text-blue-100',
                    mutedColor: 'text-blue-700 dark:text-blue-300',
                    title: '🎊 Congratulations - Job Offer!',
                    message: 'Excellent news! You\'ve been selected for the position. A formal job offer will be sent to you shortly.'
                };
            default:
                return null;
        }
    };

    const config = getOutcomeConfig(latestRoundWithOutcome.outcome);
    if (!config) return null;

    const Icon = config.icon;

    // Check if there's a next round (for advance outcome)
    const nextRound = latestRoundWithOutcome.outcome === 'advance' 
        ? rounds.find(r => r.round_number === latestRoundWithOutcome.round_number + 1)
        : null;

    return (
        <Card className={`${config.borderColor} ${config.bgColor} mt-6`}>
            <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                    <div className={`h-10 w-10 rounded-full ${config.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className={`font-semibold text-lg ${config.textColor} mb-1`}>
                            {config.title}
                        </h3>
                        <p className={`text-sm ${config.mutedColor}`}>
                            {config.message}
                        </p>
                    </div>
                </div>

                {/* Round Information */}
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">
                            {latestRoundWithOutcome.round_label || `Round ${latestRoundWithOutcome.round_number}`}
                        </span>
                        <Badge className={config.color + " text-white"}>
                            {latestRoundWithOutcome.outcome === 'advance' ? 'Passed' : 
                             latestRoundWithOutcome.outcome === 'reject' ? 'Not Selected' :
                             'Offer Received'}
                        </Badge>
                    </div>

                    {latestRoundWithOutcome.outcome_at && (
                        <>
                            <Separator />
                            <div className="text-xs text-muted-foreground">
                                Decision made on {formatTimestamp(latestRoundWithOutcome.outcome_at, "MMMM d, yyyy 'at' h:mm a")}
                            </div>
                        </>
                    )}

                    {/* Employer Feedback */}
                    {latestRoundWithOutcome.outcome_notes && (
                        <>
                            <Separator />
                            <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Feedback from Employer
                                    </span>
                                </div>
                                <div className="bg-muted/50 rounded p-3 text-sm">
                                    <p className="whitespace-pre-wrap">{latestRoundWithOutcome.outcome_notes}</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Next Round Information */}
                {nextRound && (
                    <>
                        <Separator className="my-4" />
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border space-y-3">
                            <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                                    Next Round: {nextRound.round_label || `Round ${nextRound.round_number}`}
                                </span>
                            </div>

                            {nextRound.status === 'confirmed' && nextRound.selected_time_slot && (
                                <>
                                    <Separator />
                                    <div className="grid gap-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-muted-foreground">Date:</span>
                                            <span className="font-medium">
                                                {formatUTCDate(nextRound.selected_time_slot.date ?? "")}
                                            </span>
                                        </div>
                                        {nextRound.selected_time_slot.time && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span className="text-muted-foreground">Time:</span>
                                                <span className="font-medium">
                                                    {formatUTCTime(nextRound.selected_time_slot.date ?? "", nextRound.selected_time_slot.time ?? "")}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {nextRound.status === 'pending' && (
                                <p className="text-sm text-muted-foreground">
                                    The employer will send you the interview details shortly.
                                </p>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
