import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Fetch complete candidate profile with all related data in a single optimized query
        const { data: candidate, error } = await supabase
            .from("candidates")
            .select(`
                id,
                first_name,
                last_name,
                email,
                created_at,
                phone,
                alternative_phone,
                contact_no,
                address,
                country,
                nicPassport,
                dob,
                gender,
                industry,
                current_position,
                years_of_experience,
                experience_level,
                qualifications,
                highest_qualification,
                expected_monthly_salary,
                availability_status,
                notice_period,
                employment_type,
                professional_summary,
                profile_image_url,
                membership_no,
                approval_status,
                resume_url,
                expected_positions,
                work_experiences (
                    id,
                    job_title,
                    company,
                    employment_type,
                    location,
                    location_type,
                    start_date,
                    end_date,
                    description,
                    is_current
                ),
                educations (
                    id,
                    education_type,
                    degree_diploma,
                    professional_qualification,
                    institution,
                    status
                ),
                awards (
                    id,
                    nature_of_award,
                    offered_by,
                    description
                ),
                projects (
                    id,
                    project_name,
                    description,
                    demo_url,
                    is_current
                ),
                certificates (
                    id,
                    certificate_name,
                    issuing_authority,
                    issue_date,
                    expiry_date,
                    credential_id,
                    credential_url,
                    description
                ),
                finance_academic_education (
                    id,
                    degree_diploma,
                    institution,
                    status
                ),
                finance_professional_education (
                    id,
                    professional_qualification,
                    institution,
                    status
                ),
                banking_academic_education (
                    id,
                    degree_diploma,
                    institution,
                    status
                ),
                banking_professional_education (
                    id,
                    professional_qualification,
                    institution,
                    status
                ),
                banking_specialized_training (
                    id,
                    certificate_name,
                    issuing_authority,
                    certificate_issue_month,
                    status
                ),
                industry_specializations (
                    id,
                    industry,
                    specialization,
                    description,
                    years_experience
                )
            `)
            .eq("user_id", user.id)
            .order("start_date", {
                referencedTable: "work_experiences",
                ascending: false
            })
            .single();

        if (error) {
            console.error("Error fetching candidate profile:", error);
            return NextResponse.json(
                { success: false, error: "Failed to fetch profile data" },
                { status: 500 }
            );
        }

        if (!candidate) {
            return NextResponse.json(
                { success: false, error: "Profile not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: candidate
        });
    } catch (error) {
        console.error("API error:", error);
        await logError({ source: "api/candidate/profile:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
