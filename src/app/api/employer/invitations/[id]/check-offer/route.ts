import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

// GET /api/employer/invitations/[id]/check-offer
// Check if a job offer exists for this invitation
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

        // Verify invitation belongs to this company
        const { data: invitation } = await supabase
            .from('job_invitations')
            .select('id, company_id')
            .eq('id', invitationId)
            .eq('company_id', employer.company_id)
            .single();

        if (!invitation) {
            return NextResponse.json(
                { success: false, error: "Invitation not found or unauthorized" },
                { status: 404 }
            );
        }

        // Check if offer exists
        const { data: offer } = await supabase
            .from('job_offers')
            .select('*')
            .eq('invitation_id', invitationId)
            .maybeSingle();

        return NextResponse.json({
            success: true,
            exists: !!offer,
            offer: offer || null
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({
            source: "api/employer/invitations/check-offer:GET",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error)
        });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
