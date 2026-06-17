import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const adminClient = createAdminClient();
        const { data: misUser, error: misUserError } = await adminClient
            .from("mis_user")
            .select("user_id")
            .eq("user_id", user.id)
            .single();

        if (misUserError || !misUser) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { data: industries, error } = await adminClient
            .from("industries")
            .select("*")
            .order("industry_name");

        if (error) {
            console.error("Error fetching industries:", error);
            return NextResponse.json({ error: "Failed to fetch industries" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            industries: industries || [],
        });
    } catch (error) {
        console.error("Error in GET /api/mis/master-data/industries:", error);
        await logError({
            source: "api/mis/master-data/industries:GET",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ error: "Failed to fetch industries" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const adminClient = createAdminClient();
        const { data: misUser, error: misUserError } = await adminClient
            .from("mis_user")
            .select("is_super_admin")
            .eq("user_id", user.id)
            .single();

        if (misUserError || !misUser || !misUser.is_super_admin) {
            return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 });
        }

        const body = await request.json();
        const { industry_name } = body;

        if (!industry_name || typeof industry_name !== "string") {
            return NextResponse.json({ error: "Industry name is required" }, { status: 400 });
        }

        // Get max industry_id
        const { data: maxIdData } = await adminClient
            .from("industries")
            .select("industry_id")
            .order("industry_id", { ascending: false })
            .limit(1)
            .single();

        const newId = (maxIdData?.industry_id || 0) + 1;

        const { data: industry, error } = await adminClient
            .from("industries")
            .insert({
                industry_id: newId,
                industry_name: industry_name.trim(),
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating industry:", error);
            return NextResponse.json({ error: "Failed to create industry" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            industry,
        });
    } catch (error) {
        console.error("Error in POST /api/mis/master-data/industries:", error);
        await logError({
            source: "api/mis/master-data/industries:POST",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ error: "Failed to create industry" }, { status: 500 });
    }
}
