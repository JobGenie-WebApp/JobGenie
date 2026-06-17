import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export const dynamic = 'force-dynamic';

// GET /api/candidate/invitations
export async function GET(request: NextRequest) {
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

        // Get pagination parameters with defaults
        const url = new URL(request.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
        const offset = (page - 1) * limit;

        // Fetch total count and paginated results in parallel
        const [{ count: totalCount }, { data: invitations, error: invitationsError }] = await Promise.all([
            supabase
                .from('job_invitations')
                .select('id', { count: 'exact', head: true })
                .eq('candidate_id', candidate.id),
            supabase
                .from('job_invitations')
                .select(`
                    id,
                    industry,
                    job_designation,
                    message,
                    given_time_slots,
                    alternative_dates,
                    status,
                    interview_confirmed,
                    pipeline_status,
                    current_round_number,
                    invitation_canceled,
                    mis_rescheduled,
                    canceled_by,
                    cancellation_reason,
                    canceled_at,
                    sent_at,
                    viewed_at,
                    job_offers(id, status),
                    employer:employers(id, user_id),
                    company:companies(company_name, logo_url, industry, headoffice_location)
                `)
                .eq('candidate_id', candidate.id)
                .order('sent_at', { ascending: false })
                .range(offset, offset + limit - 1),
        ]);

        if (invitationsError) {
            console.error('Error fetching invitations:', invitationsError);
            return NextResponse.json(
                { success: false, error: "Failed to fetch invitations" },
                { status: 500 }
            );
        }

        const response = NextResponse.json({
            success: true,
            data: invitations || [],
            pagination: {
                page,
                limit,
                offset,
                total: totalCount || 0,
                pages: Math.ceil((totalCount || 0) / limit),
            }
        });

        // Add Cache-Control header (short TTL for user-specific data)
        response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120');

        return response;

    } catch (error) {
        console.error('API error:', error);
        await logError({ source: "api/candidate/invitations:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
