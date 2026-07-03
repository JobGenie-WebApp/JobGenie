-- ATS score fields on job applications.
-- Computed at apply time by comparing the candidate's résumé against the job
-- description via Gemini. Additive and nullable: no data is dropped or altered.

ALTER TABLE "job_applications"
  ADD COLUMN "ats_score" DOUBLE PRECISION,
  ADD COLUMN "ats_status" VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN "ats_breakdown" JSONB,
  ADD COLUMN "ats_matched_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "ats_missing_keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "ats_scored_at" TIMESTAMPTZ(6),
  ADD COLUMN "ats_error" TEXT;

CREATE INDEX "job_applications_ats_score_idx" ON "job_applications"("ats_score");
