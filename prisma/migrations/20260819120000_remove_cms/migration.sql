-- Remove the MIS landing-page CMS.
--
-- These tables let MIS admins override landing/nav/footer strings and serve
-- markdown pages. Nothing depended on them: the three `content.*` permissions
-- had zero role grants and every cms_pages row was unpublished with an empty
-- body. Site copy now lives only in src/content/site.ts.
--
-- Every row from both environments is preserved in docs/cms-content-backup.sql,
-- and the CREATE TABLE DDL is in 20260730120000_cms_content/migration.sql, so
-- this is reversible.
--
-- DROP TABLE also removes each table's indexes and RLS policies, and
-- cms_nav_items' self-referencing parent/child FK goes with the table itself.

DROP TABLE IF EXISTS "cms_texts";
DROP TABLE IF EXISTS "cms_nav_items";
DROP TABLE IF EXISTS "cms_pages";
