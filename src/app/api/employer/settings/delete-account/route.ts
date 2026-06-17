import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: employer } = await supabase
            .from("employers")
            .select("id, company_id, is_super_admin")
            .eq("user_id", user.id)
            .single();

        if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

        // Block deletion if this is the last super admin in the company
        if (employer.is_super_admin) {
            const { count } = await supabase
                .from("employers")
                .select("id", { count: "exact", head: true })
                .eq("company_id", employer.company_id)
                .eq("is_super_admin", true);

            if ((count ?? 0) <= 1) {
                return NextResponse.json({
                    error: "You are the only super admin. Deactivate the company or transfer ownership before deleting your account.",
                    code: "LAST_SUPER_ADMIN",
                }, { status: 400 });
            }
        }

        const admin = createAdminClient();
        const { error } = await admin.auth.admin.deleteUser(user.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
    }
}
