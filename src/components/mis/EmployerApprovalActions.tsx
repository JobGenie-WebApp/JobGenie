"use client";

import { useState } from "react";
import { Check, X, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { approveCompanyProfile, rejectCompanyProfile } from "@/app/actions/employer";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface EmployerApprovalActionsProps {
    companyId: string;
    companyName: string;
    currentStatus: "pending" | "approved" | "rejected";
}

export function EmployerApprovalActions({
    companyId,
    companyName,
    currentStatus,
}: EmployerApprovalActionsProps) {
    const router = useRouter();
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleApprove = async () => {
        setIsSubmitting(true);

        const result = await approveCompanyProfile(companyId);

        if (result.success) {
            toast.success(result.message);
            router.refresh();
        } else {
            toast.error(result.message);
        }

        setIsSubmitting(false);
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error("Please provide a reason for rejection.");
            return;
        }

        setIsSubmitting(true);

        const result = await rejectCompanyProfile(companyId, rejectionReason);

        if (result.success) {
            toast.success(result.message);
            setShowRejectDialog(false);
            setRejectionReason("");
            router.refresh();
        } else {
            toast.error(result.message);
        }

        setIsSubmitting(false);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {currentStatus !== "approved" && (
                        <DropdownMenuItem
                            onClick={handleApprove}
                            disabled={isSubmitting}
                            className="text-green-600 dark:text-green-400"
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Approve Company
                        </DropdownMenuItem>
                    )}
                    {currentStatus !== "rejected" && (
                        <DropdownMenuItem
                            onClick={() => setShowRejectDialog(true)}
                            disabled={isSubmitting}
                            className="text-red-600 dark:text-red-400"
                        >
                            <X className="mr-2 h-4 w-4" />
                            Reject Company
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Company Profile</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting {companyName}'s profile. This will help them
                            improve and resubmit.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Rejection Reason</Label>
                        <Textarea
                            id="reason"
                            placeholder="e.g., Business registration certificate is unclear, mismatch in company details..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowRejectDialog(false);
                                setRejectionReason("");
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={isSubmitting || !rejectionReason.trim()}
                        >
                            {isSubmitting ? "Rejecting..." : "Reject Profile"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
