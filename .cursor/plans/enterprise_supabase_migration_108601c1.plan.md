---
name: ""
overview: ""
todos: []
isProject: false
---

---
name: Enterprise Supabase Migration
overview: Full enterprise migration for JobGenie — covering all missing backend features: RLS, Resend email (replacing Gmail SMTP), Auth hardening, JWT review, pg_cron, Edge Functions, Realtime notifications, audit logs RLS, database performance fixes, and environment config — without breaking any existing feature.
todos:
  - id: phase1-rls
    content: "Apply complete_rls_policies.sql to live database via MCP execute_sql"
    status: pending
  - id: phase1-storage
    content: "Apply supabase/storage_rls_policies.sql for all 5 storage buckets"
    status: pending
  - id: phase1-functions
    content: "Fix mutable search_path on update_pipeline_status_from_outcome and create_first_interview_round"
    status: pending
  - id: phase1-password-col
    content: "REVOKE SELECT on users.password column from anon and authenticated roles"
    status: pending
  - id: phase1-db-perf
    content: "Fix 3 duplicate index pairs on interview_rounds + add missing FK index on candidates.reviewed_by"
    status: pending
  - id: phase2-nextconfig
    content: "Fix wrong Supabase project hostname in next.config.ts image remote patterns"
    status: pending
  - id: phase2-keys
    content: "Reconcile PUBLISHABLE_KEY vs ANON_KEY in middleware.ts + add missing NEXT_PUBLIC_APP_URL env var"
    status: pending
  - id: phase2-auth
    content: "Enable leaked password protection + configure JWT session expiry in Supabase Dashboard"
    status: pending
  - id: phase3-resend
    content: "Replace Gmail SMTP with Resend in src/lib/email.ts (all 6 email functions) + configure Supabase Auth SMTP to Resend"
    status: pending
  - id: phase3-mfa
    content: "Add TOTP MFA enrollment and enforcement for MIS users"
    status: pending
  - id: phase4-pgcron
    content: "Install pg_cron + pg_net extensions + create interview-reminders Edge Function + schedule via pg_cron"
    status: pending
  - id: phase5-notifications-sql
    content: "Create notifications table with RLS + Postgres triggers on job_invitations, interview_rounds, job_offers"
    status: pending
  - id: phase5-realtime
    content: "Add useNotifications hook (Realtime subscription) + NotificationBell component to candidate/employer dashboards"
    status: pending
  - id: phase6-edge-cv
    content: "Move Gemini CV extraction to Supabase Edge Function (extract-cv)"
    status: pending
isProject: false
---

# Enterprise Supabase Migration — Complete Plan for JobGenie

## Two Environments — Both Must Be Updated

| Environment | File | Supabase Project | Region |
|---|---|---|---|
| Development | `.env.local` | `qqhdpoddfwkqsubmjskg` | ap-southeast-2 (Sydney) |
| Production | `.env.prod` | `oxcmkfejolzcyxhgfdhj` | ap-northeast-1 (Tokyo) |

**Data preservation guarantee:** Every SQL operation in this plan is non-destructive:
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` — does not touch rows, only restricts new PostgREST access
- `CREATE POLICY` — does not touch rows
- `CREATE INDEX CONCURRENTLY` — adds an index without locking writes
- `DROP INDEX` (duplicate removal) — drops the index only, never the data
- `CREATE TABLE notifications` — new table, does not affect existing tables
- `CREATE EXTENSION` — installs extension, no data touched
- `REVOKE SELECT (password)` — restricts API access to a column, does not delete it
- Storage RLS policies — restricts who can GET/PUT/DELETE objects, never deletes the objects themselves

**Execution strategy:**
- All changes are bundled into numbered SQL migration files in `supabase/migrations/`
- MCP (`execute_sql`) applies to dev (`qqhdpoddfwkqsubmjskg`) — used for dev
- For prod (`oxcmkfejolzcyxhgfdhj`): run the same SQL files via the Supabase Dashboard SQL editor, or via `psql` using `DIRECT_URL` from `.env.prod`, or via `supabase db push` with the prod project token
- Edge Functions are deployed to both projects with `supabase functions deploy --project-ref <id>`

---

## Full Gap Analysis (Code vs Live Database)

Verified via MCP on dev project `qqhdpoddfwkqsubmjskg` (prod project `oxcmkfejolzcyxhgfdhj` assumed same state as code was never applied to either):

| Area | What exists in code | What is live | Status |
|---|---|---|---|
| RLS | `prisma/complete_rls_policies.sql` written | **NEVER APPLIED** — 31 tables open | CRITICAL |
| Storage RLS | `supabase/storage_rls_policies.sql` written | Not applied | CRITICAL |
| `users.password` exposed | bcrypt hashes in DB | Column returned by API | CRITICAL |
| Function search_path | 2 functions in DB | Mutable — SQL injection risk | CRITICAL |
| next.config.ts hostname | Wrong project ID in remotePatterns | next/image broken for all storage | HIGH |
| ANON_KEY vs PUBLISHABLE_KEY | Both keys in .env.local | Inconsistent usage in middleware | HIGH |
| `NEXT_PUBLIC_APP_URL` | Referenced in `email.ts` | **Missing from .env.local** — all email links go to localhost | HIGH |
| Custom SMTP | Gmail App Password in .env.local | 500/day limit, no bounce handling | HIGH |
| Resend / Auth SMTP | Not configured | No Resend integration | HIGH |
| Leaked password protection | N/A | Disabled in Supabase Auth | HIGH |
| JWT expiry / session config | N/A | Using default settings (unreviewed) | MEDIUM |
| MFA for MIS users | Not implemented | Not configured | MEDIUM |
| pg_cron | Available but not installed | Cron depends on Vercel external scheduler | MEDIUM |
| Edge Functions | None written | None deployed | MEDIUM |
| Realtime | No subscriptions anywhere | No notification table | MEDIUM |
| Audit logs (tables) | `event_logs`, `api_request_logs`, `error_logs` exist | RLS not applied | MEDIUM |
| Duplicate indexes | 3 duplicate pairs on `interview_rounds` | Wastes write IOPS | LOW |
| Missing FK index | `candidates.reviewed_by` missing index | Slow admin queries | LOW |
| Supabase Vault | N/A | Secrets in env vars | LOW |

---

## Architecture Overview

```mermaid
flowchart TD
    P1["Phase 1\nRLS + DB Security\n(SQL only)"] --> P2["Phase 2\nEnv + Auth Config\n(Dashboard + code)"]
    P2 --> P3["Phase 3\nResend Email\n(code change)"]
    P3 --> P4["Phase 4\npg_cron + Edge Fn\n(Supabase)"]
    P4 --> P5["Phase 5\nRealtime Notifications\n(SQL + code)"]
    P5 --> P6["Phase 6\nEdge Fn — CV Extract\n(optional)"]
```

All existing 74 API routes and server actions are **unaffected** — they use the service_role admin client which bypasses RLS. No existing feature breaks.

---

## Phase 1 — Database Security (SQL only, zero code changes)

### 1a. Apply RLS Policies

Run `prisma/complete_rls_policies.sql` via MCP `execute_sql`. The file is already correctly written with:
- `SECURITY DEFINER` helper functions (`is_mis_user()`, `is_candidate()`, `is_employer()`)
- `(SELECT auth.uid())` init-plan pattern for performance
- Per-role policies covering all 31 tables
- Covers all logging tables: `event_logs`, `api_request_logs`, `error_logs` — **audit logs are already in the codebase, they just need RLS**

### 1b. Apply Storage Bucket RLS

Run `supabase/storage_rls_policies.sql` — covers all 5 buckets (`profile-images`, `company-logos`, `resume`, `resume_copy`, `br-certificates`).

### 1c. Fix Function search_path (SQL injection risk)

```sql
ALTER FUNCTION public.update_pipeline_status_from_outcome()
  SET search_path = public, extensions;
ALTER FUNCTION public.create_first_interview_round()
  SET search_path = public, extensions;
```

### 1d. Revoke password column from API

```sql
REVOKE SELECT (password) ON public.users FROM anon, authenticated;
```

### 1e. Fix duplicate indexes on `interview_rounds`

```sql
DROP INDEX IF EXISTS idx_interview_rounds_invitation_round;
DROP INDEX IF EXISTS idx_interview_rounds_outcome;
DROP INDEX IF EXISTS idx_interview_rounds_status;
```
(Keep the `interview_rounds_*_idx` versions — they were created first by Prisma.)

### 1f. Add missing FK index on `candidates.reviewed_by`

```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS candidates_reviewed_by_idx
  ON public.candidates (reviewed_by);
```

---

## Phase 2 — Environment Config + Supabase Auth Dashboard Settings

### 2a. Fix `next.config.ts` for both environments

The current config hardcodes a **wrong** and **single** Supabase project hostname (`qczkzpbkbwjzdvmtkfyn.supabase.co`). This breaks `next/image` for both dev (`qqhdpoddfwkqsubmjskg`) and prod (`oxcmkfejolzcyxhgfdhj`).

Replace the hardcoded hostname with a wildcard `*.supabase.co` pattern so both environments are covered automatically — no env-specific config needed:

```typescript
// next.config.ts — remotePatterns change
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
  ],
},
```

This is safe — it only allows images from Supabase-hosted storage paths, covering all current and future Supabase projects.

### 2b. Fix middleware key inconsistency + add missing env var

- [`src/middleware.ts`](src/middleware.ts) uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy JWT format)
- [`src/lib/supabase/client.ts`](src/lib/supabase/client.ts) and [`server.ts`](src/lib/supabase/server.ts) use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (new `sb_publishable_...` format)

Both work with the same Supabase project, but using two different env vars is confusing and error-prone. Update `src/middleware.ts` to use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

- Add `NEXT_PUBLIC_APP_URL=https://yourdomain.com` to `.env.local` — **this is currently missing**. Without it, every email link (verification, password reset, invitation, approval) points to `http://localhost:3000` in production.

### 2c. Supabase Auth Dashboard settings (no code changes)

In the Supabase Dashboard → **Auth → Settings**:
- Enable **Leaked Password Protection** (HaveIBeenPwned.org check)
- Set **JWT expiry** to 3600s (1 hour) — review current value
- Enable **Refresh Token Rotation** (already default; confirm it is on)
- Set **Password minimum length** to 8+ characters with complexity requirements

In **Auth → Email Settings**:
- Point SMTP to Resend relay (`smtp.resend.com`, port 465/587, API key as password) — this handles any Supabase-generated auth emails

---

## Phase 3 — Complete nodemailer Removal + Resend Integration

### Full inventory of nodemailer usage

Three files each contain their own `createTransporter()` factory (code duplicated 3×):

| File | Functions | Called by |
|---|---|---|
| [`src/lib/email.ts`](src/lib/email.ts) | `sendVerificationEmail`, `sendPasswordResetEmail`, `sendMISInvitationEmail`, `sendEmployerInvitationEmail`, `sendApprovalEmail`, `sendRejectionEmail` | `auth.ts`, `candidate.ts` actions |
| [`src/lib/interview-emails.ts`](src/lib/interview-emails.ts) | `sendInterviewInvitationEmail`, `sendInterviewConfirmedEmail`, `sendInterviewReminderEmail`, `sendCandidateCancellationEmail`, `sendEmployerCancellationEmail`, `sendMISRescheduleNotificationToCandidate`, `sendMISRescheduleNotificationToEmployer` | 7 API route handlers + `process-interview-reminders.ts` |
| [`src/lib/employer-emails.ts`](src/lib/employer-emails.ts) | `sendEmployerApprovalEmail`, `sendEmployerRejectionEmail` | `employer.ts`, `employer-actions.ts` actions |

**Total: 3 files with nodemailer, 15 email functions. Zero callers change — all function signatures are identical after migration.**

### 3a. Package + env changes

```bash
npm uninstall nodemailer
npm install resend
```

Add to **both** `.env.local` and `.env.prod`:
```
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000   # dev; prod: https://yourdomain.com
```

Remove from **both** `.env.local` and `.env.prod`:
```
SMTP_HOST  SMTP_PORT  SMTP_SECURE  SMTP_USER  SMTP_PASS
```

Update `.env.example` to replace the SMTP block with the Resend block.

Also configure **Supabase Auth SMTP** (Dashboard → Auth → Email Settings) to use Resend's SMTP relay (`smtp.resend.com`, port 465, API key as password) so any Supabase-generated auth emails also use Resend.

### 3b. Create `src/lib/resend.ts` (new shared client)

One file, imported by all three email files — eliminates the duplicated `createTransporter()`:

```typescript
import { Resend } from "resend";
export const resend = new Resend(process.env.RESEND_API_KEY);
export const EMAIL_FROM = process.env.EMAIL_FROM ?? "noreply@jobgenie.com";
```

### 3c. Rewrite `src/lib/email.ts`

- Remove `import nodemailer from "nodemailer"` and `function createTransporter()`
- Add `import { resend, EMAIL_FROM } from "./resend"`
- Replace the SMTP check guard: `if (!process.env.SMTP_USER || !process.env.SMTP_PASS)` → `if (!process.env.RESEND_API_KEY)`
- Replace every `transporter.sendMail({ from: ..., to, subject, html })` with:

```typescript
const { error } = await resend.emails.send({ from: EMAIL_FROM, to, subject, html });
if (error) throw new Error(error.message);
```

All 6 function signatures unchanged. All HTML templates unchanged. All utility exports (`generateVerificationCode`, `getVerificationExpiry`, `getInvitationExpiry`, `generateInvitationToken`, `getBaseUrl`, `maskEmail`) unchanged.

### 3d. Rewrite `src/lib/interview-emails.ts`

- Remove `import nodemailer` and local `createTransporter()`
- Add `import { resend, EMAIL_FROM } from "./resend"`
- Replace all 7 `transporter.sendMail(...)` calls with `resend.emails.send(...)`
- Change SMTP guard to `!process.env.RESEND_API_KEY`
- All 7 function signatures and HTML templates unchanged

### 3e. Rewrite `src/lib/employer-emails.ts`

- Same pattern: remove nodemailer, import shared resend client, replace 2 `sendMail` calls
- Both function signatures and HTML templates unchanged

### 3f. MFA for MIS users

Supabase Auth provides TOTP MFA via `supabase.auth.mfa.*`. Add to the MIS settings page:
- Enrollment: show QR code, verify TOTP code
- Enforcement: check `aal_level` in `src/middleware.ts` for MIS routes — redirect to `/mis/mfa` if AAL1 only
- Challenge/verify flow on login: after `signInWithPassword`, check if MFA is enrolled and prompt for TOTP

---

## Phase 4 — Replace Vercel Cron with pg_cron + Edge Function

The current [`src/app/api/cron/interview-reminders/route.ts`](src/app/api/cron/interview-reminders/route.ts) requires an external scheduler. Move it fully into Supabase.

### 4a. Install extensions

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;  -- for HTTP calls from pg_cron
```

### 4b. Create Edge Function

Create `supabase/functions/interview-reminders/index.ts` — port the logic from [`src/lib/process-interview-reminders.ts`](src/lib/process-interview-reminders.ts) to Deno. Uses Resend API directly (no nodemailer, which is Node.js only).

```
supabase/functions/
  interview-reminders/
    index.ts
```

### 4c. Schedule with pg_cron (run on EACH database separately)

For **dev** (`qqhdpoddfwkqsubmjskg`):
```sql
SELECT cron.schedule(
  'interview-reminders',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url  := 'https://qqhdpoddfwkqsubmjskg.supabase.co/functions/v1/interview-reminders',
      headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret')),
      body := '{}'::jsonb
    );
  $$
);
```

For **prod** (`oxcmkfejolzcyxhgfdhj`):
```sql
SELECT cron.schedule(
  'interview-reminders',
  '*/15 * * * *',
  $$
    SELECT net.http_post(
      url  := 'https://oxcmkfejolzcyxhgfdhj.supabase.co/functions/v1/interview-reminders',
      headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret')),
      body := '{}'::jsonb
    );
  $$
);
```

Edge Functions deployed to each project with:
```bash
supabase functions deploy interview-reminders --project-ref qqhdpoddfwkqsubmjskg  # dev
supabase functions deploy interview-reminders --project-ref oxcmkfejolzcyxhgfdhj  # prod
```

The Next.js route handler stays as a manual-trigger fallback.

---

## Phase 5 — Realtime Notifications

### 5a. Create `notifications` table + triggers (SQL)

```sql
CREATE TABLE public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT,
  data         JSONB,
  is_read      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_id_unread_idx
  ON public.notifications (user_id, is_read)
  WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_notifications" ON public.notifications
  FOR ALL USING ((SELECT auth.uid()) = user_id);
```

Add `NOTIFY` triggers on:
- `job_invitations` — INSERT and status change → notify the candidate and employer
- `interview_rounds` — INSERT (new round scheduled) → notify candidate
- `job_offers` — INSERT and status change → notify candidate

Triggers call a `notify_user(user_id, type, title, body, data)` helper function that inserts into `notifications`.

### 5b. `useNotifications` hook

In [`src/hooks/`](src/hooks/), add `useNotifications.ts` using `supabase.channel().on('postgres_changes', ...)` filtered by `user_id`. On new INSERT, append to local state and show a toast (shadcn/ui `useToast`).

### 5c. `NotificationBell` component

In [`src/components/`](src/components/), add `NotificationBell.tsx`:
- Bell icon with unread count badge (red dot)
- Dropdown with last 10 notifications
- "Mark all read" button
- Clicking a notification navigates to the related invitation/round/offer

Add to candidate and employer dashboard layouts.

---

## Phase 6 — Edge Function: CV Extraction (optional)

Move [`src/app/actions/extract-cv.ts`](src/app/actions/extract-cv.ts) (Gemini API call) to `supabase/functions/extract-cv/index.ts`. Benefit: longer timeout (150s vs Next.js 60s default), runs globally closer to the user, `GEMINI_API_KEY` removed from Next.js env. Server action becomes a thin proxy: `supabase.functions.invoke('extract-cv', { body: { url } })`.

---

## Complete Summary

### What this fixes (confirmed gaps):

- **RLS** — 31 tables protected (policies were written but never applied)
- **Storage RLS** — 5 storage buckets protected
- **Audit logs** — `event_logs`, `api_request_logs`, `error_logs` are already implemented; RLS just needs applying
- **Auth hardening** — leaked password protection, session expiry, refresh token rotation, password strength
- **JWT** — Supabase manages session JWTs internally; the `JWT_SECRET` in `.env.local` is only for custom tokens (password reset, invitations) and stays as-is
- **Postgres Admin** — Supabase Dashboard already provides Table Editor, SQL Editor, and pg_stat_statements; no changes needed
- **Custom SMTP → Resend** — replace Gmail (500/day, app password) with Resend SDK across all 7 email functions
- **Supabase Auth SMTP** — point to Resend relay so Supabase-generated auth emails also use Resend
- **Production email links** — add missing `NEXT_PUBLIC_APP_URL` env var
- **MFA** — TOTP for MIS admin users
- **pg_cron** — install extension + schedule interview reminders natively in Supabase (no Vercel dependency)
- **Edge Functions** — interview-reminders (required) + extract-cv (optional)
- **Realtime** — notifications table + triggers + `useNotifications` hook + `NotificationBell` component
- **Key inconsistency** — align middleware to use `PUBLISHABLE_KEY`
- **next.config.ts** — fix wrong project hostname (next/image broken for all uploaded images)
- **DB performance** — remove 3 duplicate index pairs, add missing FK index

### What is NOT changed (zero risk):
- All 74 API routes (use service_role, bypass RLS)
- All Server Actions
- All Prisma queries
- All existing auth flows (login, register, OTP, password reset) — same signatures, same behavior
- All frontend pages and components
- The `users.password` bcrypt column stays (needed for MIS invitation temp-password flow)
- All existing data in every table and every storage bucket — zero rows deleted, zero files deleted

---

## How to Apply to Both Databases (Execution Order)

Every SQL change is packaged as a numbered migration file in `supabase/migrations/`. Execute in this order on **both** dev and prod:

```
supabase/migrations/
  20260514_01_enable_rls.sql           ← Phase 1a: complete_rls_policies.sql
  20260514_02_storage_rls.sql          ← Phase 1b: storage_rls_policies.sql
  20260514_03_fix_functions.sql        ← Phase 1c: fix search_path + REVOKE password col
  20260514_04_fix_indexes.sql          ← Phase 1d: drop duplicate indexes + add FK index
  20260514_05_notifications.sql        ← Phase 5: notifications table + triggers
  20260514_06_pgcron_dev.sql           ← Phase 4 dev: pg_cron + pg_net + dev schedule URL
  20260514_06_pgcron_prod.sql          ← Phase 4 prod: pg_cron + pg_net + prod schedule URL
```

**Dev database** — applied via MCP `execute_sql` (already connected to `qqhdpoddfwkqsubmjskg`).

**Prod database** — applied via one of these methods (user's choice):
1. Supabase Dashboard → SQL Editor for project `oxcmkfejolzcyxhgfdhj` — paste each file
2. `psql "postgresql://postgres.oxcmkfejolzcyxhgfdhj:PASSWORD@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres" -f supabase/migrations/20260514_01_enable_rls.sql`
3. `supabase db push --project-ref oxcmkfejolzcyxhgfdhj` (requires Supabase CLI + project access token)

**Code changes** (Next.js app) — applied once to the codebase, affect both environments via the respective env files:
- `next.config.ts` — wildcard hostname covers both projects
- `src/middleware.ts` — key name fix
- `src/lib/email.ts` — Resend replaces nodemailer
- Both `.env.local` and `.env.prod` — add `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_APP_URL`; remove SMTP vars

**Edge Functions** — deployed separately to each project:
```bash
supabase functions deploy interview-reminders --project-ref qqhdpoddfwkqsubmjskg
supabase functions deploy interview-reminders --project-ref oxcmkfejolzcyxhgfdhj
```