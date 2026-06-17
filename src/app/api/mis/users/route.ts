import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized - Please log in" },
                { status: 401 }
            );
        }

        // Verify user is MIS user
        const adminClient = createAdminClient();
        const { data: userRecord, error: userError } = await adminClient
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        if (userError || !userRecord || userRecord.role !== "mis") {
            return NextResponse.json(
                { error: "Forbidden - MIS access required" },
                { status: 403 }
            );
        }

        // Get pagination parameters with defaults
        const url = new URL(request.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
        const offset = (page - 1) * limit;

        // Fetch total count and paginated results in parallel for efficiency
        const [{ count: totalCount }, { data: misUsers, error: fetchError }] = await Promise.all([
            adminClient
                .from("mis_user")
                .select("user_id", { count: 'exact', head: true }),
            adminClient
                .from("mis_user")
                .select("user_id, first_name, last_name, email, created_at")
                .order("created_at", { ascending: false })
                .range(offset, offset + limit - 1),
        ]);

        if (fetchError) {
            console.error("Error fetching MIS users:", fetchError);
            return NextResponse.json(
                { error: "Failed to fetch MIS users" },
                { status: 500 }
            );
        }

        const response = NextResponse.json({
            success: true,
            users: misUsers || [],
            pagination: {
                page,
                limit,
                offset,
                total: totalCount || 0,
                pages: Math.ceil((totalCount || 0) / limit),
            },
        });

        // Add Cache-Control header for authenticated endpoints (short TTL for user-specific data)
        response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120');

        return response;
    } catch (error) {
        console.error("Error fetching MIS users:", error);
        await logError({ source: "api/mis/users:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { error: "Failed to fetch MIS users" },
            { status: 500 }
        );
    }
}
