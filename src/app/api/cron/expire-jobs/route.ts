import { NextRequest, NextResponse } from "next/server";
import { processJobExpiry } from "@/lib/process-job-expiry";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Scheduled job: expire job advertisements whose validity period has ended.
 * Runs daily. Secure with Authorization: Bearer <CRON_SECRET> or ?secret=
 */
export async function GET(request: NextRequest) {
    try {
        const secret =
            request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
            request.nextUrl.searchParams.get("secret");
        const expected = process.env.CRON_SECRET;

        if (!expected || secret !== expected) {
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
