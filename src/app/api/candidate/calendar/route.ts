import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export const dynamic = 'force-dynamic';

// GET /api/candidate/calendar
// Returns all interview events for the calendar (invitations + rounds)
export async function GET() {
    try {
        const authClient = await createClient();

        const { data: { user } } = await authClient.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createAdminClient();

        const { data: candidate, error: candidateError } = await supabase
            .from('candidates')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (candidateError || !candidate) {
            return NextResponse.json({ success: false, error: "Candidate profile not found" }, { status: 404 });
        }

        // Fetch all invitations with their rounds
        const { data: invitations, error: invError } = await supabase
            .from('job_invitations')
            .select(`
                id,
                job_designation,
                industry,
                interview_mode,
                given_time_slots,
                selected_time_slot,
                confirmed_time,
                meeting_link,
                interview_address,
                map_link,
                confirmed_at,
                interview_confirmed,
                invitation_canceled,
                canceled_at,
                status,
                pipeline_status,
                current_round_number,
                mis_rescheduled,
                mis_reschedule_data,
                company:companies(company_name, logo_url),
                job_offers(id, status),
                interview_rounds(
                    id,
                    round_number,
                    round_label,
                    status,
                    outcome,
                    interview_mode,
                    given_time_slots,
                    selected_time_slot,
                    confirmed_time,
                    meeting_link,
                    interview_address,
                    map_link,
                    confirmed_at,
                    sent_at,
                    round_canceled,
                    mis_rescheduled,
                    mis_reschedule_data
                )
            `)
            .eq('candidate_id', candidate.id)
            .order('sent_at', { ascending: false });

        if (invError) {
            return NextResponse.json({ success: false, error: "Failed to fetch calendar data" }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: invitations || [] });

    } catch (error) {
        await logError({ source: "api/candidate/calendar:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
