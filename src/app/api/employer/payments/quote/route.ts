import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { ensureCorePaymentTypes } from "@/lib/payments";

const ALLOWED_TYPES = ["JOB_AD_PUBLISH", "JOB_AD_EXTEND"];

// GET /api/employer/payments/quote?type=JOB_AD_PUBLISH|JOB_AD_EXTEND
// Returns the current active price for a payment type so the publish/extend modal
// can show the amount before a payment request is created.
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "employer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const type = request.nextUrl.searchParams.get("type") ?? "";
        if (!ALLOWED_TYPES.includes(type)) {
            return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
        }

        // Self-heal core payment types if a fresh database is missing them.
        await ensureCorePaymentTypes();

        // Determine whether MIS has configured an active price for this type.
        const { data: pricingRow } = await admin
            .from("payment_pricing")
            .select("amount, currency, payment_types!inner(code)")
            .eq("payment_types.code", type)
            .eq("is_active", true)
            .order("effective_from", { ascending: false })
            .limit(1)
            .maybeSingle();

        const configured = !!pricingRow;
        const amount = pricingRow ? Number(pricingRow.amount) : 0;
        const currency = (pricingRow?.currency as string) ?? "LKR";
        return NextResponse.json({ success: true, data: { amount, currency, type, configured } });
    } catch (error) {
        await logError({ source: "api/employer/payments/quote:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
