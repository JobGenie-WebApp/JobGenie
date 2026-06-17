import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ companyId: string }> }
) {
    try {
        const companyId = (await params).companyId;
        const supabase = await createClient();

        // Verify user is MIS admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        if (userData?.role !== "mis") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Fetch company details
        const { data: company, error } = await supabase
            .from("companies")
            .select("*")
            .eq("id", companyId)
            .single();

        if (error || !company) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        // Fetch super admin details for this company
        const { data: admin } = await supabase
            .from("employers")
            .select("first_name, last_name, email, phone, job_title")
            .eq("company_id", companyId)
            .eq("is_super_admin", true)
            .single();

        return NextResponse.json({ ...company, admin });

    } catch (error) {
        console.error("Error fetching company details:", error);
        await logError({ source: "api/mis/companies/[companyId]:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
