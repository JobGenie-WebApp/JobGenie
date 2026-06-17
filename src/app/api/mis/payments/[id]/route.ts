import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// GET /api/mis/payments/[id] — full payment request details with proofs
export async function GET(
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

        const { data, error } = await admin
            .from("payment_requests")
            .select(`
                *,
                companies(id, company_name, industry, phone, logo_url),
                employers(id, first_name, last_name, email, designation, phone),
                payment_types(id, code, label),
                payment_proofs(
                    id, status, file_url, file_path, file_name, file_type,
                    uploaded_at, reviewed_at, review_notes,
                    uploaded_by:employers!payment_proofs_uploaded_by_employer_id_fkey(
                        id, first_name, last_name, email
                    ),
                    reviewed_by:mis_user!payment_proofs_reviewed_by_mis_user_id_fkey(
                        user_id, first_name, last_name, email
                    )
                )
            `)
            .eq("id", id)
            .single();

        if (error || !data) return NextResponse.json({ error: "Payment request not found" }, { status: 404 });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        await logError({ source: "api/mis/payments/[id]:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
