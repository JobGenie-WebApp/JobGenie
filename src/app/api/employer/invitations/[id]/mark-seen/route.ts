import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// POST /api/employer/invitations/[id]/mark-seen — employer opened this invitation (clear sidebar unread)
export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authClient = await createClient();
        const { id: invitationId } = await params;

        const { data: { user } } = await authClient.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createAdminClient();

        const { data: employer } = await supabase
            .from("employers")
            .select("company_id")
            .eq("user_id", user.id)
            .single();

        if (!employer) {
            return NextResponse.json({ success: false, error: "Employer profile not found" }, { status: 404 });
        }

        const now = new Date().toISOString();

        const { data: updated, error } = await supabase
            .from("job_invitations")
            .update({ employer_last_seen_at: now })
            .eq("id", invitationId)
            .eq("company_id", employer.company_id)
            .select("id")
            .maybeSingle();

        if (error) {
            console.error("mark-seen update error:", error);
            return NextResponse.json({ success: false, error: "Failed to update" }, { status: 500 });
        }

        if (!updated) {
            return NextResponse.json({ success: false, error: "Invitation not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("mark-seen API error:", error);
        await logError({
            source: "api/employer/invitations/mark-seen:POST",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
