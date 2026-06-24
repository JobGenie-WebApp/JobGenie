import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";
import Papa from "papaparse";

interface DesignationCSVRow {
    designation_name: string;
    // Industry can be given by id (industry_id) or by name (industry_name).
    industry_id?: string;
    industry_name?: string;
    // Seniority can be given by id (level_id) or by name (seniority_level).
    level_id?: string;
    seniority_level?: string;
}

interface EvaluatedRow {
    row: number;
    valid: boolean;
    error: string | null;
    values: { designation_name: string; industry_name: string; seniority_level: string };
    // Resolved FK ids for valid rows (null when invalid).
    industry_id: number | null;
    level_id: number | null;
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

        // Lookups by name (case-insensitive) and by id, plus id -> name for display.
        const industryByName = new Map(
            industries?.map((ind) => [ind.industry_name.toLowerCase(), ind.industry_id]) || []
        );
        const industryNameById = new Map(
            industries?.map((ind) => [ind.industry_id, ind.industry_name]) || []
        );

        // Fetch seniority levels from the database (MIS-managed, not hardcoded)
        const { data: seniorityLevels, error: seniorityError } = await adminClient
            .from("seniority_levels")
            .select("level_id, level_name");

        if (seniorityError) {
            return NextResponse.json({
                error: "Failed to fetch seniority levels",
                details: seniorityError.message,
            }, { status: 500 });
        }

        const seniorityByName = new Map(
            seniorityLevels?.map((lvl) => [lvl.level_name.toLowerCase(), lvl.level_id]) || []
        );
        const seniorityNameById = new Map(
            seniorityLevels?.map((lvl) => [lvl.level_id, lvl.level_name]) || []
        );
        const validSeniorityNames = (seniorityLevels || [])
            .map((lvl) => lvl.level_name)
            .join(", ");

        // Resolve a foreign key from a CSV row that may supply either an id or a name.
        const resolveFk = (
            idRaw: string,
            nameRaw: string,
            byName: Map<string, number>,
            nameById: Map<number, string>,
        ): { id: number | null; display: string; error: string | null } => {
            // Prefer an explicit id column when present.
            if (idRaw) {
                const parsed = Number(idRaw);
                if (!Number.isInteger(parsed) || !nameById.has(parsed)) {
                    return { id: null, display: idRaw, error: `id "${idRaw}" not found` };
                }
                return { id: parsed, display: nameById.get(parsed)!, error: null };
            }
            if (nameRaw) {
                const id = byName.get(nameRaw.toLowerCase());
                if (!id) {
                    return { id: null, display: nameRaw, error: `"${nameRaw}" not found` };
                }
                return { id, display: nameById.get(id) ?? nameRaw, error: null };
            }
            return { id: null, display: "", error: "missing" };
        };

        const evaluated: EvaluatedRow[] = rows.map((row, index) => {
            const rowNum = index + 2;
            const name = (row.designation_name || "").trim();
            const industryIdRaw = (row.industry_id || "").trim();
            const industryName = (row.industry_name || "").trim();
            const levelIdRaw = (row.level_id || "").trim();
            const seniority = (row.seniority_level || "").trim();

            const industry = resolveFk(industryIdRaw, industryName, industryByName, industryNameById);
            const level = resolveFk(levelIdRaw, seniority, seniorityByName, seniorityNameById);

            // Display resolved names where possible so the preview is human-readable.
            const values = {
                designation_name: name,
                industry_name: industry.display,
                seniority_level: level.display,
            };

            if (!name) {
                return { row: rowNum, valid: false, error: "Designation name is required", values, industry_id: null, level_id: null };
            }
            if (industry.error === "missing") {
                return { row: rowNum, valid: false, error: "Industry is required (industry_id or industry_name)", values, industry_id: null, level_id: null };
            }
            if (industry.error) {
                return { row: rowNum, valid: false, error: `Industry ${industry.error}`, values, industry_id: null, level_id: null };
            }
            if (level.error === "missing") {
                return { row: rowNum, valid: false, error: "Seniority is required (level_id or seniority_level)", values, industry_id: null, level_id: null };
            }
            if (level.error) {
                return {
                    row: rowNum,
                    valid: false,
                    error: levelIdRaw
                        ? `Seniority ${level.error}`
                        : `Invalid seniority level "${seniority}". Valid values: ${validSeniorityNames}`,
                    values,
                    industry_id: null,
                    level_id: null,
                };
            }

            return { row: rowNum, valid: true, error: null, values, industry_id: industry.id, level_id: level.id };
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
                rows: evaluated.map(({ industry_id, level_id, ...rest }) => {
                    void industry_id;
                    void level_id;
                    return rest;
                }),
            });
        }

        if (validRows.length === 0) {
            return NextResponse.json({
                error: "No valid rows to import",
                details: evaluated.filter((e) => !e.valid).map((e) => `Row ${e.row}: ${e.error}`),
            }, { status: 400 });
        }

        const designationsToInsert = validRows.map((row) => ({
            designation_name: row.values.designation_name,
            industry_id: row.industry_id as number,
            level_id: row.level_id as number,
        }));

        const { data: insertedDesignations, error: insertError } = await adminClient
            .from("job_designations")
            .insert(designationsToInsert)
            .select();

        if (insertError) {
            console.error("Error inserting designations:", insertError);
            return NextResponse.json({
                error: "Failed to insert designations",
                details: insertError.message,
            }, { status: 500 });
        }

        const skipped = evaluated.length - validRows.length;
        return NextResponse.json({
            success: true,
            message: `Successfully imported ${insertedDesignations.length} designations${skipped > 0 ? ` (${skipped} skipped)` : ""}`,
            count: insertedDesignations.length,
            skipped,
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
