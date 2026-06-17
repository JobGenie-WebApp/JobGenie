import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { timezone } = (await request.json()) as { timezone?: string };
        if (!timezone || typeof timezone !== "string" || timezone.length > 64) {
            return NextResponse.json({ success: false, error: "Invalid timezone" }, { status: 400 });
        }

        try {
            // Sanity-check: Intl throws on invalid IANA zone.
            new Intl.DateTimeFormat("en-US", { timeZone: timezone });
        } catch {
            return NextResponse.json({ success: false, error: "Invalid timezone" }, { status: 400 });
        }

        const admin = createAdminClient();
        const { error } = await admin
            .from("users")
            .update({ timezone })
            .eq("id", user.id);

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, timezone });
    } catch (e) {
        return NextResponse.json(
            { success: false, error: e instanceof Error ? e.message : "Unknown error" },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { data, error } = await supabase
            .from("users")
            .select("timezone")
            .eq("id", user.id)
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, timezone: data?.timezone || "UTC" });
    } catch (e) {
        return NextResponse.json(
            { success: false, error: e instanceof Error ? e.message : "Unknown error" },
            { status: 500 }
        );
    }
}
