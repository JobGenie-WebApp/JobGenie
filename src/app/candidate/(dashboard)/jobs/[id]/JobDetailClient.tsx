"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Bookmark,
    Briefcase,
    Building2,
    CalendarDays,
    CheckCircle2,
    CircleAlert,
    Clock,
    ExternalLink,
    Loader2,
    MapPin,
    SendHorizonal,
    Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const MDXViewer = dynamic(
    () => import("@/components/employer/MdxViewer").then((module) => module.MdxViewer),
    { ssr: false }
);

const JOB_TYPE_LABELS: Record<string, string> = {
    full_time: "Full Time",
    part_time: "Part Time",
    contract: "Contract",
    internship: "Internship",
    freelance: "Freelance",
};

const APP_STATUS_LABELS: Record<string, string> = {
    pending: "Applied",
    reviewed: "Under Review",
    shortlisted: "Shortlisted",
    rejected: "Not Progressing",
    hired: "Hired",
    withdrawn: "Withdrawn",
};

const TECHNICAL_ERROR_PATTERN =
    /(?:\[(?:GET|POST|PUT|PATCH|DELETE)\s+\/api\/|DB error|SQLSTATE|violates (?:not-null|foreign-key|unique) constraint|relation ["']?\w+["']?)/i;

function fmt(date: string | null) {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function salaryDisplay(min: number | null, max: number | null, currency: string | null) {
    if (!min && !max) return null;
    const resolvedCurrency = currency ?? "LKR";
    if (min && max) {
        return `${resolvedCurrency} ${min.toLocaleString()} – ${max.toLocaleString()} / month`;
    }
    if (min) return `${resolvedCurrency} ${min.toLocaleString()}+ / month`;
    return `Up to ${resolvedCurrency} ${max!.toLocaleString()} / month`;
}

interface JobDetail {
    id: string;
    job_title: string;
    location: string | null;
    industry: string | null;
    job_type: string;
    description: string | null;
    deadline: string | null;
    expires_at: string | null;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string | null;
    experience_level: string | null;
    positions_available: number | null;
    published_at: string | null;
    company: {
        company_name: string;
        logo_url: string | null;
        description: string | null;
        website: string | null;
        company_size: string | null;
    };
}

function JobDetailLoading() {
    return (
        <div className="space-y-5" aria-label="Loading job details">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-52 w-full rounded-xl" />
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
                <Skeleton className="h-96 w-full rounded-xl" />
                <Skeleton className="h-72 w-full rounded-xl" />
            </div>
        </div>
    );
}

function ApplicationActions({
    hasApplied,
    applicationStatus,
    canWithdraw,
    isSaved,
    saving,
    withdrawing,
    onApply,
    onToggleSave,
    onWithdraw,
}: {
    hasApplied: boolean;
    applicationStatus: string | null;
    canWithdraw: boolean;
    isSaved: boolean;
    saving: boolean;
    withdrawing: boolean;
    onApply: () => void;
    onToggleSave: () => void;
    onWithdraw: () => void;
}) {
    return (
        <Card>
            <CardContent className="space-y-4">
                {hasApplied ? (
                    <div
                        className="flex items-start gap-3 rounded-lg bg-muted/70 p-3.5"
                        aria-live="polite"
                    >
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <div>
                            <p className="text-sm font-semibold">Application submitted</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {applicationStatus
                                    ? APP_STATUS_LABELS[applicationStatus] ?? applicationStatus
                                    : "Applied"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm font-semibold">Interested in this role?</p>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                            Apply with your JobGenie profile and resume.
                        </p>
                    </div>
                )}

                {!hasApplied ? (
                    <Button className="h-11 w-full" onClick={onApply}>
                        <SendHorizonal className="mr-2 h-4 w-4" />
                        Apply Now
                    </Button>
                ) : null}

                <Button
                    variant="outline"
                    className="h-10 w-full"
                    onClick={onToggleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Bookmark
                            className={`mr-2 h-4 w-4 ${
                                isSaved ? "fill-current text-primary" : ""
                            }`}
                        />
                    )}
                    {isSaved ? "Saved" : "Save Job"}
                </Button>

                {canWithdraw ? (
                    <Button
                        variant="ghost"
                        className="h-10 w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={onWithdraw}
                        disabled={withdrawing}
                    >
                        {withdrawing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Withdraw application
                    </Button>
                ) : null}
            </CardContent>
        </Card>
    );
}

export function JobDetailClient({ jobId }: { jobId: string }) {
    const router = useRouter();
    const [job, setJob] = useState<JobDetail | null>(null);
    const [hasApplied, setHasApplied] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
    const [applicationId, setApplicationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [applyOpen, setApplyOpen] = useState(false);
    const [coverLetter, setCoverLetter] = useState("");
    const [applying, setApplying] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);

    const fetchJob = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/candidate/jobs/${jobId}`);
            if (!response.ok) {
                toast.error("Job not found");
                router.push("/candidate/jobs");
                return;
            }

            const data = await response.json();
            setJob(data.job);
            setHasApplied(data.has_applied);
            setApplicationStatus(data.application_status);
            setApplicationId(data.application_id ?? null);
            setIsSaved(Boolean(data.is_saved));
        } catch {
            toast.error("Could not load this job");
        } finally {
            setLoading(false);
        }
    }, [jobId, router]);

    useEffect(() => {
        fetchJob();
    }, [fetchJob]);

    const canWithdraw =
        hasApplied &&
        Boolean(applicationId) &&
        ["pending", "reviewed"].includes(applicationStatus ?? "");

    async function withdrawApplication() {
        if (!applicationId) return;
        setWithdrawing(true);
        try {
            const response = await fetch(`/api/candidate/applications/${applicationId}`, {
                method: "DELETE",
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                toast.error(data.error || "Failed to withdraw");
                return;
            }

            toast.success("Application withdrawn");
            setHasApplied(false);
            setApplicationStatus(null);
            setApplicationId(null);
        } finally {
            setWithdrawing(false);
        }
    }

    async function toggleSave() {
        const nextSavedState = !isSaved;
        setSaving(true);
        setIsSaved(nextSavedState);

        try {
            const response = await fetch(`/api/candidate/jobs/${jobId}/save`, {
                method: nextSavedState ? "POST" : "DELETE",
            });
            if (!response.ok) throw new Error();
            toast.success(nextSavedState ? "Job saved" : "Removed from saved");
        } catch {
            setIsSaved(!nextSavedState);
            toast.error("Could not update saved jobs");
        } finally {
            setSaving(false);
        }
    }

    async function submitApplication() {
        setApplying(true);
        try {
            const response = await fetch(`/api/candidate/jobs/${jobId}/apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cover_letter: coverLetter || null }),
            });
            const data = await response.json();
            if (!response.ok) {
                toast.error(data.error || "Failed to apply");
                return;
            }

            toast.success("Application submitted successfully!");
            setApplyOpen(false);
            setHasApplied(true);
            setApplicationStatus("pending");
        } finally {
            setApplying(false);
        }
    }

    if (loading) return <JobDetailLoading />;
    if (!job) return null;

    const company = Array.isArray(job.company) ? job.company[0] : job.company;
    const salary = salaryDisplay(job.salary_min, job.salary_max, job.salary_currency);
    const jobType = JOB_TYPE_LABELS[job.job_type] ?? job.job_type;
    const descriptionHasTechnicalError =
        Boolean(job.description) && TECHNICAL_ERROR_PATTERN.test(job.description ?? "");

    const quickFacts = [
        {
            label: "Experience",
            value: job.experience_level || "Not specified",
            icon: Briefcase,
        },
        {
            label: "Open positions",
            value: job.positions_available?.toString() ?? "1",
            icon: Users,
        },
        {
            label: "Industry",
            value: job.industry || "Not specified",
            icon: Building2,
        },
        {
            label: "Published",
            value: fmt(job.published_at) || "Not specified",
            icon: CalendarDays,
        },
    ];

    return (
        <div className="space-y-5 pb-8">
            <Button
                variant="ghost"
                className="-ml-2 h-10 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => router.push("/candidate/jobs")}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Jobs
            </Button>

            <Card className="overflow-hidden py-0">
                <div className="p-5 sm:p-7">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-muted">
                            {company?.logo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={company.logo_url}
                                    alt={`${company.company_name} logo`}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <Building2 className="h-7 w-7 text-muted-foreground" />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="font-medium">
                                    {jobType}
                                </Badge>
                                {job.experience_level ? (
                                    <Badge variant="outline" className="font-normal text-muted-foreground">
                                        {job.experience_level}
                                    </Badge>
                                ) : null}
                            </div>

                            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                {job.job_title}
                            </h1>
                            <p className="mt-1 text-base text-muted-foreground">
                                {company?.company_name}
                            </p>

                            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                                {job.location ? (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4" />
                                        {job.location}
                                    </span>
                                ) : null}
                                {salary ? (
                                    <span className="font-medium text-foreground">{salary}</span>
                                ) : null}
                                {job.expires_at ? (
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-4 w-4" />
                                        Closes {fmt(job.expires_at)}
                                    </span>
                                ) : null}
                                {job.deadline ? (
                                    <span className="flex items-center gap-1.5">
                                        <CalendarDays className="h-4 w-4" />
                                        Deadline {fmt(job.deadline)}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="lg:hidden">
                <ApplicationActions
                    hasApplied={hasApplied}
                    applicationStatus={applicationStatus}
                    canWithdraw={canWithdraw}
                    isSaved={isSaved}
                    saving={saving}
                    withdrawing={withdrawing}
                    onApply={() => setApplyOpen(true)}
                    onToggleSave={toggleSave}
                    onWithdraw={withdrawApplication}
                />
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
                <main className="space-y-5">
                    <Card>
                        <CardHeader className="border-b border-border/50 pb-4">
                            <h2 className="text-base font-semibold">Job Description</h2>
                        </CardHeader>
                        <CardContent>
                            {descriptionHasTechnicalError ? (
                                <div
                                    role="status"
                                    className="flex items-start gap-3 rounded-lg bg-muted/70 p-4"
                                >
                                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">
                                            Description temporarily unavailable
                                        </p>
                                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                            The employer&apos;s description could not be displayed. You can
                                            still review the job details and application status.
                                        </p>
                                    </div>
                                </div>
                            ) : job.description ? (
                                <div className="text-[15px] leading-7">
                                    <MDXViewer markdown={job.description} />
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No job description has been provided.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {company ? (
                        <Card>
                            <CardHeader className="border-b border-border/50 pb-4">
                                <h2 className="text-base font-semibold">
                                    About {company.company_name}
                                </h2>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {company.description ? (
                                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                                        {company.description}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No company overview has been provided.
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center gap-3 border-t border-border/50 pt-4">
                                    {company.company_size ? (
                                        <span className="flex items-center gap-2 text-sm">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            {company.company_size} employees
                                        </span>
                                    ) : null}
                                    {company.website ? (
                                        <Button variant="outline" size="sm" asChild>
                                            <a
                                                href={company.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Visit company website
                                                <ExternalLink className="ml-2 h-3.5 w-3.5" />
                                            </a>
                                        </Button>
                                    ) : null}
                                </div>
                            </CardContent>
                        </Card>
                    ) : null}
                </main>

                <aside className="space-y-4 lg:sticky lg:top-20">
                    <div className="hidden lg:block">
                        <ApplicationActions
                            hasApplied={hasApplied}
                            applicationStatus={applicationStatus}
                            canWithdraw={canWithdraw}
                            isSaved={isSaved}
                            saving={saving}
                            withdrawing={withdrawing}
                            onApply={() => setApplyOpen(true)}
                            onToggleSave={toggleSave}
                            onWithdraw={withdrawApplication}
                        />
                    </div>

                    <Card>
                        <CardHeader className="border-b border-border/50 pb-4">
                            <h2 className="text-sm font-semibold">At a glance</h2>
                        </CardHeader>
                        <CardContent className="divide-y divide-border/50">
                            {quickFacts.map((fact) => {
                                const Icon = fact.icon;
                                return (
                                    <div key={fact.label} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">{fact.label}</p>
                                            <p className="mt-0.5 break-words text-sm font-medium">
                                                {fact.value}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </aside>
            </div>

            <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Apply for {job.job_title}</DialogTitle>
                        <DialogDescription>
                            Submit your application to {company?.company_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label htmlFor="cover-letter">Cover Letter (optional)</Label>
                            <Textarea
                                id="cover-letter"
                                className="mt-1.5 min-h-[150px]"
                                placeholder="Tell the employer why you're a great fit for this role..."
                                value={coverLetter}
                                onChange={(event) => setCoverLetter(event.target.value)}
                                maxLength={5000}
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                                {coverLetter.length}/5000
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Your profile and resume on file will be shared with the employer.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApplyOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={submitApplication} disabled={applying}>
                            {applying ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <SendHorizonal className="mr-2 h-4 w-4" />
                            )}
                            Submit Application
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
