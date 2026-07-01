"use client";

import { useState } from "react";
import { Send, Loader2, XCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    getInvitationJourneyDisplay,
    journeyVariantToEmployerBadgeProps,
} from "@/lib/invitation-journey-status";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ScheduleInterviewDialog } from "@/components/employer/ScheduleInterviewDialog";

interface InviteCandidateButtonProps {
    candidateId: string;
    suggestedIndustry?: string;
    suggestedDesignation?: string;
    isInvited?: boolean;
    isHiredElsewhere?: boolean;
    // Invitation journey fields — used to lock the cancel button after acceptance
    invitationStatus?: string | null;
    invitationPipelineStatus?: string | null;
    invitationInterviewConfirmed?: boolean;
    invitationCurrentRound?: number | null;
    invitationMisRescheduled?: boolean;
    onInvitationChange?: () => void;  // Callback to refresh data
}

export function InviteCandidateButton({
    candidateId,
    suggestedIndustry,
    suggestedDesignation,
    isInvited = false,
    isHiredElsewhere = false,
    invitationStatus,
    invitationPipelineStatus,
    invitationInterviewConfirmed,
    invitationCurrentRound,
    invitationMisRescheduled,
    onInvitationChange
}: InviteCandidateButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const handleInvitationChange = () => {
        if (onInvitationChange) {
            onInvitationChange();
        } else {
            window.location.reload();
        }
    };

    const handleCancelInvitation = async () => {
        setCancelling(true);
        try {
            const response = await fetch(`/api/employer/invitations/cancel?candidateId=${candidateId}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Invitation cancelled successfully!");
                setShowCancelDialog(false);
                handleInvitationChange();
            } else {
                toast.error(data.error || "Failed to cancel invitation");
            }
        } catch (error) {
            console.error("Error cancelling invitation:", error);
            toast.error("An error occurred while cancelling invitation");
        } finally {
            setCancelling(false);
        }
    };

    // Determine if the Cancel Invitation button should be locked.
    // Cancellation is only allowed while the candidate hasn't acted on the invitation
    // (i.e. status is pending or viewed). Once accepted, the pipeline is underway.
    const canCancelInvitation = !invitationStatus ||
        invitationStatus === 'pending' ||
        invitationStatus === 'viewed';

    // Compute the human-readable journey label to display when locked
    const journeyDisplay = (!canCancelInvitation && invitationStatus)
        ? getInvitationJourneyDisplay({
            status: invitationStatus,
            invitation_canceled: false,
            interview_confirmed: invitationInterviewConfirmed ?? false,
            mis_rescheduled: invitationMisRescheduled ?? false,
            pipeline_status: invitationPipelineStatus ?? null,
            current_round_number: invitationCurrentRound ?? null,
        })
        : null;

    const journeyBadgeProps = journeyDisplay
        ? journeyVariantToEmployerBadgeProps(journeyDisplay.variant)
        : null;

    // If hired by another company, show locked state — cannot invite
    if (isHiredElsewhere) {
        return (
            <div className="space-y-2">
                <Button className="w-full" size="lg" variant="outline" disabled>
                    <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Invite for an Interview</span>
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                    This candidate has accepted an offer from another company.
                </p>
            </div>
        );
    }

    // If already invited by this company, show cancel button (or locked status if accepted)
    if (isInvited) {
        return (
            <>
                {canCancelInvitation ? (
                    /* Candidate hasn't accepted yet — allow cancellation */
                    <Button
                        className="w-full cursor-pointer"
                        size="lg"
                        variant="destructive"
                        onClick={() => setShowCancelDialog(true)}
                        disabled={cancelling}
                    >
                        {cancelling ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Cancelling...
                            </>
                        ) : (
                            <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Invitation
                            </>
                        )}
                    </Button>
                ) : (
                    /* Candidate has accepted — disable and show current status */
                    <div className="space-y-2">
                        <Button
                            className="w-full"
                            size="lg"
                            variant="outline"
                            disabled
                        >
                            <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground">Cancel Invitation</span>
                        </Button>
                        {journeyDisplay && journeyBadgeProps && (
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <span>Candidate status:</span>
                                <Badge
                                    variant={journeyBadgeProps.variant}
                                    className={journeyBadgeProps.className}
                                >
                                    {journeyDisplay.label}
                                </Badge>
                            </div>
                        )}
                    </div>
                )}

                <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to cancel this interview invitation? The candidate will no longer see this invitation as active. You can send a new invitation later if needed.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={cancelling}>No, Keep It</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleCancelInvitation}
                                disabled={cancelling}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {cancelling ? "Cancelling..." : "Yes, Cancel Invitation"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        );
    }

    // Otherwise show normal invite button + shared scheduling dialog
    return (
        <>
            <Button className="w-full" size="lg" onClick={() => setIsOpen(true)}>
                <Send className="h-4 w-4 mr-2" />
                Invite for an Interview
            </Button>
            <ScheduleInterviewDialog
                open={isOpen}
                onOpenChange={setIsOpen}
                endpoint="/api/employer/invitations"
                positionLabel={
                    suggestedIndustry && suggestedDesignation
                        ? `${suggestedIndustry} - ${suggestedDesignation}`
                        : suggestedDesignation || suggestedIndustry
                }
                extraPayload={{
                    candidateId,
                    industry: suggestedIndustry,
                    jobDesignation: suggestedDesignation,
                }}
                validateBeforeSubmit={() =>
                    !suggestedIndustry || !suggestedDesignation
                        ? "Missing job position information"
                        : null
                }
                onSuccess={handleInvitationChange}
            />
        </>
    );
}
