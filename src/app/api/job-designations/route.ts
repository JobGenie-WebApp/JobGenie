import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { resolveIndustryIdsForProfile } from "@/lib/job-designations-resolve";

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
                return NextResponse.json(
                    { success: false, error: "Failed to resolve industry for job designations" },
                    { status: 500 }
                );
            }

            filterIds = resolveIndustryIdsForProfile(profileIndustry, industriesRows ?? []);
            if (filterIds.length === 0) {
                return NextResponse.json({ success: true, data: [] });
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
            return NextResponse.json(
                { success: false, error: "Failed to fetch job designations" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: jobDesignations || []
        });
    } catch (error) {
        console.error("API error:", error);
        await logError({ source: "api/job-designations:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
