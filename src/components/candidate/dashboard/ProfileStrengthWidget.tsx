"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { CandidateDashboardData } from "@/app/actions/candidate-dashboard-data";

interface ProfileStrengthWidgetProps {
    data: CandidateDashboardData;
}

// Circular progress SVG — always green (matches jg-new design)
function CircularProgress({ percent }: { percent: number }) {
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
        <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center">
            <svg className="absolute h-16 w-16 -rotate-90" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r={radius} fill="none" stroke="currentColor" strokeWidth="5" className="text-border" />
                <circle
                    cx="30" cy="30" r={radius}
                    fill="none"
                    stroke="var(--color-primary, #00cc44)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 1s ease", filter: "drop-shadow(0 0 6px oklch(0.52 0.20 155 / 0.5))" }}
                />
            </svg>
            <span className="relative z-10 text-sm font-bold text-foreground tabular-nums">
                {percent}%
            </span>
        </div>
    );
}

export function ProfileStrengthWidget({ data }: ProfileStrengthWidgetProps) {
    const { profileCompletionPercent, profileCompletionItems } = data;

    const incompleteItems = profileCompletionItems.filter(i => !i.done).slice(0, 3);

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm p-5">
            {/* Header row with inline circular progress */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Profile Strength</h3>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <CircularProgress percent={profileCompletionPercent} />
                <div>
                    <p className="text-sm font-semibold text-foreground">
                        {profileCompletionPercent < 80 ? "Almost there!" : "Looking great!"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {incompleteItems.length > 0
                            ? `${incompleteItems.length} section${incompleteItems.length > 1 ? "s" : ""} to complete`
                            : "Profile fully complete"}
                    </p>
                </div>
            </div>

            {/* Incomplete items */}
            {incompleteItems.length > 0 && (
                <div className="space-y-1.5 mb-4">
                    {incompleteItems.map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                            <span className="h-3 w-3 flex-shrink-0 rounded-full border-2 border-primary/40 flex items-center justify-center">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                            </span>
                            <span className="text-xs text-muted-foreground">{item.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* CTA Button — green */}
            <Link
                href="/candidate/profile"
                className={cn(
                    "w-full rounded-xl py-2.5 text-sm font-semibold transition-all duration-150",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "flex items-center justify-center shadow-sm shadow-primary/20"
                )}
            >
                {incompleteItems.length > 0 ? "Complete Profile" : "View Profile"}
            </Link>
        </div>
    );
}
