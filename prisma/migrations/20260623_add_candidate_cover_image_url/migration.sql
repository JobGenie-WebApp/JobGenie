-- Add cover_image_url to candidates (profile cover photo)
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "cover_image_url" VARCHAR(500);
