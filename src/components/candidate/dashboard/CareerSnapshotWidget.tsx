"use client";

import Link from "next/link";
import { Briefcase, GraduationCap, ChevronRight, CalendarDays } from "lucide-react";
import { cn, sortEducations } from "@/lib/utils";
import type { WorkExperienceSnap, EducationSnap } from "@/app/actions/candidate-dashboard-data";
import { formatUTCDate } from "@/lib/date-utils";

interface CareerSnapshotWidgetProps {
    experiences: WorkExperienceSnap[];
    educations: EducationSnap[];
}

function formatDateRange(start: string, end: string | null, isCurrent: boolean): string {
    const startStr = formatUTCDate(start, "MMM yyyy");
    if (isCurrent) return `${startStr} – Present`;
    if (!end) return startStr;
    const endStr = formatUTCDate(end, "MMM yyyy");
    return `${startStr} – ${endStr}`;
}

const educationStatusColors: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    incomplete: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const educationStatusLabels: Record<string, string> = {
    completed: "Completed",
    in_progress: "In Progress",
    incomplete: "Incomplete",
};

export function CareerSnapshotWidget({ experiences, educations }: CareerSnapshotWidgetProps) {
    const hasContent = experiences.length > 0 || educations.length > 0;

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                        <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">Career Snapshot</h3>
                </div>
                <Link
                    href="/candidate/profile"
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                    Full Profile
                    <ChevronRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            <div className="flex-1 p-5 flex flex-col gap-5">
                {!hasContent ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                        <Briefcase className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">No career info yet</p>
                        <Link href="/candidate/profile" className="text-xs font-semibold text-primary hover:underline">
                            Add your experience & education
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Work Experience */}
                        {experiences.length > 0 && (
                            <div>
                                <div className="flex items-center gap-1.5 mb-3">
                                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Work Experience
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {experiences.map((exp, index) => (
                                        <div key={exp.id} className="relative flex gap-3">
                                            {/* Timeline line */}
                                            {index < experiences.length - 1 && (
                                                <div className="absolute left-3.5 top-8 h-full w-px bg-border" />
                                            )}
                                            {/* Dot */}
                                            <div className={cn(
                                                "mt-1 h-3 w-3 flex-shrink-0 rounded-full ring-2 ring-card",
                                                exp.is_current
                                                    ? "bg-emerald-500 ring-emerald-200 dark:ring-emerald-800"
                                                    : "bg-muted-foreground/40"
                                            )} />
                                            <div className="flex-1 pb-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-foreground truncate">{exp.job_title}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{exp.company}</p>
                                                    </div>
                                                    {exp.is_current && (
                                                        <span className="flex-shrink-0 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                                                    <CalendarDays className="h-3 w-3" />
                                                    {formatDateRange(exp.start_date, exp.end_date, exp.is_current)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Divider between sections */}
                        {experiences.length > 0 && educations.length > 0 && (
                            <div className="h-px bg-border" />
                        )}

                        {/* Education */}
                        {educations.length > 0 && (
                            <div>
                                <div className="flex items-center gap-1.5 mb-3">
                                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Education
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {sortEducations(educations).map((edu) => {
                                        const statusKey = edu.status || "completed";
                                        const statusColor = educationStatusColors[statusKey] || "bg-muted text-muted-foreground";
                                        const statusLabel = educationStatusLabels[statusKey] || statusKey;
                                        return (
                                            <div key={edu.id} className="flex items-start gap-3">
                                                <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                                                    <GraduationCap className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-foreground truncate">
                                                                {edu.professional_qualification || edu.degree_diploma}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground truncate">{edu.institution}</p>
                                                        </div>
                                                        <span className={cn("flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", statusColor)}>
                                                            {statusLabel}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
