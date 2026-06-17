import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { createPaymentRequest } from "@/lib/payments";

// GET /api/mis/payments — list all payment requests with filters
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const url = new URL(request.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
        const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "25", 10)));
        const offset = (page - 1) * limit;
        const search = url.searchParams.get("search") || "";
        const statusFilter = url.searchParams.get("status") || "";
        const typeFilter = url.searchParams.get("type") || "";
        const companyId = url.searchParams.get("companyId") || "";
        const dateFrom = url.searchParams.get("dateFrom") || "";
        const dateTo = url.searchParams.get("dateTo") || "";

        let query = admin
            .from("payment_requests")
            .select(`
                id, company_id, employer_id, payment_type_id, amount, currency,
                description, due_date, status, bank_transfer_reference,
                created_at, updated_at,
                companies(id, company_name, industry),
                employers(id, first_name, last_name, email, designation),
                payment_types(id, code, label),
                payment_proofs(id, status, uploaded_at, file_url, file_name)
            `, { count: "exact" });

        if (search) {
            query = query.ilike("companies.company_name", `%${search}%`);
        }
        if (statusFilter) query = query.eq("status", statusFilter);
        if (companyId) query = query.eq("company_id", companyId);
        if (dateFrom) query = query.gte("created_at", dateFrom);
        if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59Z");

        // Filter by payment type code
        if (typeFilter) {
            const { data: pt } = await admin.from("payment_types").select("id").eq("code", typeFilter).single();
            if (pt) query = query.eq("payment_type_id", pt.id);
        }

        const { data, error, count } = await query
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data ?? [],
            pagination: { page, limit, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) },
        });
    } catch (error) {
        await logError({ source: "api/mis/payments:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/mis/payments — manually create a payment request
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createAdminClient();
        const { data: userData } = await admin.from("users").select("role").eq("id", user.id).single();
        if (userData?.role !== "mis") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Get MIS user record
        const { data: misUser } = await admin.from("mis_user").select("user_id").eq("user_id", user.id).single();
        if (!misUser) return NextResponse.json({ error: "MIS user profile not found" }, { status: 404 });

        const body = await request.json();
        const {
            company_id,
            employer_id,
            payment_type_code,
            reference_job_id,
            reference_invitation_id,
            amount,
            currency,
            description,
            due_date,
        } = body;

        if (!company_id || !payment_type_code) {
            return NextResponse.json({ error: "company_id and payment_type_code are required" }, { status: 400 });
        }

        // Get employer user_id for notification if employer_id provided
        let employer_user_id: string | undefined;
        if (employer_id) {
            const { data: emp } = await admin.from("employers").select("user_id").eq("id", employer_id).single();
            employer_user_id = emp?.user_id;
        }

        const paymentRequestId = await createPaymentRequest({
            company_id,
            employer_id,
            employer_user_id,
            payment_type_code,
            reference_job_id,
            reference_invitation_id,
            amount,
            currency,
            description,
            due_date,
            created_by_mis_user_id: misUser.user_id,
        });

        return NextResponse.json({ success: true, data: { id: paymentRequestId } }, { status: 201 });
    } catch (error) {
        await logError({ source: "api/mis/payments:POST", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
    }
}
