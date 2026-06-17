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

        const adminClient = createAdminClient();
        const { data: misUser, error: misUserError } = await adminClient
            .from("mis_user")
            .select("user_id")
            .eq("user_id", user.id)
            .single();

        if (misUserError || !misUser) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const resolved = searchParams.get("resolved");
        const errorType = searchParams.get("errorType");
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");

        let query = adminClient
            .from("error_logs")
            .select("*", { count: "exact" })
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (resolved !== null) query = query.eq("resolved", resolved === "true");
        if (errorType) query = query.eq("error_type", errorType);
        if (dateFrom) query = query.gte("created_at", dateFrom);
        if (dateTo) query = query.lte("created_at", dateTo);

        const { data: errors, error: errorsError, count } = await query;

        if (errorsError) {
            console.error("Error fetching errors:", errorsError);
            return NextResponse.json({ error: "Failed to fetch errors" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            errors: errors || [],
            total: count || 0,
            limit,
            offset,
        });
    } catch (error) {
        console.error("Error in GET /api/mis/audit/errors:", error);
        return NextResponse.json({ error: "Failed to fetch errors" }, { status: 500 });
    }
}
