import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";
import Papa from "papaparse";

interface DesignationCSVRow {
    designation_name: string;
    industry_name: string;
    seniority_level: string;
}

const SENIORITY_LEVELS_MAP: Record<string, number> = {
    "entry level": 1,
    "junior": 2,
    "mid level": 3,
    "mid-level": 3,
    "senior": 4,
    "lead": 5,
    "principal": 6,
};

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const adminClient = createAdminClient();
        const { data: misUser, error: misUserError } = await adminClient
            .from("mis_user")
            .select("is_super_admin")
            .eq("user_id", user.id)
            .single();

        if (misUserError || !misUser || !misUser.is_super_admin) {
            return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const text = await file.text();

        const parseResult = Papa.parse<DesignationCSVRow>(text, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, "_"),
        });

        if (parseResult.errors.length > 0) {
            return NextResponse.json({
                error: "CSV parsing failed",
                details: parseResult.errors,
            }, { status: 400 });
        }

        const rows = parseResult.data;

        if (rows.length === 0) {
            return NextResponse.json({ error: "No data found in CSV" }, { status: 400 });
        }

        // Fetch existing industries
        const { data: industries, error: industriesError } = await adminClient
            .from("industries")
            .select("industry_id, industry_name");

        if (industriesError) {
            return NextResponse.json({
                error: "Failed to fetch industries",
                details: industriesError.message,
            }, { status: 500 });
        }

        const industryMap = new Map(
            industries?.map((ind) => [ind.industry_name.toLowerCase(), ind.industry_id]) || []
        );

        const errors: string[] = [];
        const validRows: Array<{
            designation_name: string;
            industry_id: number;
            level_id: number;
        }> = [];

        rows.forEach((row, index) => {
            const rowNum = index + 2;

            if (!row.designation_name || !row.designation_name.trim()) {
                errors.push(`Row ${rowNum}: Designation name is required`);
                return;
            }

            if (!row.industry_name || !row.industry_name.trim()) {
                errors.push(`Row ${rowNum}: Industry name is required`);
                return;
            }

            if (!row.seniority_level || !row.seniority_level.trim()) {
                errors.push(`Row ${rowNum}: Seniority level is required`);
                return;
            }

            const industryId = industryMap.get(row.industry_name.trim().toLowerCase());
            if (!industryId) {
                errors.push(`Row ${rowNum}: Industry "${row.industry_name}" not found`);
                return;
            }

            const levelId = SENIORITY_LEVELS_MAP[row.seniority_level.trim().toLowerCase()];
            if (!levelId) {
                errors.push(
                    `Row ${rowNum}: Invalid seniority level "${row.seniority_level}". Valid values: Entry Level, Junior, Mid Level, Senior, Lead, Principal`
                );
                return;
            }

            validRows.push({
                designation_name: row.designation_name.trim(),
                industry_id: industryId,
                level_id: levelId,
            });
        });

        if (errors.length > 0) {
            return NextResponse.json({
                error: "Validation failed",
                details: errors,
            }, { status: 400 });
        }

        const { data: insertedDesignations, error: insertError } = await adminClient
            .from("job_designations")
            .insert(validRows)
            .select();

        if (insertError) {
            console.error("Error inserting designations:", insertError);
            return NextResponse.json({
                error: "Failed to insert designations",
                details: insertError.message,
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Successfully imported ${insertedDesignations.length} designations`,
            count: insertedDesignations.length,
        });
    } catch (error) {
        console.error("Error in POST /api/mis/master-data/designations/bulk-upload:", error);
        await logError({
            source: "api/mis/master-data/designations/bulk-upload:POST",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ error: "Failed to process bulk upload" }, { status: 500 });
    }
}
