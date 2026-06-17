-- =====================================================
-- PHASE 1d FIX: PROPERLY HIDE users.password FROM POSTG REST API
-- =====================================================
-- Applied to dev: 2026-05-14 via MCP apply_migration
-- Apply to prod:  Supabase Dashboard SQL Editor (project oxcmkfejolzcyxhgfdhj)
--
-- WHY: PostgreSQL table-level SELECT grants ALL column access.
-- A column-level REVOKE does NOT override a table-level GRANT.
-- Fix: revoke table-level SELECT on users, then re-grant column-level
-- SELECT for every column EXCEPT password. INSERT/UPDATE/DELETE
-- remain as table-level grants (write ops are not column-level).
-- service_role bypasses all grants and can still read all columns.
-- =====================================================

-- Step 1: Remove table-level SELECT from users for anon and authenticated
REVOKE SELECT ON TABLE public.users FROM anon, authenticated;

-- Step 2: Re-grant SELECT column-by-column, explicitly skipping 'password'
GRANT SELECT (id)                            ON TABLE public.users TO authenticated;
GRANT SELECT (email)                         ON TABLE public.users TO authenticated;
GRANT SELECT (role)                          ON TABLE public.users TO authenticated;
GRANT SELECT (status)                        ON TABLE public.users TO authenticated;
GRANT SELECT (provider)                      ON TABLE public.users TO authenticated;
GRANT SELECT (provider_id)                   ON TABLE public.users TO authenticated;
GRANT SELECT (email_verified)                ON TABLE public.users TO authenticated;
GRANT SELECT (email_verification_token)      ON TABLE public.users TO authenticated;
GRANT SELECT (verification_token_expires_at) ON TABLE public.users TO authenticated;
GRANT SELECT (password_reset_token)          ON TABLE public.users TO authenticated;
GRANT SELECT (password_reset_expires_at)     ON TABLE public.users TO authenticated;
GRANT SELECT (invitation_token)              ON TABLE public.users TO authenticated;
GRANT SELECT (invitation_token_expires_at)   ON TABLE public.users TO authenticated;
GRANT SELECT (invited_by)                    ON TABLE public.users TO authenticated;
GRANT SELECT (timezone)                      ON TABLE public.users TO authenticated;
GRANT SELECT (last_login_at)                 ON TABLE public.users TO authenticated;
GRANT SELECT (created_at)                    ON TABLE public.users TO authenticated;
GRANT SELECT (updated_at)                    ON TABLE public.users TO authenticated;
GRANT SELECT (deleted_at)                    ON TABLE public.users TO authenticated;

-- anon role: only needs id and email for public lookups
GRANT SELECT (id)    ON TABLE public.users TO anon;
GRANT SELECT (email) ON TABLE public.users TO anon;

-- Confirm INSERT/UPDATE/DELETE table-level grants remain for authenticated
GRANT INSERT, UPDATE, DELETE ON TABLE public.users TO authenticated;

NOTIFY pgrst, 'reload schema';
