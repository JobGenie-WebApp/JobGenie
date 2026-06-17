"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Returns the count of invitations not yet viewed by the candidate.
 * Initial count is fetched once via direct Supabase query (no HTTP API).
 * Kept live via a Postgres Changes realtime subscription — zero polling.
 */
export function useUnopenedInvitationCount() {
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    const fetchCount = useCallback(
        async (candidateId: string) => {
            const { count: result } = await supabase
                .from("job_invitations")
                .select("id", { count: "exact", head: true })
                .eq("candidate_id", candidateId)
                .is("viewed_at", null)
                .eq("invitation_canceled", false);
            setCount(result ?? 0);
            setIsLoading(false);
        },
        [supabase]
    );

    useEffect(() => {
        let channel: RealtimeChannel | null = null;
        let cancelled = false;

        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || cancelled) return;

            const { data: candidate } = await supabase
                .from("candidates")
                .select("id")
                .eq("user_id", user.id)
                .single();

            if (!candidate || cancelled) { setIsLoading(false); return; }

            await fetchCount(candidate.id);

            channel = supabase
                .channel(`realtime-count-invitations-candidate-${candidate.id}`)
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "job_invitations",
                        filter: `candidate_id=eq.${candidate.id}`,
                    },
                    () => { if (!cancelled) fetchCount(candidate.id); }
                )
                .subscribe();
        })();

        return () => {
            cancelled = true;
            if (channel) supabase.removeChannel(channel);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return { count, isLoading };
}

/**
 * Returns the count of invitation updates the employer has not opened yet.
 * Initial count is fetched once via direct Supabase query (no HTTP API).
 * Kept live via a Postgres Changes realtime subscription — zero polling.
 */
export function usePendingInvitationCount() {
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    const fetchCount = useCallback(
        async (companyId: string) => {
            const { count: result } = await supabase
                .from("job_invitations")
                .select("id", { count: "exact", head: true })
                .eq("company_id", companyId)
                .eq("invitation_canceled", false)
                .is("employer_last_seen_at", null);
            setCount(result ?? 0);
            setIsLoading(false);
        },
        [supabase]
    );

    useEffect(() => {
        let channel: RealtimeChannel | null = null;
        let cancelled = false;

        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || cancelled) return;

            const { data: employer } = await supabase
                .from("employers")
                .select("company_id")
                .eq("user_id", user.id)
                .single();

            if (!employer || cancelled) { setIsLoading(false); return; }

            await fetchCount(employer.company_id);

            channel = supabase
                .channel(`realtime-count-invitations-company-${employer.company_id}`)
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "job_invitations",
                        filter: `company_id=eq.${employer.company_id}`,
                    },
                    () => { if (!cancelled) fetchCount(employer.company_id); }
                )
                .subscribe();
        })();

        return () => {
            cancelled = true;
            if (channel) supabase.removeChannel(channel);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return { count, isLoading };
}
