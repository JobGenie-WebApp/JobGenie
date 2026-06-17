import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// PATCH /api/employer/interview-rounds/[roundId]/edit
// Allows employer to update time slots before candidate accepts
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ roundId: string }> }
) {
    try {
        const authClient = await createClient();
        const { roundId } = await params;

        const { data: { user } } = await authClient.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const supabase = createAdminClient();

        const { data: round, error: roundError } = await supabase
            .from("interview_rounds")
            .select("id, status, round_canceled, invitation:job_invitations!inner(company_id, employers!inner(user_id))")
            .eq("id", roundId)
            .single();

        if (roundError || !round) return NextResponse.json({ success: false, error: "Round not found" }, { status: 404 });

        const inv = (round as unknown as { invitation: { employers: { user_id: string }[] } }).invitation;
        const emp = inv?.employers?.[0];
        if (emp?.user_id !== user.id) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

        const editableStatuses = ["pending", "viewed", "accepted"];
        if (!editableStatuses.includes(round.status)) {
            return NextResponse.json({ success: false, error: "Cannot edit after round is confirmed" }, { status: 409 });
        }
        if (round.round_canceled) {
            return NextResponse.json({ success: false, error: "Cannot edit a cancelled round" }, { status: 409 });
        }

        const body = await request.json();
        const { timeSlots, interviewMode, meetingLink, interviewAddress, mapLink } = body;

        if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0 || timeSlots.length > 3) {
            return NextResponse.json({ success: false, error: "Invalid time slots (must be 1-3)" }, { status: 400 });
        }
        for (const slot of timeSlots) {
            if (!slot.date || !slot.time) return NextResponse.json({ success: false, error: "Incomplete time slot data" }, { status: 400 });
        }
        if (!interviewMode) return NextResponse.json({ success: false, error: "Interview mode is required" }, { status: 400 });
        if (interviewMode === "physical" && !interviewAddress) {
            return NextResponse.json({ success: false, error: "Interview address is required for physical interviews" }, { status: 400 });
        }

        const { error: updateError } = await supabase
            .from("interview_rounds")
            .update({
                given_time_slots: timeSlots,
                interview_mode: interviewMode,
                meeting_link: interviewMode === "online" ? (meetingLink || null) : null,
                interview_address: interviewMode === "physical" ? (interviewAddress || null) : null,
                map_link: interviewMode === "physical" ? (mapLink || null) : null,
            })
            .eq("id", roundId);

        if (updateError) {
            console.error("edit-round error:", updateError);
            return NextResponse.json({ success: false, error: "Failed to update round" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("edit-round error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
