"use client";

import { useRouter } from "next/navigation";
import { formatLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Clock, Building2, DollarSign, CheckCircle2 } from "lucide-react";
import { formatSalaryRange } from "@/lib/currencies";

export interface JobCardData {
    id: string;
    job_title: string;
    location: string | null;
    industry: string | null;
    job_type: string;
    experience_level: string | null;
    expires_at: string | null;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string | null;
    published_at: string | null;
    company: { company_name: string; logo_url: string | null; headoffice_location?: string | null } | { company_name: string; logo_url: string | null }[];
}

const JOB_TYPE_LABELS: Record<string, string> = {
    full_time: "Full Time", part_time: "Part Time", contract: "Contract",
    internship: "Internship", freelance: "Freelance",
};

export function daysLeft(expiresAt: string | null): string | null {
    if (!expiresAt) return null;
    const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
    if (diff <= 3) return `${diff}d left`;
    return null;
}

export function postedAgo(dateString: string | null): string | null {
    if (!dateString) return null;
    const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
}

// Shared job card used across Browse / Applied / Saved sections so the design
// stays identical. `rightSlot` (top-right), `extraBadges` (after the level
// badge) and `footer` are composed by each caller.
export function JobCard({ job, rightSlot, extraBadges, footer, applied }: {
    job: JobCardData;
    rightSlot?: React.ReactNode;
    extraBadges?: React.ReactNode;
    footer?: React.ReactNode;
    /** When true, the default footer shows a disabled "Applied" state instead of "Apply Now". */
    applied?: boolean;
}) {
    const router = useRouter();
    const urgent = daysLeft(job.expires_at);
    const salary = formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency);
    const posted = postedAgo(job.published_at);
    const company = Array.isArray(job.company) ? job.company[0] : job.company;

    return (
        <Card className="flex h-full flex-col transition-all hover:shadow-md hover:border-primary/40">
            <CardHeader>
                <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">{JOB_TYPE_LABELS[job.job_type] ?? job.job_type}</Badge>
                        {job.experience_level && <Badge variant="secondary" className="text-xs">{formatLabel(job.experience_level)}</Badge>}
                        {extraBadges}
                    </div>
                    {rightSlot}
                </div>
                <CardTitle className="line-clamp-2 text-base">{job.job_title}</CardTitle>
                <div className="mt-1 flex items-center gap-1.5">
                    {company?.logo_url
                        ? <img src={company.logo_url} alt="" className="h-4 w-4 rounded object-cover" />
                        : <Building2 className="text-muted-foreground h-3.5 w-3.5" />
                    }
                    <p className="text-muted-foreground truncate text-sm">{company?.company_name}</p>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="space-y-2.5">
                    {job.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                            <span className="text-sm truncate">{job.location}</span>
                        </div>
                    )}
                    {job.industry && (
                        <div className="flex items-center gap-2">
                            <Briefcase className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                            <span className="text-sm truncate">{job.industry}</span>
                        </div>
                    )}
                    {salary && (
                        <div className="flex items-center gap-2">
                            <DollarSign className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                            <span className="text-sm truncate">{salary}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Clock className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                        <span className="text-sm">
                            {posted ? `Posted ${posted}` : "Recently posted"}
                            {urgent && <span className="text-amber-600"> · {urgent}</span>}
                        </span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="gap-3 pt-2">
                {footer ?? (
                    <>
                        <Button variant="outline" size="sm" className="w-1/2" onClick={() => router.push(`/candidate/jobs/${job.id}`)}>
                            View Details
                        </Button>
                        {applied ? (
                            <Button variant="secondary" size="sm" className="w-1/2" disabled>
                                <CheckCircle2 className="h-4 w-4 mr-1" />Applied
                            </Button>
                        ) : (
                            <Button size="sm" className="w-1/2" onClick={() => router.push(`/candidate/jobs/${job.id}`)}>
                                Apply Now
                            </Button>
                        )}
                    </>
                )}
            </CardFooter>
        </Card>
    );
}
