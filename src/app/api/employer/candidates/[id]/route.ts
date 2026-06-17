import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();

        // Verify employer authentication
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify user is an employer
        const { data: employerData } = await supabase
            .from('employers')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!employerData) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Await params as required by Next.js 15
        const { id: candidateId } = await params;

        // Fetch complete candidate profile - only approved candidates
        const { data: candidate, error } = await supabase
            .from('candidates')
            .select(`
                id,
                first_name,
                last_name,
                email,
                phone,
                alternative_phone,
                address,
                country,
                industry,
                current_position,
                years_of_experience,
                experience_level,
                employment_type,
                expected_monthly_salary,
                availability_status,
                notice_period,
                professional_summary,
                membership_no,
                resume_url,
                profile_image_url,
                qualifications,
                highest_qualification,
                work_experiences (
                    job_title,
                    company,
                    start_date,
                    end_date,
                    is_current,
                    description
                ),
                educations (
                    degree_diploma,
                    institution,
                    status
                ),
                awards (
                    nature_of_award,
                    offered_by
                ),
                projects (
                    project_name,
                    description
                ),
                certificates (
                    certificate_name,
                    issuing_authority
                )
            `)
            .eq('id', candidateId)
            .eq('approval_status', 'approved')
            .single();

        if (error || !candidate) {
            return NextResponse.json(
                { error: "Candidate not found or not approved" },
                { status: 404 }
            );
        }

        return NextResponse.json(candidate);
    } catch (error) {
        console.error("Error fetching candidate:", error);
        await logError({ source: "api/employer/candidates/[id]:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
