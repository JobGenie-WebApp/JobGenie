# Database Setup Guide

## Overview

This directory contains the consolidated database migration file for JobGenie. All database setup including schemas, RLS policies, triggers, and functions are managed here.

## Files

### `complete_migration.sql`
Complete database setup file containing:
- **Extensions**: pg_cron, pg_net
- **Helper Functions**: Security definer functions for role checks
- **Table Grants**: Permissions for authenticated/anon users
- **RLS Policies**: Row-level security for all tables
- **Indexes**: Performance indexes
- **Notification System**: Triggers and functions for real-time notifications
- **Storage Policies**: RLS policies for Supabase Storage buckets

## Setup Instructions

### Initial Setup

1. **Create Prisma Schema** (tables, enums, relations)
   ```bash
   npx prisma migrate deploy
   ```

2. **Apply Complete Migration** (RLS, permissions, triggers)
   ```bash
   npm run db:policies
   ```

### Available Scripts

- `npm run db:policies` - Apply RLS policies and functions (tables must exist)
- `npm run db:setup` - Run Prisma migrations then apply policies
- `npm run db:reset` - Drop everything, remigrate, and apply policies

### Development Workflow

When you modify the Prisma schema:

1. Create a new Prisma migration:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```

2. Reapply the complete migration:
   ```bash
   npm run db:policies
   ```

### Production Deployment

1. Backup your database first!

2. Run Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```

3. Apply the complete migration via Supabase Dashboard SQL Editor:
   - Copy contents of `database/complete_migration.sql`
   - Paste into SQL Editor
   - Execute

## Environment Variables

Required in `.env` or `.env.local`:

```env
# Direct Postgres connection (for migrations)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?pgbouncer=true&connection_limit=1"

# Supabase client (for app runtime)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

## Migration Strategy

This project uses a **two-step migration approach**:

1. **Prisma Migrations** (schema/structure)
   - Located in `prisma/migrations/`
   - Managed by Prisma CLI
   - Creates tables, columns, constraints, indexes

2. **Complete Migration** (security/features)
   - Located in `database/complete_migration.sql`
   - Applied after Prisma migrations
   - Adds RLS, triggers, functions, storage policies

### Why This Approach?

- **Prisma** is excellent for schema management and type generation
- **RLS & Triggers** are better managed in raw SQL for Supabase
- **Separation** makes it clear what each tool handles
- **Idempotent** - safe to run complete_migration.sql multiple times

## Storage Buckets

The following storage buckets must be created manually in Supabase Dashboard:

- `profile-images` - Candidate profile images
- `company-logos` - Company logo images  
- `resume` - Candidate resume files
- `resume_copy` - Candidate resume copy files
- `br-certificates` - Business registration certificates

RLS policies for these buckets are included in `complete_migration.sql`.

## Troubleshooting

### "Permission denied" errors
- Ensure `DATABASE_URL` uses the correct direct connection string (not pooled)
- Check that the user has SUPERUSER or required privileges

### "Relation does not exist"
- Run Prisma migrations first: `npx prisma migrate deploy`
- Then apply complete migration: `npm run db:policies`

### "Function already exists"
- Safe to ignore - the migration uses `CREATE OR REPLACE`
- Or drop and recreate: `DROP FUNCTION function_name CASCADE`

### PostgREST schema cache not updating
- The migration sends `NOTIFY pgrst, 'reload schema'`
- Restart PostgREST if changes don't appear
- Or wait 5-10 seconds for auto-reload

## Additional Scripts

Other database-related scripts in `scripts/`:

- `cleanup-logs.ts` - Delete old log entries (retention policy)
- `seed-mis-permissions.ts` - Seed MIS role/permission system
- `add-mis-permissions.ts` - Add new MIS permissions
- `update-seniority-levels.ts` - Update job designation seniority levels

## Support

For issues or questions:
1. Check Supabase logs in Dashboard
2. Review error logs table: `SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 20`
3. Verify RLS policies are active: `SELECT * FROM pg_policies WHERE schemaname = 'public'`
