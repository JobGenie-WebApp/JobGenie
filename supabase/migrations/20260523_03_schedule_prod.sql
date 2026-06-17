-- Phase 4: Schedule interview reminders Edge Function with pg_cron (PRODUCTION)
-- This file is ONLY for the production database (oxcmkfejolzcyxhgfdhj)

-- Schedule the interview-reminders Edge Function to run every 15 minutes
SELECT cron.schedule(
  'interview-reminders-prod',  -- Job name
  '*/15 * * * *',               -- Every 15 minutes
  $$
    SELECT net.http_post(
      url := 'https://oxcmkfejolzcyxhgfdhj.supabase.co/functions/v1/interview-reminders',
      headers := jsonb_build_object(
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94Y21rZmVqb2x6Y3l4aGdmZGhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTcyODQ4NCwiZXhwIjoyMDkxMzA0NDg0fQ.GMACF6e30WmHsmawbAbelS-H8k9cvad4erxNhQu0Cmc',
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
-- SELECT cron.unschedule('interview-reminders-prod');
