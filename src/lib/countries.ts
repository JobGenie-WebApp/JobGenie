import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CountryOption = { code: string; name: string; flag_emoji: string; calling_code: string | null };

/**
 * ISO countries from the `countries` reference table (public SELECT policy).
 *
 * Server-only, and deliberately not given the API-route-plus-hook treatment `job_designations`
 * has: that list is parameterised by industry and changes per candidate, this one is 249 static
 * rows. Fetched once per request and handed down as props, so the field has no loading state.
 */
export const getCountries = cache(async (): Promise<CountryOption[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("countries").select("code, name, flag_emoji, calling_code").order("name");
    if (error) {
        console.error("Could not load countries:", error);
        return [];
    }
    return data ?? [];
});

export const getCountryNames = async (): Promise<string[]> =>
    (await getCountries()).map((c) => c.name);
