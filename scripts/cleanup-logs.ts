/**
 * Log Cleanup Script
 * ------------------
 * Deletes old log entries based on configurable retention periods.
 *
 * Usage:
 *   npx tsx scripts/cleanup-logs.ts              # Dry-run (default)
 *   npx tsx scripts/cleanup-logs.ts --execute     # Actually delete rows
 *   npx tsx scripts/cleanup-logs.ts --verbose     # Show more detail
 *
 * Prerequisites:
 *   npm install -D tsx  (if not already installed)
 *
 * Environment:
 *   Loads .env/.env.local via @next/env (same as Next.js)
 *   Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

// Load .env files the same way Next.js does
loadEnvConfig(process.cwd());

// ============================================
// CONFIGURATION
// ============================================

/** Retention periods in days */
const RETENTION = {
    event_logs: 90,
    api_request_logs: 30,
    error_logs_resolved: 90,
    error_logs_unresolved: 180,
} as const;

/** Max rows to delete per batch to avoid timeouts */
const BATCH_SIZE = 1000;

// ============================================
// HELPERS
// ============================================

function daysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
}

function log(msg: string) {
    console.log(`[cleanup] ${msg}`);
}

// ============================================
// MAIN
// ============================================

async function main() {
    const args = process.argv.slice(2);
    const dryRun = !args.includes("--execute");
    const verbose = args.includes("--verbose");

    if (dryRun) {
        log("🔍 DRY-RUN MODE — no rows will be deleted. Pass --execute to delete.");
    } else {
        log("⚠️  EXECUTE MODE — rows will be permanently deleted.");
    }

    // Validate env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    let totalDeleted = 0;

    // ── 1. Event Logs ──────────────────────────────────────────────
    {
        const cutoff = daysAgo(RETENTION.event_logs);
        log(`\n📋 event_logs — retention: ${RETENTION.event_logs} days (before ${cutoff.split("T")[0]})`);

        const { count } = await supabase
            .from("event_logs")
            .select("id", { count: "exact", head: true })
            .lt("created_at", cutoff);

        log(`   Found ${count ?? 0} rows to delete`);

        if (!dryRun && count && count > 0) {
            let deleted = 0;
            while (deleted < count) {
                const { data, error } = await supabase
                    .from("event_logs")
                    .delete()
                    .lt("created_at", cutoff)
                    .limit(BATCH_SIZE)
                    .select("id");

                if (error) {
                    console.error("   ❌ Error deleting event_logs:", error.message);
                    break;
                }

                const batchCount = data?.length ?? 0;
                deleted += batchCount;
                if (verbose) log(`   Deleted batch: ${batchCount} (total: ${deleted})`);
                if (batchCount < BATCH_SIZE) break; // No more rows
            }
            log(`   ✅ Deleted ${deleted} rows from event_logs`);
            totalDeleted += deleted;
        }
    }

    // ── 2. API Request Logs ────────────────────────────────────────
    {
        const cutoff = daysAgo(RETENTION.api_request_logs);
        log(`\n📋 api_request_logs — retention: ${RETENTION.api_request_logs} days (before ${cutoff.split("T")[0]})`);

        const { count } = await supabase
            .from("api_request_logs")
            .select("id", { count: "exact", head: true })
            .lt("created_at", cutoff);

        log(`   Found ${count ?? 0} rows to delete`);

        if (!dryRun && count && count > 0) {
            let deleted = 0;
            while (deleted < count) {
                const { data, error } = await supabase
                    .from("api_request_logs")
                    .delete()
                    .lt("created_at", cutoff)
                    .limit(BATCH_SIZE)
                    .select("id");

                if (error) {
                    console.error("   ❌ Error deleting api_request_logs:", error.message);
                    break;
                }

                const batchCount = data?.length ?? 0;
                deleted += batchCount;
                if (verbose) log(`   Deleted batch: ${batchCount} (total: ${deleted})`);
                if (batchCount < BATCH_SIZE) break;
            }
            log(`   ✅ Deleted ${deleted} rows from api_request_logs`);
            totalDeleted += deleted;
        }
    }

    // ── 3. Error Logs (resolved) ───────────────────────────────────
    {
        const cutoff = daysAgo(RETENTION.error_logs_resolved);
        log(`\n📋 error_logs (resolved) — retention: ${RETENTION.error_logs_resolved} days (before ${cutoff.split("T")[0]})`);

        const { count } = await supabase
            .from("error_logs")
            .select("id", { count: "exact", head: true })
            .eq("resolved", true)
            .lt("created_at", cutoff);

        log(`   Found ${count ?? 0} resolved rows to delete`);

        if (!dryRun && count && count > 0) {
            let deleted = 0;
            while (deleted < count) {
                const { data, error } = await supabase
                    .from("error_logs")
                    .delete()
                    .eq("resolved", true)
                    .lt("created_at", cutoff)
                    .limit(BATCH_SIZE)
                    .select("id");

                if (error) {
                    console.error("   ❌ Error deleting resolved error_logs:", error.message);
                    break;
                }

                const batchCount = data?.length ?? 0;
                deleted += batchCount;
                if (verbose) log(`   Deleted batch: ${batchCount} (total: ${deleted})`);
                if (batchCount < BATCH_SIZE) break;
            }
            log(`   ✅ Deleted ${deleted} resolved rows from error_logs`);
            totalDeleted += deleted;
        }
    }

    // ── 4. Error Logs (unresolved) ─────────────────────────────────
    {
        const cutoff = daysAgo(RETENTION.error_logs_unresolved);
        log(`\n📋 error_logs (unresolved) — retention: ${RETENTION.error_logs_unresolved} days (before ${cutoff.split("T")[0]})`);

        const { count } = await supabase
            .from("error_logs")
            .select("id", { count: "exact", head: true })
            .eq("resolved", false)
            .lt("created_at", cutoff);

        log(`   Found ${count ?? 0} unresolved rows to delete`);

        if (!dryRun && count && count > 0) {
            let deleted = 0;
            while (deleted < count) {
                const { data, error } = await supabase
                    .from("error_logs")
                    .delete()
                    .eq("resolved", false)
                    .lt("created_at", cutoff)
                    .limit(BATCH_SIZE)
                    .select("id");

                if (error) {
                    console.error("   ❌ Error deleting unresolved error_logs:", error.message);
                    break;
                }

                const batchCount = data?.length ?? 0;
                deleted += batchCount;
                if (verbose) log(`   Deleted batch: ${batchCount} (total: ${deleted})`);
                if (batchCount < BATCH_SIZE) break;
            }
            log(`   ✅ Deleted ${deleted} unresolved rows from error_logs`);
            totalDeleted += deleted;
        }
    }

    // ── Summary ────────────────────────────────────────────────────
    log(`\n${"═".repeat(50)}`);
    if (dryRun) {
        log("🔍 Dry-run complete. No rows were deleted.");
        log("   Run with --execute to perform actual cleanup.");
    } else {
        log(`✅ Cleanup complete. Total rows deleted: ${totalDeleted}`);
    }
    log(`${"═".repeat(50)}\n`);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
