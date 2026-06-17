import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify MIS user
        const adminClient = createAdminClient();
        const { data: misUser, error: misUserError } = await adminClient
            .from("mis_user")
            .select("user_id")
            .eq("user_id", user.id)
            .single();

        if (misUserError || !misUser) {
            return NextResponse.json({ error: "Forbidden - MIS access required" }, { status: 403 });
        }

        // Get query params
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const action = searchParams.get("action");
        const userRole = searchParams.get("userRole");
        const emptyUserRole = searchParams.get("emptyUserRole");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        // Build query
        let query = adminClient
            .from("event_logs")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (category) {
            query = query.eq("category", category);
        }
        if (action) {
            query = query.ilike("action", `%${action}%`);
        }
        if (emptyUserRole === "1") {
            query = query.is("user_role", null);
        } else if (userRole) {
            query = query.eq("user_role", userRole);
        }
        if (dateFrom) {
            query = query.gte("created_at", dateFrom);
        }
        if (dateTo) {
            query = query.lte("created_at", dateTo);
        }

        const { data: logs, error: logsError, count } = await query;

        if (logsError) {
            console.error("Error fetching logs:", logsError);
            return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            logs: logs || [],
            total: count || 0,
            limit,
            offset,
        });
    } catch (error) {
        console.error("Error in GET /api/mis/audit/logs:", error);
        await logError({
            source: "api/mis/audit/logs:GET",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }
}
