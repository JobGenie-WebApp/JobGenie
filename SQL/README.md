# SQL — Database security & permissions source of truth

Two hand-maintained SQL files that define everything beyond the Prisma schema.
Keep these up to date so spinning up / switching a database is a couple of runs.

| File | What it does |
|------|--------------|
| [`rls_policies.sql`](./rls_policies.sql) | Row Level Security: enables RLS, all `public` table policies, storage buckets, storage.objects policies, and the SECURITY DEFINER helper functions the policies use. |
| [`permissions.sql`](./permissions.sql) | Seeds the MIS permission catalog into `public.mis_permissions`. Mirrors `src/lib/mis/default-permissions.ts`. |

## Both are safe to re-run (idempotent)

- `rls_policies.sql` — every `CREATE POLICY` is preceded by `DROP POLICY IF EXISTS`,
  buckets use `ON CONFLICT DO UPDATE`, functions use `CREATE OR REPLACE`. No data is touched.
- `permissions.sql` — `INSERT ... ON CONFLICT (resource, action) DO UPDATE`, so re-running
  refreshes names/descriptions and adds new permissions without deleting rows or breaking
  role assignments (`mis_role_permissions`).

## Applying to a database

Run both against the target project (dev and prod). Order does not matter.

- Supabase SQL Editor: paste the file contents and run.
- psql: `psql "<connection-string>" -f SQL/rls_policies.sql` then `-f SQL/permissions.sql`.

## When you change things — keep these in sync

- Added/changed an RLS policy, storage bucket, or helper function → update `rls_policies.sql`.
- Added a permission in `src/lib/mis/default-permissions.ts` → add the matching row in
  `permissions.sql` (name = `resource.action`).
