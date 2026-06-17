import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";

// DELETE /api/employer/invitations?candidateId=xxx
export async function DELETE(request: Request) {
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

        // Get candidate ID from query params
        const { searchParams } = new URL(request.url);
        const candidateId = searchParams.get("candidateId");

        if (!candidateId) {
            return NextResponse.json(
                { success: false, error: "Missing candidate ID" },
                { status: 400 }
            );
        }

        // Get employer record
        const { data: employer, error: employerError } = await supabase
            .from('employers')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (employerError || !employer) {
            return NextResponse.json(
                { success: false, error: "Employer profile not found" },
                { status: 404 }
            );
        }

        // Soft delete invitation (set canceled flag instead of deleting)
        const { error: updateError } = await supabase
            .from('job_invitations')
            .update({
                invitation_canceled: true,
                canceled_at: new Date().toISOString()
            })
            .eq('candidate_id', candidateId)
            .eq('employer_id', employer.id);

        if (updateError) {
            console.error('Error canceling invitation:', updateError);
            return NextResponse.json(
                { success: false, error: "Failed to cancel invitation" },
                { status: 500 }
            );
        }

        await logBusiness("invitation_canceled", user.id, "employer", "job_invitation", undefined, { candidateId });
        return NextResponse.json({
            success: true,
            message: "Invitation cancelled successfully"
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({ source: "api/employer/invitations/cancel:DELETE", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
