import { useState, useEffect } from "react";

export interface Industry {
    industry_id: number;
    industry_name: string;
}

interface UseIndustriesReturn {
    industries: Industry[];
    loading: boolean;
    error: string | null;
}

export function useIndustries(): UseIndustriesReturn {
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchIndustries() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch("/api/industries");
                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.error || "Failed to fetch industries");
                }

                setIndustries(result.data);
            } catch (err) {
                console.error("Error fetching industries:", err);
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        }

        fetchIndustries();
    }, []);

    return { industries, loading, error };
}
