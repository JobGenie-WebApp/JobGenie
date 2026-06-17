import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// GET /api/employer/payments/[id] — single payment with all proofs
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();

        const { data: employer } = await admin
            .from("employers")
            .select("id, company_id")
            .eq("user_id", user.id)
            .single();

        if (!employer) return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });

        const { id } = await params;

        const { data, error } = await admin
            .from("payment_requests")
            .select(`
                *,
                payment_types(id, code, label),
                payment_proofs(
                    id, status, file_url, file_path, file_name, file_type,
                    uploaded_at, reviewed_at, review_notes
                )
            `)
            .eq("id", id)
            .eq("company_id", employer.company_id)
            .single();

        if (error || !data) return NextResponse.json({ error: "Payment request not found" }, { status: 404 });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        await logError({ source: "api/employer/payments/[id]:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
