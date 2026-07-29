/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Calendar,
    Video,
    MapPin,
    Mail,
    Phone,
    Building2,
    User,
    Briefcase,
    Link as LinkIcon,
    MapPinned,
    Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RescheduleModal } from "./RescheduleModal";
import { RoundRescheduleModal } from "./RoundRescheduleModal";
import { formatUTCTime, formatDate } from "@/lib/date-utils";
import { formatIndustry } from "@/lib/utils";

interface InterviewDetailViewProps {
    interviewId: string | null;
    onClose: () => void;
    onInterviewUpdate?: () => void;
}

export function InterviewDetailView({ interviewId, onClose, onInterviewUpdate }: InterviewDetailViewProps) {
    const [interview, setInterview] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [rescheduleRound, setRescheduleRound] = useState<{ id: string; label: string } | null>(null);

    // Fetch interview details when dialog opens or ID changes
    useEffect(() => {
        if (interviewId) {
            setLoading(true);
            setInterview(null);
            setError(null);

            fetch(`/api/mis/interviews/${interviewId}`)
                .then((res) => {
                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }
                    return res.json();
                })
                .then((data) => {
                    if (data.success) {
                        setInterview(data.interview);
                    } else {
                        setError(data.error || "Failed to fetch interview details");
                        console.error("Failed to fetch interview:", data.error);
                    }
                })
                .catch((error) => {
                    const msg = error instanceof Error ? error.message : "An unexpected error occurred";
                    setError(msg);
                    console.error("Error fetching interview:", error);
                })
                .finally(() => setLoading(false));
        }
    }, [interviewId]);

    const refetchInterview = () => {
        if (interviewId) {
            fetch(`/api/mis/interviews/${interviewId}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        setInterview(data.interview);
                        onInterviewUpdate?.();
                    }
                })
                .catch((error) => {
                    console.error("Error refetching interview:", error);
                });
        }
    };

    const handleRescheduleSuccess = () => {
        refetchInterview();
        setShowRescheduleModal(false);
    };



    const getStatusInfo = (interview: any) => {
        if (interview.invitation_canceled) {
            // Prioritize Rescheduled status if it was cancelled and rescheduled
            if (interview.mis_rescheduled) {
                return {
                    icon: Calendar,
                    label: "Rescheduled",
                    text_color: "text-green-600",
                    color: "text-green-600",
                    bgColor: "bg-green-50",
                    borderColor: "border-green-200",
                };
            }
            return {
                icon: XCircle,
                label: "Cancelled",
                text_color: "text-red-600",
                color: "text-red-600",
                bgColor: "bg-red-50",
                borderColor: "border-red-200",
            };
        }
        if (interview.interview_confirmed) {
            return {
                icon: CheckCircle2,
                label: "Confirmed",
                text_color: "text-green-600",
                color: "text-green-600",
                bgColor: "bg-green-50",
                borderColor: "border-green-200",
            };
        }
        return {
            icon: Clock,
            label: "Pending",
            text_color: "text-amber-600",
            color: "text-amber-600",
            bgColor: "bg-amber-50",
            borderColor: "border-amber-200",
        };
    };

    if (!interviewId) return null;

    return (
        <>
            <Dialog open={!!interviewId} onOpenChange={onClose}>
                <DialogContent
                    className="max-w-4xl max-h-[90vh] overflow-y-auto"
                    style={{
                        maxWidth: '50rem',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    } as React.CSSProperties}
                >
                    <DialogHeader className="pb-4 border-b">
                        <DialogTitle className="text-2xl font-semibold">Interview Details</DialogTitle>
                        <DialogDescription className="text-base">
                            Comprehensive information about this interview engagement
                        </DialogDescription>
                    </DialogHeader>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-muted-foreground">Loading interview details...</div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <XCircle className="h-12 w-12 text-destructive mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Error Loading Details</h3>
                            <p className="text-muted-foreground text-sm">{error}</p>
                        </div>
                    ) : interview ? (
                        <div className="space-y-6 pt-2">
                            {/* Status Header */}
                            {(() => {
                                const status = getStatusInfo(interview);
                                const StatusIcon = status.icon;
                                return (
                                    <div className={`flex items-center justify-between p-4 rounded-lg border ${status.borderColor} ${status.bgColor}`}>
                                        <div className="flex items-center gap-3">
                                            <StatusIcon className={`h-5 w-5 ${status.color}`} />
                                            <div>
                                                <p className={`font-semibold ${status.text_color}`}>{status.label}</p>
                                                {interview.selected_time_slot && (
                                                    <p className={`text-sm ${status.text_color}`}>
                                                        {formatUTCTime(
                                                            interview.selected_time_slot.date,
                                                            interview.selected_time_slot.time
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={`${status.color} border-current`}>
                                            {status.label}
                                        </Badge>
                                    </div>
                                );
                            })()}

                            {/* Main Grid */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Candidate Profile */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        <User className="h-4 w-4" />
                                        Candidate
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-16 w-16 border-2">
                                            <AvatarImage src={interview.candidate.profile_image_url || undefined} />
                                            <AvatarFallback className="text-lg">
                                                {interview.candidate.first_name[0]}{interview.candidate.last_name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold truncate">
                                                {interview.candidate.first_name} {interview.candidate.last_name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">{interview.candidate.current_position}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {interview.candidate.years_of_experience || 0} years experience · {interview.candidate.experience_level}
                                            </p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span className="truncate">{interview.candidate.email}</span>
                                        </div>
                                        {interview.candidate.phone && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span>{interview.candidate.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Company & Employer */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                        <Building2 className="h-4 w-4" />
                                        Company
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <Avatar className="h-16 w-16 border-2">
                                            <AvatarImage src={interview.company.logo_url || undefined} />
                                            <AvatarFallback className="text-lg">
                                                {interview.company.company_name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold truncate">{interview.company.company_name}</h3>
                                            <p className="text-sm text-muted-foreground">{formatIndustry(interview.company.industry)}</p>
                                            {interview.company.headoffice_location && (
                                                <p className="text-xs text-muted-foreground mt-1">{interview.company.headoffice_location}</p>
                                            )}
                                        </div>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-2">Contact Person</p>
                                        <p className="font-medium text-sm">
                                            {interview.employer.first_name} {interview.employer.last_name}
                                        </p>
                                        {interview.employer.designation && (
                                            <p className="text-xs text-muted-foreground">{interview.employer.designation}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span className="truncate">{interview.employer.email}</span>
                                        </div>
                                        {interview.employer.phone && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <span>{interview.employer.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Interview Details */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    <Briefcase className="h-4 w-4" />
                                    Interview Information
                                </div>
                                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Position</p>
                                        <p className="font-medium text-sm">{interview.job_designation}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Industry</p>
                                        <p className="font-medium text-sm">{formatIndustry(interview.industry)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Mode</p>
                                        <div className="flex items-center gap-1.5">
                                            {interview.interview_mode === "online" ? (
                                                <>
                                                    <Video className="h-4 w-4 text-blue-600" />
                                                    <span className="text-sm">Online</span>
                                                </>
                                            ) : interview.interview_mode === "physical" ? (
                                                <>
                                                    <MapPin className="h-4 w-4 text-purple-600" />
                                                    <span className="text-sm">Physical</span>
                                                </>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">—</span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Invitation Sent</p>
                                        <p className="font-medium text-sm">
                                            {formatDate(interview.sent_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>



                            {/* Engagement Timeline */}
                            <Separator />
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    <Clock className="h-4 w-4" />
                                    Engagement Timeline
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">Invitation Sent</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(interview.sent_at, "MMM d, yyyy HH:mm")}
                                            </p>
                                        </div>
                                    </div>
                                    {interview.viewed_at && (
                                        <div className="flex items-start gap-3">
                                            <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">Invitation Viewed</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(interview.viewed_at, "MMM d, yyyy HH:mm")}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {interview.responded_at && (
                                        <div className="flex items-start gap-3">
                                            <div className="h-2 w-2 rounded-full bg-purple-500 mt-1.5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">Candidate Responded</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(interview.responded_at, "MMM d, yyyy HH:mm")}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {interview.confirmed_at && (
                                        <div className="flex items-start gap-3">
                                            <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">Interview Confirmed</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(interview.confirmed_at, "MMM d, yyyy HH:mm")}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Interview Rounds */}
                            {interview.interview_rounds && interview.interview_rounds.length > 0 && (
                                <>
                                    <Separator />
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                            <Layers className="h-4 w-4" />
                                            Interview Rounds ({interview.interview_rounds.length})
                                        </div>
                                        <div className="space-y-4">
                                            {[...interview.interview_rounds]
                                                .sort((a: any, b: any) => a.round_number - b.round_number)
                                                .map((round: any) => {
                                                    const roundLabel = round.round_label || `Round ${round.round_number}`;
                                                    return (
                                                        <div key={round.id} className="border rounded-lg p-4 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-sm">{roundLabel}</span>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={
                                                                            round.round_canceled
                                                                                ? "text-red-600 border-red-300 bg-red-50"
                                                                                : round.mis_rescheduled
                                                                                    ? "text-green-600 border-green-300 bg-green-50"
                                                                                    : round.status === "confirmed"
                                                                                        ? "text-green-600 border-green-300 bg-green-50"
                                                                                        : round.status === "completed"
                                                                                            ? "text-blue-600 border-blue-300 bg-blue-50"
                                                                                            : "text-amber-600 border-amber-300 bg-amber-50"
                                                                        }
                                                                    >
                                                                        {round.round_canceled
                                                                            ? "Cancelled"
                                                                            : round.mis_rescheduled
                                                                                ? "Rescheduled"
                                                                                : round.status
                                                                                    ? round.status.charAt(0).toUpperCase() + round.status.slice(1)
                                                                                    : "Pending"}
                                                                    </Badge>
                                                                </div>
                                                                {round.round_canceled && round.interview_confirmed && !round.mis_rescheduled && (
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-green-600 text-white hover:bg-green-700"
                                                                        onClick={() => setRescheduleRound({ id: round.id, label: roundLabel })}
                                                                    >
                                                                        <Calendar className="h-3 w-3 mr-1" />
                                                                        Reschedule Round
                                                                    </Button>
                                                                )}
                                                            </div>

                                                            {round.selected_time_slot && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Scheduled: {formatUTCTime(round.selected_time_slot.date, round.selected_time_slot.time)}
                                                                </p>
                                                            )}

                                                            {round.round_canceled && (
                                                                <div className="rounded-md bg-red-50 border border-red-200 p-3 space-y-1">
                                                                    <p className="text-xs font-medium text-red-700">
                                                                        Cancelled by {round.canceled_by === "candidate" ? "Candidate" : "Employer"}
                                                                        {round.canceled_at && (
                                                                            <span className="font-normal ml-1">· {formatDate(round.canceled_at)}</span>
                                                                        )}
                                                                    </p>
                                                                    {round.cancellation_reason && (
                                                                        <p className="text-xs text-red-600">{round.cancellation_reason}</p>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {round.mis_rescheduled && round.mis_reschedule_data && (
                                                                <div className="rounded-md bg-green-50 border border-green-200 p-3 space-y-1">
                                                                    <p className="text-xs font-medium text-green-700">
                                                                        Rescheduled by MIS
                                                                        {round.mis_rescheduled_at && (
                                                                            <span className="font-normal ml-1">· {formatDate(round.mis_rescheduled_at)}</span>
                                                                        )}
                                                                    </p>
                                                                    <p className="text-xs text-green-600">
                                                                        {formatUTCTime(round.mis_reschedule_data.date, round.mis_reschedule_data.time)}
                                                                        {" · "}
                                                                        {round.mis_reschedule_data.interview_mode === "online" ? "Online" : "Physical"}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-muted-foreground">Interview not found</div>
                        </div>
                    )}

                    {/* MIS Reschedule Section */}
                    {interview && interview.mis_rescheduled && interview.mis_reschedule_data && (
                        <>
                            <Separator className="my-6" />
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-green-600 text-white">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Rescheduled by MIS
                                    </Badge>
                                    {interview.mis_rescheduled_at && (
                                        <span className="text-xs text-muted-foreground">
                                            on {formatDate(interview.mis_rescheduled_at)}
                                        </span>
                                    )}
                                </div>

                                <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg space-y-3">
                                    <h3 className="font-semibold text-green-900 dark:text-green-100">New Interview Schedule</h3>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-green-700 dark:text-green-300 mb-1">Date & Time</p>
                                            <p className="text-sm font-medium">
                                                {formatUTCTime(interview.mis_reschedule_data.date, interview.mis_reschedule_data.time)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-green-700 dark:text-green-300 mb-1">Mode</p>
                                            <div className="flex items-center gap-1.5">
                                                {interview.mis_reschedule_data.interview_mode === "online" ? (
                                                    <>
                                                        <Video className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                        <span className="text-sm">Online</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <MapPin className="h-4 w-4 text-purple-600" />
                                                        <span className="text-sm">Physical</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {interview.mis_reschedule_data.meeting_link && (
                                        <div>
                                            <p className="text-xs text-green-700 dark:text-green-300 mb-1.5">Meeting Link</p>
                                            <a
                                                href={interview.mis_reschedule_data.meeting_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:underline"
                                            >
                                                <LinkIcon className="h-4 w-4" />
                                                <span className="truncate">{interview.mis_reschedule_data.meeting_link}</span>
                                            </a>
                                        </div>
                                    )}

                                    {interview.mis_reschedule_data.interview_address && (
                                        <div>
                                            <p className="text-xs text-green-700 dark:text-green-300 mb-1.5">Interview Address</p>
                                            <div className="flex items-start gap-2">
                                                <MapPinned className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                                                <p className="text-sm">{interview.mis_reschedule_data.interview_address}</p>
                                            </div>
                                            {interview.mis_reschedule_data.map_link && (
                                                <a
                                                    href={interview.mis_reschedule_data.map_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-green-600 dark:text-green-400 hover:underline mt-1 inline-block"
                                                >
                                                    View on Map →
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {interview.mis_reschedule_data.notes && (
                                        <div>
                                            <p className="text-xs text-green-700 dark:text-green-300 mb-1.5">Notes</p>
                                            <p className="text-sm">{interview.mis_reschedule_data.notes}</p>
                                        </div>
                                    )}
                                </div>

                                {interview.mis_user && interview.mis_user.mis_user && (
                                    <p className="text-xs text-muted-foreground">
                                        Rescheduled by {interview.mis_user.mis_user.first_name} {interview.mis_user.mis_user.last_name}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                        {/* Show reschedule button for any cancelled invitation that hasn't been rescheduled yet */}
                        {interview &&
                            interview.invitation_canceled &&
                            !interview.mis_rescheduled && (
                                <Button
                                    onClick={() => setShowRescheduleModal(true)}
                                    className="bg-green-600 text-white hover:bg-green-700"
                                >
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Reschedule Interview
                                </Button>
                            )}
                        <Button variant="outline" onClick={onClose}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Root Reschedule Modal */}
            {interview && (
                <RescheduleModal
                    interviewId={interview.id}
                    isOpen={showRescheduleModal}
                    onClose={() => setShowRescheduleModal(false)}
                    onSuccess={handleRescheduleSuccess}
                />
            )}

            {/* Round Reschedule Modal */}
            {rescheduleRound && (
                <RoundRescheduleModal
                    roundId={rescheduleRound.id}
                    roundLabel={rescheduleRound.label}
                    isOpen={!!rescheduleRound}
                    onClose={() => setRescheduleRound(null)}
                    onSuccess={() => {
                        setRescheduleRound(null);
                        refetchInterview();
                    }}
                />
            )}
        </>
    );
}
