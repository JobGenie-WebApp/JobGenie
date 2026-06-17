"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { markApprovalMessageAsSeen } from "@/app/actions/candidate";

interface ApprovalStatusNotificationProps {
    approvalStatus: "approved" | "rejected";
    rejectionReason?: string | null;
}

export function ApprovalStatusNotification({
    approvalStatus,
    rejectionReason,
}: ApprovalStatusNotificationProps) {
    const [open, setOpen] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isApproved = approvalStatus === "approved";

    const handleClose = async () => {
        setIsSubmitting(true);

        const result = await markApprovalMessageAsSeen();

        if (result.success) {
            setOpen(false);
        } else {
            console.error("Failed to mark message as seen:", result.message);
            // Still close the dialog even if the API call failed
            setOpen(false);
        }

        setIsSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[500px]" showCloseButton={false} onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        {isApproved ? (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
                            </div>
                        ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                                <XCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
                            </div>
                        )}
                        <DialogTitle className="text-2xl">
                            {isApproved ? "Profile Approved!" : "Profile Needs Improvement"}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-base pt-2">
                        {isApproved ? (
                            <>
                                🎉 <strong>Congratulations!</strong> Your profile has been approved by our MIS
                                administrator. Welcome to JobGenie! You can now explore job opportunities and submit
                                applications.
                            </>
                        ) : (
                            <>
                                We&apos;ve reviewed your profile and it needs some improvements before approval. Please
                                update your profile and resubmit it for review.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {!isApproved && rejectionReason && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/10">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                            Reason for rejection:
                        </p>
                        <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{rejectionReason}</p>
                    </div>
                )}

                <DialogFooter className="sm:justify-end">
                    <Button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className={
                            isApproved
                                ? "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                                : ""
                        }
                    >
                        {isSubmitting ? "Processing..." : "OK"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
