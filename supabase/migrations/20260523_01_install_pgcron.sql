-- Phase 4: Install pg_cron and pg_net extensions for interview reminders
-- This migration is safe to run on both dev and prod databases

-- Install pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Install pg_net extension for HTTP requests from cron jobs
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant pg_cron schema access to postgres role (required for scheduling)
GRANT USAGE ON SCHEMA cron TO postgres;

-- Comment documenting the purpose
COMMENT ON EXTENSION pg_cron IS 'pg_cron: Job scheduler for PostgreSQL - used for interview reminder scheduling';
COMMENT ON EXTENSION pg_net IS 'pg_net: Async HTTP client for PostgreSQL - used by pg_cron to call Edge Functions';
