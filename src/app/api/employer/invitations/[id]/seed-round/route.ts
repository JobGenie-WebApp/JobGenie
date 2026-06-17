import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// POST /api/employer/invitations/[id]/seed-round
// Creates round 1 for invitations that were confirmed before auto-creation was in place.
export async function POST(
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

        // Verify employer owns this invitation
        const { data: invitation, error: invError } = await supabase
            .from("job_invitations")
            .select(`
                id, company_id, interview_confirmed, mis_rescheduled,
                selected_time_slot, interview_mode, confirmed_time,
                meeting_link, interview_address, map_link, confirmed_at,
                mis_reschedule_data,
                employer:employers!inner(user_id)
            `)
            .eq("id", invitationId)
            .single();

        if (invError || !invitation) {
            return NextResponse.json({ success: false, error: "Invitation not found" }, { status: 404 });
        }

        type SeedInvitation = { employer: { user_id: string }[]; mis_reschedule_data: { date: string; time: string; interview_mode: string; meeting_link?: string; interview_address?: string; map_link?: string } | null; mis_rescheduled: boolean; selected_time_slot: Record<string, unknown> | null; interview_mode: string | null; confirmed_time: string | null; meeting_link: string | null; interview_address: string | null; map_link: string | null; confirmed_at: string | null };
        const typedInv = invitation as unknown as SeedInvitation;
        const emp = typedInv.employer?.[0];
        if (emp?.user_id !== user.id) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        // Check round 1 doesn't already exist
        const { data: existing } = await supabase
            .from("interview_rounds")
            .select("id")
            .eq("invitation_id", invitationId)
            .eq("round_number", 1)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ success: false, error: "Round 1 already exists" }, { status: 409 });
        }

        // Build round data from the invitation's confirmation details
        const reschedule = typedInv.mis_reschedule_data;
        const isRescheduled = typedInv.mis_rescheduled && reschedule;

        const roundData: Record<string, unknown> = {
            invitation_id: invitationId,
            round_number: 1,
            round_label: "Initial Interview",
            status: isRescheduled ? "confirmed" : "confirmed",
            given_time_slots: isRescheduled
                ? [{ date: reschedule.date, time: reschedule.time, order: 1 }]
                : typedInv.selected_time_slot
                    ? [typedInv.selected_time_slot]
                    : [],
            interview_mode: isRescheduled ? reschedule.interview_mode : typedInv.interview_mode,
            interview_confirmed: true,
            confirmed_time: isRescheduled ? reschedule.time : typedInv.confirmed_time,
            meeting_link: isRescheduled ? (reschedule.meeting_link ?? null) : typedInv.meeting_link,
            interview_address: isRescheduled ? (reschedule.interview_address ?? null) : typedInv.interview_address,
            map_link: isRescheduled ? (reschedule.map_link ?? null) : typedInv.map_link,
            confirmed_at: typedInv.confirmed_at ?? new Date().toISOString(),
            mis_rescheduled: isRescheduled ? true : false,
            mis_reschedule_data: isRescheduled ? reschedule : null,
        };

        const { data: newRound, error: createError } = await supabase
            .from("interview_rounds")
            .insert(roundData)
            .select("id, round_number")
            .single();

        if (createError || !newRound) {
            console.error("seed-round insert error:", createError);
            return NextResponse.json({ success: false, error: "Failed to create round" }, { status: 500 });
        }

        // Ensure invitation current_round_number is 1
        await supabase
            .from("job_invitations")
            .update({ current_round_number: 1 })
            .eq("id", invitationId)
            .eq("current_round_number", 0);

        return NextResponse.json({ success: true, data: newRound });
    } catch (error) {
        console.error("seed-round error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
