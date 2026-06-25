import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";
import Papa from "papaparse";

interface SeniorityLevelCSVRow {
    level_name: string;
    level_order: string;
}

interface EvaluatedRow {
    row: number;
    valid: boolean;
    error: string | null;
    values: { level_name: string; level_order: string };
    // Parsed order (> 0) when explicitly provided; null means "append".
    order: number | null;
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

        const parseResult = Papa.parse<SeniorityLevelCSVRow>(text, {
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
            const name = (row.level_name || "").trim();
            const orderRaw = row.level_order !== undefined ? String(row.level_order).trim() : "";

            if (!name) {
                return {
                    row: rowNum,
                    valid: false,
                    error: "Level name is required",
                    values: { level_name: row.level_name || "", level_order: orderRaw },
                    order: null,
                };
            }

            // level_order is optional; fall back to sequential ordering at commit time.
            let order: number | null = null;
            if (orderRaw !== "") {
                const parsed = Number(orderRaw);
                if (!Number.isFinite(parsed) || parsed <= 0) {
                    return {
                        row: rowNum,
                        valid: false,
                        error: "Order must be a positive number",
                        values: { level_name: name, level_order: orderRaw },
                        order: null,
                    };
                }
                order = parsed;
            }

            return {
                row: rowNum,
                valid: true,
                error: null,
                values: { level_name: name, level_order: orderRaw },
                order,
            };
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
                rows: evaluated.map(({ order, ...rest }) => { void order; return rest; }),
            });
        }

        if (validRows.length === 0) {
            return NextResponse.json({
                error: "No valid rows to import",
                details: evaluated.filter((e) => !e.valid).map((e) => `Row ${e.row}: ${e.error}`),
            }, { status: 400 });
        }

        // Get max level_id and level_order to append new rows.
        const { data: maxIdData } = await adminClient
            .from("seniority_levels")
            .select("level_id")
            .order("level_id", { ascending: false })
            .limit(1)
            .single();

        const { data: maxOrderData } = await adminClient
            .from("seniority_levels")
            .select("level_order")
            .order("level_order", { ascending: false })
            .limit(1)
            .single();

        let currentId = maxIdData?.level_id || 0;
        let currentOrder = maxOrderData?.level_order || 0;

        const levelsToInsert = validRows.map((row) => ({
            level_id: ++currentId,
            level_name: row.values.level_name,
            // Use provided order when given (> 0), otherwise append sequentially.
            level_order: row.order && row.order > 0 ? row.order : ++currentOrder,
        }));

        const { data: insertedLevels, error: insertError } = await adminClient
            .from("seniority_levels")
            .insert(levelsToInsert)
            .select();

        if (insertError) {
            console.error("Error inserting seniority levels:", insertError);
            return NextResponse.json({
                error: "Failed to insert seniority levels",
                details: insertError.message,
            }, { status: 500 });
        }

        const skipped = evaluated.length - validRows.length;
        return NextResponse.json({
            success: true,
            message: `Successfully imported ${insertedLevels.length} seniority levels${skipped > 0 ? ` (${skipped} skipped)` : ""}`,
            count: insertedLevels.length,
            skipped,
        });
    } catch (error) {
        console.error("Error in POST /api/mis/master-data/seniority-levels/bulk-upload:", error);
        await logError({
            source: "api/mis/master-data/seniority-levels/bulk-upload:POST",
            errorType: "APIError",
            message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ error: "Failed to process bulk upload" }, { status: 500 });
    }
}
