"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, MapPin, Filter, X, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { JobCard, type JobCardData } from "./JobCard";

interface Job extends JobCardData {
    is_saved?: boolean;
    has_applied?: boolean;
}

interface Industry { industry_id: number; industry_name: string; }

const JOB_TYPES = [
    { value: "__all__", label: "All Types" },
    { value: "full_time", label: "Full Time" },
    { value: "part_time", label: "Part Time" },
    { value: "contract", label: "Contract" },
    { value: "internship", label: "Internship" },
    { value: "freelance", label: "Freelance" },
];

const EXPERIENCE_LEVELS = ["Entry Level", "Junior", "Mid Level", "Senior", "Lead", "Executive"];

const SALARY_FLOORS = [
    { value: "50000", label: "LKR 50,000+" },
    { value: "100000", label: "LKR 100,000+" },
    { value: "150000", label: "LKR 150,000+" },
    { value: "250000", label: "LKR 250,000+" },
    { value: "500000", label: "LKR 500,000+" },
];

export function JobBoardClient() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [jobType, setJobType] = useState("__all__");
    const [industry, setIndustry] = useState("__all__");
    const [experience, setExperience] = useState("__all__");
    const [location, setLocation] = useState("");
    const [salaryMin, setSalaryMin] = useState("__all__");
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [filtersVisible, setFiltersVisible] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    const hasFilters =
        !!search || jobType !== "__all__" || industry !== "__all__" ||
        experience !== "__all__" || !!location || salaryMin !== "__all__";

    const resetFilters = () => {
        setSearch(""); setJobType("__all__"); setIndustry("__all__");
        setExperience("__all__"); setLocation(""); setSalaryMin("__all__");
    };

    const [savingId, setSavingId] = useState<string | null>(null);

    const toggleSave = async (job: Job) => {
        const next = !job.is_saved;
        setSavingId(job.id);
        // Optimistic update.
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, is_saved: next } : j)));
        try {
            const res = await fetch(`/api/candidate/jobs/${job.id}/save`, { method: next ? "POST" : "DELETE" });
            if (!res.ok) throw new Error();
            toast.success(next ? "Job saved" : "Removed from saved");
        } catch {
            // Revert on failure.
            setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, is_saved: !next } : j)));
            toast.error("Could not update saved jobs");
        } finally {
            setSavingId(null);
        }
    };

    // Load industries once for the filter dropdown.
    useEffect(() => {
        fetch("/api/industries")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (d) setIndustries(d.data ?? d.industries ?? d ?? []); })
            .catch(() => {});
    }, []);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search) params.set("search", search);
        if (jobType !== "__all__") params.set("job_type", jobType);
        if (industry !== "__all__") params.set("industry", industry);
        if (experience !== "__all__") params.set("experience_level", experience);
        if (location) params.set("location", location);
        if (salaryMin !== "__all__") params.set("salary_min", salaryMin);
        const res = await fetch(`/api/candidate/jobs?${params}`);
        if (res.ok) {
            const d = await res.json();
            setJobs(d.jobs);
            setTotal(d.pagination.total);
        }
        setLoading(false);
    }, [search, jobType, industry, experience, location, salaryMin, page]);

    useEffect(() => { setPage(1); }, [search, jobType, industry, experience, location, salaryMin]);
    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    return (
        <div className="space-y-6">
            {/* Search + filter controls */}
            <div>
                <div className="mb-4 flex flex-col gap-3 md:flex-row">
                    <div className="relative flex-grow">
                        <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search jobs by title..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline" onClick={() => setFiltersVisible(!filtersVisible)} className="w-full md:w-auto">
                        <Filter className="mr-2 h-4 w-4" />
                        {filtersVisible ? "Hide Filters" : "Show Filters"}
                    </Button>
                    {hasFilters && (
                        <Button variant="ghost" onClick={resetFilters} className="w-full md:w-auto">
                            <X className="mr-1 h-4 w-4" />Reset Filters
                        </Button>
                    )}
                </div>

                {filtersVisible && (
                    <div className="bg-muted/10 mt-4 grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                        <Select value={industry} onValueChange={setIndustry}>
                            <SelectTrigger><SelectValue placeholder="Industry" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">All Industries</SelectItem>
                                {industries.map((i) => <SelectItem key={i.industry_id} value={i.industry_name}>{i.industry_name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <div className="relative">
                            <MapPin className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                            <Input className="pl-9" placeholder="Location..." value={location} onChange={(e) => setLocation(e.target.value)} />
                        </div>
                        <Select value={jobType} onValueChange={setJobType}>
                            <SelectTrigger><SelectValue placeholder="Employment Type" /></SelectTrigger>
                            <SelectContent>
                                {JOB_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={experience} onValueChange={setExperience}>
                            <SelectTrigger><SelectValue placeholder="Experience Level" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">All Levels</SelectItem>
                                {EXPERIENCE_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={salaryMin} onValueChange={setSalaryMin}>
                            <SelectTrigger><SelectValue placeholder="Salary" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">Any Salary</SelectItem>
                                {SALARY_FLOORS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Search className="text-muted-foreground mb-4 h-12 w-12" />
                    <h3 className="mb-2 text-xl font-semibold">No matching jobs found</h3>
                    <p className="text-muted-foreground mb-6">Try adjusting your search criteria or filters to find what you&apos;re looking for.</p>
                    {hasFilters && <Button onClick={resetFilters}>Clear All Filters</Button>}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {jobs.map((job) => (
                            <JobCard
                                key={job.id}
                                job={job}
                                applied={job.has_applied}
                                rightSlot={
                                    <button
                                        type="button"
                                        onClick={() => toggleSave(job)}
                                        disabled={savingId === job.id}
                                        aria-label={job.is_saved ? "Remove from saved" : "Save job"}
                                        title={job.is_saved ? "Remove from saved" : "Save job"}
                                        className="text-muted-foreground hover:text-primary transition-colors shrink-0 -mt-0.5"
                                    >
                                        <Bookmark className={`h-4 w-4 ${job.is_saved ? "fill-primary text-primary" : ""}`} />
                                    </button>
                                }
                            />
                        ))}
                    </div>

                    <div className="mt-6 flex flex-col items-center gap-4">
                        <p className="text-muted-foreground text-sm">
                            Showing {jobs.length} of {total} available position{total !== 1 ? "s" : ""}
                        </p>
                        {total > limit && (
                            <div className="flex justify-center gap-2">
                                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                                <span className="flex items-center text-sm text-muted-foreground">Page {page} of {Math.ceil(total / limit)}</span>
                                <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>Next</Button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
