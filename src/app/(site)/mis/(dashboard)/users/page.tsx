import Link from "next/link";
import { MISLayout } from "@/components/mis";
import { MISUserTable } from "@/components/mis/MISUserTable";
import { createAdminClient } from "@/lib/supabase/admin";

async function fetchMISUsers() {
    try {
        const adminClient = createAdminClient();

        // Fetch all MIS users directly from database with role information
        const { data: misUsers, error: fetchError } = await adminClient
            .from("mis_user")
            .select(`
                user_id,
                first_name,
                last_name,
                email,
                created_at,
                is_super_admin,
                role_id,
                role:mis_roles(name, description)
            `)
            .order("created_at", { ascending: false });

        if (fetchError) {
            console.error("Error fetching MIS users:", fetchError);
            return [];
        }

        // Transform the data: Supabase returns role as an array, but we need a single object
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transformedUsers = (misUsers || []).map((user: any) => ({
            ...user,
            role: Array.isArray(user.role) && user.role.length > 0 ? user.role[0] : null,
        }));

        return transformedUsers;
    } catch (error) {
        console.error("Error fetching MIS users:", error);
        return [];
    }
}

export default async function MISUsersPage() {
    const users = await fetchMISUsers();

    return (
        <MISLayout
            pageTitle="MIS Users"
            pageDescription="Manage MIS administrator accounts"
        >
            <div className="max-w-7xl mx-auto">
                {/* Header with Add Button */}
                <div className="flex items-center justify-end mb-6">
                    <Link
                        href="/mis/users/add"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium"
                    >
                        Add MIS User
                    </Link>
                </div>

                {/* User List Table */}
                <MISUserTable users={users} />
            </div>
        </MISLayout>
    );
}
