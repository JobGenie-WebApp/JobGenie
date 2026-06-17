-- ============================================
-- PAYMENT SYSTEM MIGRATION
-- ============================================

-- 1. Create lifecycle enums
CREATE TYPE "PaymentRequestStatus" AS ENUM (
  'pending_payment',
  'under_review',
  'verified',
  'rejected',
  'cancelled'
);

CREATE TYPE "PaymentProofStatus" AS ENUM (
  'pending_review',
  'approved',
  'rejected'
);

-- 2. Payment types master data table (extensible, no enum)
CREATE TABLE "payment_types" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "code"        VARCHAR(100) NOT NULL,
  "label"       VARCHAR(200) NOT NULL,
  "description" TEXT,
  "is_active"   BOOLEAN     NOT NULL DEFAULT true,
  "sort_order"  INTEGER     NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "payment_types_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_types_code_key" UNIQUE ("code")
);

CREATE INDEX "payment_types_is_active_idx" ON "payment_types"("is_active");

-- Seed initial payment types
INSERT INTO "payment_types" ("code", "label", "description", "sort_order") VALUES
  ('job_advertisement',      'Job Advertisement',      'Fee for posting a job advertisement',          1),
  ('advertisement_extension','Advertisement Extension', 'Fee for extending a job advertisement deadline', 2),
  ('hiring_fee',             'Hiring Fee',             'Fee payable when a candidate is successfully hired', 3);

-- 3. Payment pricing table (configurable per type)
CREATE TABLE "payment_pricing" (
  "id"              UUID           NOT NULL DEFAULT gen_random_uuid(),
  "payment_type_id" UUID           NOT NULL,
  "amount"          DECIMAL(12, 2) NOT NULL,
  "currency"        VARCHAR(10)    NOT NULL DEFAULT 'LKR',
  "description"     TEXT,
  "is_active"       BOOLEAN        NOT NULL DEFAULT true,
  "effective_from"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "created_at"      TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "payment_pricing_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_pricing_payment_type_id_fkey"
    FOREIGN KEY ("payment_type_id") REFERENCES "payment_types"("id") ON DELETE CASCADE
);

CREATE INDEX "payment_pricing_payment_type_id_idx" ON "payment_pricing"("payment_type_id");
CREATE INDEX "payment_pricing_is_active_idx"       ON "payment_pricing"("is_active");

-- 4. Bank details table (MIS-managed)
CREATE TABLE "payment_bank_details" (
  "id"             UUID           NOT NULL DEFAULT gen_random_uuid(),
  "bank_name"      VARCHAR(200)   NOT NULL,
  "account_name"   VARCHAR(200)   NOT NULL,
  "account_number" VARCHAR(100)   NOT NULL,
  "branch"         VARCHAR(200),
  "bank_code"      VARCHAR(50),
  "swift_code"     VARCHAR(50),
  "is_active"      BOOLEAN        NOT NULL DEFAULT true,
  "sort_order"     INTEGER        NOT NULL DEFAULT 0,
  "created_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"     TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "payment_bank_details_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payment_bank_details_is_active_idx" ON "payment_bank_details"("is_active");

-- 5. Payment requests table
CREATE TABLE "payment_requests" (
  "id"                      UUID                   NOT NULL DEFAULT gen_random_uuid(),
  "company_id"              UUID                   NOT NULL,
  "employer_id"             UUID,
  "created_by_mis_user_id"  UUID                   NOT NULL,
  "payment_type_id"         UUID                   NOT NULL,
  "reference_job_id"        UUID,
  "reference_invitation_id" UUID,
  "amount"                  DECIMAL(12, 2)          NOT NULL,
  "currency"                VARCHAR(10)             NOT NULL DEFAULT 'LKR',
  "description"             TEXT                   NOT NULL,
  "due_date"                DATE,
  "status"                  "PaymentRequestStatus" NOT NULL DEFAULT 'pending_payment',
  "bank_transfer_reference" VARCHAR(200),
  "created_at"              TIMESTAMPTZ(6)          NOT NULL DEFAULT now(),
  "updated_at"              TIMESTAMPTZ(6)          NOT NULL DEFAULT now(),
  CONSTRAINT "payment_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_requests_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
  CONSTRAINT "payment_requests_employer_id_fkey"
    FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE SET NULL,
  CONSTRAINT "payment_requests_created_by_mis_user_id_fkey"
    FOREIGN KEY ("created_by_mis_user_id") REFERENCES "mis_user"("user_id"),
  CONSTRAINT "payment_requests_payment_type_id_fkey"
    FOREIGN KEY ("payment_type_id") REFERENCES "payment_types"("id"),
  CONSTRAINT "payment_requests_reference_job_id_fkey"
    FOREIGN KEY ("reference_job_id") REFERENCES "jobs"("id") ON DELETE SET NULL,
  CONSTRAINT "payment_requests_reference_invitation_id_fkey"
    FOREIGN KEY ("reference_invitation_id") REFERENCES "job_invitations"("id") ON DELETE SET NULL
);

CREATE INDEX "payment_requests_company_id_idx"      ON "payment_requests"("company_id");
CREATE INDEX "payment_requests_employer_id_idx"     ON "payment_requests"("employer_id");
CREATE INDEX "payment_requests_status_idx"          ON "payment_requests"("status");
CREATE INDEX "payment_requests_payment_type_id_idx" ON "payment_requests"("payment_type_id");
CREATE INDEX "payment_requests_created_at_idx"      ON "payment_requests"("created_at");
CREATE INDEX "payment_requests_due_date_idx"        ON "payment_requests"("due_date");

-- 6. Payment proofs table
CREATE TABLE "payment_proofs" (
  "id"                      UUID                  NOT NULL DEFAULT gen_random_uuid(),
  "payment_request_id"      UUID                  NOT NULL,
  "uploaded_by_employer_id" UUID                  NOT NULL,
  "file_url"                VARCHAR(500)          NOT NULL,
  "file_path"               VARCHAR(500)          NOT NULL,
  "file_name"               VARCHAR(255)          NOT NULL,
  "file_type"               VARCHAR(100)          NOT NULL,
  "uploaded_at"             TIMESTAMPTZ(6)        NOT NULL DEFAULT now(),
  "reviewed_by_mis_user_id" UUID,
  "reviewed_at"             TIMESTAMPTZ(6),
  "review_notes"            TEXT,
  "status"                  "PaymentProofStatus"  NOT NULL DEFAULT 'pending_review',
  CONSTRAINT "payment_proofs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_proofs_payment_request_id_fkey"
    FOREIGN KEY ("payment_request_id") REFERENCES "payment_requests"("id") ON DELETE CASCADE,
  CONSTRAINT "payment_proofs_uploaded_by_employer_id_fkey"
    FOREIGN KEY ("uploaded_by_employer_id") REFERENCES "employers"("id"),
  CONSTRAINT "payment_proofs_reviewed_by_mis_user_id_fkey"
    FOREIGN KEY ("reviewed_by_mis_user_id") REFERENCES "mis_user"("user_id")
);

CREATE INDEX "payment_proofs_payment_request_id_idx" ON "payment_proofs"("payment_request_id");
CREATE INDEX "payment_proofs_status_idx"             ON "payment_proofs"("status");
