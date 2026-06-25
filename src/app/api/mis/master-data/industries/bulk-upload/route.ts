import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";
import Papa from "papaparse";

interface IndustryCSVRow {
    industry_name: string;
}

interface EvaluatedRow {
    row: number;
    valid: boolean;
    error: string | null;
    values: { industry_name: string };
}

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
        const mode = (formData.get("mode") as string) || "commit";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const text = await file.text();

        const parseResult = Papa.parse<IndustryCSVRow>(text, {
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

        const evaluated: EvaluatedRow[] = rows.map((row, index) => {
            const rowNum = index + 2;
            const name = (row.industry_name || "").trim();
            if (!name) {
                return {
                    row: rowNum,
                    valid: false,
                    error: "Industry name is required",
                    values: { industry_name: row.industry_name || "" },
                };
            }
            return { row: rowNum, valid: true, error: null, values: { industry_name: name } };
        });

        const validRows = evaluated.filter((e) => e.valid);

        // Preview mode: return per-row validation without writing anything.
        if (mode === "preview") {
            return NextResponse.json({
                success: true,
                mode: "preview",
                summary: {
                    total: evaluated.length,
                    valid: validRows.length,
                    invalid: evaluated.length - validRows.length,
                },
                rows: evaluated,
            });
        }

        if (validRows.length === 0) {
            return NextResponse.json({
                error: "No valid rows to import",
                details: evaluated.filter((e) => !e.valid).map((e) => `Row ${e.row}: ${e.error}`),
            }, { status: 400 });
        }

        // Get max industry_id
        const { data: maxIdData } = await adminClient
            .from("industries")
            .select("industry_id")
            .order("industry_id", { ascending: false })
            .limit(1)
            .single();

        let currentId = (maxIdData?.industry_id || 0);

        const industriesToInsert = validRows.map((row) => ({
            industry_id: ++currentId,
            industry_name: row.values.industry_name,
        }));

        const { data: insertedIndustries, error: insertError } = await adminClient
            .from("industries")
            .insert(industriesToInsert)
            .select();

        if (insertError) {
            console.error("Error inserting industries:", insertError);
            return NextResponse.json({
                error: "Failed to insert industries",
                details: insertError.message,
            }, { status: 500 });
        }

        const skipped = evaluated.length - validRows.length;
        return NextResponse.json({
            success: true,
            message: `Successfully imported ${insertedIndustries.length} industries${skipped > 0 ? ` (${skipped} skipped)` : ""}`,
            count: insertedIndustries.length,
            skipped,
        });
    } catch (error) {
        console.error("Error in POST /api/mis/master-data/industries/bulk-upload:", error);
        await logError({
            source: "api/mis/master-data/industries/bulk-upload:POST",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ error: "Failed to process bulk upload" }, { status: 500 });
    }
}
