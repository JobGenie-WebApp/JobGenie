import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

// GET - Fetch all permissions
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
        const { data: misUser, error: misUserError } = await adminClient
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

        // Fetch all permissions grouped by resource
        const { data: permissions, error: fetchError } = await adminClient
            .from("mis_permissions")
            .select("*")
            .order("resource, action");

        if (fetchError) {
            console.error("Error fetching permissions:", fetchError);
            return NextResponse.json(
                { error: "Failed to fetch permissions" },
                { status: 500 }
            );
        }

        // Group permissions by resource
        const groupedPermissions = (permissions || []).reduce((acc, permission) => {
            if (!acc[permission.resource]) {
                acc[permission.resource] = [];
            }
            acc[permission.resource].push(permission);
            return acc;
        }, {} as Record<string, typeof permissions>);

        return NextResponse.json({
            success: true,
            permissions: permissions || [],
            groupedPermissions,
        });
    } catch (error) {
        console.error("Error in GET /api/mis/permissions:", error);
        await logError({
            source: "api/mis/permissions:GET",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json(
            { error: "Failed to fetch permissions" },
            { status: 500 }
        );
    }
}
