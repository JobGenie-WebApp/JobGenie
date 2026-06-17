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

        const { searchParams } = new URL(request.url);
        const industryId = searchParams.get("industry_id");

        let query = adminClient
            .from("job_designations")
            .select(`
                *,
                industry:industries(industry_name),
                seniority_level:seniority_levels(level_name, level_order)
            `)
            .order("designation_name");

        if (industryId) {
            query = query.eq("industry_id", parseInt(industryId));
        }

        const { data: designations, error } = await query;

        if (error) {
            console.error("Error fetching designations:", error);
            return NextResponse.json({ error: "Failed to fetch designations" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            designations: designations || [],
        });
    } catch (error) {
        console.error("Error in GET /api/mis/master-data/designations:", error);
        await logError({
            source: "api/mis/master-data/designations:GET",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ error: "Failed to fetch designations" }, { status: 500 });
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
        const { designation_name, industry_id, level_id } = body;

        if (!designation_name || !industry_id || !level_id) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const { data: designation, error } = await adminClient
            .from("job_designations")
            .insert({
                designation_name: designation_name.trim(),
                industry_id: parseInt(industry_id),
                level_id: parseInt(level_id),
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating designation:", error);
            return NextResponse.json({ error: "Failed to create designation" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            designation,
        });
    } catch (error) {
        console.error("Error in POST /api/mis/master-data/designations:", error);
        await logError({
            source: "api/mis/master-data/designations:POST",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ error: "Failed to create designation" }, { status: 500 });
    }
}
