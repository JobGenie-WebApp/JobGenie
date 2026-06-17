"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Clock, Search, Loader2, Building2 } from "lucide-react";

interface Job {
    id: string;
    job_title: string;
    location: string | null;
    industry: string | null;
    job_type: string;
    expires_at: string | null;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string | null;
    published_at: string | null;
    company: { company_name: string; logo_url: string | null; headoffice_location: string | null };
}

const JOB_TYPES = [
    { value: "__all__", label: "All Types" },
    { value: "full_time", label: "Full Time" },
    { value: "part_time", label: "Part Time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
    { value: "freelance", label: "Freelance" },
];

const JOB_TYPE_LABELS: Record<string, string> = {
    full_time: "Full Time", part_time: "Part Time", contract: "Contract",
    internship: "Internship", freelance: "Freelance",
};

function daysLeft(expiresAt: string | null): string | null {
    if (!expiresAt) return null;
    const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
    if (diff <= 3) return `${diff}d left`;
    return null;
}

function salaryDisplay(min: number | null, max: number | null, currency: string | null) {
    if (!min && !max) return null;
    const c = currency ?? "LKR";
    if (min && max) return `${c} ${min.toLocaleString()} – ${max.toLocaleString()}`;
    if (min) return `${c} ${min.toLocaleString()}+`;
    return `Up to ${c} ${max!.toLocaleString()}`;
}

export function JobBoardClient() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [jobType, setJobType] = useState("__all__");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.set("search", search);
        if (jobType !== "__all__") params.set("job_type", jobType);
        const res = await fetch(`/api/candidate/jobs?${params}`);
        if (res.ok) {
            const d = await res.json();
            setJobs(d.jobs);
            setTotal(d.pagination.total);
        }
        setLoading(false);
    }, [search, jobType, page]);

    useEffect(() => { setPage(1); }, [search, jobType]);
    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Browse Jobs</h1>
                <p className="text-muted-foreground text-sm mt-1">{total} available position{total !== 1 ? "s" : ""}</p>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder="Search job titles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={jobType} onValueChange={setJobType}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {JOB_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No job listings found. Try adjusting your filters.</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {jobs.map((job) => {
                            const urgent = daysLeft(job.expires_at);
                            const salary = salaryDisplay(job.salary_min, job.salary_max, job.salary_currency);
                            const company = Array.isArray(job.company) ? job.company[0] : job.company;
                            return (
                                <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/candidate/jobs/${job.id}`)}>
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                                    {company?.logo_url
                                                        ? <img src={company.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                                                        : <Building2 className="h-5 w-5 text-muted-foreground" />
                                                    }
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-sm">{job.job_title}</h3>
                                                    <p className="text-xs text-muted-foreground">{company?.company_name}</p>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                                                        {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                                                        {salary && <span>{salary}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                <Badge variant="secondary" className="text-xs">{JOB_TYPE_LABELS[job.job_type] ?? job.job_type}</Badge>
                                                {urgent && <span className="text-xs text-amber-600 flex items-center gap-1"><Clock className="h-3 w-3" />{urgent}</span>}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {total > limit && (
                        <div className="flex justify-center gap-2">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                            <span className="flex items-center text-sm text-muted-foreground">Page {page} of {Math.ceil(total / limit)}</span>
                            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>Next</Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
