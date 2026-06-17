-- =====================================================
-- PHASE 1e + 1f: FIX DUPLICATE INDEXES + ADD FK INDEX
-- =====================================================
-- Applied to dev: 2026-05-14 via MCP apply_migration
-- Apply to prod:  Supabase Dashboard SQL Editor (project oxcmkfejolzcyxhgfdhj)
-- =====================================================

-- Phase 1e: Drop duplicate indexes on interview_rounds
-- Prisma already created interview_rounds_*_idx variants;
-- the idx_interview_rounds_* duplicates waste write IOPS.
DROP INDEX IF EXISTS idx_interview_rounds_invitation_round;
DROP INDEX IF EXISTS idx_interview_rounds_outcome;
DROP INDEX IF EXISTS idx_interview_rounds_status;

-- Phase 1f: Add missing FK index on candidates.reviewed_by
-- Speeds up MIS admin queries that filter/join on the reviewer column.
-- IF NOT EXISTS is safe — migration 01 may have already created this.
CREATE INDEX IF NOT EXISTS candidates_reviewed_by_idx
  ON public.candidates (reviewed_by);
