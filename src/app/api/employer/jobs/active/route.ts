import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
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

        // Get pagination parameters with defaults
        const url = new URL(request.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
        const offset = (page - 1) * limit;

        // Fetch total count and paginated results in parallel
        const [{ count: totalCount }, { data: jobs, error: jobsError }] = await Promise.all([
            supabase
                .from('jobs')
                .select('id', { count: 'exact', head: true })
                .eq('employer_id', employer.id)
                .eq('status', 'published'),
            supabase
                .from('jobs')
                .select('id, job_title, location, job_type, deadline')
                .eq('employer_id', employer.id)
                .eq('status', 'published')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1),
        ]);

        if (jobsError) {
            console.error('Error fetching jobs:', jobsError);
            return NextResponse.json(
                { success: false, error: "Failed to fetch jobs" },
                { status: 500 }
            );
        }

        const response = NextResponse.json({
            success: true,
            data: jobs || [],
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
        await logError({ source: "api/employer/jobs/active:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
