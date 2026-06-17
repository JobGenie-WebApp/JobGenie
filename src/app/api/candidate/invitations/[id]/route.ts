import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export const dynamic = 'force-dynamic';

// GET /api/candidate/invitations/:id
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authClient = await createClient();

        // Get the current user
        const { data: { user } } = await authClient.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supabase = createAdminClient();

        // Get candidate record
        const { data: candidate, error: candidateError } = await supabase
            .from('candidates')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (candidateError || !candidate) {
            return NextResponse.json(
                { success: false, error: "Candidate profile not found" },
                { status: 404 }
            );
        }

        const { id } = await params;

        // Fetch single invitation
        const { data: invitation, error: invitationError } = await supabase
            .from('job_invitations')
            .select(`
                id,
                industry,
                job_designation,
                message,
                given_time_slots,
                alternative_dates,
                selected_time_slot,
                interview_mode,
                status,
                invitation_canceled,
                sent_at,
                viewed_at,
                responded_at,
                interview_confirmed,
                confirmed_time,
                meeting_link,
                interview_address,
                map_link,
                confirmed_at,
                canceled_by,
                cancellation_reason,
                canceled_at,
                mis_rescheduled,
                mis_rescheduled_at,
                mis_reschedule_data,
                pipeline_status,
                current_round_number,
                job_offers(id, status),
                employer:employers(id, user_id, first_name, last_name, designation, email, phone, job_title, department),
                company:companies(company_name, logo_url, industry, headoffice_location, bio, website, phone)
            `)
            .eq('id', id)
            .eq('candidate_id', candidate.id)
            .single();

        if (invitationError) {
            console.error('Error fetching invitation:', invitationError);
            return NextResponse.json(
                { success: false, error: "Invitation not found" },
                { status: 404 }
            );
        }

        // Mark as viewed if not already; notify employer (clear their seen flag) when candidate first opens
        if (!invitation.viewed_at) {
            const updateData: Record<string, unknown> = {
                viewed_at: new Date().toISOString(),
                employer_last_seen_at: null,
            };
            
            if (invitation.status === 'pending') {
                updateData.status = 'viewed';
            }

            await supabase
                .from('job_invitations')
                .update(updateData)
                .eq('id', id);
        }

        return NextResponse.json({
            success: true,
            data: invitation
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({ source: "api/candidate/invitations/[id]:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
