-- Assessments are interview pipeline rounds, but they have a deadline instead
-- of candidate-selected time slots.
ALTER TYPE public."InterviewMode" ADD VALUE IF NOT EXISTS 'assessment';

DO $$
BEGIN
    CREATE TYPE public."AssessmentDeliveryMode" AS ENUM ('online', 'physical');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.interview_rounds
    ADD COLUMN IF NOT EXISTS assessment_delivery_mode public."AssessmentDeliveryMode",
    ADD COLUMN IF NOT EXISTS assessment_deadline timestamptz,
    ADD COLUMN IF NOT EXISTS assessment_link text,
    ADD COLUMN IF NOT EXISTS assessment_attachment_path text,
    ADD COLUMN IF NOT EXISTS assessment_attachment_name varchar(255);

ALTER TABLE public.interview_rounds
    DROP CONSTRAINT IF EXISTS interview_rounds_assessment_details_check;

ALTER TABLE public.interview_rounds
    ADD CONSTRAINT interview_rounds_assessment_details_check CHECK (
        interview_mode::text <> 'assessment'
        OR (
            assessment_delivery_mode IS NOT NULL
            AND assessment_deadline IS NOT NULL
            AND (
                assessment_delivery_mode <> 'physical'
                OR nullif(btrim(interview_address), '') IS NOT NULL
            )
        )
    );

CREATE INDEX IF NOT EXISTS interview_rounds_assessment_deadline_idx
    ON public.interview_rounds (assessment_deadline);
