import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export async function GET() {
    try {
        const supabase = await createClient();

        // Fetch all seniority levels from the database, ordered by level_order
        const { data: seniorityLevels, error } = await supabase
            .from("seniority_levels")
            .select("level_id, level_name, level_order")
            .order("level_order", { ascending: true });

        if (error) {
            console.error("Error fetching seniority levels:", error);
            return NextResponse.json(
                { success: false, error: "Failed to fetch seniority levels" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: seniorityLevels || []
        });
    } catch (error) {
        console.error("API error:", error);
        await logError({ source: "api/seniority-levels:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
