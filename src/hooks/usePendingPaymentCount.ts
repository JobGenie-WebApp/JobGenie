"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Returns the count of payment requests needing employer action (pending_payment or rejected).
 * Initial count is fetched once via direct Supabase query (no HTTP API).
 * Kept live via a Postgres Changes realtime subscription on payment_requests — zero polling.
 */
export function usePendingPaymentCount() {
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    const fetchCount = useCallback(
        async (companyId: string) => {
            const { count: result } = await supabase
                .from("payment_requests")
                .select("id", { count: "exact", head: true })
                .eq("company_id", companyId)
                .in("status", ["pending_payment", "rejected"]);
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
                .channel(`realtime-count-payments-company-${employer.company_id}`)
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "payment_requests",
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
