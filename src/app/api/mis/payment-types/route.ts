import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// GET /api/mis/payment-types — list all payment types
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { data, error } = await admin
            .from("payment_types")
            .select("*")
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true });

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error) {
        await logError({ source: "api/mis/payment-types:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/mis/payment-types — create a new payment type
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await request.json();
        const { code, label, description, sort_order } = body;

        if (!code || !label) {
            return NextResponse.json({ error: "code and label are required" }, { status: 400 });
        }

        const { data, error } = await admin
            .from("payment_types")
            .insert({ code: code.trim(), label: label.trim(), description: description ?? null, sort_order: sort_order ?? 0 })
            .select()
            .single();

        if (error) {
            if (error.code === "23505") return NextResponse.json({ error: "A payment type with this code already exists" }, { status: 409 });
            throw error;
        }
        return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (error) {
        await logError({ source: "api/mis/payment-types:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
