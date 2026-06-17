import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// GET /api/mis/payment-pricing — list all pricing rows with payment type info
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { data, error } = await admin
            .from("payment_pricing")
            .select(`
                id, amount, currency, description, is_active, effective_from, created_at,
                payment_types(id, code, label)
            `)
            .order("effective_from", { ascending: false });

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error) {
        await logError({ source: "api/mis/payment-pricing:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/mis/payment-pricing — set or update pricing for a payment type
// Creates a new pricing row and deactivates prior rows for the same type.
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await request.json();
        const { payment_type_id, amount, currency, description } = body;

        if (!payment_type_id || amount === undefined) {
            return NextResponse.json({ error: "payment_type_id and amount are required" }, { status: 400 });
        }
        if (Number(amount) < 0) {
            return NextResponse.json({ error: "amount must be non-negative" }, { status: 400 });
        }

        // Deactivate all prior active pricing for this type
        await admin
            .from("payment_pricing")
            .update({ is_active: false })
            .eq("payment_type_id", payment_type_id)
            .eq("is_active", true);

        const { data, error } = await admin
            .from("payment_pricing")
            .insert({
                payment_type_id,
                amount: Number(amount),
                currency: currency ?? "LKR",
                description: description ?? null,
                is_active: true,
                effective_from: new Date().toISOString(),
            })
            .select(`
                id, amount, currency, description, is_active, effective_from, created_at,
                payment_types(id, code, label)
            `)
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        await logError({ source: "api/mis/payment-pricing:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
