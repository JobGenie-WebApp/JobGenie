import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// GET /api/mis/bank-details — list all bank accounts
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { data, error } = await admin
            .from("payment_bank_details")
            .select("*")
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true });

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error) {
        await logError({ source: "api/mis/bank-details:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/mis/bank-details — add a bank account
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await request.json();
        const { bank_name, account_name, account_number, branch, bank_code, swift_code, sort_order } = body;

        if (!bank_name || !account_name || !account_number) {
            return NextResponse.json({ error: "bank_name, account_name, and account_number are required" }, { status: 400 });
        }

        const { data, error } = await admin
            .from("payment_bank_details")
            .insert({
                bank_name: bank_name.trim(),
                account_name: account_name.trim(),
                account_number: account_number.trim(),
                branch: branch?.trim() ?? null,
                bank_code: bank_code?.trim() ?? null,
                swift_code: swift_code?.trim() ?? null,
                sort_order: sort_order ?? 0,
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        await logError({ source: "api/mis/bank-details:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
