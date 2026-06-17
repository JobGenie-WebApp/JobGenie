import Link from "next/link";
import { notFound } from "next/navigation";
import { MISLayout } from "@/components/mis";
import { createAdminClient } from "@/lib/supabase/admin";
import { EditRoleForm } from "./EditRoleForm";

async function fetchRole(roleId: string) {
    try {
        const adminClient = createAdminClient();

        const { data: role, error } = await adminClient
            .from("mis_roles")
            .select("*")
            .eq("id", roleId)
            .single();

        if (error || !role) {
            return null;
        }

        return role;
    } catch (error) {
        console.error("Error fetching role:", error);
        return null;
    }
}

export default async function EditRolePage({
    params,
}: {
    params: Promise<{ roleId: string }>;
}) {
    const { roleId } = await params;
    const role = await fetchRole(roleId);

    if (!role) {
        notFound();
    }

    return (
        <MISLayout
            pageTitle="Edit Role"
            pageDescription="Update role details and settings"
        >
            <div className="max-w-2xl mx-auto">
                {/* Back Link */}
                <div className="mb-6">
                    <Link
                        href="/mis/roles"
                        className="text-sm text-muted-foreground hover:text-foreground inline-block"
                    >
                        ← Back to Roles
                    </Link>
                </div>

                {/* Form Card */}
                <div className="bg-card border rounded-lg p-6 shadow-sm">
                    <EditRoleForm role={role} />
                </div>
            </div>
        </MISLayout>
    );
}
