import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { hasPermission } from "@/lib/permissions";

// GET /api/mis/employers — lightweight employer list for filter dropdown
export async function GET(_request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const canView = await hasPermission("jobs", "view");
        if (!canView) return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

        const { data, error } = await admin
            .from("employers")
            .select("id, first_name, last_name, companies!employers_company_id_fkey(company_name)")
            .order("first_name", { ascending: true });

        if (error) throw error;

        const employers = (data ?? []).map((e: {
            id: string;
            first_name: string;
            last_name: string;
            companies: { company_name: string } | { company_name: string }[] | null;
        }) => {
            const co = Array.isArray(e.companies) ? e.companies[0] : e.companies;
            return {
                id: e.id,
                first_name: e.first_name,
                last_name: e.last_name,
                company_name: co?.company_name ?? "",
            };
        });

        return NextResponse.json({ employers });
    } catch (error) {
        await logError({ source: "api/mis/employers:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
