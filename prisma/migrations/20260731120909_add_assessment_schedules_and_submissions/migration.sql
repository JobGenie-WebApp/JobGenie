-- Delivery-specific assessment schedules and candidate submissions.
ALTER TABLE "interview_rounds"
    ADD COLUMN IF NOT EXISTS assessment_start_at timestamptz,
    ADD COLUMN IF NOT EXISTS assessment_end_at timestamptz,
    ADD COLUMN IF NOT EXISTS assessment_submission_file_path text,
    ADD COLUMN IF NOT EXISTS assessment_submission_file_name varchar(255),
    ADD COLUMN IF NOT EXISTS assessment_submission_file_type varchar(100),
    ADD COLUMN IF NOT EXISTS assessment_submission_links jsonb,
    ADD COLUMN IF NOT EXISTS assessment_submitted_at timestamptz;

ALTER TABLE "interview_rounds"
    DROP CONSTRAINT IF EXISTS interview_rounds_assessment_details_check;

-- Preserve any physical assessments created by the earlier deadline-only flow.
UPDATE "interview_rounds"
SET assessment_start_at = assessment_deadline,
    assessment_end_at = assessment_deadline + interval '1 hour',
    assessment_deadline = NULL
WHERE interview_mode::text = 'assessment'
  AND assessment_delivery_mode = 'physical'
  AND assessment_deadline IS NOT NULL
  AND assessment_start_at IS NULL
  AND assessment_end_at IS NULL;

ALTER TABLE "interview_rounds"
    ADD CONSTRAINT interview_rounds_assessment_details_check CHECK (
        interview_mode::text <> 'assessment'
        OR (
            assessment_delivery_mode = 'online'
            AND assessment_deadline IS NOT NULL
        )
        OR (
            assessment_delivery_mode = 'physical'
            AND assessment_start_at IS NOT NULL
            AND assessment_end_at IS NOT NULL
            AND assessment_start_at < assessment_end_at
            AND nullif(btrim(interview_address), '') IS NOT NULL
        )
    );

CREATE INDEX IF NOT EXISTS interview_rounds_assessment_start_at_idx
    ON "interview_rounds" (assessment_start_at);

CREATE INDEX IF NOT EXISTS interview_rounds_assessment_submitted_at_idx
    ON "interview_rounds" (assessment_submitted_at);
