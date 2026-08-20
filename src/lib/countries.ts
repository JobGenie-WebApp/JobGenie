import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * ISO country names from the `countries` reference table (public SELECT policy).
 *
 * Server-only, and deliberately not given the API-route-plus-hook treatment `job_designations`
 * has: that list is parameterised by industry and changes per candidate, this one is 249 static
 * rows. Fetched once per request and handed down as props, so the field has no loading state.
 */
export const getCountryNames = cache(async (): Promise<string[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("countries").select("name").order("name");
    if (error) {
        console.error("Could not load countries:", error);
        return [];
    }
    return (data ?? []).map((c) => c.name);
});
