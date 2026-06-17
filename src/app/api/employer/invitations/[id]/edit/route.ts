import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// PATCH /api/employer/invitations/[id]/edit
// Allows employer to edit time slots / mode before candidate accepts
export async function PATCH(
    request: Request,
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

        // Fetch invitation and verify ownership
        const { data: invitation, error: invError } = await supabase
            .from("job_invitations")
            .select("id, status, interview_confirmed, invitation_canceled, employer_id, employers!inner(user_id)")
            .eq("id", invitationId)
            .single();

        if (invError || !invitation) {
            return NextResponse.json({ success: false, error: "Invitation not found" }, { status: 404 });
        }

        const emp = (invitation as unknown as { employers: { user_id: string }[] }).employers?.[0];
        if (emp?.user_id !== user.id) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        // Only editable before candidate accepts (pending or viewed)
        const editableStatuses = ["pending", "viewed"];
        if (!editableStatuses.includes(invitation.status)) {
            return NextResponse.json(
                { success: false, error: "Cannot edit after candidate has responded" },
                { status: 409 }
            );
        }

        if (invitation.invitation_canceled) {
            return NextResponse.json({ success: false, error: "Cannot edit a cancelled invitation" }, { status: 409 });
        }

        const body = await request.json();
        const { timeSlots, interviewMode, meetingLink, interviewAddress, mapLink } = body;

        if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0 || timeSlots.length > 3) {
            return NextResponse.json({ success: false, error: "Invalid time slots (must be 1-3)" }, { status: 400 });
        }

        for (const slot of timeSlots) {
            if (!slot.date || !slot.time) {
                return NextResponse.json({ success: false, error: "Incomplete time slot data" }, { status: 400 });
            }
        }

        if (!interviewMode) {
            return NextResponse.json({ success: false, error: "Interview mode is required" }, { status: 400 });
        }

        if (interviewMode === "physical" && !interviewAddress) {
            return NextResponse.json({ success: false, error: "Interview address is required for physical interviews" }, { status: 400 });
        }

        const { error: updateError } = await supabase
            .from("job_invitations")
            .update({
                given_time_slots: timeSlots,
                interview_mode: interviewMode,
                meeting_link: interviewMode === "online" ? (meetingLink || null) : null,
                interview_address: interviewMode === "physical" ? (interviewAddress || null) : null,
                map_link: interviewMode === "physical" ? (mapLink || null) : null,
            })
            .eq("id", invitationId);

        if (updateError) {
            console.error("Edit invitation error:", updateError);
            return NextResponse.json({ success: false, error: "Failed to update invitation" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("edit invitation error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
