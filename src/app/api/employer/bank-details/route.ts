import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// GET /api/employer/bank-details — returns active bank accounts for payment display
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "employer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { data, error } = await admin
            .from("payment_bank_details")
            .select("id, bank_name, account_name, account_number, branch, bank_code, swift_code, sort_order")
            .eq("is_active", true)
            .order("sort_order", { ascending: true });

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error) {
        await logError({ source: "api/employer/bank-details:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
