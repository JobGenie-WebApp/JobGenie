import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export const dynamic = 'force-dynamic';

// GET /api/employer/invitations/pending-count
export async function GET() {
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

        // Get employer record
        const { data: employer, error: employerError } = await supabase
            .from('employers')
            .select('id, company_id')
            .eq('user_id', user.id)
            .single();

        if (employerError || !employer) {
            return NextResponse.json(
                { success: false, error: "Employer profile not found" },
                { status: 404 }
            );
        }

        // Invitations with updates the employer has not opened yet (employer_last_seen_at IS NULL)
        const { count, error: countError } = await supabase
            .from('job_invitations')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', employer.company_id)
            .eq('invitation_canceled', false)
            .is('employer_last_seen_at', null);

        if (countError) {
            console.error('Error counting pending invitations:', countError);
            return NextResponse.json(
                { success: false, error: "Failed to count pending invitations" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            count: count || 0
        });

    } catch (error) {
        console.error('API error:', error);
        await logError({ source: "api/employer/invitations/pending-count:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
