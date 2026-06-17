"use client";

import Image from "next/image";
import Link from "next/link";
import {
    User,
    MapPin,
    Briefcase,
    Clock,
    BadgeCheck,
    Award,
    ChevronRight,
    Building2,
} from "lucide-react";
import { cn, formatIndustry } from "@/lib/utils";
import type { CandidateDashboardData } from "@/app/actions/candidate-dashboard-data";

interface ProfileHeroWidgetProps {
    data: CandidateDashboardData;
}

const availabilityColors: Record<string, string> = {
    available: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    not_available: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    open_to_opportunities: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
};

const availabilityLabels: Record<string, string> = {
    available: "Available Now",
    not_available: "Not Available",
    open_to_opportunities: "Open to Opportunities",
};

const approvalColors: Record<string, string> = {
    approved: "bg-emerald-500 text-white",
    pending: "bg-amber-500 text-white",
    rejected: "bg-rose-500 text-white",
};

// Circular progress SVG component
function CircularProgress({ percent }: { percent: number }) {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    const getColor = () => {
        if (percent >= 80) return "#10b981"; // emerald
        if (percent >= 50) return "#3b82f6"; // blue
        return "#f59e0b"; // amber
    };

    return (
        <div className="relative flex h-28 w-28 items-center justify-center">
            <svg className="absolute h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                <circle
                    className="text-muted/40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    cx="50"
                    cy="50"
                    r={radius}
                />
                <circle
                    stroke={getColor()}
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="none"
                    cx="50"
                    cy="50"
                    r={radius}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.8s ease" }}
                />
            </svg>
            <div className="flex flex-col items-center">
                <span className="text-2xl font-bold tabular-nums">{percent}%</span>
                <span className="text-[10px] text-muted-foreground font-medium">Complete</span>
            </div>
        </div>
    );
}

export function ProfileHeroWidget({ data }: ProfileHeroWidgetProps) {
    const {
        firstName, lastName, currentPosition, industry, country,
        yearsOfExperience, experienceLevel, availabilityStatus,
        approvalStatus, membershipNo, profileImageUrl,
        profileCompletionPercent, profileCompletionItems,
        expectedMonthlySalary,
    } = data;

    const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
    const availKey = availabilityStatus || "not_available";
    const availColor = availabilityColors[availKey] || availabilityColors.not_available;
    const availLabel = availabilityLabels[availKey] || availabilityStatus;

    const expLabel = experienceLevel
        ? experienceLevel.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
        : null;

    const incompleteItems = profileCompletionItems
        .filter(i => !i.done)
        .slice(0, 3);

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Header gradient band */}
            <div className="h-24 bg-gradient-to-r from-primary/80 via-primary/60 to-blue-600/40 relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
                {approvalStatus && (
                    <div className="absolute top-3 right-4">
                        <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                            approvalColors[approvalStatus] || "bg-muted text-muted-foreground"
                        )}>
                            <BadgeCheck className="h-3 w-3" />
                            {approvalStatus}
                        </span>
                    </div>
                )}
            </div>

            <div className="px-6 pb-6">
                {/* Avatar row */}
                <div className="flex items-end gap-4 -mt-12 mb-4">
                    <div className="relative flex-shrink-0">
                        <div className="h-20 w-20 rounded-2xl ring-4 ring-card overflow-hidden bg-muted flex items-center justify-center shadow-md">
                            {profileImageUrl ? (
                                <Image
                                    src={profileImageUrl}
                                    alt={`${firstName} ${lastName}`}
                                    width={80}
                                    height={80}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-2xl font-bold text-muted-foreground">{initials}</span>
                            )}
                        </div>
                        {availabilityStatus === 'available' && (
                            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-card" />
                        )}
                    </div>

                    <div className="flex-1 pb-1">
                        <h2 className="text-xl font-bold text-foreground leading-tight">
                            {firstName} {lastName}
                        </h2>
                        {currentPosition && (
                            <p className="text-sm text-muted-foreground">{currentPosition}</p>
                        )}
                    </div>
                </div>

                {/* Info chips row */}
                <div className="flex flex-wrap gap-2 mb-5">
                    {availabilityStatus && (
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium", availColor)}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {availLabel}
                        </span>
                    )}
                    {industry && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {formatIndustry(industry)}
                        </span>
                    )}
                    {country && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {country}
                        </span>
                    )}
                    {yearsOfExperience !== null && yearsOfExperience !== undefined && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                            <Briefcase className="h-3 w-3" />
                            {yearsOfExperience} yr{yearsOfExperience !== 1 ? "s" : ""} experience
                        </span>
                    )}
                    {expLabel && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                            <Award className="h-3 w-3" />
                            {expLabel}
                        </span>
                    )}
                    {membershipNo && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                            <BadgeCheck className="h-3 w-3" />
                            Member #{membershipNo}
                        </span>
                    )}
                </div>

                {/* Divider */}
                <div className="h-px bg-border mb-5" />

                {/* Profile completion + salary row */}
                <div className="flex items-start gap-6">
                    {/* Circular progress */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        <CircularProgress percent={profileCompletionPercent} />
                        <span className="text-xs text-muted-foreground font-medium">Profile Strength</span>
                    </div>

                    {/* Completion checklist + salary */}
                    <div className="flex-1 space-y-3">
                        {expectedMonthlySalary !== null && expectedMonthlySalary !== undefined && (
                            <div className="rounded-xl bg-muted/50 border border-border px-4 py-3">
                                <p className="text-xs text-muted-foreground mb-0.5">Expected Monthly Salary</p>
                                <p className="text-xl font-bold text-foreground">
                                    LKR {Number(expectedMonthlySalary).toLocaleString()}
                                </p>
                            </div>
                        )}

                        {incompleteItems.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                                    Complete your profile
                                </p>
                                <div className="space-y-1.5">
                                    {incompleteItems.map((item) => (
                                        <div key={item.label} className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                            <span className="text-xs text-muted-foreground">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Link
                            href="/candidate/profile"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline mt-2"
                        >
                            {incompleteItems.length > 0 ? "Complete Profile" : "View Profile"}
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
