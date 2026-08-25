-- Expected salary is no longer assumed to be LKR.
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "expected_salary_currency" VARCHAR(3) DEFAULT 'LKR';
