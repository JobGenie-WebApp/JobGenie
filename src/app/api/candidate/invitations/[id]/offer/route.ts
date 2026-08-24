import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";
import { createHiringFeeForInvitation, notifyMisHiringFeeFailed } from "@/lib/payments";

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

        // Keep the source application (if any) in sync with the pipeline outcome
        const { data: bridgedInvitation } = await supabase
            .from("job_invitations")
            .select("application_id")
            .eq("id", invitationId)
            .maybeSingle();
        if (bridgedInvitation?.application_id) {
            await supabase
                .from("job_applications")
                .update({
                    status: action === "accept" ? "hired" : "withdrawn",
                    updated_at: now,
                })
                .eq("id", bridgedInvitation.application_id);
        }

        // Auto-generate the hiring fee once the candidate accepts. Non-blocking:
        // a billing glitch must not un-hire the candidate — but it is made loud,
        // or the hire goes unbilled with nobody knowing.
        if (action === "accept") {
            try {
                await createHiringFeeForInvitation(invitationId);
            } catch (payErr) {
                const reason = payErr instanceof Error ? payErr.message : String(payErr);
                console.error("Failed to create hiring fee payment request:", payErr);
                await logError({
                    source: "api/candidate/invitations/offer:POST",
                    errorType: "HiringFeeCreationFailed",
                    message: `Invitation ${invitationId}: ${reason}`,
                });
                const { data: ctx } = await supabase
                    .from("job_invitations")
                    .select(`
                        candidate:candidates!job_invitations_candidate_id_fkey(first_name, last_name),
                        company:companies!job_invitations_company_id_fkey(company_name)
                    `)
                    .eq("id", invitationId)
                    .maybeSingle();
                const cand = Array.isArray(ctx?.candidate) ? ctx?.candidate[0] : ctx?.candidate;
                const comp = Array.isArray(ctx?.company) ? ctx?.company[0] : ctx?.company;
                await notifyMisHiringFeeFailed({
                    invitation_id: invitationId,
                    company_name: comp?.company_name ?? "A company",
                    candidate_name: cand ? `${cand.first_name} ${cand.last_name}` : "a candidate",
                    reason,
                }).catch((notifyErr) =>
                    console.error("Failed to notify MIS of hiring fee failure:", notifyErr)
                );
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
