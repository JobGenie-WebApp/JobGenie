import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Revoke all other sessions; keeps the current session active
        const { error } = await supabase.auth.signOut({ scope: "others" });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Internal server error" },
            { status: 500 }
        );
    }
}
