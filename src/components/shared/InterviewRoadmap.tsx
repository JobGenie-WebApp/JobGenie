"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
    CheckCircle2, 
    XCircle, 
    Clock,
    Briefcase,
    Calendar,
    MapPin,
    Video,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    TrendingUp,
    Award
} from "lucide-react";
import { formatUTCDate, formatUTCTime, formatTimestamp } from "@/lib/date-utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { RoundResponseCard } from "@/components/candidate/RoundResponseCard";

interface InterviewRound {
    id: string;
    round_number: number;
    round_label: string | null;
    status: string;
    outcome: string | null;
    outcome_notes: string | null;
    outcome_at: string | null;
    given_time_slots: { date: string; time?: string }[] | null;
    alternative_dates: { date: string; time?: string }[] | null;
    selected_time_slot: { date?: string; time?: string; is_alternative?: boolean } | null;
    interview_mode: string | null;
    confirmed_time: string | null;
    meeting_link: string | null;
    interview_address: string | null;
    map_link: string | null;
    confirmed_at: string | null;
    sent_at: string;
    viewed_at: string | null;
    responded_at: string | null;
    round_canceled?: boolean;
    canceled_by?: string | null;
    canceled_at?: string | null;
    mis_rescheduled?: boolean;
}

interface InterviewRoadmapProps {
    invitationId: string;
    userRole: 'employer' | 'candidate';
    onOutcomeFound?: (hasOutcome: boolean) => void;
    className?: string;
}

export function InterviewRoadmap({ 
    invitationId, 
    userRole,
    onOutcomeFound,
    className 
}: InterviewRoadmapProps) {
    const [rounds, setRounds] = useState<InterviewRound[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

    useEffect(() => {
        fetchRounds();
        
        // Auto-refresh every 10 seconds to check for updates (like new offers)
        const interval = setInterval(() => {
            fetchRounds();
        }, 10000);
        
        return () => clearInterval(interval);
    }, [invitationId]);

    const fetchRounds = async () => {
        try {
            const endpoint = userRole === 'employer' 
                ? `/api/employer/invitations/${invitationId}/rounds`
                : `/api/candidate/invitations/${invitationId}/rounds`;
            
            const response = await fetch(endpoint);
            const data = await response.json();

            if (data.success) {
                setRounds(data.data);
                
                // Auto-expand the latest round and any round with an outcome
                const toExpand = new Set<number>();
                data.data.forEach((round: InterviewRound, index: number) => {
                    if (round.outcome || index === data.data.length - 1) {
                        toExpand.add(round.round_number);
                    }
                });
                setExpandedRounds(toExpand);
                
                const hasOutcome = data.data.some((r: InterviewRound) => r.outcome);
                if (onOutcomeFound) {
                    onOutcomeFound(hasOutcome);
                }
            }
        } catch (error) {
            console.error("Error fetching rounds:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRound = (roundNumber: number) => {
        const newExpanded = new Set(expandedRounds);
        if (newExpanded.has(roundNumber)) {
            newExpanded.delete(roundNumber);
        } else {
            newExpanded.add(roundNumber);
        }
        setExpandedRounds(newExpanded);
    };

    const getStatusIcon = (round: InterviewRound) => {
        if (round.round_canceled && !round.mis_rescheduled) return { Icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-100' };
        if (round.round_canceled && round.mis_rescheduled) return { Icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' };
        if (round.outcome === 'advance') return { Icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' };
        if (round.outcome === 'reject') return { Icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' };
        if (round.outcome === 'offer') return { Icon: Award, color: 'text-blue-600', bg: 'bg-blue-100' };
        if (round.status === 'confirmed') return { Icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' };
        if (round.status === 'accepted') return { Icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' };
        if (round.status === 'pending') return { Icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100' };
        return { Icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100' };
    };

    const getRoundStatus = (round: InterviewRound) => {
        if (round.round_canceled && !round.mis_rescheduled) return { label: 'Cancelled', color: 'bg-slate-400' };
        if (round.round_canceled && round.mis_rescheduled) return { label: 'Rescheduled', color: 'bg-amber-500' };
        if (round.outcome === 'advance') return { label: 'Passed', color: 'bg-green-500' };
        if (round.outcome === 'reject') return { label: 'Not Selected', color: 'bg-red-500' };
        if (round.outcome === 'offer') return {
            label: userRole === 'candidate' ? 'Offer Received' : 'Offer Sent',
            color: 'bg-blue-500'
        };
        if (round.status === 'confirmed') return { label: 'Confirmed', color: 'bg-green-500' };
        if (round.status === 'accepted') return { label: 'Awaiting Confirmation', color: 'bg-orange-500' };
        if (round.status === 'pending') return { label: 'Invitation Sent', color: 'bg-blue-500' };
        if (round.status === 'viewed') return { label: 'Viewed', color: 'bg-purple-500' };
        return { label: 'Pending', color: 'bg-gray-500' };
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center py-8">
                        <Clock className="h-6 w-6 animate-spin text-primary" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (rounds.length === 0) {
        return null;
    }

    // Determine the final outcome of the interview process
    const finalOutcome = rounds.find(r => r.outcome === 'reject' || r.outcome === 'offer');
    const hasActiveRounds = rounds.some(r => !r.outcome && !r.round_canceled && r.status !== 'canceled');

    return (
        <Card className={cn("border-2", className)}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Interview Roadmap
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                        {rounds.length} {rounds.length === 1 ? 'Round' : 'Rounds'}
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    {finalOutcome 
                        ? finalOutcome.outcome === 'offer' 
                            ? userRole === 'candidate'
                                ? '🎉 Interview process completed - Offer received'
                                : '🎉 Interview process completed - Offer sent'
                            : 'Interview process concluded'
                        : 'Your interview journey progress'}
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Pending Round Response (for candidates only) */}
                {userRole === 'candidate' && rounds.some(r => (r.status === 'pending' || r.status === 'viewed') && !r.round_canceled) && (
                    <>
                        {rounds
                            .filter(r => (r.status === 'pending' || r.status === 'viewed') && !r.round_canceled)
                            .map(round => (
                                <RoundResponseCard
                                    key={round.id}
                                    roundId={round.id}
                                    roundNumber={round.round_number}
                                    roundLabel={round.round_label}
                                    interviewMode={round.interview_mode}
                                    meetingLink={round.meeting_link}
                                    interviewAddress={round.interview_address}
                                    mapLink={round.map_link}
                                    givenTimeSlots={(round.given_time_slots ?? []) as { date: string; time: string; order: number; is_alternative?: boolean }[]}
                                    onResponse={fetchRounds}
                                />
                            ))
                        }
                    </>
                )}

                {/* Timeline */}
                <div className="relative space-y-6">
                    {rounds.map((round, index) => {
                        const isLast = index === rounds.length - 1;
                        const isExpanded = expandedRounds.has(round.round_number);
                        const statusInfo = getStatusIcon(round);
                        const statusBadge = getRoundStatus(round);
                        const StatusIcon = statusInfo.Icon;
                        
                        // Hide details if there's an outcome and it's not the latest round
                        const shouldShowDetails = round.outcome === 'advance' ? false : true;
                        const isCompletedWithOutcome = round.outcome && round.outcome !== 'no_decision';

                        return (
                            <div key={round.id} className="relative">
                                {/* Timeline Connector */}
                                {!isLast && (
                                    <div 
                                        className={cn(
                                            "absolute left-6 top-12 bottom-0 w-0.5",
                                            round.outcome === 'advance' ? "bg-green-300" :
                                            round.outcome === 'reject' ? "bg-red-300" :
                                            round.outcome === 'offer' ? "bg-blue-300" :
                                            "bg-gray-300"
                                        )}
                                    />
                                )}

                                <div className="flex gap-4">
                                    {/* Icon */}
                                    <div className={cn(
                                        "h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 border-2",
                                        statusInfo.bg,
                                        isCompletedWithOutcome ? "border-primary" : "border-muted"
                                    )}>
                                        <StatusIcon className={cn("h-6 w-6", statusInfo.color)} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <Collapsible 
                                            open={isExpanded} 
                                            onOpenChange={() => toggleRound(round.round_number)}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex-1">
                                                    <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-70 transition-opacity text-left group w-full">
                                                        <h3 className="font-semibold text-base">
                                                            {round.round_label || `Round ${round.round_number}`}
                                                        </h3>
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                                                        )}
                                                    </CollapsibleTrigger>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {round.confirmed_at 
                                                            ? `Confirmed on ${formatTimestamp(round.confirmed_at, "MMM d, yyyy")}`
                                                            : round.sent_at 
                                                                ? `Sent on ${formatTimestamp(round.sent_at, "MMM d, yyyy")}`
                                                                : 'Pending'}
                                                    </p>
                                                </div>
                                                <Badge className={cn(statusBadge.color, "text-white text-xs")}>
                                                    {statusBadge.label}
                                                </Badge>
                                            </div>

                                            <CollapsibleContent className="space-y-3 mt-3">
                                                {/* Interview Details (hide if advanced) */}
                                                {shouldShowDetails && round.selected_time_slot && round.status !== 'pending' && (
                                                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                                        <p className="text-xs font-medium text-muted-foreground">Interview Details</p>
                                                        <div className="grid gap-2 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                                <span>{formatUTCDate(round.selected_time_slot.date ?? '')}</span>
                                                            </div>
                                                            {round.selected_time_slot.time && (
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    <span>{formatUTCTime(round.selected_time_slot.date ?? '', round.selected_time_slot.time)}</span>
                                                                </div>
                                                            )}
                                                            {round.interview_mode && (
                                                                <div className="flex items-center gap-2">
                                                                    {round.interview_mode === 'online' ? (
                                                                        <Video className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    ) : (
                                                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    )}
                                                                    <span className="capitalize">{round.interview_mode} Interview</span>
                                                                </div>
                                                            )}
                                                            {userRole === 'candidate' && round.interview_mode === 'online' && round.meeting_link && (
                                                                <a 
                                                                    href={round.meeting_link} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                                                >
                                                                    <Video className="h-3 w-3" />
                                                                    Join Meeting
                                                                </a>
                                                            )}
                                                            {userRole === 'candidate' && round.interview_mode === 'physical' && round.interview_address && (
                                                                <div className="text-xs">
                                                                    <p className="text-muted-foreground mb-1">Location:</p>
                                                                    <p>{round.interview_address}</p>
                                                                    {round.map_link && (
                                                                        <a 
                                                                            href={round.map_link} 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer"
                                                                            className="text-primary hover:underline flex items-center gap-1 mt-1"
                                                                        >
                                                                            <MapPin className="h-3 w-3" />
                                                                            View on Map
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Pending Round - Show Proposed Time Slots (Employer View) */}
                                                {userRole === 'employer' && round.status === 'pending' && round.given_time_slots && (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 dark:bg-blue-950/20 dark:border-blue-800">
                                                        <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Proposed Time Slots (Awaiting Candidate Response)</p>
                                                        <div className="space-y-1.5">
                                                            {(round.given_time_slots ?? []).map((slot: { date: string; time?: string }, idx: number) => (
                                                                <div key={idx} className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                                                                    <Calendar className="h-3 w-3" />
                                                                    <span>{formatUTCDate(slot.date)}</span>
                                                                    {slot.time && (
                                                                        <>
                                                                            <Clock className="h-3 w-3 ml-2" />
                                                                            <span>{formatUTCTime(slot.date, slot.time)}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {round.alternative_dates && (round.alternative_dates ?? []).length > 0 && (
                                                            <>
                                                                <Separator className="my-2" />
                                                                <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Alternative Dates</p>
                                                                <div className="space-y-1.5">
                                                                    {(round.alternative_dates ?? []).map((slot: { date: string; time?: string }, idx: number) => (
                                                                        <div key={idx} className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                                                                            <Calendar className="h-3 w-3" />
                                                                            <span>{formatUTCDate(slot.date)}</span>
                                                                            <Badge variant="outline" className="ml-2 text-xs">Alternative</Badge>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Outcome Message */}
                                                {round.outcome && (
                                                    <div className={cn(
                                                        "rounded-lg p-3 border-2",
                                                        round.outcome === 'advance' && "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800",
                                                        round.outcome === 'reject' && "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800",
                                                        round.outcome === 'offer' && "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                                                    )}>
                                                        <div className="flex items-start gap-2">
                                                            {round.outcome === 'advance' && (
                                                                <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                            )}
                                                            {round.outcome === 'reject' && (
                                                                <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                            )}
                                                            {round.outcome === 'offer' && (
                                                                <Award className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                            )}
                                                            <div className="flex-1">
                                                                <p className={cn(
                                                                    "text-sm font-semibold",
                                                                    round.outcome === 'advance' && "text-green-900 dark:text-green-100",
                                                                    round.outcome === 'reject' && "text-red-900 dark:text-red-100",
                                                                    round.outcome === 'offer' && "text-blue-900 dark:text-blue-100"
                                                                )}>
                                                                    {round.outcome === 'advance' && "🎉 Congratulations! You've advanced to the next round"}
                                                                    {round.outcome === 'reject' && "Interview Result: Not Selected"}
                                                                    {round.outcome === 'offer' && (
                                                                        userRole === 'candidate' 
                                                                            ? "🎊 Excellent! Job Offer Received" 
                                                                            : "✅ Job Offer Sent Successfully"
                                                                    )}
                                                                </p>
                                                                {round.outcome_at && (
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        Decision made on {formatTimestamp(round.outcome_at, "MMM d, yyyy")}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Employer Feedback */}
                                                {round.outcome_notes && userRole === 'candidate' && (
                                                    <>
                                                        <Separator />
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                                                                <p className="text-xs font-medium text-muted-foreground">
                                                                    Feedback from Employer
                                                                </p>
                                                            </div>
                                                            <div className="bg-muted rounded-lg p-3 text-sm">
                                                                <p className="whitespace-pre-wrap">{round.outcome_notes}</p>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Pending Status for Candidate */}
                                                {!round.outcome && round.status === 'pending' && userRole === 'candidate' && (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 dark:bg-blue-950/20 dark:border-blue-800">
                                                        <p className="text-sm text-blue-900 dark:text-blue-100">
                                                            The employer will send you the interview details shortly.
                                                        </p>
                                                    </div>
                                                )}
                                            </CollapsibleContent>
                                        </Collapsible>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Process Status */}
                {!hasActiveRounds && finalOutcome && (
                    <div className={cn(
                        "rounded-lg p-4 text-center border-2 mt-6",
                        finalOutcome.outcome === 'offer' 
                            ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                            : "bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800"
                    )}>
                        <p className="text-sm font-medium">
                            {finalOutcome.outcome === 'offer' 
                                ? (userRole === 'candidate' 
                                    ? "Interview process completed successfully! Check your offers section for details."
                                    : "Interview process completed successfully! You can view the sent offer details below.")
                                : "Interview process has concluded. Thank you for your time."}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
