-- Phase 4: Schedule interview reminders Edge Function with pg_cron (DEVELOPMENT)
-- This file is ONLY for the development database (qqhdpoddfwkqsubmjskg)

-- Schedule the interview-reminders Edge Function to run every 15 minutes
SELECT cron.schedule(
  'interview-reminders-dev',  -- Job name
  '*/15 * * * *',              -- Every 15 minutes
  $$
    SELECT net.http_post(
      url := 'https://qqhdpoddfwkqsubmjskg.supabase.co/functions/v1/interview-reminders',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxaGRwb2RkZndrcXN1Ym1qc2tnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA3NjUxOSwiZXhwIjoyMDkxNjUyNTE5fQ.HzQ7tcsIE_dgS2LneXkf8PkZDk6Z4o6KmDfF8a33xgY',
        'x-cron-secret', '74a656678155c36c6e823845f82a05da556f134b55382130ef1f27cdbac36835',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- View scheduled jobs (for verification)
-- SELECT * FROM cron.job;

-- To unschedule this job later (if needed):
-- SELECT cron.unschedule('interview-reminders-dev');
