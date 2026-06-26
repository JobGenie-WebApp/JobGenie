import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";

// GET /api/mis/payment-settings — read global payment settings (hiring fee %)
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Self-heal the single settings row if missing.
        let { data } = await admin.from("payment_settings").select("id, hiring_fee_percentage, updated_at").eq("id", 1).maybeSingle();
        if (!data) {
            const { data: created } = await admin
                .from("payment_settings")
                .insert({ id: 1, hiring_fee_percentage: 50 })
                .select("id, hiring_fee_percentage, updated_at")
                .single();
            data = created ?? { id: 1, hiring_fee_percentage: 50, updated_at: new Date().toISOString() };
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        await logError({ source: "api/mis/payment-settings:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/mis/payment-settings — update the hiring fee percentage
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await request.json().catch(() => ({}));
        const pct = Number(body.hiring_fee_percentage);
        if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
            return NextResponse.json({ error: "hiring_fee_percentage must be between 0 and 100" }, { status: 400 });
        }

        const { data, error } = await admin
            .from("payment_settings")
            .upsert({ id: 1, hiring_fee_percentage: pct, updated_at: new Date().toISOString(), updated_by_user_id: user.id })
            .select("id, hiring_fee_percentage, updated_at")
            .single();

        if (error) throw error;

        await logBusiness("payment_settings_updated", user.id, "mis", "payment_settings", "1", { hiring_fee_percentage: pct });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        await logError({ source: "api/mis/payment-settings:PATCH", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
