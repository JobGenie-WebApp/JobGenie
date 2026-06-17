import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify user is MIS admin
        const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        if (!userData || userData.role !== "mis") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Await params in Next.js 15
        const { id: candidateId } = await params;

        // Fetch candidate with all related data
        const { data: candidate, error } = await supabase
            .from("candidates")
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
                expected_monthly_salary,
                availability_status,
                notice_period,
                employment_type,
                professional_summary,
                approval_status,
                rejection_reason,
                membership_no,
                resume_url,
                profile_image_url,
                work_experiences (
                    job_title,
                    company,
                    start_date,
                    end_date,
                    is_current
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
            .eq("id", candidateId)
            .single();

        if (error) {
            console.error("Error fetching candidate:", error);
            return NextResponse.json({ error: "Failed to fetch candidate" }, { status: 500 });
        }

        return NextResponse.json(candidate);
    } catch (error) {
        console.error("API error:", error);
        await logError({ source: "api/mis/candidates/[id]:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
