import { NextRequest, NextResponse } from "next/server";
import { processInterviewReminders } from "@/lib/process-interview-reminders";
import { logError } from "@/lib/logger";
import { verifyCronSecret } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * Scheduled job: send interview reminder emails per MIS settings.
 * Secured with Authorization: Bearer <CRON_SECRET> (header only). Vercel Cron
 * sends this header automatically when CRON_SECRET is configured.
 */
export async function GET(request: NextRequest) {
    try {
        if (!verifyCronSecret(request)) {
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
