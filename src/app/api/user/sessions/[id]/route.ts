import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "Session ID required" }, { status: 400 });
        }

        const { error } = await supabase.rpc("delete_my_session", { session_id: id });

        if (error) {
            console.error("delete_my_session:", error);
            return NextResponse.json({ error: "Failed to revoke session" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Internal server error" },
            { status: 500 }
        );
    }
}
