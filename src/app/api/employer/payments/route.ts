import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// GET /api/employer/payments — list payment requests for the employer's company
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();

        const { data: employer, error: empErr } = await admin
            .from("employers")
            .select("id, company_id")
            .eq("user_id", user.id)
            .single();

        if (empErr || !employer) return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });

        const url = new URL(request.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
        const offset = (page - 1) * limit;
        const statusFilter = url.searchParams.get("status") || "";
        const typeFilter = url.searchParams.get("type") || "";
        const dateFrom = url.searchParams.get("dateFrom") || "";
        const dateTo = url.searchParams.get("dateTo") || "";

        let query = admin
            .from("payment_requests")
            .select(`
                id, company_id, employer_id, payment_type_id, amount, currency,
                description, due_date, status, bank_transfer_reference,
                created_at, updated_at,
                payment_types(id, code, label),
                payment_proofs(
                    id, status, file_url, file_name, uploaded_at, reviewed_at, review_notes
                )
            `, { count: "exact" })
            .eq("company_id", employer.company_id);

        if (statusFilter) {
            const statuses = statusFilter.split(",").map(s => s.trim()).filter(Boolean);
            if (statuses.length === 1) query = query.eq("status", statuses[0]);
            else if (statuses.length > 1) query = query.in("status", statuses);
        }
        if (dateFrom) query = query.gte("created_at", dateFrom);
        if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59Z");

        if (typeFilter) {
            const { data: pt } = await admin.from("payment_types").select("id").eq("code", typeFilter).single();
            if (pt) query = query.eq("payment_type_id", pt.id);
        }

        const { data, error, count } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // Summary stats
        const { data: allRows } = await admin
            .from("payment_requests")
            .select("amount, status, due_date")
            .eq("company_id", employer.company_id);

        const now = new Date().toISOString().slice(0, 10);
        let totalPaid = 0;
        let pendingAmount = 0;
        let overdueAmount = 0;

        for (const r of allRows ?? []) {
            const amt = Number(r.amount);
            if (r.status === "verified") totalPaid += amt;
            else if (r.status === "pending_payment" || r.status === "rejected") {
                pendingAmount += amt;
                if (r.due_date && (r.due_date as string) < now) overdueAmount += amt;
            }
        }

        return NextResponse.json({
            success: true,
            data: data ?? [],
            pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) },
            summary: { total_paid: totalPaid, pending_amount: pendingAmount, overdue_amount: overdueAmount, currency: "LKR" },
        });
    } catch (error) {
        await logError({ source: "api/employer/payments:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
