import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

// GET - Fetch all roles
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

        // Verify user is MIS user with roles.view permission
        const adminClient = createAdminClient();
        const { data: misUser, error: misUserError } = await adminClient
            .from("mis_user")
            .select("is_super_admin, role_id")
            .eq("user_id", user.id)
            .single();

        if (misUserError || !misUser) {
            return NextResponse.json(
                { error: "Forbidden - MIS access required" },
                { status: 403 }
            );
        }

        // Check permission
        const hasPermission = await checkPermission(adminClient, misUser, "roles", "view");
        if (!hasPermission && !misUser.is_super_admin) {
            return NextResponse.json(
                { error: "Forbidden - You don't have permission to view roles" },
                { status: 403 }
            );
        }

        // Fetch all roles with permission count
        const { data: roles, error: fetchError } = await adminClient
            .from("mis_roles")
            .select(`
                *,
                role_permissions:mis_role_permissions(count)
            `)
            .order("created_at", { ascending: false });

        if (fetchError) {
            console.error("Error fetching roles:", fetchError);
            return NextResponse.json(
                { error: "Failed to fetch roles" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            roles: roles || [],
        });
    } catch (error) {
        console.error("Error in GET /api/mis/roles:", error);
        await logError({
            source: "api/mis/roles:GET",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json(
            { error: "Failed to fetch roles" },
            { status: 500 }
        );
    }
}

// POST - Create a new role
export async function POST(request: NextRequest) {
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

        // Verify user is MIS user with roles.create permission
        const adminClient = createAdminClient();
        const { data: misUser, error: misUserError } = await adminClient
            .from("mis_user")
            .select("is_super_admin, role_id")
            .eq("user_id", user.id)
            .single();

        if (misUserError || !misUser) {
            return NextResponse.json(
                { error: "Forbidden - MIS access required" },
                { status: 403 }
            );
        }

        // Check permission
        const hasPermission = await checkPermission(adminClient, misUser, "roles", "create");
        if (!hasPermission && !misUser.is_super_admin) {
            return NextResponse.json(
                { error: "Forbidden - You don't have permission to create roles" },
                { status: 403 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { name, description } = body;

        // Validate input
        if (!name || typeof name !== "string" || name.trim().length < 2) {
            return NextResponse.json(
                { error: "Role name is required and must be at least 2 characters" },
                { status: 400 }
            );
        }

        // Check if role name already exists
        const { data: existing } = await adminClient
            .from("mis_roles")
            .select("id")
            .eq("name", name.trim())
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { error: "A role with this name already exists" },
                { status: 400 }
            );
        }

        // Create role (Supabase bypasses Prisma @updatedAt; DB requires updated_at)
        const now = new Date().toISOString();
        const { data: newRole, error: createError } = await adminClient
            .from("mis_roles")
            .insert({
                name: name.trim(),
                description: description?.trim() || null,
                is_active: true,
                created_by: user.id,
                created_at: now,
                updated_at: now,
            })
            .select()
            .single();

        if (createError) {
            console.error("Error creating role:", createError);
            return NextResponse.json(
                { error: "Failed to create role" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            role: newRole,
        });
    } catch (error) {
        console.error("Error in POST /api/mis/roles:", error);
        await logError({
            source: "api/mis/roles:POST",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json(
            { error: "Failed to create role" },
            { status: 500 }
        );
    }
}

// Helper function to check if user has a specific permission
async function checkPermission(
    adminClient: ReturnType<typeof createAdminClient>,
    misUser: { is_super_admin: boolean; role_id: string | null },
    resource: string,
    action: string
): Promise<boolean> {
    // Super admins have all permissions
    if (misUser.is_super_admin) {
        return true;
    }

    // No role assigned
    if (!misUser.role_id) {
        return false;
    }

    // Check if role has the permission
    const { data: permission } = await adminClient
        .from("mis_role_permissions")
        .select(`
            permission:mis_permissions!inner(resource, action)
        `)
        .eq("role_id", misUser.role_id)
        .eq("permission.resource", resource)
        .eq("permission.action", action)
        .maybeSingle();

    return !!permission;
}
