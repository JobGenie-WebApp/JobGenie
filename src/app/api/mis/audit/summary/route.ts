import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuditSummary } from "@/lib/audit-queries";
import { logError } from "@/lib/logger";

/**
 * DB-backed summary for the audit UI: totals, category breakdown, distinct user roles, top actions.
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const admin = createAdminClient();
        const { data: misUser, error: misUserError } = await admin
            .from("mis_user")
            .select("user_id")
            .eq("user_id", user.id)
            .single();

        if (misUserError || !misUser) {
            return NextResponse.json(
                { error: "Forbidden - MIS access required" },
                { status: 403 }
            );
        }

        const summary = await getAuditSummary();
        return NextResponse.json({ success: true, summary });
    } catch (error) {
        console.error("Error in GET /api/mis/audit/summary:", error);
        await logError({
            source: "api/mis/audit/summary:GET",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json(
            { error: "Failed to load audit summary" },
            { status: 500 }
        );
    }
}
