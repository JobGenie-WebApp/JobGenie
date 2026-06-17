import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

// GET - Fetch a single role with its permissions
export async function GET(
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

        // Verify user is MIS user
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

        // Fetch role with permissions
        const { data: role, error: fetchError } = await adminClient
            .from("mis_roles")
            .select(`
                *,
                role_permissions:mis_role_permissions(
                    permission:mis_permissions(*)
                )
            `)
            .eq("id", roleId)
            .single();

        if (fetchError) {
            console.error("Error fetching role:", fetchError);
            return NextResponse.json(
                { error: "Role not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            role,
        });
    } catch (error) {
        console.error("Error in GET /api/mis/roles/[roleId]:", error);
        await logError({
            source: "api/mis/roles/[roleId]:GET",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json(
            { error: "Failed to fetch role" },
            { status: 500 }
        );
    }
}

// PATCH - Update a role
export async function PATCH(
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

        // Verify user is MIS super admin or has roles.edit permission
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

        if (!misUser.is_super_admin) {
            return NextResponse.json(
                { error: "Forbidden - Only super administrators can edit roles" },
                { status: 403 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { name, description, is_active } = body;

        const updateData: Record<string, any> = {};
        
        if (name !== undefined) {
            if (typeof name !== "string" || name.trim().length < 2) {
                return NextResponse.json(
                    { error: "Role name must be at least 2 characters" },
                    { status: 400 }
                );
            }

            // Check if another role has this name
            const { data: existing } = await adminClient
                .from("mis_roles")
                .select("id")
                .eq("name", name.trim())
                .neq("id", roleId)
                .maybeSingle();

            if (existing) {
                return NextResponse.json(
                    { error: "A role with this name already exists" },
                    { status: 400 }
                );
            }

            updateData.name = name.trim();
        }

        if (description !== undefined) {
            updateData.description = description?.trim() || null;
        }

        if (is_active !== undefined) {
            updateData.is_active = Boolean(is_active);
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "No changes provided" },
                { status: 400 }
            );
        }

        updateData.updated_at = new Date().toISOString();

        // Update role
        const { data: updatedRole, error: updateError } = await adminClient
            .from("mis_roles")
            .update(updateData)
            .eq("id", roleId)
            .select()
            .single();

        if (updateError) {
            console.error("Error updating role:", updateError);
            return NextResponse.json(
                { error: "Failed to update role" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            role: updatedRole,
        });
    } catch (error) {
        console.error("Error in PATCH /api/mis/roles/[roleId]:", error);
        await logError({
            source: "api/mis/roles/[roleId]:PATCH",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json(
            { error: "Failed to update role" },
            { status: 500 }
        );
    }
}

// DELETE - Delete a role
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
                { error: "Forbidden - Only super administrators can delete roles" },
                { status: 403 }
            );
        }

        // Check if any users are assigned to this role
        const { count: userCount } = await adminClient
            .from("mis_user")
            .select("*", { count: "exact", head: true })
            .eq("role_id", roleId);

        if (userCount && userCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete role: ${userCount} user(s) are assigned to this role` },
                { status: 400 }
            );
        }

        // Delete role
        const { error: deleteError } = await adminClient
            .from("mis_roles")
            .delete()
            .eq("id", roleId);

        if (deleteError) {
            console.error("Error deleting role:", deleteError);
            return NextResponse.json(
                { error: "Failed to delete role" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Role deleted successfully",
        });
    } catch (error) {
        console.error("Error in DELETE /api/mis/roles/[roleId]:", error);
        await logError({
            source: "api/mis/roles/[roleId]:DELETE",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json(
            { error: "Failed to delete role" },
            { status: 500 }
        );
    }
}
