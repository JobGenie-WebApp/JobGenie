"use client";

import Link from "next/link";
import { Mail, Clock, ChevronRight, CheckCircle, XCircle, AlertCircle, Ban } from "lucide-react";
import { cn, formatIndustry } from "@/lib/utils";
import type { RecentInvitation, InvitationStatus } from "@/app/actions/candidate-dashboard-data";

interface InvitationsWidgetProps {
    invitations: RecentInvitation[];
    totalCount: number;
}

const statusConfig: Record<
    InvitationStatus | string,
    { label: string; icon: React.ElementType; classes: string }
> = {
    pending: {
        label: "Pending",
        icon: AlertCircle,
        classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    accepted: {
        label: "Accepted",
        icon: CheckCircle,
        classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    confirmed: {
        label: "Confirmed",
        icon: CheckCircle,
        classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    completed: {
        label: "Completed",
        icon: CheckCircle,
        classes: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    rejected: {
        label: "Declined",
        icon: XCircle,
        classes: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    },
    canceled: {
        label: "Canceled",
        icon: Ban,
        classes: "bg-muted text-muted-foreground",
    },
};

function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
}

export function InvitationsWidget({ invitations, totalCount }: InvitationsWidgetProps) {
    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                        <Mail className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Job Invitations</h3>
                        <p className="text-xs text-muted-foreground">{totalCount} total received</p>
                    </div>
                </div>
                <Link
                    href="/candidate/invitations"
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                    View All
                    <ChevronRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            {/* Invitation list */}
            <div className="flex-1 divide-y divide-border/50">
                {invitations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                        <Mail className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">No invitations yet</p>
                        <p className="text-xs text-muted-foreground/70">
                            Employers will reach out once your profile is approved
                        </p>
                    </div>
                ) : (
                    invitations.map((inv) => {
                        const effectiveStatus = inv.invitation_canceled ? "canceled" : inv.status;
                        const config = statusConfig[effectiveStatus] || statusConfig.pending;
                        const StatusIcon = config.icon;

                        return (
                            <div key={inv.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                                {/* Status icon */}
                                <div className={cn("flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg mt-0.5", config.classes)}>
                                    <StatusIcon className="h-4 w-4" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">
                                        {inv.job_title}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {inv.company_name || formatIndustry(inv.industry) || "Company"} • {formatIndustry(inv.industry) || "Industry"}
                                    </p>
                                </div>

                                {/* Right side */}
                                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", config.classes)}>
                                        {config.label}
                                    </span>
                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {formatRelativeDate(inv.sent_at)}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {invitations.length > 0 && (
                <div className="px-5 py-3 border-t border-border">
                    <Link
                        href="/candidate/invitations"
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                    >
                        Manage All Invitations
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            )}
        </div>
    );
}
