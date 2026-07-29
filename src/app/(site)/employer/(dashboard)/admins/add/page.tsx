import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AddSubAdminForm } from "@/components/employer/AddSubAdminForm";
import { ArrowLeft } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Add Sub-Admin | JobGenie",
    description: "Invite a new administrator to your company",
};

export default async function AddSubAdminPage() {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/employer/login");
    }

    // Get current employer and verify they are super admin
    const { data: employer } = await supabase
        .from("employers")
        .select("id, company_id, is_super_admin, first_name")
        .eq("user_id", user.id)
        .single();

    if (!employer) {
        redirect("/employer/login");
    }

    // Only super admin can access this page
    if (!employer.is_super_admin) {
        redirect("/employer/admins");
    }

    // Check current sub-admin count
    const adminClient = createAdminClient();
    const { count: subAdminCount } = await adminClient
        .from("employers")
        .select("*", { count: "exact", head: true })
        .eq("company_id", employer.company_id)
        .eq("is_super_admin", false);

    const currentCount = subAdminCount || 0;
    const maxCount = 5;

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/employer/admins"
                        className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Company Admins
                    </Link>
                    <h1 className="text-3xl font-bold mt-2">Add Sub-Admin</h1>
                    <p className="text-muted-foreground mt-2">
                        Invite a new administrator to help manage your company&apos;s job postings
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            Current sub-admins:
                        </span>
                        <span className={`text-sm font-semibold ${currentCount >= maxCount ? 'text-destructive' : 'text-primary'}`}>
                            {currentCount} / {maxCount}
                        </span>
                    </div>
                </div>

                {/* Warning if at limit */}
                {currentCount >= maxCount && (
                    <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-6">
                        <p className="text-sm text-destructive font-medium">
                            ⚠️ Maximum sub-admin limit reached. You cannot add more sub-admins at this time.
                        </p>
                    </div>
                )}

                {/* Form Card */}
                {currentCount < maxCount && (
                    <div className="bg-card border rounded-lg p-6 shadow-sm">
                        <AddSubAdminForm />
                    </div>
                )}
            </div>
        </div>
    );
}
