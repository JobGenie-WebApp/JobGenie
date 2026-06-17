import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// PATCH /api/mis/bank-details/[id] — update or activate/deactivate
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
        const { bank_name, account_name, account_number, branch, bank_code, swift_code, sort_order, is_active } = body;

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (bank_name !== undefined) updates.bank_name = bank_name;
        if (account_name !== undefined) updates.account_name = account_name;
        if (account_number !== undefined) updates.account_number = account_number;
        if (branch !== undefined) updates.branch = branch;
        if (bank_code !== undefined) updates.bank_code = bank_code;
        if (swift_code !== undefined) updates.swift_code = swift_code;
        if (sort_order !== undefined) updates.sort_order = sort_order;
        if (is_active !== undefined) updates.is_active = is_active;

        const { data, error } = await admin
            .from("payment_bank_details")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return NextResponse.json({ error: "Bank account not found" }, { status: 404 });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        await logError({ source: "api/mis/bank-details/[id]:PATCH", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/mis/bank-details/[id] — hard delete (use PATCH is_active=false to deactivate instead)
export async function DELETE(
    _request: NextRequest,
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
        const { error } = await admin.from("payment_bank_details").delete().eq("id", id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        await logError({ source: "api/mis/bank-details/[id]:DELETE", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
