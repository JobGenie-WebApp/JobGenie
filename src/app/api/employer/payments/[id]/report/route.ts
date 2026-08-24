import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logBusiness, logError } from "@/lib/logger";
import { z } from "zod";

const schema = z.object({
    reason: z.string().trim().min(10, "Please provide a little more detail").max(1000),
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: employer } = await admin
            .from("employers")
            .select("id, company_id, first_name, last_name, company:companies(company_name)")
            .eq("user_id", user.id)
            .single();
        if (!employer) return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });

        const { id } = await params;
        if (!z.string().uuid().safeParse(id).success) {
            return NextResponse.json({ error: "Invalid payment request" }, { status: 400 });
        }
        const parsed = schema.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) {
            return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid report" }, { status: 422 });
        }

        const { data: payment } = await admin
            .from("payment_requests")
            .select("id, amount, currency, description")
            .eq("id", id)
            .eq("company_id", employer.company_id)
            .single();
        if (!payment) return NextResponse.json({ error: "Payment request not found" }, { status: 404 });

        const { data: previousReport } = await admin
            .from("event_logs")
            .select("id")
            .eq("user_id", user.id)
            .eq("action", "payment_suspicious_reported")
            .eq("resource_id", id)
            .limit(1)
            .maybeSingle();
        if (previousReport) {
            return NextResponse.json({ error: "This payment has already been reported" }, { status: 409 });
        }

        const companyRelation = employer.company as unknown as { company_name?: string } | { company_name?: string }[] | null;
        const company = Array.isArray(companyRelation) ? companyRelation[0] : companyRelation;
        const reporter = `${employer.first_name} ${employer.last_name}`.trim() || "An employer";
        const { data: misUsers } = await admin.from("mis_user").select("user_id");
        if (!misUsers?.length) return NextResponse.json({ error: "No MIS reviewer is available" }, { status: 503 });

        const { error: notificationError } = await admin.from("notifications").insert(misUsers.map((mis) => ({
            user_id: mis.user_id,
            type: "payment_suspicious_reported",
            title: "Suspicious Payment Reported",
            body: `${reporter} from ${company?.company_name ?? "a company"} reported payment ${payment.currency} ${Number(payment.amount).toFixed(2)}. Reason: ${parsed.data.reason}`,
            data: { payment_request_id: id, company_id: employer.company_id },
        })));
        if (notificationError) throw notificationError;

        await logBusiness("payment_suspicious_reported", user.id, "employer", "payment_request", id, {
            reason: parsed.data.reason,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        await logError({ source: "api/employer/payments/[id]/report:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
