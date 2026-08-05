"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { markCompanyApprovalMessageAsSeen } from "@/app/actions/employer";
import { Button } from "@/components/ui/button";
import { ApprovalCelebrationVideo } from "@/components/shared/ApprovalCelebrationVideo";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface EmployerApprovalStatusNotificationProps {
    approvalStatus: "approved" | "rejected";
    companyName: string;
    rejectionReason?: string | null;
}

export function EmployerApprovalStatusNotification({
    approvalStatus,
    companyName,
    rejectionReason,
}: EmployerApprovalStatusNotificationProps) {
    const [open, setOpen] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isApproved = approvalStatus === "approved";

    const handleClose = async () => {
        setIsSubmitting(true);

        const result = await markCompanyApprovalMessageAsSeen();
        if (!result.success) {
            console.error("Failed to mark company approval message as seen:", result.message);
        }

        setOpen(false);
        setIsSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent
                className={isApproved ? "max-h-[90vh] overflow-y-auto border-emerald-400/30 bg-[radial-gradient(circle_at_82%_50%,#343b2b_0%,#18291c_42%,#091f14_100%)] text-white shadow-[0_32px_90px_rgba(1,18,10,0.55)] sm:max-w-[800px]" : "sm:max-w-[520px]"}
                showCloseButton={false}
                onPointerDownOutside={(event) => event.preventDefault()}
                onEscapeKeyDown={(event) => event.preventDefault()}
            >
                <div className={isApproved ? "grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_260px]" : "space-y-4"}>
                    <div className="space-y-4">
                        <DialogHeader>
                            <div className="mb-2 flex items-center gap-3">
                                <div
                                    className={
                                        isApproved
                                            ? "flex h-12 w-12 items-center justify-center rounded-full bg-emerald-300/15 ring-1 ring-emerald-300/30"
                                            : "flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20"
                                    }
                                >
                                    {isApproved ? (
                                        <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                                    ) : (
                                        <XCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
                                    )}
                                </div>
                                <DialogTitle className={isApproved ? "text-2xl text-white" : "text-2xl"}>
                                    {isApproved ? "Company Approved!" : "Company Profile Needs Improvement"}
                                </DialogTitle>
                            </div>
                            <DialogDescription className={isApproved ? "pt-2 text-base text-emerald-50/75" : "pt-2 text-base"}>
                                {isApproved ? (
                                    <>
                                        🎉 <strong>Congratulations!</strong> {companyName} has been approved by our MIS
                                        administrator. Your team can now post jobs, explore approved talent, and use the
                                        full JobGenie recruitment workflow.
                                    </>
                                ) : (
                                    <>
                                        We&apos;ve reviewed {companyName}&apos;s profile and it needs some improvements
                                        before approval. Please update the company profile and resubmit it for review.
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
                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-950/30 hover:bg-emerald-400"
                                        : ""
                                }
                            >
                                {isSubmitting ? "Processing..." : isApproved ? "Start Hiring" : "OK"}
                            </Button>
                        </DialogFooter>
                    </div>

                    {isApproved && <ApprovalCelebrationVideo />}
                </div>
            </DialogContent>
        </Dialog>
    );
}
