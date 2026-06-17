"use client";

import { useEffect } from "react";
import { useSWRConfig } from "swr";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to Postgres changes on job_invitations for this candidate.
 * Invalidates SWR cache for invitation list and detail API routes so they
 * refetch when invitation data changes. Badge counts are handled separately
 * by useUnopenedInvitationCount / usePendingInvitationCount via their own
 * realtime subscriptions and do not depend on this bridge.
 */
export function CandidateInvitationRealtimeBridge() {
    const { mutate } = useSWRConfig();

    useEffect(() => {
        const supabase = createClient();
        let channel: ReturnType<typeof supabase.channel> | null = null;
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch("/api/candidate/profile");
                const json = await res.json();
                const candidateId = json?.success ? json.data?.id : null;
                if (!candidateId || cancelled) return;

                channel = supabase
                    .channel(`realtime-invitations-candidate-${candidateId}`)
                    .on(
                        "postgres_changes",
                        {
                            event: "*",
                            schema: "public",
                            table: "job_invitations",
                            filter: `candidate_id=eq.${candidateId}`,
                        },
                        () => {
                            mutate(
                                (key) =>
                                    typeof key === "string" &&
                                    key.startsWith("/api/candidate/")
                            );
                        }
                    )
                    .subscribe();
            } catch {
                /* ignore — polling fallback still applies */
            }
        })();

        return () => {
            cancelled = true;
            if (channel) supabase.removeChannel(channel);
        };
    }, [mutate]);

    return null;
}

/**
 * Same pattern for employers: watch invitations for this company.
 * Badge counts (pending-count, payment pending-count) have their own
 * subscriptions and are not invalidated here.
 */
export function EmployerInvitationRealtimeBridge() {
    const { mutate } = useSWRConfig();

    useEffect(() => {
        const supabase = createClient();
        let channel: ReturnType<typeof supabase.channel> | null = null;
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch("/api/employer/company");
                const json = await res.json();
                const companyId = json?.success ? json.data?.id : null;
                if (!companyId || cancelled) return;

                channel = supabase
                    .channel(`realtime-invitations-company-${companyId}`)
                    .on(
                        "postgres_changes",
                        {
                            event: "*",
                            schema: "public",
                            table: "job_invitations",
                            filter: `company_id=eq.${companyId}`,
                        },
                        () => {
                            mutate(
                                (key) =>
                                    typeof key === "string" &&
                                    key.startsWith("/api/employer/")
                            );
                        }
                    )
                    .subscribe();
            } catch {
                /* ignore */
            }
        })();

        return () => {
            cancelled = true;
            if (channel) supabase.removeChannel(channel);
        };
    }, [mutate]);

    return null;
}
