-- =============================================================================
-- Security hardening migration — 2026-06
-- =============================================================================
-- Addresses Supabase security-advisor findings. POLICY / GRANT changes only —
-- no table or column changes, no data is dropped or modified.
--
-- Apply to BOTH Dev and Prod. Idempotent (safe to re-run).
--
-- Covered advisors:
--   0024 rls_policy_always_true  — companies INSERT + log-table INSERT policies
--   0025 public_bucket_allows_listing — company-logos / cover-images / profile-images
--   0028/0029 *_security_definer_function_executable — rls_auto_enable()
--
-- NOT covered here (intentional, see SECURITY.md):
--   - is_candidate/is_employer/is_mis_user EXECUTE: these are referenced inside
--     RLS policies, so revoking EXECUTE from `authenticated`/`anon` would break
--     policy evaluation. They only reveal the caller's OWN role (no data leak).
--   - payment_* tables (0008 RLS-enabled-no-policy, INFO): deny-all to clients
--     is already secure; access is via the service-role admin client.
-- =============================================================================

-- 1) companies INSERT — replace the always-true check with an employer check.
--    The employer row already exists by the time a company is created, so
--    is_employer() is true for the legitimate caller; candidates / others are
--    now blocked from inserting arbitrary company rows.
DROP POLICY IF EXISTS "Employers can insert company" ON public.companies;
CREATE POLICY "Employers can insert company" ON public.companies
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (is_employer());

-- 2) Log tables — the app writes these via the service-role admin client
--    (RLS-bypassing), so the permissive authenticated INSERT policies are
--    unnecessary and only weaken RLS. Remove them.
DROP POLICY IF EXISTS "Authenticated can insert api request logs" ON public.api_request_logs;
DROP POLICY IF EXISTS "Authenticated can insert error logs"       ON public.error_logs;
DROP POLICY IF EXISTS "Authenticated can insert event logs"       ON public.event_logs;

-- 3) Public storage buckets — drop the broad SELECT policies that allow clients
--    to LIST every object. Public buckets still serve individual objects by
--    direct URL without these policies, and all writes use the admin client.
DROP POLICY IF EXISTS "Public can read company logos"  ON storage.objects;
DROP POLICY IF EXISTS "Public can read cover images"   ON storage.objects;
DROP POLICY IF EXISTS "Public can read profile images" ON storage.objects;

-- 4) rls_auto_enable() — a maintenance/DDL helper that should never be callable
--    from the public API. It is not referenced by any RLS policy, so revoking
--    EXECUTE is safe.
-- Revoke from PUBLIC too: functions grant EXECUTE to PUBLIC by default, so
-- revoking only from anon/authenticated leaves the PUBLIC grant in place.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
