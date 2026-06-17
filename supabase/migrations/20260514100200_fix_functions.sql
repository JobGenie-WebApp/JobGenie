-- =====================================================
-- PHASE 1c + 1d: FIX FUNCTION SEARCH_PATH + REVOKE PASSWORD COLUMN
-- =====================================================
-- Applied to dev: 2026-05-14 via MCP apply_migration
-- Apply to prod:  Supabase Dashboard SQL Editor (project oxcmkfejolzcyxhgfdhj)
-- =====================================================

-- Phase 1c: Fix mutable search_path on DB functions (SQL injection risk)
-- Without a fixed search_path a malicious user could create a public schema
-- function/table that shadows a pg_catalog object before the function runs.
ALTER FUNCTION public.update_pipeline_status_from_outcome()
  SET search_path = public, extensions;

ALTER FUNCTION public.create_first_interview_round()
  SET search_path = public, extensions;

-- Phase 1d: Revoke password column from anon and authenticated roles
-- NOTE: Column-level REVOKE does NOT override a table-level GRANT SELECT.
-- The actual fix is applied in migration 20260514_05_revoke_password_column.sql
-- which revokes table-level SELECT and re-grants column-by-column (excluding password).
-- This statement is kept for audit trail but is effectively superseded by migration 05.
REVOKE SELECT (password) ON public.users FROM anon, authenticated;
