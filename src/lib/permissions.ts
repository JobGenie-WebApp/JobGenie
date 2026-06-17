import { createAdminClient } from "./supabase/admin";
import { createClient } from "./supabase/server";

/**
 * Check if the current user has a specific permission
 * Super admins have all permissions automatically
 */
export async function hasPermission(
    resource: string,
    action: string
): Promise<boolean> {
    try {
        // Get current user
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return false;
        }

        // Get MIS user with role info
        const adminClient = createAdminClient();
        const { data: misUser, error: misUserError } = await adminClient
            .from("mis_user")
            .select("is_super_admin, role_id")
            .eq("user_id", user.id)
            .single();

        if (misUserError || !misUser) {
            return false;
        }

        // Super admins have all permissions
        if (misUser.is_super_admin) {
            return true;
        }

        // No role assigned
        if (!misUser.role_id) {
            return false;
        }

        // Check if role has the permission
        const { data: permission, error: permError } = await adminClient
            .from("mis_role_permissions")
            .select(`
                permission:mis_permissions!inner(resource, action)
            `)
            .eq("role_id", misUser.role_id)
            .eq("permission.resource", resource)
            .eq("permission.action", action)
            .maybeSingle();

        return !!permission && !permError;
    } catch (error) {
        console.error("Error checking permission:", error);
        return false;
    }
}

/**
 * Check if the current user has any of the specified permissions
 */
export async function hasAnyPermission(
    permissions: Array<{ resource: string; action: string }>
): Promise<boolean> {
    for (const { resource, action } of permissions) {
        if (await hasPermission(resource, action)) {
            return true;
        }
    }
    return false;
}

/**
 * Check if the current user has all of the specified permissions
 */
export async function hasAllPermissions(
    permissions: Array<{ resource: string; action: string }>
): Promise<boolean> {
    for (const { resource, action } of permissions) {
        if (!(await hasPermission(resource, action))) {
            return false;
        }
    }
    return true;
}

/**
 * Check if the current user is a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return false;
        }

        const adminClient = createAdminClient();
        const { data: misUser, error: misUserError } = await adminClient
            .from("mis_user")
            .select("is_super_admin")
            .eq("user_id", user.id)
            .single();

        return misUser?.is_super_admin === true;
    } catch (error) {
        console.error("Error checking super admin status:", error);
        return false;
    }
}

/**
 * Get all permissions for the current user
 */
export async function getUserPermissions(): Promise<
    Array<{ resource: string; action: string; name: string }>
> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return [];
        }

        const adminClient = createAdminClient();
        const { data: misUser, error: misUserError } = await adminClient
            .from("mis_user")
            .select("is_super_admin, role_id")
            .eq("user_id", user.id)
            .single();

        if (misUserError || !misUser) {
            return [];
        }

        // Super admins have all permissions
        if (misUser.is_super_admin) {
            const { data: allPermissions } = await adminClient
                .from("mis_permissions")
                .select("name, resource, action");

            return allPermissions || [];
        }

        // No role assigned
        if (!misUser.role_id) {
            return [];
        }

        // Get permissions for the role
        const { data: rolePermissions, error: permError } = await adminClient
            .from("mis_role_permissions")
            .select(`
                permission:mis_permissions(name, resource, action)
            `)
            .eq("role_id", misUser.role_id);

        if (permError) {
            return [];
        }

        return (rolePermissions || []).map((rp: { permission: { resource: string; action: string; name: string }[] }) => rp.permission[0]).filter(Boolean);
    } catch (error) {
        console.error("Error getting user permissions:", error);
        return [];
    }
}
