import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized - Please log in" },
                { status: 401 }
            );
        }

        // Verify user is MIS user
        const adminClient = createAdminClient();
        const { data: userRecord, error: userError } = await adminClient
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        if (userError || !userRecord || userRecord.role !== "mis") {
            return NextResponse.json(
                { error: "Forbidden - MIS access required" },
                { status: 403 }
            );
        }

        // Get query parameters for filtering
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status"); // confirmed, pending, cancelled
        const industry = searchParams.get("industry");
        const mode = searchParams.get("mode"); // online, physical
        const dateFrom = searchParams.get("dateFrom");
        const dateTo = searchParams.get("dateTo");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "500");

        // Build query - fetch all job invitations
        let query = adminClient
            .from("job_invitations")
            .select(`
                id,
                status,
                industry,
                job_designation,
                given_time_slots,
                alternative_dates,
                selected_time_slot,
                interview_mode,
                interview_confirmed,
                confirmed_time,
                meeting_link,
                interview_address,
                map_link,
                confirmed_at,
                invitation_canceled,
                canceled_by,
                cancellation_reason,
                canceled_at,
                sent_at,
                viewed_at,
                responded_at,
                mis_rescheduled,
                mis_rescheduled_at,
                mis_rescheduled_by,
                mis_reschedule_data,
                candidate:candidates!inner(
                    id,
                    first_name,
                    last_name,
                    email,
                    industry,
                    current_position,
                    profile_image_url
                ),
                employer:employers!inner(
                    id,
                    first_name,
                    last_name,
                    email,
                    designation,
                    company_id
                ),
                company:companies!inner(
                    id,
                    company_name,
                    industry,
                    logo_url
                )
            `);

        // Apply filters
        if (status) {
            if (status === "confirmed") {
                query = query.eq("interview_confirmed", true).eq("invitation_canceled", false);
            } else if (status === "pending") {
                query = query.eq("interview_confirmed", false).eq("invitation_canceled", false);
            } else if (status === "cancelled") {
                query = query.eq("invitation_canceled", true);
            }
        }

        if (industry) {
            query = query.eq("industry", industry);
        }

        if (mode) {
            query = query.eq("interview_mode", mode);
        }

        if (dateFrom) {
            query = query.gte("sent_at", dateFrom);
        }

        if (dateTo) {
            query = query.lte("sent_at", dateTo);
        }

        // Get total count for pagination
        const { count } = await query;

        // Apply ordering and pagination
        const offset = (page - 1) * limit;
        query = query
            .order("sent_at", { ascending: false })
            .range(offset, offset + limit - 1);

        const { data: interviews, error: fetchError } = await query;

        if (fetchError) {
            console.error("Error fetching interviews:", fetchError);
            return NextResponse.json(
                { error: "Failed to fetch interviews" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            interviews: interviews || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching interviews:", error);
        await logError({ source: "api/mis/interviews:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { error: "Failed to fetch interviews" },
            { status: 500 }
        );
    }
}
