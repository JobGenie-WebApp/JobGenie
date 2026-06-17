"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    ArrowLeft, MapPin, Briefcase, Clock, Calendar, Building2,
    Loader2, SendHorizonal, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const MDXViewer = dynamic(
    () => import("@/components/employer/MdxViewer").then((m) => m.MdxViewer),
    { ssr: false }
);

const JOB_TYPE_LABELS: Record<string, string> = {
    full_time: "Full Time", part_time: "Part Time", contract: "Contract",
    internship: "Internship", freelance: "Freelance",
};

const APP_STATUS_LABELS: Record<string, string> = {
    pending: "Applied", reviewed: "Under Review", shortlisted: "Shortlisted",
    rejected: "Not Progressing", hired: "Hired", withdrawn: "Withdrawn",
};

function fmt(d: string | null) {
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function salaryDisplay(min: number | null, max: number | null, currency: string | null) {
    if (!min && !max) return null;
    const c = currency ?? "LKR";
    if (min && max) return `${c} ${min.toLocaleString()} – ${max.toLocaleString()} / month`;
    if (min) return `${c} ${min.toLocaleString()}+ / month`;
    return `Up to ${c} ${max!.toLocaleString()} / month`;
}

interface JobDetail {
    id: string; job_title: string; location: string | null; industry: string | null;
    job_type: string; description: string | null; deadline: string | null;
    expires_at: string | null; salary_min: number | null; salary_max: number | null;
    salary_currency: string | null; experience_level: string | null; positions_available: number | null;
    published_at: string | null;
    company: { company_name: string; logo_url: string | null; description: string | null; website: string | null; company_size: string | null };
}

export function JobDetailClient({ jobId }: { jobId: string }) {
    const router = useRouter();
    const [job, setJob] = useState<JobDetail | null>(null);
    const [hasApplied, setHasApplied] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [applyOpen, setApplyOpen] = useState(false);
    const [coverLetter, setCoverLetter] = useState("");
    const [applying, setApplying] = useState(false);

    const fetchJob = useCallback(async () => {
        setLoading(true);
        const res = await fetch(`/api/candidate/jobs/${jobId}`);
        if (res.ok) {
            const d = await res.json();
            setJob(d.job);
            setHasApplied(d.has_applied);
            setApplicationStatus(d.application_status);
        } else {
            toast.error("Job not found");
            router.push("/candidate/jobs");
        }
        setLoading(false);
    }, [jobId, router]);

    useEffect(() => { fetchJob(); }, [fetchJob]);

    async function submitApplication() {
        setApplying(true);
        try {
            const res = await fetch(`/api/candidate/jobs/${jobId}/apply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cover_letter: coverLetter || null }),
            });
            const data = await res.json();
            if (!res.ok) {
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

    if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    if (!job) return null;

    const company = Array.isArray(job.company) ? job.company[0] : job.company;
    const salary = salaryDisplay(job.salary_min, job.salary_max, job.salary_currency);

    return (
        <div className="space-y-6">
            <Button variant="ghost" size="sm" onClick={() => router.push("/candidate/jobs")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Jobs
            </Button>

            {/* Header */}
            <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    {company?.logo_url
                        ? <img src={company.logo_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
                        : <Building2 className="h-7 w-7 text-muted-foreground" />
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold">{job.job_title}</h1>
                    <p className="text-muted-foreground">{company?.company_name}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                        {job.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>}
                        <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{JOB_TYPE_LABELS[job.job_type]}</span>
                        {salary && <span>{salary}</span>}
                        {job.expires_at && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Closes {fmt(job.expires_at)}</span>}
                        {job.deadline && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Deadline {fmt(job.deadline)}</span>}
                    </div>
                </div>
                <div className="shrink-0">
                    {hasApplied ? (
                        <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                            <CheckCircle2 className="h-5 w-5" />
                            <div>
                                <div>Applied</div>
                                {applicationStatus && <div className="text-xs text-muted-foreground">{APP_STATUS_LABELS[applicationStatus] ?? applicationStatus}</div>}
                            </div>
                        </div>
                    ) : (
                        <Button onClick={() => setApplyOpen(true)}>
                            <SendHorizonal className="h-4 w-4 mr-2" /> Apply Now
                        </Button>
                    )}
                </div>
            </div>

            {/* Quick details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Experience", value: job.experience_level || "Not specified" },
                    { label: "Positions", value: job.positions_available?.toString() ?? "1" },
                    { label: "Industry", value: job.industry || "Not specified" },
                    { label: "Published", value: fmt(job.published_at) || "—" },
                ].map((item) => (
                    <div key={item.label} className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="text-sm font-medium mt-0.5">{item.value}</p>
                    </div>
                ))}
            </div>

            {/* Description */}
            {job.description && (
                <Card>
                    <CardHeader><CardTitle>Job Description</CardTitle></CardHeader>
                    <CardContent>
                        <MDXViewer markdown={job.description} />
                    </CardContent>
                </Card>
            )}

            {/* Company info */}
            {company && (
                <Card>
                    <CardHeader><CardTitle>About {company.company_name}</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {company.description && <p className="text-sm text-muted-foreground">{company.description}</p>}
                        {company.company_size && <p className="text-sm"><span className="font-medium">Size:</span> {company.company_size}</p>}
                        {company.website && (
                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline">
                                {company.website}
                            </a>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Apply CTA at bottom */}
            {!hasApplied && (
                <div className="flex justify-center pb-8">
                    <Button size="lg" onClick={() => setApplyOpen(true)}>
                        <SendHorizonal className="h-4 w-4 mr-2" /> Apply for this Position
                    </Button>
                </div>
            )}

            {/* Apply Dialog */}
            <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Apply for {job.job_title}</DialogTitle>
                        <DialogDescription>Submit your application to {company?.company_name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label>Cover Letter (optional)</Label>
                            <Textarea
                                className="mt-1.5 min-h-[150px]"
                                placeholder="Tell the employer why you're a great fit for this role..."
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                                maxLength={5000}
                            />
                            <p className="text-xs text-muted-foreground mt-1">{coverLetter.length}/5000</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Your profile and resume on file will be shared with the employer.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApplyOpen(false)}>Cancel</Button>
                        <Button onClick={submitApplication} disabled={applying}>
                            {applying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <SendHorizonal className="h-4 w-4 mr-2" />}
                            Submit Application
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
