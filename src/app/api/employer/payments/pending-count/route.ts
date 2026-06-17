import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// GET /api/employer/payments/pending-count
// Returns count of payment requests that need employer action (pending_payment or rejected)
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();

        const { data: employer } = await admin
            .from("employers")
            .select("company_id")
            .eq("user_id", user.id)
            .single();

        if (!employer) return NextResponse.json({ count: 0 });

        const { count, error } = await admin
            .from("payment_requests")
            .select("id", { count: "exact", head: true })
            .eq("company_id", employer.company_id)
            .in("status", ["pending_payment", "rejected"]);

        if (error) throw error;

        return NextResponse.json({ count: count ?? 0 });
    } catch (error) {
        await logError({ source: "api/employer/payments/pending-count:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ count: 0 });
    }
}
