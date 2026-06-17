"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
    Calendar, 
    Clock, 
    Video, 
    MapPinned, 
    CheckCircle2, 
    XCircle, 
    Briefcase,
    MessageSquare,
    Loader2
} from "lucide-react";
import { formatUTCDate, formatUTCTime } from "@/lib/date-utils";
import { InterviewFeedbackDialog } from "./InterviewFeedbackDialog";
import { NextRoundDialog } from "./NextRoundDialog";
import { JobOfferDialog } from "./JobOfferDialog";
import { toast } from "sonner";

interface InterviewFeedbackPanelProps {
    invitation: {
        id: string;
        selected_time_slot: { date?: string; time?: string; is_alternative?: boolean } | null;
        interview_mode: string | null;
        confirmed_time: string | null;
        meeting_link: string | null;
        interview_address: string | null;
        map_link: string | null;
        confirmed_at: string | null;
    };
    roundId?: string | null;
    roundNumber?: number;
    roundOutcome?: string | null;
    candidateName: string;
    jobTitle: string;
    onUpdate: () => void;
}

export function InterviewFeedbackPanel({
    invitation,
    roundId: propRoundId,
    roundNumber: propRoundNumber,
    roundOutcome: propRoundOutcome,
    candidateName,
    jobTitle,
    onUpdate
}: InterviewFeedbackPanelProps) {
    const [feedbackDialog, setFeedbackDialog] = useState(false);
    const [nextRoundDialog, setNextRoundDialog] = useState(false);
    const [offerDialog, setOfferDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [roundId, setRoundId] = useState<string | null>(propRoundId || null);
    const [roundNumber, setRoundNumber] = useState<number>(propRoundNumber || 1);
    const [roundOutcome, setRoundOutcome] = useState<string | null>(propRoundOutcome || null);

    useEffect(() => {
        fetchCurrentRound();
    }, [invitation.id]);

    const fetchCurrentRound = async () => {
        try {
            const response = await fetch(`/api/employer/invitations/${invitation.id}/current-round`);
            const data = await response.json();

            if (data.success && data.data) {
                setRoundId(data.data.id);
                setRoundNumber(data.data.round_number);
                setRoundOutcome(data.data.outcome);
            } else {
                // No round exists yet - migration not run
                setRoundId(null);
                setRoundNumber(data.current_round_number || 1);
                setRoundOutcome(null);
            }
        } catch (error) {
            console.error("Error fetching current round:", error);
            toast.error("Failed to load interview round");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = () => {
        fetchCurrentRound();
        onUpdate();
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

    // If no round ID, this interview hasn't been processed yet
    if (!roundId) {
        return (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
                <CardContent className="pt-6">
                    <div className="text-center">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                            <strong>Interview Confirmed</strong>
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                            Database migration required to enable feedback system.
                        </p>
                        <code className="block mt-3 text-xs bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded">
                            npx supabase db push
                        </code>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Round {roundNumber} - Interview Details</CardTitle>
                        <Badge variant={roundOutcome ? "default" : "secondary"}>
                            {roundOutcome === 'advance' ? 'Advanced' : 
                             roundOutcome === 'reject' ? 'Rejected' :
                             roundOutcome === 'offer' ? 'Job Offer Sent' :
                             'Awaiting Feedback'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Interview Details */}
                    <div className="grid gap-3 text-sm">
                        {invitation.selected_time_slot && (
                            <>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Date:</span>
                                    <span>{formatUTCDate(invitation.selected_time_slot.date ?? '')}</span>
                                </div>
                                
                                {invitation.selected_time_slot.time && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">Time:</span>
                                        <span>
                                            {formatUTCTime(
                                                invitation.selected_time_slot.date ?? '',
                                                invitation.selected_time_slot.is_alternative && invitation.confirmed_time
                                                    ? invitation.confirmed_time
                                                    : invitation.selected_time_slot.time
                                            )}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}

                        {invitation.interview_mode === 'online' && invitation.meeting_link && (
                            <div className="flex items-start gap-2">
                                <Video className="h-4 w-4 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                    <span className="font-medium">Meeting Link:</span>
                                    <a 
                                        href={invitation.meeting_link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block text-blue-600 hover:underline text-xs mt-1 break-all"
                                    >
                                        {invitation.meeting_link}
                                    </a>
                                </div>
                            </div>
                        )}

                        {invitation.interview_mode === 'physical' && invitation.interview_address && (
                            <>
                                <div className="flex items-start gap-2">
                                    <MapPinned className="h-4 w-4 text-green-600 mt-0.5" />
                                    <div className="flex-1">
                                        <span className="font-medium">Address:</span>
                                        <p className="text-xs mt-1">{invitation.interview_address}</p>
                                    </div>
                                </div>
                                {invitation.map_link && (
                                    <div className="pl-6">
                                        <a 
                                            href={invitation.map_link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            View on Map →
                                        </a>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <Separator />

                    {/* Action Section */}
                    {!roundOutcome ? (
                        <div className="space-y-3">
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                    <MessageSquare className="h-4 w-4 inline mr-1.5" />
                                    Provide Interview Feedback
                                </p>
                                <p className="text-xs text-blue-800 dark:text-blue-200">
                                    After the interview, add your feedback and decide the next step for this candidate.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    size="sm"
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    onClick={() => setFeedbackDialog(true)}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    Accept
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => setFeedbackDialog(true)}
                                >
                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                    Reject
                                </Button>
                                <Button
                                    size="sm"
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    onClick={() => setFeedbackDialog(true)}
                                >
                                    <Briefcase className="h-3.5 w-3.5 mr-1" />
                                    Offer Job
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {roundOutcome === 'advance' && (
                                <Button
                                    onClick={() => setNextRoundDialog(true)}
                                    className="w-full"
                                >
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Schedule Next Interview Round
                                </Button>
                            )}

                            {roundOutcome === 'offer' && (
                                <Button
                                    onClick={() => setOfferDialog(true)}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    <Briefcase className="h-4 w-4 mr-2" />
                                    Create Job Offer
                                </Button>
                            )}

                            {roundOutcome === 'reject' && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                    <p className="text-sm text-red-800 dark:text-red-200">
                                        Candidate has been rejected for this position.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            {roundId && (
                <>
                    <InterviewFeedbackDialog
                        roundId={roundId}
                        roundNumber={roundNumber}
                        candidateName={candidateName}
                        isOpen={feedbackDialog}
                        onClose={() => setFeedbackDialog(false)}
                        onSuccess={handleUpdate}
                    />

                    <NextRoundDialog
                        previousRoundId={roundId}
                        nextRoundNumber={roundNumber + 1}
                        candidateName={candidateName}
                        isOpen={nextRoundDialog}
                        onClose={() => setNextRoundDialog(false)}
                        onSuccess={handleUpdate}
                    />

                    <JobOfferDialog
                        roundId={roundId}
                        candidateName={candidateName}
                        jobTitle={jobTitle}
                        isOpen={offerDialog}
                        onClose={() => setOfferDialog(false)}
                        onSuccess={handleUpdate}
                    />
                </>
            )}
        </>
    );
}
