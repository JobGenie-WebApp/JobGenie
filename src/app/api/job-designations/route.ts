import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { resolveIndustryIdsForProfile } from "@/lib/job-designations-resolve";

// Cache populated reference data at the edge, but never cache an empty result.
// An empty array cached during a window when the lookup tables were unseeded
// previously poisoned the CDN and hid all job titles until the cache expired.
const CACHE_POPULATED = "public, s-maxage=43200, stale-while-revalidate=86400";
const CACHE_NONE = "no-store";

function jsonWithCache(
    body: Record<string, unknown>,
    { status, cacheable }: { status?: number; cacheable: boolean }
) {
    return NextResponse.json(body, {
        status,
        headers: { "Cache-Control": cacheable ? CACHE_POPULATED : CACHE_NONE },
    });
}

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const industryIdParam = searchParams.get("industryId");
        const profileIndustry = searchParams.get("profileIndustry");

        let filterIds: number[] | null = null;

        if (profileIndustry) {
            const { data: industriesRows, error: industriesError } = await supabase
                .from("industries")
                .select("industry_id, industry_name");

            if (industriesError) {
                console.error("Error fetching industries:", industriesError);
                return jsonWithCache(
                    { success: false, error: "Failed to resolve industry for job designations" },
                    { status: 500, cacheable: false }
                );
            }

            filterIds = resolveIndustryIdsForProfile(profileIndustry, industriesRows ?? []);
            if (filterIds.length === 0) {
                return jsonWithCache({ success: true, data: [] }, { cacheable: false });
            }
        } else if (industryIdParam) {
            const id = parseInt(industryIdParam, 10);
            if (!Number.isNaN(id)) {
                filterIds = [id];
            }
        }

        // Build query to fetch job designations with related industry and seniority level
        let query = supabase
            .from("job_designations")
            .select(`
                designation_id,
                designation_name,
                industry_id,
                level_id,
                industries!inner (
                    industry_id,
                    industry_name
                ),
                seniority_levels!inner (
                    level_id,
                    level_name,
                    level_order
                )
            `)
            .order("designation_name", { ascending: true });

        if (filterIds && filterIds.length === 1) {
            query = query.eq("industry_id", filterIds[0]);
        } else if (filterIds && filterIds.length > 1) {
            query = query.in("industry_id", filterIds);
        }

        const { data: jobDesignations, error } = await query;

        if (error) {
            console.error("Error fetching job designations:", error);
            return jsonWithCache(
                { success: false, error: "Failed to fetch job designations" },
                { status: 500, cacheable: false }
            );
        }

        const rows = jobDesignations || [];
        return jsonWithCache({ success: true, data: rows }, { cacheable: rows.length > 0 });
    } catch (error) {
        console.error("API error:", error);
        await logError({ source: "api/job-designations:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return jsonWithCache(
            { success: false, error: "Internal server error" },
            { status: 500, cacheable: false }
        );
    }
}
