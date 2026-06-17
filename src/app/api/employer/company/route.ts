import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";

export async function GET() {
    try {
        const supabase = await createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Get the employer's company data including approval status
        const { data: employer, error: employerError } = await supabase
            .from("employers")
            .select(`
                id,
                companies (
                    id,
                    company_name,
                    approval_status,
                    profile_completed
                )
            `)
            .eq("user_id", user.id)
            .single();

        if (employerError || !employer) {
            return NextResponse.json(
                { success: false, error: "Company not found" },
                { status: 404 }
            );
        }

        // Type assertion for nested company data
        const company = (employer as Record<string, unknown>)?.companies;

        return NextResponse.json({
            success: true,
            data: company,
        });
    } catch (error) {
        console.error("Error fetching company:", error);
        await logError({ source: "api/employer/company:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
