import Link from "next/link";
import { MISLayout } from "@/components/mis";
import { RolesTable } from "./RolesTable";
import { createAdminClient } from "@/lib/supabase/admin";

async function fetchRoles() {
    try {
        const adminClient = createAdminClient();

        // Fetch all roles with permission count and user count
        const { data: roles, error: fetchError } = await adminClient
            .from("mis_roles")
            .select(`
                *,
                role_permissions:mis_role_permissions(count),
                mis_users:mis_user(count)
            `)
            .order("created_at", { ascending: false });

        if (fetchError) {
            console.error("Error fetching roles:", fetchError);
            return [];
        }

        return roles || [];
    } catch (error) {
        console.error("Error fetching roles:", error);
        return [];
    }
}

export default async function RolesPage() {
    const roles = await fetchRoles();

    return (
        <MISLayout
            pageTitle="Roles & Permissions"
            pageDescription="Manage MIS roles and assign permissions"
        >
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header with Actions */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Create roles and assign specific permissions to control access within the MIS system.
                        </p>
                    </div>
                    <Link
                        href="/mis/roles/create"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium"
                    >
                        Create Role
                    </Link>
                </div>

                {/* Roles Table */}
                <RolesTable roles={roles} />
            </div>
        </MISLayout>
    );
}
