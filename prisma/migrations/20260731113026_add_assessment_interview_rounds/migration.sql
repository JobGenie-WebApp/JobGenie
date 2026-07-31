-- Assessments are interview pipeline rounds with deadlines instead of
-- candidate-selected time slots.
ALTER TYPE "InterviewMode" ADD VALUE IF NOT EXISTS 'assessment';

DO $$
BEGIN
    CREATE TYPE "AssessmentDeliveryMode" AS ENUM ('online', 'physical');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "interview_rounds"
    ADD COLUMN IF NOT EXISTS "assessment_delivery_mode" "AssessmentDeliveryMode",
    ADD COLUMN IF NOT EXISTS "assessment_deadline" TIMESTAMPTZ(6),
    ADD COLUMN IF NOT EXISTS "assessment_link" TEXT,
    ADD COLUMN IF NOT EXISTS "assessment_attachment_path" TEXT,
    ADD COLUMN IF NOT EXISTS "assessment_attachment_name" VARCHAR(255);

ALTER TABLE "interview_rounds"
    DROP CONSTRAINT IF EXISTS "interview_rounds_assessment_details_check";

ALTER TABLE "interview_rounds"
    ADD CONSTRAINT "interview_rounds_assessment_details_check" CHECK (
        "interview_mode"::text <> 'assessment'
        OR (
            "assessment_delivery_mode" IS NOT NULL
            AND "assessment_deadline" IS NOT NULL
            AND (
                "assessment_delivery_mode" <> 'physical'
                OR nullif(btrim("interview_address"), '') IS NOT NULL
            )
        )
    );

CREATE INDEX IF NOT EXISTS "interview_rounds_assessment_deadline_idx"
    ON "interview_rounds" ("assessment_deadline");
