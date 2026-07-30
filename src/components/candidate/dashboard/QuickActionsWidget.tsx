"use client";

import Link from "next/link";
import { User, Search, FileText, Settings, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
    title: string;
    subtitle: string;
    href: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    badge?: string | number;
    badgeColor?: string;
    disabled?: boolean;
    disabledReason?: string;
}

interface QuickActionsWidgetProps {
    isApproved: boolean;
    activeJobsCount: number;
    pendingInvitationsCount?: number;
}

export function QuickActionsWidget({
    isApproved,
    activeJobsCount,
    pendingInvitationsCount = 0,
}: QuickActionsWidgetProps) {
    const actions: QuickAction[] = [
        {
            title: "My Profile",
            subtitle: "Manage resume & info",
            href: "/candidate/profile",
            icon: User,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
        },
        {
            title: "Browse Jobs",
            subtitle: "Find your next role",
            href: "/candidate/jobs",
            icon: Search,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            badge: `${activeJobsCount} New`,
            badgeColor: "bg-primary/10 text-primary",
            disabled: !isApproved,
            disabledReason: "Awaiting approval",
        },
        {
            title: "Applications",
            subtitle: "Track submission status",
            href: "/candidate/jobs?section=applied",
            icon: FileText,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            badge: pendingInvitationsCount > 0 ? `${pendingInvitationsCount} active` : undefined,
            badgeColor: "bg-primary/10 text-primary",
            disabled: !isApproved,
            disabledReason: "Awaiting approval",
        },
        {
            title: "Settings",
            subtitle: "Preferences & security",
            href: "/candidate/settings",
            icon: Settings,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            disabled: !isApproved,
            disabledReason: "Awaiting approval",
        },
    ];

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Navigate to key sections</p>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
                {actions.map((action) => {
                    const Icon = action.icon;

                    if (action.disabled) {
                        return (
                            <div
                                key={action.href}
                                className="group relative flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4 opacity-50 cursor-not-allowed"
                            >
                                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", action.iconBg, action.iconColor)}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-foreground leading-tight">{action.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{action.disabledReason}</p>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={action.href}
                            href={action.href}
                            className={cn(
                                "group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4",
                                "hover:border-primary/30 hover:bg-muted/20"
                            )}
                        >
                            {/* Icon */}
                            <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-xl",
                                action.iconBg, action.iconColor
                            )}>
                                <Icon className="h-5 w-5" />
                            </div>

                            {/* Text */}
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-foreground leading-tight">{action.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{action.subtitle}</p>
                            </div>

                            {/* Badge */}
                            {action.badge && (
                                <span className={cn("inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold", action.badgeColor)}>
                                    {action.badge}
                                </span>
                            )}

                            {/* Arrow */}
                            <ArrowRight className="absolute top-3.5 right-3.5 h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/50" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
