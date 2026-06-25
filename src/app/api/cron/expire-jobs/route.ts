import { NextRequest, NextResponse } from "next/server";
import { processJobExpiry } from "@/lib/process-job-expiry";
import { logError } from "@/lib/logger";
import { verifyCronSecret } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * Scheduled job: expire job advertisements whose validity period has ended.
 * Runs daily. Secured with Authorization: Bearer <CRON_SECRET> (header only).
 */
export async function GET(request: NextRequest) {
    try {
        if (!verifyCronSecret(request)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const result = await processJobExpiry();
        return NextResponse.json({ success: true, ...result });
    } catch (e) {
        await logError({
            source: "api/cron/expire-jobs:GET",
            errorType: "APIError",
            message: e instanceof Error ? e.message : String(e),
        });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
