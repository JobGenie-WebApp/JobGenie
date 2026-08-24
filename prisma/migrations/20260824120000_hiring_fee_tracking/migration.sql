-- Payment terms for the auto-generated hiring fee (MIS-configurable).
ALTER TABLE "payment_settings"
  ADD COLUMN IF NOT EXISTS "hiring_fee_due_days" INTEGER NOT NULL DEFAULT 14;

-- One hiring fee per hire. NULLs are distinct in Postgres, so job-ad payment
-- requests (which leave reference_invitation_id null) are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS "payment_requests_reference_invitation_id_key"
  ON "payment_requests"("reference_invitation_id");
