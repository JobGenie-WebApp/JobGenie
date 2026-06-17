import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";
import { createPaymentRequest } from "@/lib/payments";

// GET /api/candidate/invitations/[id]/offer
// Fetch job offer for a specific invitation (candidate view)
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authClient = await createClient();
        const { id: invitationId } = await params;

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
        const { data: candidate } = await supabase
            .from('candidates')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!candidate) {
            return NextResponse.json(
                { success: false, error: "Candidate profile not found" },
                { status: 404 }
            );
        }

        // Verify invitation belongs to this candidate
        const { data: invitation } = await supabase
            .from('job_invitations')
            .select('id, candidate_id')
            .eq('id', invitationId)
            .eq('candidate_id', candidate.id)
            .single();

        if (!invitation) {
            return NextResponse.json(
                { success: false, error: "Invitation not found or unauthorized" },
                { status: 404 }
            );
        }

        // Fetch the job offer
        const { data: offer, error: offerError } = await supabase
            .from('job_offers')
            .select(`
                id,
                job_title,
                salary_amount,
                salary_currency,
                salary_period,
                start_date,
                expiry_date,
                offer_letter_url,
                description,
                status,
                created_at,
                responded_at
            `)
            .eq('invitation_id', invitationId)
            .maybeSingle();

        if (offerError) {
            console.error('Database error fetching offer:', offerError);
            await logError({
                source: "api/candidate/invitations/offer:GET",
                errorType: "DatabaseError",
                message: offerError.message
            });
            return NextResponse.json(
                { success: false, error: "Failed to fetch offer" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            offer: offer || null
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({
            source: "api/candidate/invitations/offer:GET",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error)
        });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/candidate/invitations/[id]/offer
// Body: { action: "accept" | "decline" } — respond to a pending job offer
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authClient = await createClient();
        const { id: invitationId } = await params;
        const body = await request.json();
        const action = body?.action as string | undefined;

        if (action !== "accept" && action !== "decline") {
            return NextResponse.json(
                { success: false, error: "Invalid action" },
                { status: 400 }
            );
        }

        const { data: { user } } = await authClient.auth.getUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const supabase = createAdminClient();

        const { data: candidate } = await supabase
            .from("candidates")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!candidate) {
            return NextResponse.json(
                { success: false, error: "Candidate profile not found" },
                { status: 404 }
            );
        }

        const { data: invitation } = await supabase
            .from("job_invitations")
            .select("id, candidate_id")
            .eq("id", invitationId)
            .eq("candidate_id", candidate.id)
            .single();

        if (!invitation) {
            return NextResponse.json(
                { success: false, error: "Invitation not found or unauthorized" },
                { status: 404 }
            );
        }

        const { data: offer, error: offerFetchError } = await supabase
            .from("job_offers")
            .select("id, status, expiry_date")
            .eq("invitation_id", invitationId)
            .maybeSingle();

        if (offerFetchError) {
            console.error("Error loading offer:", offerFetchError);
            return NextResponse.json(
                { success: false, error: "Failed to load offer" },
                { status: 500 }
            );
        }

        if (!offer) {
            return NextResponse.json(
                { success: false, error: "No job offer for this invitation" },
                { status: 404 }
            );
        }

        if (offer.status !== "pending") {
            return NextResponse.json(
                { success: false, error: "This offer has already been responded to" },
                { status: 400 }
            );
        }

        if (action === "accept" && offer.expiry_date) {
            const exp = new Date(offer.expiry_date);
            if (!Number.isNaN(exp.getTime()) && exp < new Date()) {
                return NextResponse.json(
                    { success: false, error: "This offer has expired" },
                    { status: 400 }
                );
            }
        }

        const now = new Date().toISOString();
        const newOfferStatus = action === "accept" ? "accepted" : "declined";
        const newPipeline = action === "accept" ? "hired" : "withdrawn";

        const { error: offerUpdateError } = await supabase
            .from("job_offers")
            .update({
                status: newOfferStatus,
                responded_at: now,
                updated_at: now,
            })
            .eq("id", offer.id);

        if (offerUpdateError) {
            console.error("Error updating offer:", offerUpdateError);
            await logError({
                source: "api/candidate/invitations/offer:POST",
                errorType: "DatabaseError",
                message: offerUpdateError.message,
            });
            return NextResponse.json(
                { success: false, error: "Failed to update offer" },
                { status: 500 }
            );
        }

        const { error: invUpdateError } = await supabase
            .from("job_invitations")
            .update({ pipeline_status: newPipeline, employer_last_seen_at: null })
            .eq("id", invitationId);

        if (invUpdateError) {
            console.error("Error updating invitation pipeline:", invUpdateError);
        }

        // Auto-generate hiring fee payment request when offer is accepted
        if (action === "accept") {
            try {
                const { data: invDetails } = await supabase
                    .from("job_invitations")
                    .select(`
                        id, company_id, employer_id,
                        employer:employers!inner(user_id)
                    `)
                    .eq("id", invitationId)
                    .single();

                if (invDetails) {
                    const empDetails = invDetails.employer as unknown as { user_id: string } | null;
                    // Get a system MIS user to record as creator
                    const { data: sysMis } = await supabase
                        .from("mis_user")
                        .select("user_id")
                        .limit(1)
                        .maybeSingle();

                    if (sysMis) {
                        await createPaymentRequest({
                            company_id: invDetails.company_id,
                            employer_id: invDetails.employer_id,
                            employer_user_id: empDetails?.user_id,
                            payment_type_code: "hiring_fee",
                            reference_invitation_id: invitationId,
                            created_by_mis_user_id: sysMis.user_id,
                        });
                    }
                }
            } catch (payErr) {
                // Non-blocking: log but don't fail the offer acceptance
                console.error("Failed to create hiring fee payment request:", payErr);
            }
        }

        await logBusiness(
            action === "accept" ? "job_offer_accepted" : "job_offer_declined",
            user.id,
            "candidate",
            "job_offer",
            offer.id,
            { invitation_id: invitationId, pipeline_status: newPipeline }
        );

        return NextResponse.json({
            success: true,
            message:
                action === "accept"
                    ? "Offer accepted successfully"
                    : "Offer declined",
        });
    } catch (error) {
        console.error("API error:", error);
        await logError({
            source: "api/candidate/invitations/offer:POST",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
