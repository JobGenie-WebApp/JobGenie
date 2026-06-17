import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";

// POST /api/employer/interview-rounds/[roundId]/offer
// Create a job offer after interview round
export async function POST(
    request: Request,
    { params }: { params: Promise<{ roundId: string }> }
) {
    try {
        const authClient = await createClient();
        const { roundId } = await params;
        const body = await request.json();
        const { 
            job_title,
            salary_amount,
            salary_currency,
            salary_period,
            start_date,
            expiry_date,
            offer_letter_url,
            description
        } = body;

        // Validation
        if (!job_title) {
            return NextResponse.json(
                { success: false, error: "Job title is required" },
                { status: 400 }
            );
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
            .select('id, company_id, user_id')
            .eq('user_id', user.id)
            .single();

        if (employerError || !employer) {
            return NextResponse.json(
                { success: false, error: "Employer profile not found" },
                { status: 404 }
            );
        }

        // Get the interview round and verify permissions
        const { data: round, error: roundError } = await supabase
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
                    pipeline_status
                )
            `)
            .eq('id', roundId)
            .single();

        if (roundError || !round) {
            return NextResponse.json(
                { success: false, error: "Interview round not found" },
                { status: 404 }
            );
        }

        const invitation = round.invitation as unknown as { id: string; company_id: string; candidate_id: string; pipeline_status: string } | null;

        if (!invitation) return NextResponse.json({ success: false, error: "Invitation not found" }, { status: 404 });

        // Verify the round belongs to this company
        if (invitation.company_id !== employer.company_id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized access to this interview" },
                { status: 403 }
            );
        }

        // Verify the round outcome is 'offer'
        if (round.outcome !== 'offer') {
            return NextResponse.json(
                { success: false, error: "Can only create offer when round outcome is 'offer'" },
                { status: 400 }
            );
        }

        // Check if offer already exists for this invitation
        const { data: existingOffer } = await supabase
            .from('job_offers')
            .select('id')
            .eq('invitation_id', invitation.id)
            .maybeSingle();

        if (existingOffer) {
            return NextResponse.json(
                { success: false, error: "Job offer already exists for this candidate" },
                { status: 409 }
            );
        }

        // Create the job offer
        const now = new Date().toISOString();
        const { data: offer, error: createError } = await supabase
            .from('job_offers')
            .insert({
                invitation_id: invitation.id,
                round_id: roundId,
                job_title: job_title,
                salary_amount: salary_amount || null,
                salary_currency: salary_currency || 'LKR',
                salary_period: salary_period || 'monthly',
                start_date: start_date || null,
                expiry_date: expiry_date || null,
                offer_letter_url: offer_letter_url || null,
                description: description || null,
                status: 'pending',
                created_by: employer.user_id,
                created_at: now,
                updated_at: now
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating job offer:', createError);
            return NextResponse.json(
                { success: false, error: "Failed to create job offer" },
                { status: 500 }
            );
        }

        // Update invitation pipeline status to 'offered'
        const { error: updateError } = await supabase
            .from('job_invitations')
            .update({
                pipeline_status: 'offered'
            })
            .eq('id', invitation.id);

        if (updateError) {
            console.error('Error updating pipeline status:', updateError);
        }

        await logBusiness(
            "job_offer_created",
            user.id,
            "employer",
            "job_offer",
            offer.id,
            { 
                invitation_id: invitation.id, 
                round_id: roundId,
                candidate_id: invitation.candidate_id,
                job_title: job_title
            }
        );

        return NextResponse.json({
            success: true,
            message: "Job offer created successfully",
            data: {
                offer_id: offer.id,
                invitation_id: invitation.id,
                status: 'pending'
            }
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({
            source: "api/employer/interview-rounds/offer:POST",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error)
        });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// GET /api/employer/interview-rounds/[roundId]/offer
// Get job offer details for a specific round
export async function GET(
    request: Request,
    { params }: { params: Promise<{ roundId: string }> }
) {
    try {
        const authClient = await createClient();
        const { roundId } = await params;

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
        const { data: employer } = await supabase
            .from('employers')
            .select('company_id')
            .eq('user_id', user.id)
            .single();

        if (!employer) {
            return NextResponse.json(
                { success: false, error: "Employer profile not found" },
                { status: 404 }
            );
        }

        // Get the job offer with related data
        const { data: offer, error: offerError } = await supabase
            .from('job_offers')
            .select(`
                *,
                round:interview_rounds!inner(
                    id,
                    round_number,
                    invitation:job_invitations!inner(
                        id,
                        company_id,
                        candidate:candidates(
                            first_name,
                            last_name,
                            email
                        )
                    )
                )
            `)
            .eq('round_id', roundId)
            .single();

        if (offerError || !offer) {
            return NextResponse.json(
                { success: false, error: "Job offer not found" },
                { status: 404 }
            );
        }

        const round = offer.round as unknown as { invitation: { company_id: string } } | null;
        const invitation = round?.invitation ?? null;

        if (!invitation) return NextResponse.json({ success: false, error: "Invitation not found" }, { status: 404 });

        // Verify access
        if (invitation.company_id !== employer.company_id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            data: offer
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({
            source: "api/employer/interview-rounds/offer:GET",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error)
        });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
