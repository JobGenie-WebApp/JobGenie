# JobGenie — Supabase Extraction Map

**Purpose:** complete inventory of every place the application talks to Supabase, and what a replacement backend must provide.
**Audit date:** 1 September 2026 · **Scope:** full sweep of `src/`, `scripts/`, `supabase/`, `prisma/` (branch `landing`).
**Companion:** interactive version — https://claude.ai/code/artifact/a16b4a0c-4757-43f1-b8ed-b3fc16384fd5

---

## Executive summary

**All 143 API routes touch Supabase**, directly or through a shared library. There is no subset to carve out; the dependency is total.

But the routes are not the problem. **They already are your API.** What must be rebuilt is the layer underneath them — five Supabase services the route handlers call. Plus eleven places where the browser and server components skip the API entirely and query Supabase directly; those need brand-new endpoints that do not exist today.

| Surface | Scale | Difficulty |
|---|---|---|
| Auth (GoTrue) | 268 call sites — 234 are `getUser()` | Medium — but it is the hot path |
| Database (PostgREST) | 785 queries across 39 tables | Large, mechanical |
| Storage | 9 buckets, 4 private via signed URLs | Small, self-contained |
| Realtime | 5 tables, 8 subscription sites | Small — or delete it entirely |
| Postgres logic | 3 RPC + 12 triggers + several hundred RLS policies | **Largest and least visible** |

**Counts at a glance**

| | |
|---|---|
| API routes | 143 (all Supabase-dependent) |
| Server actions | 57 across 14 files |
| Server components querying directly | 30 |
| Browser-direct call sites | 11 files |
| Shared libraries reaching Supabase | 13 |
| Files importing a Supabase client factory | 205 |
| Scheduled jobs | 2 Vercel crons + 1 duplicate Edge Function |

---

## 1. The five surfaces to replace

Supabase is not one dependency here. It is five separate services wearing one SDK.

### 1.1 Auth — 268 call sites

Cookie-based sessions via `@supabase/ssr`, refreshed in `src/middleware.ts` on every request.

| Method | Sites |
|---|---|
| `auth.getUser` | 234 |
| `auth.signOut` | 11 |
| `auth.signInWithPassword` | 5 |
| `auth.signUp` | 4 |
| `auth.admin.createUser` | 4 |
| `auth.admin.deleteUser` | 4 |
| `auth.admin.updateUserById` | 3 |
| `auth.admin.listUsers` | 2 |
| `auth.getSession` | 1 |

**Requirement:** session issue / refresh / revoke, an admin user API, and a `getUser` that is *cheap* — it runs on all 234 sites and on every middleware pass. Verify the JWT locally rather than round-tripping.

### 1.2 Database — 785 queries, 39 tables

Every runtime query is a PostgREST call through `supabase-js`. **Prisma is present but schema-and-migrations only — zero runtime usage**, so the new backend can adopt Prisma directly against the existing 39-model schema.

Tables by query volume: `employers` (94), `candidates` (93), `users` (87), `job_invitations` (74), `mis_user` (52), `jobs` (47), `interview_rounds` (37), `companies` (35), `job_applications` (28), `notifications` (22), `payment_requests` (19), `mis_roles` (12), `candidate_resumes` (12), `industries` (11), `job_offers` (10), `event_logs` (10), `seniority_levels` (9), `work_experiences` (8), `payment_types` (8), `job_compliance_flags` (8), `educations` (8), `projects` (7), `certificates` (7), `awards` (7), `saved_jobs` (6), `mis_role_permissions` (6), `mis_permissions` (6), `job_designations` (6), `payment_settings` (5), `payment_pricing` (5), `payment_bank_details` (5), `payment_proofs` (4), `mis_sidebar_visibility_settings` (4), `interview_reminder_sent` (4), `error_logs` (4), `mis_interview_reminder_settings` (3), `countries` (1), `api_request_logs` (1).

### 1.3 Storage — 9 buckets

Operations in use: `upload`, `remove`, `list`, `download`, `createSignedUrl`, `getPublicUrl`, `createBucket`, `listBuckets`.

| Bucket | Visibility | Used by |
|---|---|---|
| `resume` | private, signed | `StorageService.uploadResume` (watermarked) |
| `resume_copy` | private, signed | Generated common CV |
| `br-certificates` | private, signed | Employer registration (pre-signup) |
| `payment-proofs` | private, signed | `/api/payments/proofs/[proofId]` |
| `profile-images` | public | Candidate profile photo |
| `cover-images` | public | Candidate cover image |
| `company-logos` | public | Employer logo |
| `assessment-attachments` | signed | Interview round assessments |
| `assessment-submissions` | signed | Candidate assessment uploads |

Private buckets are read through short-lived signed URLs minted by `signStorageUrl()`; `signPiiUrls()` deep-walks 25 API responses rewriting stored URLs in place.

### 1.4 Realtime — 5 tables, 8 subscriptions

Tables in the `supabase_realtime` publication: `notifications`, `job_invitations`, `payment_requests`, `interview_rounds`, `job_offers`.

**Every one of the eight subscriptions does nothing but trigger a refetch.** SWR `refreshInterval` replaces all of them with no user-visible change. Deleting this surface is a defensible call.

### 1.5 Postgres logic — 15 functions + RLS

Does not appear in the route inventory, which is exactly why it gets missed. See §7.

---

## 2. Calls that bypass your API entirely

These talk to Supabase straight from the browser or from a server component. They have **no endpoint today**, so each is net-new work — not a rewrite, an addition. Start here.

| File | What it does | New endpoint needed |
|---|---|---|
| `src/hooks/useNotifications.ts` | Reads / marks read / deletes `notifications`; three realtime subscriptions | `GET`/`PATCH`/`DELETE /notifications` + change stream or poll |
| `src/hooks/useInvitationCount.ts` | Resolves candidate + employer, counts unopened `job_invitations`, subscribes | `GET /invitations/unread-count` — **note:** `/api/candidate/invitations/unopened-count` already exists and the hook does not use it |
| `src/hooks/usePendingPaymentCount.ts` | Counts pending `payment_requests` for the company, subscribes | `GET /payments/pending-count` — **route exists, unused by the hook** |
| `src/hooks/useRealtimeCount.ts` | Generic counter: arbitrary table, filters, `count: exact`, plus subscription | Cannot stay generic in a real API. Replace each caller with a named count endpoint |
| `src/components/realtime/InvitationRealtimeBridge.tsx` | Watches `job_invitations` to invalidate SWR caches (candidate + employer variants) | Change stream, or SWR `refreshInterval` |
| `src/app/candidate/(dashboard)/invitations/[id]/InvitationDetailClient.tsx` | Per-invitation channel on `job_invitations` and `job_offers` | Change stream, or revalidate on focus |
| `src/app/candidate/(dashboard)/settings/AccountSecuritySettings.tsx` | `auth.signOut()` from the browser | `POST /auth/sign-out` |
| `src/app/candidate/(dashboard)/settings/DangerZoneSettings.tsx` | `auth.signOut()` after account deletion | `POST /auth/sign-out` |
| `src/app/employer/(dashboard)/settings/AccountSecuritySettings.tsx` | `auth.signOut()` from the browser | `POST /auth/sign-out` |
| `src/app/employer/(dashboard)/settings/DangerZoneSettings.tsx` | `auth.signOut()` after account deletion | `POST /auth/sign-out` |
| `src/components/employer/profile/EmployerProfileWizard.tsx` | `auth.getUser()` from the browser | `GET /auth/user` |

---

## 3. API route inventory (143 routes)

`DB-via-lib` marks a route with no direct query of its own that pulls Supabase in through a shared library — **the cron routes are the ones to watch; they look clean and are not.**

| Route | Methods | Surfaces | Detail | Tables |
|---|---|---|---|---|
| `/api/auth/logout` | POST | Auth, DB | auth: `getUser`, `signOut`<br>via lib: db | `users` |
| `/api/candidate/applications` | GET | Auth, DB, Storage | auth: `getUser`<br>via lib: storage, db | `candidates` `job_applications` |
| `/api/candidate/applications/[id]` | DELETE | Auth, DB | auth: `getUser`<br>via lib: db | `candidates` `job_applications` |
| `/api/candidate/calendar` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `candidates` `job_invitations` |
| `/api/candidate/interview-rounds/[roundId]/assessment-attachment` | GET | Auth, DB, Storage | auth: `getUser`<br>storage: `createSignedUrl` | `candidates` `interview_rounds` |
| `/api/candidate/interview-rounds/[roundId]/assessment-submission` | POST GET | Auth, DB, Storage | auth: `getUser`<br>storage: `listBuckets`, `createBucket`, `upload`, `remove`, `createSignedUrl`<br>via lib: storage | `candidates` `interview_rounds` |
| `/api/candidate/interview-rounds/[roundId]/cancel-round` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `candidates` `interview_rounds` |
| `/api/candidate/interview-rounds/[roundId]/respond` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `candidates` `interview_rounds` `job_invitations` |
| `/api/candidate/invitations` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `candidates` `job_invitations` |
| `/api/candidate/invitations/[id]` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `candidates` `job_invitations` |
| `/api/candidate/invitations/[id]/cancel-interview` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `candidates` `job_invitations` |
| `/api/candidate/invitations/[id]/offer` | GET POST | Auth, DB | auth: `getUser`<br>via lib: db | `candidates` `job_invitations` `job_offers` `job_applications` |
| `/api/candidate/invitations/[id]/respond` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `candidates` `job_invitations` `interview_rounds` |
| `/api/candidate/invitations/[id]/rounds` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `candidates` `job_invitations` `interview_rounds` |
| `/api/candidate/invitations/unopened-count` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `candidates` `job_invitations` |
| `/api/candidate/job-preferences` | GET PUT | Auth, DB | auth: `getUser` | `candidates` |
| `/api/candidate/jobs` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `jobs` `candidates` `saved_jobs` `job_applications` |
| `/api/candidate/jobs/[id]` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `candidates` `jobs` `job_applications` `saved_jobs` |
| `/api/candidate/jobs/[id]/apply` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `candidates` `jobs` `job_applications` `notifications` |
| `/api/candidate/jobs/[id]/save` | POST DELETE | Auth, DB | auth: `getUser`<br>via lib: db | `candidates` `saved_jobs` |
| `/api/candidate/profile` | GET | Auth, DB, Storage | auth: `getUser`<br>via lib: db, storage | `candidates` |
| `/api/candidate/resumes` | GET POST | Auth, DB, Storage | auth: `getUser`<br>via lib: storage, db | `candidates` `candidate_resumes` |
| `/api/candidate/resumes/[id]` | DELETE | Auth, DB, Storage | auth: `getUser`<br>via lib: storage, db | `candidates` `candidate_resumes` |
| `/api/candidate/resumes/[id]/primary` | PUT | Auth, DB | auth: `getUser`<br>via lib: db | `candidates` `candidate_resumes` |
| `/api/candidate/saved-jobs` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `candidates` `saved_jobs` `job_applications` |
| `/api/candidate/settings/delete-account` | DELETE | Auth, DB | auth: `getUser`, `admin.deleteUser` | `candidates` |
| `/api/candidate/sidebar-visibility` | GET | Auth, DB | auth: `getUser` | `mis_sidebar_visibility_settings` |
| `/api/candidate/upload-cover-image` | POST DELETE | Auth, DB, Storage | auth: `getUser`<br>storage: `listBuckets`, `createBucket`, `upload`, `getPublicUrl`, `list`, `remove`<br>via lib: db | `candidates` |
| `/api/candidate/upload-profile-image` | POST | Auth, DB, Storage | auth: `getUser`<br>storage: `listBuckets`, `createBucket`, `upload`, `getPublicUrl`<br>via lib: db | `candidates` |
| `/api/candidate/upload-resume` | POST | Auth, DB, Storage | auth: `getUser`<br>via lib: storage, db | `candidates` |
| `/api/cron/expire-jobs` | GET | DB-via-lib | via lib: db | — |
| `/api/cron/interview-reminders` | GET | DB-via-lib | via lib: db | — |
| `/api/delete-file` | POST | Auth, DB, Storage | auth: `getUser`<br>storage: `remove`<br>via lib: db | `users` |
| `/api/delete-presignup-file` | POST | Storage, DB-via-lib | storage: `remove`<br>via lib: db | — |
| `/api/employer/applications` | GET | Auth, DB, Storage | auth: `getUser`<br>via lib: storage, db | `employers` `jobs` `job_applications` |
| `/api/employer/applications/[id]/ats-recompute` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `job_applications` |
| `/api/employer/applications/[id]/reject` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `job_applications` `candidates` `companies` `notifications` |
| `/api/employer/applications/[id]/review` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `job_applications` `candidates` `notifications` |
| `/api/employer/applications/[id]/schedule-interview` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `job_applications` `candidates` `job_invitations` `companies` `notifications` |
| `/api/employer/bank-details` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `users` `payment_bank_details` |
| `/api/employer/calendar` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `job_invitations` |
| `/api/employer/candidates/[id]` | GET | Auth, DB, Storage | auth: `getUser`<br>via lib: db, storage | `employers` `candidates` |
| `/api/employer/company` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `employers` |
| `/api/employer/interview-rounds/[roundId]/assessment-attachment` | GET | Auth, DB, Storage | auth: `getUser`<br>storage: `createSignedUrl` | `employers` `interview_rounds` |
| `/api/employer/interview-rounds/[roundId]/assessment-submission` | GET | Auth, DB, Storage | auth: `getUser`<br>storage: `createSignedUrl` | `employers` `interview_rounds` |
| `/api/employer/interview-rounds/[roundId]/cancel-round` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `interview_rounds` |
| `/api/employer/interview-rounds/[roundId]/confirm` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `interview_rounds` `companies` |
| `/api/employer/interview-rounds/[roundId]/edit` | PATCH | Auth, DB | auth: `getUser` | `interview_rounds` `employers` |
| `/api/employer/interview-rounds/[roundId]/feedback` | POST GET | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `interview_rounds` `job_invitations` `job_applications` |
| `/api/employer/interview-rounds/[roundId]/offer` | POST GET | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `interview_rounds` `job_offers` `job_invitations` |
| `/api/employer/interview-rounds/next-round` | POST | Auth, DB, Storage | auth: `getUser`<br>storage: `listBuckets`, `createBucket`, `upload`, `remove`<br>via lib: db, storage | `employers` `interview_rounds` `job_invitations` `companies` |
| `/api/employer/invitations` | GET POST | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `job_invitations` `candidates` `companies` |
| `/api/employer/invitations/[id]/cancel-interview` | POST | Auth, DB, RPC | auth: `getUser`<br>rpc: `notify_user`<br>via lib: db | `employers` `job_invitations` |
| `/api/employer/invitations/[id]/check-offer` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `job_invitations` `job_offers` |
| `/api/employer/invitations/[id]/confirm` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `job_invitations` `interview_rounds` |
| `/api/employer/invitations/[id]/current-round` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `job_invitations` `interview_rounds` |
| `/api/employer/invitations/[id]/edit` | PATCH | Auth, DB | auth: `getUser` | `job_invitations` `employers` |
| `/api/employer/invitations/[id]/mark-seen` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `job_invitations` |
| `/api/employer/invitations/[id]/rounds` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `job_invitations` `interview_rounds` |
| `/api/employer/invitations/[id]/seed-round` | POST | Auth, DB | auth: `getUser` | `job_invitations` `employers` `interview_rounds` |
| `/api/employer/invitations/cancel` | DELETE | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `job_invitations` |
| `/api/employer/invitations/pending-count` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `job_invitations` |
| `/api/employer/invitations/status` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `job_invitations` |
| `/api/employer/jobs` | GET POST | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `jobs` |
| `/api/employer/jobs/[id]` | GET PATCH DELETE | Auth, DB, Storage | auth: `getUser`<br>via lib: storage, db | `employers` `jobs` |
| `/api/employer/jobs/[id]/extend` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `jobs` `payment_requests` |
| `/api/employer/jobs/[id]/pause` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `jobs` |
| `/api/employer/jobs/[id]/republish-request` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `jobs` `job_compliance_flags` `mis_user` `notifications` |
| `/api/employer/jobs/[id]/request-payment` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `jobs` `payment_requests` |
| `/api/employer/jobs/[id]/resume` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `jobs` |
| `/api/employer/jobs/active` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `jobs` |
| `/api/employer/payments` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `payment_requests` `payment_types` |
| `/api/employer/payments/[id]` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `payment_requests` |
| `/api/employer/payments/[id]/report` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `payment_requests` `event_logs` `mis_user` `notifications` |
| `/api/employer/payments/[id]/upload-proof` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `payment_requests` `payment_proofs` |
| `/api/employer/payments/pending-count` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `employers` `payment_requests` |
| `/api/employer/payments/quote` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `users` `payment_pricing` |
| `/api/employer/settings/deactivate-company` | POST | Auth, DB | auth: `getUser` | `employers` `companies` |
| `/api/employer/settings/delete-account` | DELETE | Auth, DB | auth: `getUser`, `admin.deleteUser` | `employers` |
| `/api/employer/settings/hiring-preferences` | GET PUT | Auth, DB | auth: `getUser` | `employers` |
| `/api/employer/settings/me` | GET | Auth, DB | auth: `getUser` | `employers` |
| `/api/employer/settings/privacy` | GET PUT | Auth, DB | auth: `getUser` | `employers` `companies` |
| `/api/employer/settings/team` | GET PUT | Auth, DB | auth: `getUser` | `employers` `companies` |
| `/api/employer/sidebar-visibility` | GET | Auth, DB | auth: `getUser` | `mis_sidebar_visibility_settings` |
| `/api/employer/upload-company-logo` | POST | Auth, DB, Storage | auth: `getUser`<br>storage: `listBuckets`, `createBucket`, `upload`, `getPublicUrl`<br>via lib: db | `employers` |
| `/api/industries` | GET | DB | via lib: db | `industries` |
| `/api/job-designations` | GET | DB | via lib: db | `industries` `job_designations` |
| `/api/mis/analytics/reports` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `mis_user` `event_logs` `candidates` `users` `employers` `companies` `jobs` `job_invitations` `job_offers` |
| `/api/mis/analytics/stats` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `mis_user` `candidates` `companies` `jobs` `job_invitations` `event_logs` |
| `/api/mis/audit/errors` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `mis_user` `error_logs` |
| `/api/mis/audit/logs` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `mis_user` `event_logs` |
| `/api/mis/audit/summary` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `mis_user` |
| `/api/mis/bank-details` | GET POST | Auth, DB | auth: `getUser`<br>via lib: db | `users` `payment_bank_details` |
| `/api/mis/bank-details/[id]` | PATCH DELETE | Auth, DB | auth: `getUser`<br>via lib: db | `users` `payment_bank_details` |
| `/api/mis/candidates/[id]` | GET | Auth, DB, Storage | auth: `getUser`<br>via lib: db, storage | `users` `candidates` |
| `/api/mis/companies/[companyId]` | GET | Auth, DB, Storage | auth: `getUser`<br>via lib: db, storage | `users` `companies` `employers` |
| `/api/mis/employers` | GET | Auth, DB | auth: `getUser`<br>via lib: db, auth | `users` `employers` |
| `/api/mis/interview-rounds/[roundId]/reschedule` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `users` `interview_rounds` `job_invitations` `interview_reminder_sent` |
| `/api/mis/interviews` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `users` `job_invitations` |
| `/api/mis/interviews/[id]` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `users` `job_invitations` `interview_rounds` |
| `/api/mis/interviews/[id]/reschedule` | POST | Auth, DB, RPC | auth: `getUser`<br>rpc: `notify_user`<br>via lib: db | `users` `job_invitations` `interview_reminder_sent` |
| `/api/mis/interviews/stats` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `users` `job_invitations` |
| `/api/mis/jobs` | GET | Auth, DB | auth: `getUser`<br>via lib: db, auth | `users` `jobs` |
| `/api/mis/jobs/[id]` | GET PATCH | Auth, DB, Storage | auth: `getUser`<br>via lib: storage, db, auth | `users` `jobs` |
| `/api/mis/jobs/[id]/applications/[appId]` | PATCH | Auth, DB | auth: `getUser`<br>via lib: db, auth | `users` `job_applications` |
| `/api/mis/jobs/[id]/compliance-pause` | POST | Auth, DB | auth: `getUser`<br>via lib: db, auth | `users` `mis_user` `jobs` `job_compliance_flags` `notifications` |
| `/api/mis/jobs/[id]/compliance-resolve` | POST | Auth, DB | auth: `getUser`<br>via lib: db, auth | `users` `mis_user` `job_compliance_flags` `jobs` `notifications` |
| `/api/mis/jobs/[id]/status` | POST | Auth, DB | auth: `getUser`<br>via lib: db, auth | `users` `jobs` |
| `/api/mis/jobs/compliance` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `users` `job_compliance_flags` `jobs` |
| `/api/mis/master-data/designations` | GET POST | Auth, DB | auth: `getUser`<br>via lib: db | `mis_user` `job_designations` |
| `/api/mis/master-data/designations/bulk-upload` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `mis_user` `industries` `seniority_levels` `job_designations` |
| `/api/mis/master-data/industries` | GET POST | Auth, DB | auth: `getUser`<br>via lib: db | `mis_user` `industries` |
| `/api/mis/master-data/industries/bulk-upload` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `mis_user` `industries` |
| `/api/mis/master-data/seniority-levels` | GET POST | Auth, DB | auth: `getUser`<br>via lib: db | `mis_user` `seniority_levels` |
| `/api/mis/master-data/seniority-levels/bulk-upload` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `mis_user` `seniority_levels` |
| `/api/mis/payment-pricing` | GET POST | Auth, DB | auth: `getUser`<br>via lib: db | `users` `payment_pricing` |
| `/api/mis/payment-settings` | GET PATCH | Auth, DB | auth: `getUser`<br>via lib: db | `users` `payment_settings` |
| `/api/mis/payment-types` | GET POST | Auth, DB | auth: `getUser`<br>via lib: db | `users` `payment_types` |
| `/api/mis/payment-types/[id]` | PATCH | Auth, DB | auth: `getUser`<br>via lib: db | `users` `payment_types` |
| `/api/mis/payments` | GET POST | Auth, DB | auth: `getUser`<br>via lib: db | `users` `payment_requests` `jobs` `payment_types` `mis_user` `employers` |
| `/api/mis/payments/[id]` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `users` `payment_requests` |
| `/api/mis/payments/[id]/review` | POST | Auth, DB | auth: `getUser`<br>via lib: db | `users` `mis_user` `payment_requests` `payment_proofs` |
| `/api/mis/payments/stats` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `users` `payment_requests` |
| `/api/mis/permissions` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `mis_user` `mis_permissions` |
| `/api/mis/placements` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `users` `job_invitations` |
| `/api/mis/register` | POST | Auth, DB | auth: `signUp`<br>via lib: db | `mis_user` `users` |
| `/api/mis/roles` | GET POST | Auth, DB | auth: `getUser`<br>via lib: db | `mis_user` `mis_roles` `mis_role_permissions` |
| `/api/mis/roles/[roleId]` | GET PATCH DELETE | Auth, DB | auth: `getUser`<br>via lib: db | `mis_user` `mis_roles` |
| `/api/mis/roles/[roleId]/permissions` | POST DELETE | Auth, DB | auth: `getUser`<br>via lib: db | `mis_user` `mis_roles` `mis_role_permissions` `mis_permissions` |
| `/api/mis/settings/interview-reminders` | GET PUT | Auth, DB | auth: `getUser`<br>via lib: db, auth | `mis_interview_reminder_settings` |
| `/api/mis/settings/sidebar-visibility` | GET PUT | Auth, DB | auth: `getUser`<br>via lib: db | `mis_user` `mis_sidebar_visibility_settings` |
| `/api/mis/users` | GET | Auth, DB | auth: `getUser`<br>via lib: db | `users` `mis_user` |
| `/api/payments/proofs/[proofId]` | GET | Auth, DB, Storage | auth: `getUser`<br>storage: `createSignedUrl`<br>via lib: db | `payment_proofs` `users` `employers` |
| `/api/seniority-levels` | GET | DB | via lib: db | `seniority_levels` |
| `/api/upload` | POST | Auth, DB, Storage | auth: `getUser`<br>via lib: storage, db | `users` |
| `/api/upload-presignup` | POST | Storage, DB-via-lib | via lib: storage, db | — |
| `/api/user/change-password` | POST | Auth, DB | auth: `getUser`, `admin.updateUserById` | `users` |
| `/api/user/notification-preferences` | GET PUT | Auth, DB | auth: `getUser` | `users` |
| `/api/user/sessions` | GET | Auth, RPC | auth: `getUser`, `getSession`<br>rpc: `get_my_sessions` | — |
| `/api/user/sessions/[id]` | DELETE | Auth, RPC | auth: `getUser`<br>rpc: `delete_my_session` | — |
| `/api/user/sign-out-all` | POST | Auth | auth: `getUser`, `signOut` | — |
| `/api/user/timezone` | POST GET | Auth, DB | auth: `getUser` | `users` |
| `/api/verify-br-certificate` | POST | DB-via-lib | via lib: db | — |

---

## 4. Server actions (57 actions, 14 files)

Invoked as form actions from client components, so this is a second, parallel API surface. Every one must be repointed alongside the routes above. `auth.ts` is the heaviest — it drives all registration, login and password-reset flows against both Supabase Auth **and** your own `users` table.

| File | Actions | Auth / storage | Tables |
|---|---|---|---|
| `ats-score.ts` | `fetchResumeAsBase64` `computeAtsScore` `buildAtsUpdate` | —<br>storage: yes | — |
| `auth.ts` | `registerCandidate` `verifyEmail` `resendVerificationCode` `loginCandidate` `registerMISUser` `loginMISUser` `addMISUser` `setupMISPassword` `registerEmployer` `loginEmployer` `requestPasswordReset` `resetPassword` | `signUp`, `signOut`, `signInWithPassword`, `getUser`, `admin.createUser`, `admin.updateUserById` | `users` `candidates` `mis_user` `mis_roles` `industries` `job_designations` `companies` `employers` |
| `candidate-dashboard-data.ts` | `getCandidateDashboardData` | `getUser` | `candidates` `job_invitations` `work_experiences` `educations` `jobs` `saved_jobs` `job_applications` |
| `candidate.ts` | `markApprovalMessageAsSeen` `approveCandidateProfile` `rejectCandidateProfile` `revokeCandidateApproval` | `getUser` | `candidates` `users` |
| `employer-actions.ts` | `createSubAdmin` `setupEmployerPassword` | `getUser`, `admin.createUser`, `admin.deleteUser`, `admin.updateUserById` | `employers` `users` |
| `employer-dashboard-data.ts` | `getEmployerDashboardData` | `getUser` | `employers` `jobs` `job_invitations` `payment_requests` `job_applications` `job_offers` |
| `employer-profile.ts` | `getEmployerProfileData` `completeEmployerProfile` `updateCompanyInfo` | `getUser` | `employers` `companies` |
| `employer-profiles.ts` | `getEmployerProfile` `getCompanyProfile` `getEmployerAndCompanyProfiles` | — | `employers` `companies` |
| `employer.ts` | `markCompanyApprovalMessageAsSeen` `approveCompanyProfile` `rejectCompanyProfile` `revokeCompanyApproval` | `getUser` | `employers` `companies` `users` |
| `extract-cv.ts` | `extractCVData` `generateProfessionalSummary` | — | `industries` `job_designations` |
| `profile-mutations.ts` | `addExperience` `updateExperience` `deleteExperience` `addProject` `updateProject` `deleteProject` `addCertification` `updateCertification` `deleteCertification` `addAward` `updateAward` `deleteAward` `addEducation` `updateEducation` `deleteEducation` `updateBasicInfo` `updateAboutSection` | `getUser` | `candidates` `work_experiences` `projects` `certificates` `awards` `educations` |
| `profile.ts` | `completeProfile` `completeFullProfile` `completeFullProfileWithCV` | `getUser` | `candidates` `work_experiences` `educations` `awards` `projects` `certificates` `candidate_resumes` |
| `universal-auth.ts` | `universalLogin` | `signInWithPassword` | `users` `candidates` `employers` |
| `verify-br-certificate.ts` | `verifyBRCertificate` | — | — |

---

## 5. Server components querying Supabase directly

Pages and layouts that query during render rather than calling an API route. Rows marked **service-role** use the admin client, which **bypasses RLS completely** — whatever authorization those pages need is written in the page body, not in a policy, and must be carried over by hand.

| File | Client | Auth | Tables |
|---|---|---|---|
| `app/candidate/(dashboard)/calendar/page.tsx` | user session | `getUser` | — |
| `app/candidate/(dashboard)/dashboard/page.tsx` | user session | `getUser` | `candidates` |
| `app/candidate/(dashboard)/invitations/[id]/page.tsx` | user session | `getUser` | — |
| `app/candidate/(dashboard)/invitations/page.tsx` | user session | `getUser` | — |
| `app/candidate/create-profile/layout.tsx` | user session | `getUser` | `candidates` |
| `app/candidate/create-profile/page.tsx` | user session | `getUser` | `candidates` |
| `app/employer/(dashboard)/admins/add/page.tsx` | **service-role** (bypasses RLS) | `getUser` | `employers` |
| `app/employer/(dashboard)/admins/page.tsx` | **service-role** (bypasses RLS) | `uid`, `getUser` | `employers` |
| `app/employer/(dashboard)/calendar/page.tsx` | user session | `getUser` | — |
| `app/employer/(dashboard)/candidates/page.tsx` | user session | `getUser` | `candidates` `employers` `job_invitations` `industries` |
| `app/employer/(dashboard)/company/page.tsx` | user session | `getUser` | `employers` |
| `app/employer/(dashboard)/dashboard/page.tsx` | user session | `getUser` | `employers` |
| `app/employer/(dashboard)/invitations/page.tsx` | user session | `getUser` | — |
| `app/employer/(dashboard)/profile/page.tsx` | user session | `getUser` | — |
| `app/employer/(dashboard)/settings/page.tsx` | user session | `getUser` | `employers` |
| `app/employer/complete-profile/page.tsx` | user session | `getUser` | `employers` |
| `app/employer/setup-password/page.tsx` | **service-role** (bypasses RLS) | — | `users` `employers` |
| `app/mis/(dashboard)/candidates/page.tsx` | user session | `getUser` | `candidates` |
| `app/mis/(dashboard)/dashboard/page.tsx` | user session | — | `candidates` `companies` `jobs` `job_invitations` |
| `app/mis/(dashboard)/employers/page.tsx` | user session | `getUser` | `companies` |
| `app/mis/(dashboard)/interviews/page.tsx` | **service-role** (bypasses RLS) | `getUser` | `job_invitations` |
| `app/mis/(dashboard)/roles/[roleId]/page.tsx` | **service-role** (bypasses RLS) | — | `mis_roles` |
| `app/mis/(dashboard)/roles/[roleId]/permissions/page.tsx` | **service-role** (bypasses RLS) | — | `mis_roles` `mis_permissions` |
| `app/mis/(dashboard)/roles/page.tsx` | **service-role** (bypasses RLS) | — | `mis_roles` |
| `app/mis/(dashboard)/users/page.tsx` | **service-role** (bypasses RLS) | — | `mis_user` |
| `app/mis/register/page.tsx` | **service-role** (bypasses RLS) | — | `mis_user` |
| `app/mis/setup-password/page.tsx` | **service-role** (bypasses RLS) | — | `users` |
| `components/candidate/CandidateLayout.tsx` | user session | `getUser` | `candidates` |
| `components/employer/EmployerLayout.tsx` | user session | `getUser` | `employers` |
| `components/mis/MISLayout.tsx` | user session | `getUser` | `users` |

---

## 6. Shared libraries

Thirteen modules under `src/lib/` reach Supabase on behalf of their callers. **Porting these is the highest-leverage work in the migration** — they are the seam that lets route handlers change once rather than 143 times.

| Module | Surface | Role |
|---|---|---|
| `@/lib/storage` | Storage | Upload, delete, watermark PDFs, mint signed URLs, rewrite PII URLs in responses |
| `@/lib/permissions` | Auth, DB | MIS role and permission checks — the authorization gate on every MIS route |
| `@/lib/logger` | DB | Writes `event_logs`, `api_request_logs`, `error_logs`; called from middleware |
| `@/lib/payments` | DB | Pricing, payment requests, settings, notification fan-out |
| `@/lib/job-advertisement` | DB | Job ad lifecycle across `jobs`, `payment_requests`, `notifications` |
| `@/lib/process-job-expiry` | DB | Cron body for `/api/cron/expire-jobs` |
| `@/lib/process-interview-reminders` | DB | Cron body for `/api/cron/interview-reminders` |
| `@/lib/public-directory` | DB | Public job, company and candidate listings |
| `@/lib/audit-queries` | DB | MIS audit log reads |
| `@/lib/countries` | DB | Reference data for `countries` |
| `@/lib/utils/membership` | DB | Candidate membership resolution |
| `@/lib/bootstrap/seed-super-admin` | Auth, DB | Startup seed, runs from `instrumentation.ts` |
| `@/lib/supabase/{client,server,admin,proxy}` | Auth | The four client factories — **replace these four files and all 205 import sites keep compiling** |

---

## 7. Logic that lives inside Postgres

None of this appears in the route inventory. It runs in the database today and has to run somewhere in the new backend.

### 7.1 Called as RPC from application code

| Function | Called from | Replacement |
|---|---|---|
| `notify_user` | `/api/employer/invitations/[id]/cancel-interview`, `/api/mis/interviews/[id]/reschedule` (×2) | A notification service method |
| `get_my_sessions` | `GET /api/user/sessions` | Session store listing — depends on your new session design |
| `delete_my_session` | `DELETE /api/user/sessions/[id]` | Session revoke by id |

### 7.2 Triggers writing the notification feed

Twelve functions fire on insert, update and status change:

`notify_on_invitation_insert`, `notify_on_invitation_update`, `notify_on_invitation_status_change`, `notify_on_offer_insert`, `notify_on_offer_update`, `notify_on_offer_created`, `notify_on_offer_status_change`, `notify_on_round_insert`, `notify_on_round_update`, `notify_on_round_status_change`, plus the `notify_user` helper.

**Notifications currently appear because the database writes them.** If the new backend writes invitations without reproducing these, the notification feed silently goes empty — no error, no failed request.

### 7.3 Row Level Security

Several hundred policies plus helpers `is_candidate`, `is_employer`, `is_mis_user`.

Of the 143 routes: **138 use the RLS-scoped session client, 124 also use the service-role client, and 123 use both in the same handler.** That split is the real authorization model, and it is only half written in the application code.

---

## 8. Scheduled work

| Job | Trigger | Schedule | Note |
|---|---|---|---|
| `/api/cron/expire-jobs` | Vercel cron | `0 10 * * *` | Runs `@/lib/process-job-expiry` |
| `/api/cron/interview-reminders` | Vercel cron | `0 3 * * *` | Runs `@/lib/process-interview-reminders` |
| `supabase/functions/interview-reminders` | pg_cron → `net.http_post` | `*/15 * * * *` | **Duplicate** of the route above, in Deno, on a different schedule. Retire with Supabase |

---

## 9. What the new backend has to expose

The application's own `/api/*` routes stay. This is the internal surface those routes will call instead of `supabase-js` — whether built as HTTP services or in-process modules.

### Auth — replaces GoTrue, 268 call sites

| Verb | Path | Note |
|---|---|---|
| GET | `/auth/user` | The hot path — 234 sites. Verify the JWT locally, do not round-trip |
| POST | `/auth/sign-in` | Email + password, sets the session cookie |
| POST | `/auth/sign-up` | Creates the auth identity only; the profile row is written separately |
| POST | `/auth/sign-out` | Needs a scope argument — `others` is used by sign-out-all |
| POST | `/auth/token/refresh` | Middleware refreshes on every request today |
| GET | `/auth/sessions` | Replaces `get_my_sessions` |
| DELETE | `/auth/sessions/:id` | Replaces `delete_my_session` |
| POST | `/auth/admin/users` | Employer sub-admins, MIS users, seed super-admin |
| PATCH | `/auth/admin/users/:id` | Password set on reset and MIS password setup |
| DELETE | `/auth/admin/users/:id` | Account deletion, candidate and employer |
| GET | `/auth/admin/users` | Seed scripts only — can be dropped from the runtime API |

### Storage — replaces Supabase Storage, 9 buckets

| Verb | Path | Note |
|---|---|---|
| PUT | `/storage/:bucket/*path` | Upsert semantics; content type preserved |
| DELETE | `/storage/:bucket/*path` | Accepts a list — cleanup paths remove several at once |
| GET | `/storage/:bucket?prefix=` | Used to clear a candidate's old cover images |
| POST | `/storage/:bucket/sign` | TTL in seconds, default 3600. Four private buckets depend on this |

### Data — replaces PostgREST, 785 queries

- **Repository modules** — Prisma is already in the repo with the full 39-model schema and zero runtime usage. Adopt it directly rather than shimming PostgREST.
- **Authorization layer** — where RLS is today. The largest and least visible piece of work.
- **Notification service** — replaces the twelve `notify_on_*` triggers and `notify_user`.

### Realtime — replaces postgres_changes, 5 tables

- `WS /realtime?table=&filter=` — only if you want to keep live updates, **or**
- delete it: all eight subscriptions only trigger a refetch, and SWR `refreshInterval` replaces every one.

---

## 10. What will bite you

### 🔴 Service-role keys are committed to git

`supabase/migrations/20260523_02_schedule_dev.sql` and `…_03_schedule_prod.sql` contain live `service_role` JWTs and the cron shared secret in plaintext, and **both files are tracked**. Anyone with repo access has full RLS-bypassing database access to dev *and* prod.

Worth fixing today, independent of the migration. Rotate both keys now, and do not carry the pattern into the new backend.

### 🔴 Stored URLs encode the Supabase host

The database stores full public URLs shaped `…/storage/v1/object/public/<bucket>/<path>`. `privatePiiTarget()` in `src/lib/storage.ts` parses that exact string to recover bucket and path. Change the storage host and every stored URL breaks unless you either keep the path shape or run a data migration over every resume, logo, image and certificate column.

### 🔴 Passwords are stored twice

`users.password` exists in the Prisma schema and Supabase Auth holds its own copy. `resetPassword()` writes both. Email verification and password reset are already custom — your own tokens, your own emails — so only the login check itself depends on GoTrue. Pick one store during the move and delete the other; carrying both forward carries the drift bug with it.

### 🔴 Notifications appear by trigger, not by code

Nothing in the application inserts most notification rows — the database does, on twelve triggers. Write invitations from a new backend without porting those and the feed goes quiet with no error anywhere.

### 🔴 The cron routes look Supabase-free

`/api/cron/expire-jobs` and `/api/cron/interview-reminders` have no `.from()` and no auth call in their own files. Both are entirely Supabase-dependent through their lib imports. Any inventory built by grepping route files alone will miss them.

---

## 11. Suggested order

1. **Rotate the leaked keys.** Before anything else, and unrelated to the migration.
2. **Replace the four client factories first.** `src/lib/supabase/{client,server,admin,proxy}.ts` are imported by 205 files. Give the new backend an SDK with the same shape and the whole codebase keeps compiling while you swap implementations underneath.
3. **Auth, then middleware.** `getUser()` runs 234 times and on every middleware pass. Get it right and cheap before anything else moves.
4. **Port the thirteen shared libraries.** Highest leverage — routes change once instead of 143 times.
5. **Move RLS into the backend authorization layer.** The biggest and least visible piece. 123 routes mix session-scoped and service-role clients in one handler; each needs a deliberate decision, not a mechanical translation.
6. **Port the triggers as service methods.** Notifications and the audit trail. Verify by watching the feed, not the HTTP status.
7. **Give the browser-direct calls real endpoints.** The files in §2. Two of them already have matching routes that simply are not being used.
8. **Retire realtime or rebuild it.** Deleting it is defensible.
9. **Storage last.** Self-contained, and the one that needs a data migration if you change the URL shape.

---

*Generated by sweeping `src/`, `scripts/`, `supabase/` and `prisma/` for every `supabase-js` and `@supabase/ssr` call site — direct and via shared libraries. Counts are call sites, not unique operations.*
