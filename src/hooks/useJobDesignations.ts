import { useState, useEffect, useCallback } from "react";

export interface JobDesignation {
    designation_id: number;
    designation_name: string;
    industry_id: number;
    level_id: number;
    industries: {
        industry_id: number;
        industry_name: string;
    };
    seniority_levels: {
        level_id: number;
        level_name: string;
        level_order: number;
    };
}

interface UseJobDesignationsReturn {
    jobDesignations: JobDesignation[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

/** One row per title (same name can exist for multiple seniority rows in DB). */
export function uniqueDesignationsByName(designations: JobDesignation[]): JobDesignation[] {
    const byName = new Map<string, JobDesignation>();
    for (const d of designations) {
        if (!byName.has(d.designation_name)) byName.set(d.designation_name, d);
    }
    return Array.from(byName.values()).sort((a, b) =>
        a.designation_name.localeCompare(b.designation_name)
    );
}

/**
 * @param profileIndustry - Candidate profile industry key: it_software | banking | finance_investment
 */
export function useJobDesignations(profileIndustry?: string | null): UseJobDesignationsReturn {
    const [jobDesignations, setJobDesignations] = useState<JobDesignation[]>([]);
    const [loading, setLoading] = useState(() => profileIndustry != null && profileIndustry !== "");
    const [error, setError] = useState<string | null>(null);

    const fetchJobDesignations = useCallback(async () => {
        if (profileIndustry == null || profileIndustry === "") {
            setJobDesignations([]);
            setLoading(false);
            setError(null);
            return;
        }
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `/api/job-designations?profileIndustry=${encodeURIComponent(profileIndustry)}`
            );
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Failed to fetch job designations");
            }

            setJobDesignations(result.data);
        } catch (err) {
            console.error("Error fetching job designations:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [profileIndustry]);

    useEffect(() => {
        if (profileIndustry == null || profileIndustry === "") {
            setJobDesignations([]);
            setLoading(false);
            setError(null);
            return;
        }
        fetchJobDesignations();
    }, [profileIndustry, fetchJobDesignations]);

    return { jobDesignations, loading, error, refetch: fetchJobDesignations };
}
