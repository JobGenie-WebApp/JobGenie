import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const AVAILABILITY_VALUES = ["available", "open_to_opportunities", "not_looking"] as const;
const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "internship", "freelance", "volunteer"] as const;
const NOTICE_PERIODS = ["immediate", "2 weeks", "1 month", "2 months", "3 months", "negotiable"] as const;

export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const admin = createAdminClient();
        const { data, error } = await admin
            .from("candidates")
            .select("availability_status, employment_type, notice_period, expected_monthly_salary, expected_positions")
            .eq("user_id", user.id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (e) {
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Validate availability_status
        if (
            body.availability_status !== undefined &&
            !AVAILABILITY_VALUES.includes(body.availability_status)
        ) {
            return NextResponse.json({ error: "Invalid availability_status." }, { status: 400 });
        }

        // Validate employment_type
        if (
            body.employment_type !== undefined &&
            body.employment_type !== null &&
            !EMPLOYMENT_TYPES.includes(body.employment_type)
        ) {
            return NextResponse.json({ error: "Invalid employment_type." }, { status: 400 });
        }

        // Validate notice_period
        if (
            body.notice_period !== undefined &&
            body.notice_period !== null &&
            (typeof body.notice_period !== "string" || body.notice_period.length > 50)
        ) {
            return NextResponse.json({ error: "Invalid notice_period." }, { status: 400 });
        }

        // Validate expected_monthly_salary
        if (
            body.expected_monthly_salary !== undefined &&
            body.expected_monthly_salary !== null &&
            (typeof body.expected_monthly_salary !== "number" || body.expected_monthly_salary < 0)
        ) {
            return NextResponse.json({ error: "Invalid expected_monthly_salary." }, { status: 400 });
        }

        // Validate expected_positions
        if (body.expected_positions !== undefined) {
            if (!Array.isArray(body.expected_positions)) {
                return NextResponse.json({ error: "expected_positions must be an array." }, { status: 400 });
            }
            if (body.expected_positions.length > 3) {
                return NextResponse.json({ error: "Maximum 3 expected positions allowed." }, { status: 400 });
            }
            if (body.expected_positions.some((p: unknown) => typeof p !== "string" || p.trim().length === 0)) {
                return NextResponse.json({ error: "Each position must be a non-empty string." }, { status: 400 });
            }
        }

        const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (body.availability_status !== undefined) update.availability_status = body.availability_status;
        if (body.employment_type !== undefined) update.employment_type = body.employment_type;
        if (body.notice_period !== undefined) update.notice_period = body.notice_period;
        if (body.expected_monthly_salary !== undefined) update.expected_monthly_salary = body.expected_monthly_salary;
        if (body.expected_positions !== undefined) update.expected_positions = body.expected_positions.map((p: string) => p.trim());

        const admin = createAdminClient();
        const { data, error } = await admin
            .from("candidates")
            .update(update)
            .eq("user_id", user.id)
            .select("availability_status, employment_type, notice_period, expected_monthly_salary, expected_positions")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (e) {
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Internal server error" },
            { status: 500 }
        );
    }
}
