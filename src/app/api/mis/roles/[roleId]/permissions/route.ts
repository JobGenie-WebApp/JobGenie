import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

// POST - Assign permissions to a role
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ roleId: string }> }
) {
    try {
        const { roleId } = await params;

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

        // Verify user is MIS super admin
        const adminClient = createAdminClient();
        const { data: misUser, error: misUserError } = await adminClient
            .from("mis_user")
            .select("is_super_admin")
            .eq("user_id", user.id)
            .single();

        if (misUserError || !misUser || !misUser.is_super_admin) {
            return NextResponse.json(
                { error: "Forbidden - Only super administrators can manage permissions" },
                { status: 403 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { permission_ids } = body;

        if (!Array.isArray(permission_ids) || permission_ids.length === 0) {
            return NextResponse.json(
                { error: "permission_ids must be a non-empty array" },
                { status: 400 }
            );
        }

        // Verify role exists
        const { data: role, error: roleError } = await adminClient
            .from("mis_roles")
            .select("id")
            .eq("id", roleId)
            .single();

        if (roleError || !role) {
            return NextResponse.json(
                { error: "Role not found" },
                { status: 404 }
            );
        }

        // Get existing permissions for this role
        const { data: existingPermissions } = await adminClient
            .from("mis_role_permissions")
            .select("permission_id")
            .eq("role_id", roleId);

        const existingPermissionIds = new Set(
            (existingPermissions || []).map((p) => p.permission_id)
        );

        // Filter out permissions that are already assigned
        const newPermissionIds = permission_ids.filter(
            (id) => !existingPermissionIds.has(id)
        );

        if (newPermissionIds.length === 0) {
            return NextResponse.json({
                success: true,
                message: "All permissions are already assigned to this role",
                assigned: 0,
            });
        }

        // Verify all permission IDs exist
        const { data: validPermissions, error: permError } = await adminClient
            .from("mis_permissions")
            .select("id")
            .in("id", newPermissionIds);

        if (permError || !validPermissions || validPermissions.length !== newPermissionIds.length) {
            return NextResponse.json(
                { error: "One or more permission IDs are invalid" },
                { status: 400 }
            );
        }

        // Assign permissions
        const permissionsToInsert = newPermissionIds.map((permissionId) => ({
            role_id: roleId,
            permission_id: permissionId,
            assigned_by: user.id,
        }));

        const { error: insertError } = await adminClient
            .from("mis_role_permissions")
            .insert(permissionsToInsert);

        if (insertError) {
            console.error("Error assigning permissions:", insertError);
            return NextResponse.json(
                { error: "Failed to assign permissions" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Successfully assigned ${newPermissionIds.length} permission(s)`,
            assigned: newPermissionIds.length,
        });
    } catch (error) {
        console.error("Error in POST /api/mis/roles/[roleId]/permissions:", error);
        await logError({
            source: "api/mis/roles/[roleId]/permissions:POST",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json(
            { error: "Failed to assign permissions" },
            { status: 500 }
        );
    }
}

// DELETE - Remove permissions from a role
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ roleId: string }> }
) {
    try {
        const { roleId } = await params;

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

        // Verify user is MIS super admin
        const adminClient = createAdminClient();
        const { data: misUser, error: misUserError } = await adminClient
            .from("mis_user")
            .select("is_super_admin")
            .eq("user_id", user.id)
            .single();

        if (misUserError || !misUser || !misUser.is_super_admin) {
            return NextResponse.json(
                { error: "Forbidden - Only super administrators can manage permissions" },
                { status: 403 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { permission_ids } = body;

        if (!Array.isArray(permission_ids) || permission_ids.length === 0) {
            return NextResponse.json(
                { error: "permission_ids must be a non-empty array" },
                { status: 400 }
            );
        }

        // Remove permissions
        const { error: deleteError } = await adminClient
            .from("mis_role_permissions")
            .delete()
            .eq("role_id", roleId)
            .in("permission_id", permission_ids);

        if (deleteError) {
            console.error("Error removing permissions:", deleteError);
            return NextResponse.json(
                { error: "Failed to remove permissions" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Successfully removed ${permission_ids.length} permission(s)`,
            removed: permission_ids.length,
        });
    } catch (error) {
        console.error("Error in DELETE /api/mis/roles/[roleId]/permissions:", error);
        await logError({
            source: "api/mis/roles/[roleId]/permissions:DELETE",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json(
            { error: "Failed to remove permissions" },
            { status: 500 }
        );
    }
}
