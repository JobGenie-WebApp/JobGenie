"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Filter = { column: string; value: string };

interface CountQuery {
    table: string;
    /** Equality filters applied to the count query, e.g. [{ column: 'candidate_id', value: '...' }] */
    filters: Filter[];
    /** Optional IS NULL checks, e.g. ['viewed_at'] */
    isNullColumns?: string[];
    /** Optional equality checks for string columns, e.g. [{ column: 'invitation_canceled', value: 'false' }] — use for booleans cast as text */
    eqFilters?: Filter[];
    /** Optional .in() filter, e.g. { column: 'status', values: ['pending_payment', 'rejected'] } */
    inFilter?: { column: string; values: string[] };
}

interface UseRealtimeCountReturn {
    count: number;
    isLoading: boolean;
}

/**
 * Fetches a row count from Supabase directly (no HTTP API call after mount)
 * and keeps it live via a Postgres Changes subscription on the same table.
 * One WebSocket connection shared across all realtime subscriptions on the page.
 */
export function useRealtimeCount(
    query: CountQuery,
    /** Realtime filter string, e.g. 'candidate_id=eq.{id}'. Leave empty to watch all rows. */
    realtimeFilter?: string
): UseRealtimeCountReturn {
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    const fetchCount = useCallback(async () => {
        let q = supabase
            .from(query.table)
            .select("*", { count: "exact", head: true });

        for (const f of query.filters) {
            q = q.eq(f.column, f.value);
        }
        for (const col of query.isNullColumns ?? []) {
            q = q.is(col, null);
        }
        for (const f of query.eqFilters ?? []) {
            q = q.eq(f.column, f.value);
        }
        if (query.inFilter) {
            q = q.in(query.inFilter.column, query.inFilter.values);
        }

        const { count: result, error } = await q;
        if (!error) setCount(result ?? 0);
        setIsLoading(false);
    }, [supabase, query.table]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        let channel: RealtimeChannel | null = null;
        let cancelled = false;

        fetchCount();

        const channelName = `realtime-count-${query.table}-${realtimeFilter ?? "all"}`;
        channel = supabase
            .channel(channelName)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: query.table,
                    ...(realtimeFilter ? { filter: realtimeFilter } : {}),
                },
                () => {
                    if (!cancelled) fetchCount();
                }
            )
            .subscribe();

        return () => {
            cancelled = true;
            if (channel) supabase.removeChannel(channel);
        };
    }, [realtimeFilter, query.table]); // eslint-disable-line react-hooks/exhaustive-deps

    return { count, isLoading };
}
