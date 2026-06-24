/**
 * Next.js instrumentation hook — `register()` runs once on server startup.
 *
 * Used to auto-bootstrap the first super MIS admin (see
 * `src/lib/bootstrap/seed-super-admin.ts`) so a fresh database has a usable
 * `/mis/*` admin out of the box. Idempotent and best-effort: failures are
 * logged inside the seeder and never block startup.
 */
export async function register() {
  // Only run in the Node.js server runtime (not edge / middleware runtime),
  // since the seeder uses bcrypt and the Supabase service-role client.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureSuperAdmin } = await import("./lib/bootstrap/seed-super-admin");
    await ensureSuperAdmin();
  }
}
