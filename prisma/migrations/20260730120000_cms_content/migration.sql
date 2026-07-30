-- CMS: editable site content (texts, nav items, standalone pages).
-- Additive only. Nothing is dropped or modified on existing tables.

-- CreateTable
CREATE TABLE IF NOT EXISTS "cms_texts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "scope" VARCHAR(64) NOT NULL,
    "path" VARCHAR(191) NOT NULL,
    "value" TEXT,
    "draft_value" TEXT,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_texts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "cms_nav_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "location" VARCHAR(32) NOT NULL,
    "parent_id" UUID,
    "label" VARCHAR(191),
    "href" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "draft" JSONB,
    "pending_delete" BOOLEAN NOT NULL DEFAULT false,
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_nav_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "cms_pages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(120) NOT NULL,
    "title" VARCHAR(200),
    "body" TEXT,
    "draft_title" VARCHAR(200),
    "draft_body" TEXT,
    "seo_description" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cms_texts_scope_idx" ON "cms_texts"("scope");
CREATE UNIQUE INDEX IF NOT EXISTS "cms_texts_scope_path_key" ON "cms_texts"("scope", "path");
CREATE INDEX IF NOT EXISTS "cms_nav_items_location_sort_order_idx" ON "cms_nav_items"("location", "sort_order");
CREATE INDEX IF NOT EXISTS "cms_nav_items_parent_id_idx" ON "cms_nav_items"("parent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "cms_pages_slug_key" ON "cms_pages"("slug");
CREATE INDEX IF NOT EXISTS "cms_pages_is_published_idx" ON "cms_pages"("is_published");

-- AddForeignKey
ALTER TABLE "cms_nav_items" DROP CONSTRAINT IF EXISTS "cms_nav_items_parent_id_fkey";
ALTER TABLE "cms_nav_items" ADD CONSTRAINT "cms_nav_items_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "cms_nav_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS: public read of site content; writes go through the service role only.
ALTER TABLE "cms_texts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cms_nav_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cms_pages" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cms_texts_public_read" ON "cms_texts";
CREATE POLICY "cms_texts_public_read" ON "cms_texts" FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "cms_nav_items_public_read" ON "cms_nav_items";
CREATE POLICY "cms_nav_items_public_read" ON "cms_nav_items" FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "cms_pages_public_read" ON "cms_pages";
CREATE POLICY "cms_pages_public_read" ON "cms_pages" FOR SELECT TO anon, authenticated USING (true);
