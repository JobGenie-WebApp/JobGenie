#!/bin/bash

# Production Supabase Secrets Configuration
# Project: jobgenie-web (Production)
# Project Ref: oxcmkfejolzcyxhgfdhj
# Region: Northeast Asia (Tokyo)

echo "========================================"
echo "Setting Supabase secrets for PRODUCTION"
echo "Project: jobgenie-web (oxcmkfejolzcyxhgfdhj)"
echo "========================================"
echo ""

# IMPORTANT: Update APP_URL below with your actual production domain
# Example: https://jobgenie.com or https://your-app.vercel.app
PRODUCTION_APP_URL="https://your-production-domain.com"

echo "⚠️  IMPORTANT: Update APP_URL in this script with your actual production domain!"
echo "Current APP_URL: $PRODUCTION_APP_URL"
echo ""

# Production CRON_SECRET (generated unique for production)
echo "Setting CRON_SECRET..."
supabase secrets set CRON_SECRET="88798c506791f2ce3ac21953c1c86969dd1c0332af4e6e2bb81f3b093abc9773" --project-ref oxcmkfejolzcyxhgfdhj

# RESEND_API_KEY - Using your existing Resend key
echo "Setting RESEND_API_KEY..."
supabase secrets set RESEND_API_KEY="re_KoUMwwFD_LNXeiM2AfPpvZJGWWgeBZApE" --project-ref oxcmkfejolzcyxhgfdhj

# EMAIL_FROM - Update this with your verified domain email
# Note: If using a custom domain, verify it in Resend first
echo "Setting EMAIL_FROM..."
supabase secrets set EMAIL_FROM="onboarding@resend.dev" --project-ref oxcmkfejolzcyxhgfdhj

# APP_URL - Your production domain
echo "Setting APP_URL..."
supabase secrets set APP_URL="$PRODUCTION_APP_URL" --project-ref oxcmkfejolzcyxhgfdhj

# SUPABASE_SERVICE_ROLE_KEY - Production service role key (from Supabase)
echo "Setting SERVICE_ROLE_KEY..."
supabase secrets set SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94Y21rZmVqb2x6Y3l4aGdmZGhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTcyODQ4NCwiZXhwIjoyMDkxMzA0NDg0fQ.GMACF6e30WmHsmawbAbelS-H8k9cvad4erxNhQu0Cmc" --project-ref oxcmkfejolzcyxhgfdhj

echo ""
echo "✅ All secrets set successfully!"
echo ""
echo "========================================"
echo "Verification Commands"
echo "========================================"
echo ""
echo "List all secrets:"
echo "  supabase secrets list --project-ref oxcmkfejolzcyxhgfdhj"
echo ""
echo "View a specific secret (example):"
echo "  supabase secrets get CRON_SECRET --project-ref oxcmkfejolzcyxhgfdhj"
echo ""
echo "========================================"
echo "Next Steps"
echo "========================================"
echo "1. Update APP_URL in this script with your production domain"
echo "2. Run this script again if you updated APP_URL"
echo "3. If using custom email domain, verify it in Resend"
echo "4. Deploy Edge Function:"
echo "   supabase functions deploy interview-reminders --project-ref oxcmkfejolzcyxhgfdhj"
echo "5. Apply pg_cron migration (see PHASE4_PGCRON_DEPLOYMENT_GUIDE.md)"
echo ""
