"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, XCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { markCompanyApprovalMessageAsSeen } from "@/app/actions/employer";

interface EmployerApprovalBannerProps {
    approvalStatus: "pending" | "approved" | "rejected";
    rejectionReason?: string;
    isMessageSeen: boolean;
}

export function EmployerApprovalBanner({
    approvalStatus,
    rejectionReason,
    isMessageSeen,
}: EmployerApprovalBannerProps) {
    const [isVisible, setIsVisible] = useState(true);

    // Don't show if already seen OR if approved (unless it's a fresh approval notification if we wanted that, 
    // but typically we only show pending/rejected persistent banners, or approved once)
    // Based on requirements: 
    // - Pending: Show banner until approved (maybe dismissable for session?) 
    //   Actually, pending status usually warrants a persistent banner or at least one that comes back. 
    //   But let's respect the isMessageSeen for persistent dismissal if the user wants.
    //   However, usually restricted access warnings should be persistent. 
    //   The plan says: "Dismissible after first view (set approval_status_message_seen)"

    // Logic:
    // - If pending: Show always (unless we implement sophisticated dismissal) OR show if not seen. 
    //   Let's show if NOT seen for "Notification" style, but maybe a smaller alert for persistent status.
    //   Plan Ref: "Dismissible after first view"

    useEffect(() => {
        if (isMessageSeen) {
            setIsVisible(false);
        }
    }, [isMessageSeen]);

    if (!isVisible) return null;

    if (approvalStatus === "approved") return null; // We don't need a banner for approved state usually, or handled by email/toast

    const handleDismiss = async () => {
        setIsVisible(false);
        await markCompanyApprovalMessageAsSeen();
    };

    if (approvalStatus === "pending") {
        return (
            <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-200 relative">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="ml-2 font-semibold">Approval Pending</AlertTitle>
                <AlertDescription className="ml-2 mt-1">
                    Your company profile is currently under review by our MIS, admins.
                    Access to some features (like posting jobs) is restricted until approval is complete.
                </AlertDescription>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 text-blue-900/40 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-200/40 dark:hover:text-blue-200"
                    onClick={handleDismiss}
                >
                    <X className="h-4 w-4" />
                </Button>
            </Alert>
        );
    }

    if (approvalStatus === "rejected") {
        return (
            <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-900 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200 relative">
                <XCircle className="h-5 w-5" />
                <AlertTitle className="ml-2 font-semibold">Profile Requires Attention</AlertTitle>
                <AlertDescription className="ml-2 mt-1 space-y-2">
                    <p>Your company profile was not approved. Please update your profile to resolve the issues.</p>
                    {rejectionReason && (
                        <div className="bg-red-100/50 dark:bg-red-950/40 p-2 rounded text-sm border border-red-200/50">
                            <span className="font-semibold">Reason:</span> {rejectionReason}
                        </div>
                    )}
                </AlertDescription>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 text-red-900/40 hover:text-red-900 hover:bg-red-100 dark:text-red-200/40 dark:hover:text-red-200"
                    onClick={handleDismiss}
                >
                    <X className="h-4 w-4" />
                </Button>
            </Alert>
        );
    }

    return null;
}
