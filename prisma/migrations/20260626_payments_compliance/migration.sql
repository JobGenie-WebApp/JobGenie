-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('bank_transfer', 'online_payment');

-- CreateEnum
CREATE TYPE "ComplianceFlagStatus" AS ENUM ('paused', 'resubmitted', 'resolved', 'dismissed');

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "mis_pause_locked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "payment_requests" ADD COLUMN     "payment_method" "PaymentMethod";

-- CreateTable
CREATE TABLE "job_compliance_flags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "job_id" UUID NOT NULL,
    "payment_request_id" UUID,
    "flagged_proof_id" UUID,
    "reason" TEXT NOT NULL,
    "flagged_by_mis_user_id" UUID NOT NULL,
    "flagged_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ComplianceFlagStatus" NOT NULL DEFAULT 'paused',
    "employer_doc_url" VARCHAR(500),
    "employer_doc_path" VARCHAR(500),
    "employer_doc_name" VARCHAR(255),
    "employer_doc_type" VARCHAR(100),
    "employer_note" TEXT,
    "resubmitted_at" TIMESTAMPTZ(6),
    "resolved_by_mis_user_id" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "resolution_notes" TEXT,

    CONSTRAINT "job_compliance_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_compliance_flags_job_id_idx" ON "job_compliance_flags"("job_id");

-- CreateIndex
CREATE INDEX "job_compliance_flags_status_idx" ON "job_compliance_flags"("status");

-- AddForeignKey
ALTER TABLE "job_compliance_flags" ADD CONSTRAINT "job_compliance_flags_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_compliance_flags" ADD CONSTRAINT "job_compliance_flags_flagged_by_mis_user_id_fkey" FOREIGN KEY ("flagged_by_mis_user_id") REFERENCES "mis_user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_compliance_flags" ADD CONSTRAINT "job_compliance_flags_resolved_by_mis_user_id_fkey" FOREIGN KEY ("resolved_by_mis_user_id") REFERENCES "mis_user"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Lock the table to service_role only (no policies), matching the other payment_* tables.
ALTER TABLE "job_compliance_flags" ENABLE ROW LEVEL SECURITY;
