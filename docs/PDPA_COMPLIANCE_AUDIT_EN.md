# JobGenie — Sri Lanka PDPA Compliance Audit (English)

**Law audited against:** Personal Data Protection Act, No. 9 of 2022 (PDPA), as amended by the Personal Data Protection (Amendment) Act, No. 22 of 2025 (certified 30 October 2025).
**Audit date:** 3 July 2026 · **Audit scope:** full codebase (`dev` branch, commit `90f0223`) + infrastructure/processor review.

---

## (a) Executive Summary — Compliance Verdict

**JobGenie is NOT yet compliant with the PDPA**, but the technical foundation is strong and no feature must be removed outright. The gaps are concentrated in four areas:

1. **No legal transparency layer** — `/privacy` and `/terms` pages do not exist (the footer links to them, returning 404), and no consent of any kind is captured at signup. There is currently **no recorded lawful basis** for any processing.
2. **Cross-border transfers with no legal basis (s.26)** — every byte of personal data leaves Sri Lanka (Supabase in Seoul, Google Gemini, Resend, Upstash, Vercel) with no explicit consent, no disclosure, and no transfer instruments on file.
3. **Undisclosed AI processing (s.18)** — every candidate's CV is automatically sent to Google Gemini for ATS scoring at application time, with zero disclosure to the candidate and no way to request a review.
4. **No data subject request machinery (s.17)** — the Act requires written responses within 1 month (extendable to 3), with reasons for refusal and notice of the right to appeal to the Data Protection Authority. Nothing tracks or enforces this today.

**Timing:** the Amendment extends the compliance window in s.52(2) to **36 months**, with commencement dates set by the Minister via Gazette. There is runway, but the highest-exposure items (privacy notice, consent capture, AI disclosure) should ship first.

---

## (b) What the Act Requires, Mapped to JobGenie

JobGenie is a **controller** under the Act (it decides the purposes and means of processing candidate and employer personal data). It is *not* a "public authority" (amended definition excludes companies incorporated under the Companies Act). Key obligations:

| Act provision | Requirement | Relevance to JobGenie |
|---|---|---|
| Part I (ss.5–12) | Lawful basis (Schedule I), valid consent + records, purpose limitation, data minimisation, accuracy, retention limitation, transparency notice (s.11), Data Protection Management Programme (s.12) | Applies to all candidate/employer data processing |
| s.13 | Right of access to personal data | Candidates/employers must be able to obtain a copy of their data |
| s.14 | Right to withdraw consent / stop processing | Must be possible without deleting the account |
| s.15 | Right to rectification/completion | Profile editing |
| s.16 | Right to erasure | Account deletion |
| s.17 (amended) | Respond **in writing within 1 month** (extendable +2 months, max 3 total; extension must be notified *before* month 1 expires); reasons required for refusal; must inform of the **right of appeal to the Authority**; requests handled **free of charge** | Requires a tracked request workflow |
| s.18 (amended) | Right to request review of decisions based **solely on automated processing** (now covering rights "under the Constitution or any written law") | ATS scoring / application rejection flow |
| s.19 (replaced) | Appeal to the Data Protection Authority against refusals | Appeal-rights text in every refusal |
| s.20 (amended) | DPO required where processing falls into risk-of-harm categories per Authority guidelines — large-scale candidate profiling/AI scoring very likely qualifies | Appoint + publish DPO contact |
| s.21–22 | Security safeguards, processor obligations | Technical controls, DPAs |
| s.23 | **Breach notification to the Authority** | Incident register + runbook |
| s.24 (amended) | Personal data protection impact assessment; must be **submitted to the Authority on written request** (s.24(5)) | DPIA for Gemini ATS scoring etc. |
| s.26 (fully replaced) | Cross-border flows only if compliance with Parts I, II & ss.20–25 is ensured via Authority-specified instruments (binding commitments from foreign recipients), **or** exceptions incl. **explicit informed consent** (s.26(3)(a)), contract necessity, legal claims, emergency, transit | Entire hosting/AI/email stack is offshore |
| s.52(2) (amended) | Compliance window extended from 24 to **36 months** | Planning runway |

---

## (c) What Is Already Compliant / Strong

| Area | Status | Evidence |
|---|---|---|
| Rectification (s.15) | ✅ Good | Full profile editing: `src/app/actions/profile-mutations.ts`, `PUT /api/candidate/job-preferences` |
| Erasure (s.16) | ✅ Good | Self-service hard delete for both roles: `src/app/api/candidate/settings/delete-account/route.ts`, `src/app/api/employer/settings/delete-account/route.ts`, Prisma `onDelete: Cascade`, UI in `DangerZoneSettings.tsx`. ⚠️ Verify Storage files (CVs/images) are also removed |
| Access (s.13) — viewing | 🟡 Partial | Users can *view* data (`GET /api/candidate/profile`) but cannot *export* a copy |
| Security safeguards (s.21) | ✅ Strong | bcrypt(12) passwords, Supabase Auth + email verification, RLS on 40+ tables (`sql/rls_policies.sql`), private storage buckets (`resume`, `br-certificates`), rate limiting + account lockout (`src/lib/rate-limit.ts`), security headers, session revocation (`/api/user/sessions`) |
| Human-in-the-loop decisions (s.18) | ✅ Structurally OK | ATS score is advisory; rejection requires explicit employer action (`/api/employer/applications/[id]/reject`) — decisions are **not solely automated**. The gap is *disclosure*, not the mechanism |
| Children's data | ✅ N/A | 18+ age gate enforced client + server side (`src/lib/validations/candidate-schema.ts:73-84`) |
| Cookie consent UI | 🟡 Partial | Banner + granular preferences + withdrawal exist (`src/lib/cookie-consent.ts`, `src/components/cookie-consent/*`, `/cookie-policy`); analytics genuinely consent-gated. But consent is stored **client-side only** — no server-side record |
| Audit infrastructure | ✅ Good base | `EventLog` (with IP/user-agent), `ApiRequestLog`, `ErrorLog` models; cleanup script `scripts/cleanup-logs.ts` (manual) |
| Notification preferences | 🟡 Partial | Granular per-type toggles (`users.notification_preferences`, `GET/PUT /api/user/notification-preferences`) — but defaults all-ON and no unsubscribe links in emails |

---

## (d) The Three Lists

### 1️⃣ CHANGES needed to existing features

| # | Change | Where (files) | Act ref |
|---|--------|---------------|---------|
| C1 | Add required consent checkboxes to both signup forms: (i) ToS + Privacy Policy acceptance, (ii) explicit consent for AI processing + cross-border transfer, (iii) optional marketing opt-in. Record each as a server-side consent record with version, IP, timestamp | `src/components/auth/CandidateSignupForm.tsx`, `src/components/employer/EmployerSignupWizard.tsx`, `src/lib/validations/candidate-schema.ts` (+ employer schema), signup API routes | s.11, Schedule I, s.26(3)(a) |
| C2 | Apply flow: display an AI-scoring disclosure notice ("your CV will be analyzed by AI to produce a match score visible to the employer; final decisions are human; you may request a review"); check `ai_processing` consent before triggering ATS; if withdrawn, skip scoring but still accept the application | apply UI + `src/app/api/candidate/jobs/[id]/apply/route.ts` (which calls `src/app/actions/ats-score.ts`) | s.18, s.26 |
| C3 | Rejection email: add a paragraph stating the decision was made by the employer (human), that automated scoring may have been an input, with a link to request a review of the automated assessment | `src/lib/job-advertisement-emails.ts` (`sendApplicationRejectedEmail`, ~line 299) | s.18 |
| C4 | All email templates: shared footer with company identity, DPO contact, "manage preferences" link, and (for non-essential mail) a signed one-click unsubscribe link; add `List-Unsubscribe` / `List-Unsubscribe-Post` headers via Resend | `src/lib/email.ts`, `src/lib/employer-emails.ts`, `src/lib/interview-emails.ts`, `src/lib/job-advertisement-emails.ts` | s.14 |
| C5 | Persist cookie consent server-side for logged-in users (cookie stays the gate for scripts; DB becomes the auditable record of consent) | `src/components/providers/CookieConsentProvider.tsx` → new consent API | s.11 (consent records) |
| C6 | Mask NIC/passport in MIS admin views (e.g. `*******123V`) with a permission-gated "reveal" that writes an audit `EventLog` entry; confirm NIC is excluded from all employer-facing payloads | MIS candidate views (`src/app/mis/(dashboard)/candidates/...`) | s.21, data minimisation |
| C7 | Fix the broken `vercel.json` cron entry (`/api/cron` matches **no route** — existing scheduled jobs may not be firing at all) and schedule the retention cleanup | `vercel.json` | s.12 (housekeeping) |
| C8 | Re-consent flow for existing users: on dashboard load, if no privacy-policy consent at the current version, show a blocking accept modal | `src/app/candidate/(dashboard)/layout.tsx`, employer equivalent | s.11 |

### 2️⃣ FEATURES to ADD

| # | Feature | Act ref |
|---|---------|---------|
| A1 | **`/privacy` + `/terms` pages** covering: controller identity; DPO contact; purposes + lawful basis per activity (accounts, applications, ATS scoring, BR verification, emails, logs); data categories incl. NIC/passport; **named overseas processors with locations** (Supabase — Seoul; Google Gemini; Resend; Upstash; Vercel); retention periods table; rights ss.13–16 and how to exercise them; s.17 timelines + **right of appeal to the Data Protection Authority**; s.18 automated-processing disclosure; cookies (link to `/cookie-policy`). Follow the static-page pattern of `src/app/cookie-policy/page.tsx` | s.11, s.26 |
| A2 | **`consent_records` table** (append-only event log; types: terms, privacy_policy, marketing_email, cookie_analytics, cookie_marketing, ai_processing, cross_border; keeps version/IP/user-agent/source; `onDelete: SetNull` so proof survives account deletion) + `GET/POST /api/user/consent` + RLS policies in `sql/rls_policies.sql` | s.11 |
| A3 | **"Download my data" export** — `GET /api/user/data-export`: JSON of user + profile + applications (incl. ATS score/breakdown — s.13 access covers them), interviews, notifications, consent history, resume signed URLs. Free of charge; rate-limited via existing `src/lib/rate-limit.ts` | s.13 |
| A4 | **DSR (Data Subject Request) workflow** — `data_subject_requests` table (types: access, rectification, erasure, consent_withdrawal, automated_review, other; statuses; `due_date = received + 1 month`; extension fields validated to max +3 months with pre-expiry notification timestamp; response/refusal text; survives erasure via `SetNull` + kept requester email). User submission UI in a new "Privacy & Data" settings section for both roles; MIS compliance queue (`src/app/mis/(dashboard)/compliance/`) gated by a new `compliance` permission; acknowledgment/extension/response emails — every refusal email **must name the right of appeal to the Authority** | ss.13–17, s.19 |
| A5 | **Automated-decision review request** — DSR type `automated_review` linked to a specific application (`related_application_id`); candidate-side "Request review" action on rejected applications; MIS detail view shows `ats_score`/`ats_breakdown` + recompute option so a human documents the review outcome | s.18 |
| A6 | **Unsubscribe page + API** — `/unsubscribe` with HMAC-signed token (no login required); flips `notification_preferences` and appends a `marketing_email granted=false` consent record | s.14 |
| A7 | **Retention automation** — `src/lib/retention.ts` (ported from `scripts/cleanup-logs.ts`) + `/api/cron/retention-cleanup` Vercel cron (daily; `verifyCronSecret` pattern from `src/app/api/cron/expire-jobs/route.ts`). Policy map documented verbatim in `/privacy`: event_logs 90d, api_request_logs 30d, error_logs 90/180d, notifications 180d, expired tokens, orphaned storage files (old resumes!), applications N years after job closure (**N to be confirmed with counsel; suggested default 2 years**). Each run logged to `EventLog` as accountability evidence | Retention limitation, s.12 |
| A8 | **Breach incident register** — `data_breach_incidents` table (severity, status, detected/occurred/contained timestamps, `authority_notified_at` for s.23, `subjects_notified_at`, affected count, data categories, remediation) + MIS "Breach Register" tab + optional bulk subject-notification email helper | s.23 |
| A9 | **DPO contact surfaced** — `DPO_EMAIL` env var shown on `/privacy`, in the site footer, and in the Privacy & Data settings section | s.20 |

### 3️⃣ Things to REMOVE / STOP

Nothing must be ripped out — **ATS scoring can legally stay** because rejections are human-made (not "solely automated"). But these current practices must stop:

| # | Stop / remove | Why |
|---|---------------|-----|
| R1 | **Stop sending CVs to Google Gemini without disclosure/consent.** Today `ats-score.ts` fires automatically on every application with zero notice. Gate it on the `ai_processing` consent (C2) | s.18 + s.26 violation as-is |
| R2 | **Stop indefinite retention**: notifications table grows forever; ALL historical resumes are kept when new ones are uploaded; applications/interview records never purge; log cleanup exists but is never scheduled | Retention limitation |
| R3 | **Remove plaintext NIC/passport exposure** in admin UI (mask — C6). Stretch goal: application-layer AES-256-GCM field encryption via an additive `nic_passport_enc` column with non-destructive backfill | s.21 |
| R4 | **Remove the broken `/api/cron` entry** in `vercel.json` (points at no route) | Operational |
| R5 | **Stop sending non-essential notification emails without unsubscribe links** and without checking stored preferences before send | s.14 |
| R6 | **Remove the dead `/privacy` and `/terms` links** (in `src/components/layout/AuthShell.tsx` footer and `/cookie-policy`) — resolved by shipping A1 | Transparency |

---

## (e) Implementation Roadmap (phased PRs — future work)

**DB rule for every schema-bearing PR** (per project convention): update `prisma/schema.prisma`; migrate **dev** via `prisma migrate dev/deploy`; apply identical DDL to **prod** via Supabase `apply_migration` (prod has no Prisma migration history — P3005); never destructive; append RLS policies to `sql/rls_policies.sql` (new tables have RLS enabled but no policies → reads return 0 rows until policies exist).

| PR | Contents |
|----|----------|
| **PR1** | `/privacy` + `/terms` pages; `ConsentRecord` model + enum + RLS; `src/lib/legal/versions.ts` (`PRIVACY_POLICY_VERSION`, `TERMS_VERSION`) |
| **PR2** | Signup checkboxes + `z.literal(true)` validation; consent recording on signup; `GET/POST /api/user/consent`; cookie-consent DB sync; re-consent modal in dashboard layouts |
| **PR3** | `GET /api/user/data-export`; `DataSubjectRequest` model + RLS; user DSR API; `PrivacyDataSettings.tsx` in both settings pages (wired into `SettingsClient.tsx` NAV_ITEMS + `src/components/layout/nav-config.ts`) |
| **PR4** | MIS DSR queue: `/api/mis/dsr` routes (list / detail / extend / respond, with s.17 validation: extension only before due date, max +3 months, refusal requires reason, response email always includes the appeal paragraph); `src/app/mis/(dashboard)/compliance/` UI; new `compliance` permission in `src/lib/mis/default-permissions.ts`; `dsr-emails.ts`; MIS nav item |
| **PR5** | s.18: apply-flow disclosure + consent gate on ATS; rejection-email paragraph + review link; candidate "Request review" action; MIS `automated_review` handling (show `ats_breakdown`, recompute) |
| **PR6** | `src/lib/email-footer.ts`; `/unsubscribe` page + HMAC token API; footer threaded through all templates; `List-Unsubscribe` headers; preference check before non-essential sends |
| **PR7** | `src/lib/retention.ts`; `/api/cron/retention-cleanup`; fix + extend `vercel.json` crons; runs logged to `EventLog` |
| **PR8** | `DataBreachIncident` model + RLS (MIS-only); breach register tab in `/mis/compliance`; optional subject-notification email; DPO in footer |
| **PR9** | NIC masking in MIS views with audited reveal. *(Deferred stretch: AES-256-GCM field encryption, additive column + backfill)* |

**Verification when implementing** (summary): signup without checkboxes → validation error, with → consent rows recorded; DSR lifecycle enforces the 1/3-month deadlines and appeal text; export returns full JSON free of charge; ATS skipped when consent withdrawn but application still succeeds; unsubscribe works logged-out; retention cron dry-run on dev before prod; RLS verified (users see only their own consent/DSR rows).

---

## (f) Non-Code / Organizational Checklist (business + legal counsel)

- [ ] **Appoint a DPO** (s.20); create `dpo@jobgenie.biz`; set `DPO_EMAIL` in Vercel env.
- [ ] **DPIAs (s.24)** for: Gemini ATS scoring, Gemini CV extraction, BR certificate verification. Must be producible if the Authority sends a written request (amended s.24(5)).
- [ ] **s.26 transfer instruments**: execute/collect DPAs or standard-clause equivalents with Supabase, Google (Gemini API terms), Resend, Upstash, Vercel; verify each processor's data residency + sub-processor lists; keep on file. (The explicit consent from PR2 is the fallback lawful route; contracts are the robust one.)
- [ ] **Data Protection Management Programme (s.12)** document — the MIS compliance hub, consent records, DSR log, retention cron logs, and breach register serve as its operational evidence.
- [ ] **Records of processing activities** (data inventory: category → purpose → processor → retention → lawful basis).
- [ ] **Breach-response runbook** (s.23): who decides Authority notification, internal escalation, timelines.
- [ ] **Legal review** of `/privacy`, `/terms`, all consent wording, and the application-data retention period **before PR1 ships**.

---

## (g) Cross-Border Processor Table (s.26)

| Service | Role | Region | Personal data transferred | Current legal basis | Required action |
|---|---|---|---|---|---|
| Supabase (DB + Auth + Storage) | Processor | AWS ap-northeast-2 (Seoul, South Korea) | **Everything at rest** — all profiles, NIC, CVs, applications, payments, logs | ❌ None | DPA + s.26 instrument; disclose in privacy notice; explicit consent at signup |
| Google Gemini (AI API) | Processor | Global | Full CV text, BR certificates, job descriptions | ❌ None | Disclose + explicit consent; DPIA; API data-use terms on file |
| Resend (email) | Processor | US/global | Emails, names, verification codes, interview details | ❌ None | DPA; disclose in privacy notice |
| Upstash Redis | Processor | Global | IP addresses, emails (lockout keys, ≤15 min TTL) | ❌ None | DPA; disclose in privacy notice |
| Vercel (hosting + Analytics) | Processor | US/global | All traffic; analytics telemetry (already consent-gated) | 🟡 Partial (cookie consent for analytics only) | DPA; disclose in privacy notice |

---

*Prepared by automated codebase audit. File paths verified against the repository at audit date. This document is a technical compliance analysis, not legal advice — final wording and retention periods require review by qualified Sri Lankan counsel.*
