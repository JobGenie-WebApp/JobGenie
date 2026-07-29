import Link from "next/link";
import { notFound } from "next/navigation";
import { MISLayout } from "@/components/mis";
import { createAdminClient } from "@/lib/supabase/admin";
import { PermissionsManager } from "./PermissionsManager";

async function fetchRoleWithPermissions(roleId: string) {
    try {
        const adminClient = createAdminClient();

        // Fetch role with its permissions
        const { data: role, error: roleError } = await adminClient
            .from("mis_roles")
            .select(`
                *,
                role_permissions:mis_role_permissions(
                    permission:mis_permissions(*)
                )
            `)
            .eq("id", roleId)
            .single();

        if (roleError || !role) {
            return null;
        }

        // Fetch all available permissions
        const { data: allPermissions, error: permError } = await adminClient
            .from("mis_permissions")
            .select("*")
            .order("resource, action");

        if (permError) {
            return null;
        }

        return { role, allPermissions: allPermissions || [] };
    } catch (error) {
        console.error("Error fetching role:", error);
        return null;
    }
}

export default async function RolePermissionsPage({
    params,
}: {
    params: Promise<{ roleId: string }>;
}) {
    const { roleId } = await params;
    const data = await fetchRoleWithPermissions(roleId);

    if (!data) {
        notFound();
    }

    const { role, allPermissions } = data;

    // Extract assigned permission IDs
    const assignedPermissionIds = new Set<string>(
        role.role_permissions.map((rp: { permission: { id: string } }) => rp.permission.id)
    );

    return (
        <MISLayout
            pageTitle="Manage Permissions"
            pageDescription={`Assign permissions to role: ${role.name}`}
        >
            <div className="max-w-6xl mx-auto">
                {/* Back Link */}
                <div className="mb-6">
                    <Link
                        href="/mis/roles"
                        className="text-sm text-muted-foreground hover:text-foreground inline-block"
                    >
                        ← Back to Roles
                    </Link>
                </div>

                {/* Role Info */}
                <div className="mb-6">
                    <p className="text-muted-foreground">
                        Role: <span className="font-semibold text-foreground">{role.name}</span>
                    </p>
                    {role.description && (
                        <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                    )}
                </div>

                {/* Permissions Manager */}
                <PermissionsManager
                    roleId={roleId}
                    roleName={role.name}
                    allPermissions={allPermissions}
                    assignedPermissionIds={Array.from(assignedPermissionIds)}
                />
            </div>
        </MISLayout>
    );
}
