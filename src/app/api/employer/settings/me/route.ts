import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { data: employer, error } = await supabase
            .from("employers")
            .select(`
                is_super_admin,
                email,
                created_at,
                companies (
                    company_name,
                    approval_status
                )
            `)
            .eq("user_id", user.id)
            .single();

        if (error || !employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

        const company = (employer as Record<string, unknown>).companies as { company_name?: string; approval_status?: string } | null;

        return NextResponse.json({
            success: true,
            data: {
                email: employer.email,
                created_at: employer.created_at,
                is_super_admin: employer.is_super_admin,
                role: "Employer",
                company_name: company?.company_name ?? null,
                approval_status: company?.approval_status ?? "pending",
            },
        });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
    }
}
