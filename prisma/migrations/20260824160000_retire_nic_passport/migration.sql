-- Retire NIC/Passport: the app no longer collects, stores or shows it.
-- The column is kept (nullable) so existing values are not destroyed.
ALTER TABLE "candidates" ALTER COLUMN "nicPassport" DROP NOT NULL;
