"use client";

import { useCallback, useState } from "react";
import { InterviewStatsCards } from "./InterviewStatsCards";
import { InterviewTable } from "./InterviewTable";
import { InterviewDetailView } from "./InterviewDetailView";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface InterviewsClientProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialInterviews: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialStats: any;
    error: string | null;
    initialSelectedInterviewId?: string | null;
}

export function InterviewsClient({ initialInterviews, initialStats, error, initialSelectedInterviewId = null }: InterviewsClientProps) {
    const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(initialSelectedInterviewId);
    const [interviews, setInterviews] = useState(initialInterviews);
    const [stats, setStats] = useState(initialStats);
    const [refreshToken, setRefreshToken] = useState(0);

    const refreshInterviews = useCallback(async () => {
        try {
            const [interviewsResponse, statsResponse] = await Promise.all([
                fetch('/api/mis/interviews', { cache: 'no-store' }),
                fetch('/api/mis/interviews/stats', { cache: 'no-store' }),
            ]);
            const [interviewsData, statsData] = await Promise.all([
                interviewsResponse.json(),
                statsResponse.json(),
            ]);
            if (interviewsData.success) setInterviews(interviewsData.interviews);
            if (statsData.success) setStats(statsData.stats);
            setRefreshToken((token) => token + 1);
        } catch (error) {
            console.error('Error refreshing interviews:', error);
        }
    }, []);

    const handleViewDetails = (id: string) => {
        setSelectedInterviewId(id);
    };

    const handleCloseDetails = () => {
        setSelectedInterviewId(null);
    };

    return (
        <div className="space-y-6">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {stats && (
                <>
                    {/* Statistics Cards */}
                    <InterviewStatsCards stats={stats} />

                    {/* Interviews Table */}
                    <InterviewTable
                        interviews={interviews}
                        onViewDetails={handleViewDetails}
                    />

                    {/* Interview Detail View Dialog */}
                    <InterviewDetailView
                        interviewId={selectedInterviewId}
                        onClose={handleCloseDetails}
                        onInterviewUpdate={refreshInterviews}
                        refreshToken={refreshToken}
                    />
                </>
            )}
        </div>
    );
}
