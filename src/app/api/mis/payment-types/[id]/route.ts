import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// PATCH /api/mis/payment-types/[id] — update label, description, sort_order, or is_active
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { id } = await params;
        const body = await request.json();
        const { label, description, sort_order, is_active } = body;

        const updates: Record<string, unknown> = {};
        if (label !== undefined) updates.label = label;
        if (description !== undefined) updates.description = description;
        if (sort_order !== undefined) updates.sort_order = sort_order;
        if (is_active !== undefined) updates.is_active = is_active;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        const { data, error } = await admin
            .from("payment_types")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return NextResponse.json({ error: "Payment type not found" }, { status: 404 });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        await logError({ source: "api/mis/payment-types/[id]:PATCH", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
