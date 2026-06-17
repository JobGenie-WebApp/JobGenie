import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: employer } = await supabase
            .from("employers")
            .select("company_id, is_super_admin")
            .eq("user_id", user.id)
            .single();

        if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
        if (!employer.is_super_admin) return NextResponse.json({ error: "Forbidden: Super admin access required." }, { status: 403 });

        const admin = createAdminClient();
        const { error } = await admin.from("companies").update({
            approval_status: "rejected",
            profile_visible: false,
            updated_at: new Date().toISOString(),
        }).eq("id", employer.company_id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
    }
}
