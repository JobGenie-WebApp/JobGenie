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

        const { data: seniorityLevels, error } = await adminClient
            .from("seniority_levels")
            .select("*")
            .order("level_order", { ascending: true });

        if (error) {
            console.error("Error fetching seniority levels:", error);
            return NextResponse.json({ error: "Failed to fetch seniority levels" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            seniorityLevels: seniorityLevels || [],
        });
    } catch (error) {
        console.error("Error in GET /api/mis/master-data/seniority-levels:", error);
        await logError({
            source: "api/mis/master-data/seniority-levels:GET",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ error: "Failed to fetch seniority levels" }, { status: 500 });
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
        const { level_name, level_order } = body;

        if (!level_name || typeof level_name !== "string" || !level_name.trim()) {
            return NextResponse.json({ error: "Level name is required" }, { status: 400 });
        }

        // Get max level_id (manual increment — same pattern as industries)
        const { data: maxIdData } = await adminClient
            .from("seniority_levels")
            .select("level_id")
            .order("level_id", { ascending: false })
            .limit(1)
            .single();

        const newId = (maxIdData?.level_id || 0) + 1;

        // If no order supplied, append to the end (max order + 1)
        let order = Number(level_order);
        if (!Number.isFinite(order) || order <= 0) {
            const { data: maxOrderData } = await adminClient
                .from("seniority_levels")
                .select("level_order")
                .order("level_order", { ascending: false })
                .limit(1)
                .single();
            order = (maxOrderData?.level_order || 0) + 1;
        }

        const { data: seniorityLevel, error } = await adminClient
            .from("seniority_levels")
            .insert({
                level_id: newId,
                level_name: level_name.trim(),
                level_order: order,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating seniority level:", error);
            return NextResponse.json({ error: "Failed to create seniority level" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            seniorityLevel,
        });
    } catch (error) {
        console.error("Error in POST /api/mis/master-data/seniority-levels:", error);
        await logError({
            source: "api/mis/master-data/seniority-levels:POST",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ error: "Failed to create seniority level" }, { status: 500 });
    }
}
