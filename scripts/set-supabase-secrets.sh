#!/bin/bash

# Production Supabase Project Secrets
# Project Ref: qqhdpoddfwkqsubmjskg

echo "Setting Supabase secrets for production project..."

# Set CRON_SECRET (already in your .env.local)
supabase secrets set CRON_SECRET="74a656678155c36c6e823845f82a05da556f134b55382130ef1f27cdbac36835" --project-ref qqhdpoddfwkqsubmjskg

# Set RESEND_API_KEY (already in your .env.local)
supabase secrets set RESEND_API_KEY="re_KoUMwwFD_LNXeiM2AfPpvZJGWWgeBZApE" --project-ref qqhdpoddfwkqsubmjskg

# Set EMAIL_FROM (already in your .env.local)
supabase secrets set EMAIL_FROM="onboarding@resend.dev" --project-ref qqhdpoddfwkqsubmjskg

# Set APP_URL (production URL - UPDATE THIS)
supabase secrets set APP_URL="https://jobgenie-staging.vercel.app" --project-ref qqhdpoddfwkqsubmjskg

# Set SUPABASE_URL (from your .env.local)
supabase secrets set SUPABASE_URL="https://qqhdpoddfwkqsubmjskg.supabase.co" --project-ref qqhdpoddfwkqsubmjskg

# Set SUPABASE_SERVICE_ROLE_KEY (from your .env.local)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxaGRwb2RkZndrcXN1Ym1qc2tnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA3NjUxOSwiZXhwIjoyMDkxNjUyNTE5fQ.HzQ7tcsIE_dgS2LneXkf8PkZDk6Z4o6KmDfF8a33xgY" --project-ref qqhdpoddfwkqsubmjskg

echo "✅ All secrets set successfully!"
echo ""
echo "To verify, run:"
echo "supabase secrets list --project-ref qqhdpoddfwkqsubmjskg"
