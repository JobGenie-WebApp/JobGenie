import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export async function GET() {
    try {
        const supabase = await createClient();

        // Fetch all industries from the database
        const { data: industries, error } = await supabase
            .from("industries")
            .select("industry_id, industry_name")
            .order("industry_name", { ascending: true });

        if (error) {
            console.error("Error fetching industries:", error);
            return NextResponse.json(
                { success: false, error: "Failed to fetch industries" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: industries || []
        });
    } catch (error) {
        console.error("API error:", error);
        await logError({ source: "api/industries:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
