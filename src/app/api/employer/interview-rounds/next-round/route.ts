import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";
import { sendInterviewInvitationEmail } from "@/lib/interview-emails";
import { getUserTimezoneByEmail } from "@/lib/user-timezone";

// POST /api/employer/interview-rounds/next-round
// Create the next interview round after a candidate has been advanced
export async function POST(request: Request) {
    try {
        const authClient = await createClient();
        const body = await request.json();
        const {
            previous_round_id,
            round_label,
            interview_mode,
            interview_address,
            map_link,
            time_slots,
        } = body;

        // Validation
        if (!previous_round_id) {
            return NextResponse.json(
                { success: false, error: "Previous round ID is required" },
                { status: 400 }
            );
        }

        if (!time_slots || !Array.isArray(time_slots) || time_slots.length === 0 || time_slots.length > 3) {
            return NextResponse.json(
                { success: false, error: "Invalid time slots (must be 1-3)" },
                { status: 400 }
            );
        }

        // Validate time slots
        for (const slot of time_slots) {
            if (!slot.date || !slot.time || !slot.order) {
                return NextResponse.json(
                    { success: false, error: "Incomplete time slot data" },
                    { status: 400 }
                );
            }
        }

        // Get the current user
        const { data: { user } } = await authClient.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supabase = createAdminClient();

        // Get employer record
        const { data: employer, error: employerError } = await supabase
            .from('employers')
            .select('id, company_id, first_name, last_name')
            .eq('user_id', user.id)
            .single();

        if (employerError || !employer) {
            return NextResponse.json(
                { success: false, error: "Employer profile not found" },
                { status: 404 }
            );
        }

        // Get the previous round and verify permissions
        const { data: previousRound, error: roundError } = await supabase
            .from('interview_rounds')
            .select(`
                id,
                invitation_id,
                round_number,
                outcome,
                invitation:job_invitations!inner(
                    id,
                    company_id,
                    candidate_id,
                    industry,
                    job_designation,
                    current_round_number,
                    pipeline_status,
                    candidate:candidates(
                        first_name,
                        last_name,
                        email
                    )
                )
            `)
            .eq('id', previous_round_id)
            .single();

        if (roundError || !previousRound) {
            return NextResponse.json(
                { success: false, error: "Previous interview round not found" },
                { status: 404 }
            );
        }

        const invitation = previousRound.invitation as unknown as { id: string; company_id: string; candidate_id: string; industry: string; job_designation: string; current_round_number: number; pipeline_status: string; candidate: { first_name: string; last_name: string; email: string }[] };

        // Verify the round belongs to this company
        if (invitation.company_id !== employer.company_id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized access to this interview" },
                { status: 403 }
            );
        }

        // Verify the previous round outcome is 'advance'
        if (previousRound.outcome !== 'advance') {
            return NextResponse.json(
                { success: false, error: "Can only create next round when previous round outcome is 'advance'" },
                { status: 400 }
            );
        }

        // Check if next round already exists
        const nextRoundNumber = previousRound.round_number + 1;
        const { data: existingRound } = await supabase
            .from('interview_rounds')
            .select('id')
            .eq('invitation_id', invitation.id)
            .eq('round_number', nextRoundNumber)
            .maybeSingle();

        if (existingRound) {
            return NextResponse.json(
                { success: false, error: "Next round already exists" },
                { status: 409 }
            );
        }

        // Calculate alternative dates (same logic as invitation creation)
        const alternativeDates = calculateAlternativeDatesArray(time_slots);

        // Create the next interview round
        const { data: newRound, error: createError } = await supabase
            .from('interview_rounds')
            .insert({
                invitation_id: invitation.id,
                round_number: nextRoundNumber,
                round_label: round_label || `Round ${nextRoundNumber}`,
                status: 'pending',
                interview_mode: interview_mode || 'online',
                interview_address: interview_address || null,
                map_link: map_link || null,
                given_time_slots: time_slots,
                alternative_dates: alternativeDates,
                sent_at: new Date().toISOString()
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating next round:', createError);
            return NextResponse.json(
                { success: false, error: "Failed to create next interview round" },
                { status: 500 }
            );
        }

        // Note: The database trigger will automatically update job_invitations.current_round_number
        // when the interview_round is created (see migration 20260419000000_fix_invitation_round_sync.sql)
        // But we'll also do it explicitly here for redundancy and immediate confirmation
        
        const { data: updateData, error: updateError } = await supabase
            .from('job_invitations')
            .update({
                current_round_number: nextRoundNumber,
                pipeline_status: 'active'
            })
            .eq('id', invitation.id)
            .select('id, current_round_number, pipeline_status')
            .single();

        if (updateError) {
            console.error('ERROR: Failed to update invitation current_round_number:', {
                invitation_id: invitation.id,
                nextRoundNumber,
                error: updateError
            });
            // This is critical - log but don't fail since trigger should handle it
        } else {
            console.log('SUCCESS: Invitation updated:', {
                invitation_id: updateData.id,
                current_round_number: updateData.current_round_number,
                pipeline_status: updateData.pipeline_status,
                expected_round: nextRoundNumber
            });
            
            // Verify the update actually worked
            if (updateData.current_round_number !== nextRoundNumber) {
                console.warn('WARNING: current_round_number mismatch!', {
                    expected: nextRoundNumber,
                    actual: updateData.current_round_number
                });
            }
        }

        // Get company info for email
        const { data: company } = await supabase
            .from('companies')
            .select('company_name')
            .eq('id', employer.company_id)
            .single();

        // Send email notification to candidate
        const candidate = invitation.candidate?.[0] ?? null;
        if (candidate && company) {
            const recipientTz = await getUserTimezoneByEmail(candidate.email);
            sendInterviewInvitationEmail(
                candidate.email,
                candidate.first_name,
                company.company_name,
                `${invitation.job_designation} - ${round_label || `Round ${nextRoundNumber}`}`,
                time_slots,
                invitation.id,
                recipientTz
            ).catch(err => console.error('Email send error:', err));
        }

        await logBusiness(
            "next_interview_round_created",
            user.id,
            "employer",
            "interview_round",
            newRound.id,
            { 
                invitation_id: invitation.id, 
                round_number: nextRoundNumber,
                candidate_id: invitation.candidate_id
            }
        );

        return NextResponse.json({
            success: true,
            message: "Next interview round created successfully",
            data: {
                round_id: newRound.id,
                round_number: nextRoundNumber,
                round_label: newRound.round_label,
                invitation_id: invitation.id
            }
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({
            source: "api/employer/interview-rounds/next-round:POST",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error)
        });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Calculate 3 working days after the latest time slot
function calculateAlternativeDatesArray(timeSlots: { date: string }[]): { date: string; time: string | null; order: number; is_alternative: boolean }[] {
    if (!timeSlots || timeSlots.length === 0) return [];

    const latestMs = Math.max(
        ...timeSlots.map((s) => Date.parse(`${s.date}T00:00:00Z`))
    );
    const cursor = new Date(latestMs);
    const alternatives: { date: string; time: string | null; order: number; is_alternative: boolean }[] = [];
    let workingDaysAdded = 0;

    while (workingDaysAdded < 3) {
        cursor.setUTCDate(cursor.getUTCDate() + 1);
        const dayOfWeek = cursor.getUTCDay();

        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            alternatives.push({
                date: cursor.toISOString().split('T')[0],
                time: null,
                order: timeSlots.length + workingDaysAdded + 1,
                is_alternative: true
            });
            workingDaysAdded++;
        }
    }

    return alternatives;
}
