-- Align the IT industry row name with what the profile industry resolver matches.
-- The deployed API resolves the `it_software` profile key to industry rows whose
-- name contains "information technology"; the seed created it as
-- "IT / Software Development", so the Current Position list came back empty in
-- production. Rename it to "Information Technology" (matched by all resolver
-- versions). Idempotent + safe: only touches the single IT row.
UPDATE industries
SET industry_name = 'Information Technology'
WHERE industry_name = 'IT / Software Development';
