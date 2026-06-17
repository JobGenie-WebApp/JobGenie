-- =====================================================
-- DROP DUPLICATE idx_* INDEXES CREATED BY MIGRATION 01
-- =====================================================
-- Applied to dev: 2026-05-14 via MCP apply_migration
-- Apply to prod:  Supabase Dashboard SQL Editor (project oxcmkfejolzcyxhgfdhj)
--
-- Migration 01 (enable_rls) created idx_* prefix versions of indexes
-- that Prisma had already created as *_idx suffix versions.
-- Keep the Prisma *_idx versions; drop the duplicate idx_* ones.
-- =====================================================

-- candidates: keep candidates_user_id_idx (Prisma)
DROP INDEX IF EXISTS idx_candidates_user_id;

-- candidates: keep candidates_reviewed_by_idx (Prisma)
DROP INDEX IF EXISTS idx_candidates_reviewed_by;

-- employers: keep employers_user_id_idx (Prisma)
DROP INDEX IF EXISTS idx_employers_user_id;

-- interview_rounds: keep interview_rounds_invitation_id_idx (Prisma)
DROP INDEX IF EXISTS idx_interview_rounds_invitation_id;

-- job_invitations: keep job_invitations_company_id_idx (Prisma)
DROP INDEX IF EXISTS idx_job_invitations_company_id;

-- job_invitations: keep job_invitations_employer_id_idx (Prisma)
DROP INDEX IF EXISTS idx_job_invitations_employer_id;

-- jobs: keep jobs_employer_id_idx (Prisma)
DROP INDEX IF EXISTS idx_jobs_employer_id;

-- mis_user: user_id is already the primary key (mis_user_pkey); drop duplicate
DROP INDEX IF EXISTS idx_mis_user_user_id;
