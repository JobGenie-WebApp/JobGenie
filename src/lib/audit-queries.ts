import { getServerSql, type ServerSql } from "@/lib/db/server-postgres";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server-side aggregations and facets for the MIS audit UI.
 * Prefer direct Postgres (DATABASE_URL) for accurate distincts/aggregations;
 * fall back to Supabase client when SQL is unavailable (sampling for facets only).
 */
export type AuditTopAction = { action: string; count: number };

export type AuditSummary = {
    eventLogTotal: number;
    errorLogTotal: number;
    errorLogUnresolved: number;
    lastEventAt: string | null;
    categoryCounts: Record<string, number>;
    userRoles: string[];
    topActions: AuditTopAction[];
    /** true when user_roles / categories were built from a limited sample (Supabase fallback) */
    facetsAreSampled: boolean;
};

function parseCountRow(row: { c: string } | undefined): number {
    if (!row) return 0;
    const n = Number(row.c);
    return Number.isFinite(n) ? n : 0;
}

export async function fetchAuditSummaryWithPostgres(
    sql: ServerSql
): Promise<AuditSummary> {
    const [
        [eventCount],
        [errorTotal],
        [errorUnresolved],
        [lastEv],
        byCategory,
        roles,
        topAct,
    ] = await Promise.all(
        [
            sql<[{ c: string }]>`SELECT COUNT(*)::text AS c FROM "event_logs"`,
            sql<[{ c: string }]>`SELECT COUNT(*)::text AS c FROM "error_logs"`,
            sql<[{ c: string }]>`SELECT COUNT(*)::text AS c FROM "error_logs" WHERE NOT "resolved"`,
            sql<[{ at: string | null }]>`SELECT (SELECT MAX("created_at") FROM "event_logs")::text AS at`,
            sql<
                { category: string; cnt: string }[]
            >`SELECT "category"::text AS category, COUNT(*)::text AS cnt FROM "event_logs" GROUP BY "category" ORDER BY "category"`,
            sql<
                { r: string }[]
            >`SELECT DISTINCT TRIM("user_role")::text AS r
              FROM "event_logs"
              WHERE "user_role" IS NOT NULL AND BTRIM("user_role"::text) <> ''
              ORDER BY 1`,
            sql<
                { action: string; cnt: string }[]
            >`SELECT "action", COUNT(*)::text AS cnt
              FROM "event_logs"
              GROUP BY "action"
              ORDER BY (COUNT(*))::bigint DESC
              LIMIT 50`,
        ]
    );

    const categoryCounts: Record<string, number> = {};
    for (const row of byCategory) {
        categoryCounts[row.category] = parseInt(row.cnt, 10) || 0;
    }

    const topActions: AuditTopAction[] = (topAct || []).map(
        (row: { action: string; cnt: string }) => ({
            action: row.action,
            count: parseInt(row.cnt, 10) || 0,
        })
    );

    return {
        eventLogTotal: parseCountRow(eventCount),
        errorLogTotal: parseCountRow(errorTotal),
        errorLogUnresolved: parseCountRow(errorUnresolved),
        lastEventAt: lastEv?.at ?? null,
        categoryCounts,
        userRoles: (roles || []).map((x: { r: string }) => x.r).filter(Boolean),
        topActions,
        facetsAreSampled: false,
    };
}

/** Sample from recent rows; distinct sets may miss rare values in very large tables. */
const FACET_SAMPLE_LIMIT = 8_000;

export async function fetchAuditSummaryWithSupabase(): Promise<AuditSummary> {
    const admin = createAdminClient();

    const [eventC, errTotalC, errUnres, lastQ, sample] = await Promise.all([
        admin.from("event_logs").select("id", { count: "exact", head: true }),
        admin.from("error_logs").select("id", { count: "exact", head: true }),
        admin.from("error_logs").select("id", { count: "exact", head: true }).eq("resolved", false),
        admin
            .from("event_logs")
            .select("created_at")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        admin
            .from("event_logs")
            .select("category, user_role, action")
            .order("created_at", { ascending: false })
            .range(0, FACET_SAMPLE_LIMIT - 1),
    ]);

    if (eventC.error) {
        throw new Error(eventC.error.message);
    }
    if (errTotalC.error) {
        throw new Error(errTotalC.error.message);
    }
    if (errUnres.error) {
        throw new Error(errUnres.error.message);
    }
    if (sample.error) {
        throw new Error(sample.error.message);
    }

    const roleSet = new Set<string>();
    const actionMap = new Map<string, number>();
    const seenCategories = new Set<string>();

    for (const row of sample.data || []) {
        const cat = String(row.category ?? "");
        if (cat) {
            seenCategories.add(cat);
        }
        const r = (row.user_role as string | null)?.trim();
        if (r) {
            roleSet.add(r);
        }
        const a = (row.action as string | null)?.trim();
        if (a) {
            actionMap.set(a, (actionMap.get(a) || 0) + 1);
        }
    }

    const categoryCounts: Record<string, number> = {};
    await Promise.all(
        Array.from(seenCategories).map(async (cat) => {
            const { count, error } = await admin
                .from("event_logs")
                .select("id", { count: "exact", head: true })
                .eq("category", cat);
            if (!error) {
                categoryCounts[cat] = count ?? 0;
            }
        })
    );

    const topActions: AuditTopAction[] = Array.from(actionMap.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((x, y) => y.count - x.count)
        .slice(0, 50);

    return {
        eventLogTotal: eventC.count ?? 0,
        errorLogTotal: errTotalC.count ?? 0,
        errorLogUnresolved: errUnres.count ?? 0,
        lastEventAt: (lastQ.data as { created_at?: string } | null)?.created_at ?? null,
        categoryCounts,
        userRoles: Array.from(roleSet).sort(),
        topActions,
        facetsAreSampled: (eventC.count ?? 0) > FACET_SAMPLE_LIMIT,
    };
}

/**
 * Use DATABASE_URL (direct SQL) when available; otherwise fall back to Supabase counts + sampled facets.
 */
export async function getAuditSummary(): Promise<AuditSummary> {
    const sql = getServerSql();
    if (sql) {
        try {
            return await fetchAuditSummaryWithPostgres(sql);
        } catch (e) {
            console.error("[audit] Postgres summary failed, using Supabase fallback:", e);
            return await fetchAuditSummaryWithSupabase();
        }
    }
    return await fetchAuditSummaryWithSupabase();
}
