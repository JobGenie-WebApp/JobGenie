# Production Supabase Secrets Configuration
# Project: jobgenie-web (Production)
# Project Ref: oxcmkfejolzcyxhgfdhj
# Region: Northeast Asia (Tokyo)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting Supabase secrets for PRODUCTION" -ForegroundColor Cyan
Write-Host "Project: jobgenie-web (oxcmkfejolzcyxhgfdhj)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# IMPORTANT: Update APP_URL below with your actual production domain
# Example: https://jobgenie.com or https://your-app.vercel.app
$PRODUCTION_APP_URL = "https://your-production-domain.com"

Write-Host "⚠️  IMPORTANT: Update APP_URL in this script with your actual production domain!" -ForegroundColor Yellow
Write-Host "Current APP_URL: $PRODUCTION_APP_URL`n" -ForegroundColor Yellow

# Production CRON_SECRET (generated unique for production)
Write-Host "Setting CRON_SECRET..." -ForegroundColor Green
supabase secrets set CRON_SECRET="88798c506791f2ce3ac21953c1c86969dd1c0332af4e6e2bb81f3b093abc9773" --project-ref oxcmkfejolzcyxhgfdhj

# RESEND_API_KEY - Using your existing Resend key
Write-Host "Setting RESEND_API_KEY..." -ForegroundColor Green
supabase secrets set RESEND_API_KEY="re_KoUMwwFD_LNXeiM2AfPpvZJGWWgeBZApE" --project-ref oxcmkfejolzcyxhgfdhj

# EMAIL_FROM - Update this with your verified domain email
# Note: If using a custom domain, verify it in Resend first
Write-Host "Setting EMAIL_FROM..." -ForegroundColor Green
supabase secrets set EMAIL_FROM="onboarding@resend.dev" --project-ref oxcmkfejolzcyxhgfdhj

# APP_URL - Your production domain
Write-Host "Setting APP_URL..." -ForegroundColor Green
supabase secrets set APP_URL="$PRODUCTION_APP_URL" --project-ref oxcmkfejolzcyxhgfdhj

# SUPABASE_SERVICE_ROLE_KEY - Production service role key (from Supabase)
Write-Host "Setting SERVICE_ROLE_KEY..." -ForegroundColor Green
supabase secrets set SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94Y21rZmVqb2x6Y3l4aGdmZGhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTcyODQ4NCwiZXhwIjoyMDkxMzA0NDg0fQ.GMACF6e30WmHsmawbAbelS-H8k9cvad4erxNhQu0Cmc" --project-ref oxcmkfejolzcyxhgfdhj

Write-Host "`n✅ All secrets set successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Commands" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "List all secrets:" -ForegroundColor Yellow
Write-Host "  supabase secrets list --project-ref oxcmkfejolzcyxhgfdhj" -ForegroundColor White
Write-Host ""
Write-Host "View a specific secret (example):" -ForegroundColor Yellow
Write-Host "  supabase secrets get CRON_SECRET --project-ref oxcmkfejolzcyxhgfdhj" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Update APP_URL in this script with your production domain" -ForegroundColor White
Write-Host "2. Run this script again if you updated APP_URL" -ForegroundColor White
Write-Host "3. If using custom email domain, verify it in Resend" -ForegroundColor White
Write-Host "4. Deploy Edge Function:" -ForegroundColor White
Write-Host "   supabase functions deploy interview-reminders --project-ref oxcmkfejolzcyxhgfdhj" -ForegroundColor Gray
Write-Host "5. Apply pg_cron migration (see PHASE4_PGCRON_DEPLOYMENT_GUIDE.md)" -ForegroundColor White
Write-Host ""
