import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { getHiringFeePercentage } from "@/lib/payments";
import { computeHiringFee, type SalaryPeriod } from "@/lib/hiring-fee";
// Nested embeds come back as an object or a single-element array depending on
// how PostgREST resolves the relationship; normalise both to one row.
import { one } from "@/lib/payment-embed";

// A hire is the tuple (accepted JobOffer + invitation with pipeline_status
// 'hired'); there is no separate placement record. This route joins that tuple
// to its hiring fee so MIS can see, company by company, who was hired and
// whether the employer has been billed for them.

interface HireRow {
    id: string;
    company_id: string;
    candidate: { first_name: string; last_name: string; email: string } | null;
    company: { id: string; company_name: string; industry: string } | null;
    employer: { first_name: string; last_name: string; email: string } | null;
    job: { id: string; job_title: string } | null;
    job_offer: {
        salary_amount: number | null;
        salary_currency: string | null;
        salary_period: string | null;
        responded_at: string | null;
    } | null;
    payment_request: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        due_date: string | null;
    } | null;
}

// GET /api/mis/placements — hired candidates grouped by company, with fee status
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
        const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
        const search = url.searchParams.get("search") || "";
        const companyId = url.searchParams.get("companyId") || "";
        const unbilledOnly = url.searchParams.get("billed") === "false";
        const dateFrom = url.searchParams.get("dateFrom") || "";
        const dateTo = url.searchParams.get("dateTo") || "";

        let query = admin
            .from("job_invitations")
            .select(`
                id, company_id,
                candidate:candidates!job_invitations_candidate_id_fkey(first_name, last_name, email),
                company:companies!job_invitations_company_id_fkey(id, company_name, industry),
                employer:employers!job_invitations_employer_id_fkey(first_name, last_name, email),
                job:jobs!job_invitations_job_id_fkey(id, job_title),
                job_offer:job_offers!job_offers_invitation_id_fkey(salary_amount, salary_currency, salary_period, responded_at),
                payment_request:payment_requests!payment_requests_reference_invitation_id_fkey(id, amount, currency, status, due_date)
            `)
            .eq("pipeline_status", "hired");

        if (companyId) query = query.eq("company_id", companyId);

        const { data, error } = await query;
        if (error) throw error;

        const hiringFeePct = await getHiringFeePercentage();

        // Flatten the embeds, derive the expected fee, and apply the filters that
        // depend on joined data (hire date lives on the offer, not the invitation).
        const hires = (data ?? []).map((row) => {
            const r = row as unknown as Record<string, unknown>;
            const offer = one(r.job_offer as HireRow["job_offer"]);
            const paymentRequest = one(r.payment_request as HireRow["payment_request"]);
            const salaryAmount = offer?.salary_amount != null ? Number(offer.salary_amount) : null;

            return {
                invitation_id: r.id as string,
                company_id: r.company_id as string,
                candidate: one(r.candidate as HireRow["candidate"]),
                company: one(r.company as HireRow["company"]),
                employer: one(r.employer as HireRow["employer"]),
                job: one(r.job as HireRow["job"]),
                hired_at: offer?.responded_at ?? null,
                salary_amount: salaryAmount,
                salary_currency: offer?.salary_currency ?? "LKR",
                salary_period: offer?.salary_period ?? "monthly",
                // Shown even when unbilled, so MIS sees what should have been charged.
                expected_fee: computeHiringFee(
                    salaryAmount,
                    (offer?.salary_period ?? "monthly") as SalaryPeriod,
                    hiringFeePct
                ),
                payment_request: paymentRequest,
                billed: paymentRequest != null,
            };
        }).filter((h) => {
            if (unbilledOnly && h.billed) return false;
            if (search && !(h.company?.company_name ?? "").toLowerCase().includes(search.toLowerCase())) return false;
            if (dateFrom && (!h.hired_at || h.hired_at < dateFrom)) return false;
            if (dateTo && (!h.hired_at || h.hired_at > dateTo + "T23:59:59Z")) return false;
            return true;
        });

        // Group by company; unbilled hires float to the top so a missed payment
        // is the first thing MIS sees.
        const groups = new Map<string, {
            company_id: string;
            company_name: string;
            industry: string | null;
            hire_count: number;
            total_fees: number;
            outstanding: number;
            unbilled_count: number;
            currency: string;
            hires: typeof hires;
        }>();

        for (const h of hires) {
            let g = groups.get(h.company_id);
            if (!g) {
                g = {
                    company_id: h.company_id,
                    company_name: h.company?.company_name ?? "Unknown company",
                    industry: h.company?.industry ?? null,
                    hire_count: 0,
                    total_fees: 0,
                    outstanding: 0,
                    unbilled_count: 0,
                    currency: h.salary_currency,
                    hires: [],
                };
                groups.set(h.company_id, g);
            }
            g.hire_count++;
            g.hires.push(h);
            const fee = h.payment_request ? Number(h.payment_request.amount) : (h.expected_fee ?? 0);
            g.total_fees += fee;
            if (!h.payment_request) {
                g.unbilled_count++;
                g.outstanding += fee;
            } else if (h.payment_request.status !== "verified" && h.payment_request.status !== "cancelled") {
                g.outstanding += fee;
            }
        }

        const all = Array.from(groups.values()).sort((a, b) => {
            if (a.unbilled_count !== b.unbilled_count) return b.unbilled_count - a.unbilled_count;
            return b.outstanding - a.outstanding;
        });

        for (const g of all) {
            g.hires.sort((a, b) => (b.hired_at ?? "").localeCompare(a.hired_at ?? ""));
        }

        const offset = (page - 1) * limit;
        const pageItems = all.slice(offset, offset + limit);

        return NextResponse.json({
            success: true,
            data: pageItems,
            summary: {
                hiring_fee_percentage: hiringFeePct,
                total_hires: hires.length,
                total_companies: all.length,
                unbilled_hires: hires.filter((h) => !h.billed).length,
                outstanding: all.reduce((sum, g) => sum + g.outstanding, 0),
            },
            pagination: { page, limit, total: all.length, pages: Math.ceil(all.length / limit) },
        });
    } catch (error) {
        await logError({ source: "api/mis/placements:GET", errorType: "APIError", message: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
