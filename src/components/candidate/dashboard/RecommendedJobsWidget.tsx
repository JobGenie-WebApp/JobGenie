"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, ChevronRight, MapPin, Briefcase, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecommendedJob } from "@/app/actions/candidate-dashboard-data";

interface RecommendedJobsWidgetProps {
    jobs: RecommendedJob[];
}

function formatSalary(min: number | null, max: number | null): string | null {
    if (!min && !max) return null;
    const fmt = (n: number) => {
        if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
        return `$${n}`;
    };
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    if (max) return `Up to ${fmt(max)}`;
    return null;
}

function getCompanyInitials(name: string | null): string {
    if (!name) return "JG";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

const avatarBg = [
    { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
    { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400" },
    { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
    { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
    { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400" },
];

const employmentTypeLabels: Record<string, string> = {
    full_time: "Full-Time",
    part_time: "Part-Time",
    contract: "Contract",
    internship: "Internship",
    freelance: "Freelance",
    temporary: "Temporary",
};

function JobRow({ job, index }: { job: RecommendedJob; index: number }) {
    const [saved, setSaved] = useState(false);
    const [hovered, setHovered] = useState(false);
    const av = avatarBg[index % avatarBg.length];
    const salaryStr = formatSalary(job.salary_min, job.salary_max);
    const typeLabel = job.employment_type
        ? (employmentTypeLabels[job.employment_type] || job.employment_type)
        : null;

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={cn(
                "flex items-start gap-3 px-5 py-4 transition-all duration-150",
                hovered
                    ? "bg-primary/[0.04] border-l-2 border-l-primary"
                    : "border-l-2 border-l-transparent"
            )}
        >
            {/* Company avatar */}
            <div className={cn(
                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                av.bg, av.text
            )}>
                {getCompanyInitials(job.company_name)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground truncate leading-snug">
                        {job.job_title}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {job.is_new && (
                            <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold tracking-wide">
                                NEW
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {job.company_name && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {job.company_name}
                        </span>
                    )}
                    {job.location && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                        </span>
                    )}
                    {salaryStr && (
                        <span className="text-xs font-medium text-foreground/70 font-mono">
                            {salaryStr}
                        </span>
                    )}
                </div>

                {/* Tags row */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {typeLabel && (
                        <span className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {typeLabel}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <button
                    onClick={() => setSaved(s => !s)}
                    className={cn(
                        "transition-colors",
                        saved ? "text-primary" : "text-muted-foreground/40 hover:text-muted-foreground"
                    )}
                    aria-label="Save job"
                >
                    <Bookmark className={cn("h-4 w-4", saved && "fill-primary")} />
                </button>
            </div>
        </div>
    );
}

export function RecommendedJobsWidget({ jobs }: RecommendedJobsWidgetProps) {
    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Recommended for you</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Based on your profile & industry</p>
                </div>
                <Link
                    href="/candidate/jobs"
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                    View all
                    <ChevronRight className="h-3.5 w-3.5" />
                </Link>
            </div>

            {/* Job list */}
            <div className="divide-y divide-border/50">
                {jobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                        <Briefcase className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">No jobs available yet</p>
                        <p className="text-xs text-muted-foreground/70">Check back soon for new opportunities</p>
                    </div>
                ) : (
                    jobs.map((job, index) => (
                        <JobRow key={job.id} job={job} index={index} />
                    ))
                )}
            </div>
        </div>
    );
}
