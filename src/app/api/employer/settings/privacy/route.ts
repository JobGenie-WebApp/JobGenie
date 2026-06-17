import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getEmployerAndCompany(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
    const { data } = await supabase
        .from("employers")
        .select("id, company_id, is_super_admin, companies(profile_visible, show_company_size, show_company_website)")
        .eq("user_id", userId)
        .single();
    return data;
}

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const employer = await getEmployerAndCompany(supabase, user.id);
        if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

        const company = (employer as Record<string, unknown>).companies as { profile_visible?: boolean; show_company_size?: boolean; show_company_website?: boolean } | null;
        return NextResponse.json({
            success: true,
            data: {
                profile_visible: company?.profile_visible ?? true,
                show_company_size: company?.show_company_size ?? true,
                show_company_website: company?.show_company_website ?? true,
            },
        });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const employer = await getEmployerAndCompany(supabase, user.id);
        if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });
        if (!employer.is_super_admin) return NextResponse.json({ error: "Forbidden: Super admin access required." }, { status: 403 });

        const body = await request.json();
        if (typeof body.profile_visible !== "boolean" || typeof body.show_company_size !== "boolean" || typeof body.show_company_website !== "boolean") {
            return NextResponse.json({ error: "Invalid payload: all fields must be boolean." }, { status: 400 });
        }

        const admin = createAdminClient();
        const { error } = await admin.from("companies").update({
            profile_visible: body.profile_visible,
            show_company_size: body.show_company_size,
            show_company_website: body.show_company_website,
            updated_at: new Date().toISOString(),
        }).eq("id", employer.company_id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
    }
}
