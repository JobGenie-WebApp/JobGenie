-- Add industry_id nullable FK to candidates
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "industry_id" INTEGER;

ALTER TABLE "candidates"
  DROP CONSTRAINT IF EXISTS "candidates_industry_id_fkey";

ALTER TABLE "candidates"
  ADD CONSTRAINT "candidates_industry_id_fkey"
  FOREIGN KEY ("industry_id")
  REFERENCES "industries"("industry_id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Drop the enum default before changing column type
ALTER TABLE "candidates"
  ALTER COLUMN "experience_level" DROP DEFAULT;

-- Change experience_level from ExperienceLevel enum to VARCHAR(100)
ALTER TABLE "candidates"
  ALTER COLUMN "experience_level" TYPE VARCHAR(100)
  USING "experience_level"::text;

-- Restore default as string literal
ALTER TABLE "candidates"
  ALTER COLUMN "experience_level" SET DEFAULT 'entry';

-- Drop the now-unused enum type
DROP TYPE IF EXISTS "ExperienceLevel";
