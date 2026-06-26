-- CreateTable
CREATE TABLE "payment_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "hiring_fee_percentage" DECIMAL(5,2) NOT NULL DEFAULT 50,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by_user_id" UUID,

    CONSTRAINT "payment_settings_pkey" PRIMARY KEY ("id")
);

-- Seed the single settings row (idempotent).
INSERT INTO "payment_settings" (id, hiring_fee_percentage, updated_at)
VALUES (1, 50, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Lock to service_role only (no policies), matching the other payment_* tables.
ALTER TABLE "payment_settings" ENABLE ROW LEVEL SECURITY;
