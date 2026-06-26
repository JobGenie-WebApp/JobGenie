-- Seed the canonical payment types the application code relies on.
-- These were missing in both environments, so publish/extend/hiring flows could
-- not create payment requests. Idempotent: existing codes are left untouched.
INSERT INTO "payment_types" (code, label, description, is_active, sort_order)
VALUES
    ('JOB_AD_PUBLISH', 'Job Advertisement Publication', 'Fee to publish a job advertisement', true, 10),
    ('JOB_AD_EXTEND',  'Job Advertisement Extension',   'Fee to extend an expired job advertisement', true, 11),
    ('hiring_fee',     'Hiring Fee',                    'Fee payable when a candidate is hired (50% of monthly salary)', true, 12)
ON CONFLICT (code) DO NOTHING;
