import { NextRequest, NextResponse } from "next/server";
import { processInterviewReminders } from "@/lib/process-interview-reminders";
import { logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Scheduled job: send interview reminder emails per MIS settings.
 * Secure with Authorization: Bearer <CRON_SECRET> or ?secret= (for Vercel Cron).
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

        const result = await processInterviewReminders();
        return NextResponse.json({ success: true, ...result });
    } catch (e) {
        await logError({
            source: "api/cron/interview-reminders:GET",
            errorType: "APIError",
            message: e instanceof Error ? e.message : String(e),
        });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
