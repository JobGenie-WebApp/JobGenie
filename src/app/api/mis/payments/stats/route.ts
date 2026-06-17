import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// GET /api/mis/payments/stats — payment KPI aggregates
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const url = new URL(request.url);
        const dateFrom = url.searchParams.get("dateFrom") || "";
        const dateTo = url.searchParams.get("dateTo") || "";
        const companyId = url.searchParams.get("companyId") || "";

        let query = admin
            .from("payment_requests")
            .select("id, amount, currency, status, payment_type_id, created_at, payment_types(code, label)");

        if (dateFrom) query = query.gte("created_at", dateFrom);
        if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59Z");
        if (companyId) query = query.eq("company_id", companyId);

        const { data: rows, error } = await query;
        if (error) throw error;

        const now = new Date();

        let totalRevenue = 0;
        let pendingCount = 0;
        let pendingAmount = 0;
        let underReviewCount = 0;
        let rejectedCount = 0;
        let overdueCount = 0;

        const byType: Record<string, { label: string; count: number; amount: number }> = {};

        // Revenue over time: group by day
        const revenueByDay: Record<string, number> = {};

        for (const row of rows ?? []) {
            const pt = row.payment_types as { code?: string; label?: string } | null;
            const code = pt?.code ?? "unknown";
            const label = pt?.label ?? code;
            const amount = Number(row.amount);

            if (!byType[code]) byType[code] = { label, count: 0, amount: 0 };
            byType[code].count++;
            byType[code].amount += amount;

            if (row.status === "verified") {
                totalRevenue += amount;
                const day = (row.created_at as string).slice(0, 10);
                revenueByDay[day] = (revenueByDay[day] ?? 0) + amount;
            } else if (row.status === "pending_payment") {
                pendingCount++;
                pendingAmount += amount;
            } else if (row.status === "under_review") {
                underReviewCount++;
            } else if (row.status === "rejected") {
                rejectedCount++;
            }
        }

        // Overdue: pending_payment past due_date
        const { data: overdueRows } = await admin
            .from("payment_requests")
            .select("id")
            .eq("status", "pending_payment")
            .lt("due_date", now.toISOString().slice(0, 10));
        overdueCount = overdueRows?.length ?? 0;

        const revenueOverTime = Object.entries(revenueByDay)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, amount]) => ({ date, amount }));

        return NextResponse.json({
            success: true,
            data: {
                total_revenue: totalRevenue,
                currency: "LKR",
                pending_count: pendingCount,
                pending_amount: pendingAmount,
                under_review_count: underReviewCount,
                rejected_count: rejectedCount,
                overdue_count: overdueCount,
                by_type: Object.values(byType),
                revenue_over_time: revenueOverTime,
            },
        });
    } catch (error) {
        await logError({ source: "api/mis/payments/stats:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
