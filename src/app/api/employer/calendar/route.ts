import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export const dynamic = 'force-dynamic';

// GET /api/employer/calendar
// Returns all interview events for the employer's company calendar (invitations + rounds)
export async function GET() {
    try {
        const authClient = await createClient();

        const { data: { user } } = await authClient.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createAdminClient();

        const { data: employer, error: employerError } = await supabase
            .from('employers')
            .select('id, company_id')
            .eq('user_id', user.id)
            .single();

        if (employerError || !employer) {
            return NextResponse.json({ success: false, error: "Employer profile not found" }, { status: 404 });
        }

        // Fetch all invitations for this company with their rounds and candidate info
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
                candidate:candidates(id, first_name, last_name, profile_image_url, email),
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
            .eq('company_id', employer.company_id)
            .order('sent_at', { ascending: false });

        if (invError) {
            return NextResponse.json({ success: false, error: "Failed to fetch calendar data" }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: invitations || [] });

    } catch (error) {
        await logError({ source: "api/employer/calendar:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
