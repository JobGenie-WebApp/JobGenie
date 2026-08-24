import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";

const SETTINGS_COLUMNS = "id, hiring_fee_percentage, hiring_fee_due_days, updated_at";

// GET /api/mis/payment-settings — read global payment settings (hiring fee % and terms)
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Self-heal the single settings row if missing.
        let { data } = await admin.from("payment_settings").select(SETTINGS_COLUMNS).eq("id", 1).maybeSingle();
        if (!data) {
            const { data: created } = await admin
                .from("payment_settings")
                .insert({ id: 1, hiring_fee_percentage: 50, hiring_fee_due_days: 14 })
                .select(SETTINGS_COLUMNS)
                .single();
            data = created ?? { id: 1, hiring_fee_percentage: 50, hiring_fee_due_days: 14, updated_at: new Date().toISOString() };
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        await logError({ source: "api/mis/payment-settings:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH /api/mis/payment-settings — update the hiring fee percentage and terms
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

        const dueDays = Number(body.hiring_fee_due_days);
        if (!Number.isInteger(dueDays) || dueDays < 1 || dueDays > 365) {
            return NextResponse.json({ error: "hiring_fee_due_days must be a whole number between 1 and 365" }, { status: 400 });
        }

        const { data, error } = await admin
            .from("payment_settings")
            .upsert({ id: 1, hiring_fee_percentage: pct, hiring_fee_due_days: dueDays, updated_at: new Date().toISOString(), updated_by_user_id: user.id })
            .select(SETTINGS_COLUMNS)
            .single();

        if (error) throw error;

        await logBusiness("payment_settings_updated", user.id, "mis", "payment_settings", "1", { hiring_fee_percentage: pct, hiring_fee_due_days: dueDays });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        await logError({ source: "api/mis/payment-settings:PATCH", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
