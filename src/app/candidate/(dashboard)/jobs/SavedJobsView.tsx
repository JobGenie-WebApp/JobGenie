"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Briefcase, Loader2, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { JobCard, type JobCardData } from "./JobCard";

interface SavedJob extends JobCardData {
    saved_at: string;
    has_applied?: boolean;
}

export function SavedJobsView() {
    const router = useRouter();
    const [jobs, setJobs] = useState<SavedJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const fetchSaved = useCallback(async () => {
        setLoading(true);
        const res = await fetch("/api/candidate/saved-jobs");
        if (res.ok) {
            const d = await res.json();
            setJobs(d.jobs);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchSaved(); }, [fetchSaved]);

    const unsave = async (job: SavedJob) => {
        setRemovingId(job.id);
        const prev = jobs;
        setJobs((list) => list.filter((j) => j.id !== job.id)); // optimistic
        try {
            const res = await fetch(`/api/candidate/jobs/${job.id}/save`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            toast.success("Removed from saved");
        } catch {
            setJobs(prev);
            toast.error("Could not remove saved job");
        } finally {
            setRemovingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bookmark className="text-muted-foreground mb-4 h-12 w-12 opacity-30" />
                <h3 className="mb-2 text-xl font-semibold">No saved jobs yet</h3>
                <p className="text-muted-foreground mb-6">Bookmark jobs while browsing to find them here later.</p>
                <Button onClick={() => router.push("/candidate/jobs")}>
                    <Briefcase className="mr-2 h-4 w-4" />Browse Jobs
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <p className="text-muted-foreground text-sm">{jobs.length} saved job{jobs.length !== 1 ? "s" : ""}</p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {jobs.map((job) => (
                    <JobCard
                        key={job.id}
                        job={job}
                        applied={job.has_applied}
                        rightSlot={
                            <button
                                type="button"
                                onClick={() => unsave(job)}
                                disabled={removingId === job.id}
                                aria-label="Remove from saved"
                                title="Remove from saved"
                                className="text-primary hover:text-muted-foreground transition-colors shrink-0 -mt-0.5"
                            >
                                <Bookmark className="h-4 w-4 fill-primary" />
                            </button>
                        }
                    />
                ))}
            </div>
        </div>
    );
}
