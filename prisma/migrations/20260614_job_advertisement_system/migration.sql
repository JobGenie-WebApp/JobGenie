-- ============================================
-- Job Advertisement System Migration
-- Phase 1: Enum additions (must run outside transaction)
-- ============================================

-- Add new JobStatus values
ALTER TYPE "JobStatus" ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE "JobStatus" ADD VALUE IF NOT EXISTS 'deleted';

-- Create ApplicationStatus enum
DO $$ BEGIN
  CREATE TYPE "ApplicationStatus" AS ENUM (
    'pending',
    'reviewed',
    'shortlisted',
    'rejected',
    'hired',
    'withdrawn'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- Phase 2: Extend jobs table
-- ============================================

ALTER TABLE "jobs"
  ADD COLUMN IF NOT EXISTS "salary_min"          DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "salary_max"          DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "salary_currency"     VARCHAR(10) DEFAULT 'LKR',
  ADD COLUMN IF NOT EXISTS "experience_level"    VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "positions_available" INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "validity_days"       INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "expires_at"          TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "is_deleted"          BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deleted_at"          TIMESTAMPTZ(6);

CREATE INDEX IF NOT EXISTS "jobs_expires_at_idx"       ON "jobs"("expires_at");
CREATE INDEX IF NOT EXISTS "jobs_is_deleted_idx"       ON "jobs"("is_deleted");
CREATE INDEX IF NOT EXISTS "jobs_status_is_deleted_idx" ON "jobs"("status", "is_deleted");

-- ============================================
-- Phase 3: Create job_applications table
-- ============================================

CREATE TABLE IF NOT EXISTS "job_applications" (
  "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
  "job_id"       UUID        NOT NULL,
  "candidate_id" UUID        NOT NULL,
  "status"       "ApplicationStatus" NOT NULL DEFAULT 'pending',
  "cover_letter" TEXT,
  "resume_url"   VARCHAR(500),
  "applied_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"   TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "notes"        TEXT,
  CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "job_applications_job_id_fkey"
    FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE,
  CONSTRAINT "job_applications_candidate_id_fkey"
    FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE,
  CONSTRAINT "job_applications_unique_apply"
    UNIQUE ("job_id", "candidate_id")
);

CREATE INDEX IF NOT EXISTS "job_applications_job_id_idx"       ON "job_applications"("job_id");
CREATE INDEX IF NOT EXISTS "job_applications_candidate_id_idx" ON "job_applications"("candidate_id");
CREATE INDEX IF NOT EXISTS "job_applications_status_idx"        ON "job_applications"("status");
CREATE INDEX IF NOT EXISTS "job_applications_applied_at_idx"    ON "job_applications"("applied_at");

-- ============================================
-- Phase 4: Seed payment types for job advertisements
-- ============================================

INSERT INTO "payment_types" ("code", "label", "description", "is_active", "sort_order")
VALUES
  ('JOB_AD_PUBLISH', 'Job Advertisement Publication', 'Fee to publish a job advertisement on the platform', true, 10),
  ('JOB_AD_EXTEND',  'Job Advertisement Extension',  'Fee to extend the validity of an expired job advertisement', true, 11)
ON CONFLICT ("code") DO NOTHING;

-- ============================================
-- Phase 5: RLS policies for job_applications
-- ============================================

ALTER TABLE "job_applications" ENABLE ROW LEVEL SECURITY;

-- Candidates can view and manage their own applications
CREATE POLICY "candidates_own_applications" ON "job_applications"
  FOR ALL
  USING (
    candidate_id = (
      SELECT id FROM candidates WHERE user_id = auth.uid()
    )
  );

-- Employers can view applications for their company's jobs
CREATE POLICY "employers_job_applications" ON "job_applications"
  FOR SELECT
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      JOIN employers e ON e.company_id = j.company_id
      WHERE e.user_id = auth.uid()
    )
  );

-- MIS users can view and manage all applications (via service role / admin client)
-- MIS API routes use the admin client which bypasses RLS

-- ============================================
-- Phase 6: Enable Realtime for job_applications
-- ============================================

ALTER TABLE "job_applications" REPLICA IDENTITY FULL;
