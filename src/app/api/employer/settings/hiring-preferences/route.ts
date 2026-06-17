import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_DURATIONS = new Set([30, 45, 60, 90]);
const ALLOWED_MODES = new Set(["online", "in_person", "hybrid"]);

const DEFAULT_HIRING_PREFS = {
    default_interview_duration: 60,
    interview_mode: "online",
    auto_send_reminders: true,
};

function mergeWithDefaults(stored: unknown) {
    const result = { ...DEFAULT_HIRING_PREFS };
    if (stored && typeof stored === "object" && !Array.isArray(stored)) {
        const s = stored as Record<string, unknown>;
        if (ALLOWED_DURATIONS.has(s.default_interview_duration as number)) result.default_interview_duration = s.default_interview_duration as number;
        if (ALLOWED_MODES.has(s.interview_mode as string)) result.interview_mode = s.interview_mode as string;
        if (typeof s.auto_send_reminders === "boolean") result.auto_send_reminders = s.auto_send_reminders;
    }
    return result;
}

async function getEmployer(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
    const { data } = await supabase.from("employers").select("id, hiring_preferences").eq("user_id", userId).single();
    return data;
}

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const employer = await getEmployer(supabase, user.id);
        if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

        return NextResponse.json({ success: true, data: mergeWithDefaults(employer.hiring_preferences) });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const employer = await getEmployer(supabase, user.id);
        if (!employer) return NextResponse.json({ error: "Employer not found" }, { status: 404 });

        const body = await request.json();
        if (!ALLOWED_DURATIONS.has(body.default_interview_duration)) {
            return NextResponse.json({ error: "Invalid interview duration." }, { status: 400 });
        }
        if (!ALLOWED_MODES.has(body.interview_mode)) {
            return NextResponse.json({ error: "Invalid interview mode." }, { status: 400 });
        }
        if (typeof body.auto_send_reminders !== "boolean") {
            return NextResponse.json({ error: "auto_send_reminders must be a boolean." }, { status: 400 });
        }

        const validated = {
            default_interview_duration: body.default_interview_duration as number,
            interview_mode: body.interview_mode as string,
            auto_send_reminders: body.auto_send_reminders as boolean,
        };

        const admin = createAdminClient();
        const { error } = await admin.from("employers").update({ hiring_preferences: validated, updated_at: new Date().toISOString() }).eq("id", employer.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        return NextResponse.json({ success: true, data: validated });
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
    }
}
