-- ISO 3166-1 reference data. Public read-only lookup table.
CREATE TABLE IF NOT EXISTS "countries" (
    "code"         CHAR(2)      NOT NULL,
    "code3"        CHAR(3)      NOT NULL,
    "numeric"      CHAR(3)      NOT NULL,
    "name"         VARCHAR(100) NOT NULL,
    "flag_emoji"   VARCHAR(8)   NOT NULL,
    "calling_code" VARCHAR(8),
    "region"       VARCHAR(50),
    "subregion"    VARCHAR(60),

    CONSTRAINT "countries_pkey" PRIMARY KEY ("code")
);

CREATE UNIQUE INDEX IF NOT EXISTS "countries_code3_key" ON "countries"("code3");
CREATE INDEX IF NOT EXISTS "countries_name_idx" ON "countries"("name");

-- Reference data: readable by everyone, writable only by service_role (bypasses RLS).
ALTER TABLE "countries" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "countries_public_read" ON "countries";
CREATE POLICY "countries_public_read" ON "countries" FOR SELECT TO anon, authenticated USING (true);
