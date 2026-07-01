-- Bridge a job application to the interview pipeline.
-- Additive and nullable: no data is dropped or altered.

ALTER TABLE "job_invitations" ADD COLUMN "application_id" UUID;

CREATE UNIQUE INDEX "job_invitations_application_id_key" ON "job_invitations"("application_id");

ALTER TABLE "job_invitations"
  ADD CONSTRAINT "job_invitations_application_id_fkey"
  FOREIGN KEY ("application_id") REFERENCES "job_applications"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
