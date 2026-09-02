# JobGenie — ශ්‍රී ලංකා PDPA Compliance Audit (සිංහල / English mix)

**Audit කරන ලද නීතිය:** පුද්ගලික දත්ත ආරක්ෂණ පනත, 2022 අංක 9 (PDPA) — 2025 අංක 22 දරන සංශෝධන පනතින් සංශෝධිත පරිදි (2025 ඔක්තෝබර් 30 සහතික කළ).
**Audit දිනය:** 2026 ජූලි 3 · **Scope:** සම්පූර්ණ codebase එක (`dev` branch, commit `90f0223`) + infrastructure/processor review.
**English version:** `PDPA_COMPLIANCE_AUDIT_EN.md` (structure එක section-by-section සමානයි).

---

## (a) Executive Summary — Compliance තත්ත්වය

**JobGenie තවම PDPA compliant නැහැ**, හැබැයි technical foundation එක ශක්තිමත්, සහ සම්පූර්ණයෙන් remove කරන්න ඕන feature එකක් නැහැ. ලොකුම gaps තියෙන්නේ ප්‍රධාන ක්ෂේත්‍ර 4ක:

1. **Legal transparency layer එකක් නැහැ** — `/privacy` සහ `/terms` pages නැහැ (footer එකේ links තියෙනවා, ඒත් 404 වෙනවා), signup එකේදී කිසිම consent එකක් capture වෙන්නේ නැහැ. දැනට කිසිම processing එකකට **recorded lawful basis එකක් නැහැ**.
2. **Legal basis නැතුව cross-border transfers (s.26)** — personal data ඔක්කොම ශ්‍රී ලංකාවෙන් පිට යනවා (Supabase — Seoul, Google Gemini, Resend, Upstash, Vercel) — explicit consent නැහැ, disclosure නැහැ, transfer instruments (DPA වගේ) file එකේ නැහැ.
3. **Disclose නොකළ AI processing (s.18)** — apply කරන හැම candidate කෙනෙක්ගේම CV එක automatic ATS scoring සඳහා Google Gemini වෙත යවනවා — candidate ට කිසිම දැනුම්දීමක් නැහැ, review request කරන්න ක්‍රමයක් නැහැ.
4. **Data subject request machinery එකක් නැහැ (s.17)** — පනතට අනුව requests වලට **මාස 1ක් ඇතුළත ලිඛිතව** පිළිතුරු දෙන්න ඕන (උපරිම මාස 3 දක්වා extend කරන්න පුළුවන්), refuse කරනවා නම් හේතු දෙන්න ඕන, සහ Data Protection Authority එකට appeal කරන්න තියෙන අයිතිය දන්වන්න ඕන. දැනට මේක track/enforce කරන කිසිවක් නැහැ.

**Timing:** සංශෝධනයෙන් s.52(2) compliance window එක **මාස 36** දක්වා දිග් කරලා තියෙනවා; commencement dates Minister විසින් Gazette එකෙන් නියම කරනවා. කාලය තියෙනවා, හැබැයි highest-exposure items (privacy notice, consent capture, AI disclosure) මුලින්ම ship කරන්න ඕන.

---

## (b) පනතේ අවශ්‍යතා — JobGenie එකට map කිරීම

පනත යටතේ JobGenie **controller** කෙනෙක් (candidate/employer personal data process කරන purposes සහ means තීරණය කරන්නේ JobGenie). "Public authority" කෙනෙක් **නෙවෙයි** (සංශෝධිත definition එකෙන් Companies Act යටතේ incorporate වූ companies exclude වෙනවා). ප්‍රධාන obligations:

| පනතේ provision | අවශ්‍යතාව | JobGenie එකට relevance |
|---|---|---|
| Part I (ss.5–12) | Lawful basis (Schedule I), valid consent + records, purpose limitation, data minimisation, accuracy, retention limitation, transparency notice (s.11), Data Protection Management Programme (s.12) | Candidate/employer data processing ඔක්කොමට apply වෙනවා |
| s.13 | තමන්ගේ personal data access කිරීමේ අයිතිය | Candidates/employers ලාට data copy එකක් ගන්න පුළුවන් වෙන්න ඕන |
| s.14 | Consent withdraw කිරීමේ / processing නවත්වන අයිතිය | Account delete නොකර කරන්න පුළුවන් වෙන්න ඕන |
| s.15 | Rectification/completion අයිතිය | Profile editing |
| s.16 | Erasure (මකා දැමීමේ) අයිතිය | Account deletion |
| s.17 (සංශෝධිත) | **මාස 1ක් ඇතුළත ලිඛිත** පිළිතුරු (+මාස 2ක් extend, උපරිම 3; extension එක මාසය ඉවර වෙන්න **කලින්** දන්වන්න ඕන); refuse කරනවා නම් හේතු; **Authority එකට appeal කරන අයිතිය** දන්වන්න ඕන; requests **නොමිලේ** handle කරන්න ඕන | Tracked request workflow එකක් ඕන |
| s.18 (සංශෝධිත) | **Solely automated processing** මත පදනම් වූ තීරණ review කරවා ගැනීමේ අයිතිය (දැන් "Constitution or any written law" යටතේ අයිතීන් cover වෙනවා) | ATS scoring / application rejection flow එක |
| s.19 (replace කළ) | Refusals වලට එරෙහිව Data Protection Authority එකට appeal | හැම refusal එකකම appeal-rights text |
| s.20 (සංශෝධිත) | Authority guidelines අනුව risk-of-harm categories වලට වැටෙන processing වලට DPO කෙනෙක් ඕන — large-scale candidate profiling/AI scoring බොහෝ දුරට qualify වෙනවා | DPO appoint කරලා contact publish කරන්න |
| s.21–22 | Security safeguards, processor obligations | Technical controls, DPAs |
| s.23 | **Authority එකට breach notification** | Incident register + runbook |
| s.24 (සංශෝධිත) | Personal data protection impact assessment; Authority ලිඛිතව ඉල්ලුවොත් **submit කරන්න ඕන** (s.24(5)) | Gemini ATS scoring ආදියට DPIA |
| s.26 (සම්පූර්ණයෙන් replace කළ) | Cross-border flows වලට: Parts I, II & ss.20–25 compliance + Authority-specified instruments (foreign recipient ගෙන් binding commitments), **නැත්නම්** exceptions — **explicit informed consent** (s.26(3)(a)), contract necessity, legal claims, emergency, transit | Hosting/AI/email stack එක සම්පූර්ණයෙන් offshore |
| s.52(2) (සංශෝධිත) | Compliance window එක මාස 24 → **36** | Planning runway |

---

## (c) දැනටමත් Compliant / ශක්තිමත් දේවල්

| ක්ෂේත්‍රය | තත්ත්වය | සාක්ෂි (files) |
|---|---|---|
| Rectification (s.15) | ✅ හොඳයි | Full profile editing: `src/app/actions/profile-mutations.ts`, `PUT /api/candidate/job-preferences` |
| Erasure (s.16) | ✅ හොඳයි | Roles දෙකටම self-service hard delete: `src/app/api/candidate/settings/delete-account/route.ts`, `src/app/api/employer/settings/delete-account/route.ts`, Prisma `onDelete: Cascade`, UI: `DangerZoneSettings.tsx`. ⚠️ Storage files (CVs/images) delete වෙනවද verify කරන්න |
| Access (s.13) — බැලීම | 🟡 Partial | Users ලාට data *බලන්න* පුළුවන් (`GET /api/candidate/profile`) ඒත් copy එකක් *export* කරන්න බැහැ |
| Security safeguards (s.21) | ✅ ශක්තිමත් | bcrypt(12) passwords, Supabase Auth + email verification, tables 40+ කට RLS (`sql/rls_policies.sql`), private storage buckets (`resume`, `br-certificates`), rate limiting + account lockout (`src/lib/rate-limit.ts`), security headers, session revocation (`/api/user/sessions`) |
| Human-in-the-loop තීරණ (s.18) | ✅ Structure එක OK | ATS score එක advisory විතරයි; rejection එකට employer ගේ explicit action එකක් ඕන (`/api/employer/applications/[id]/reject`) — තීරණ **solely automated නෙවෙයි**. Gap එක *disclosure* එක, mechanism එක නෙවෙයි |
| ළමා දත්ත | ✅ N/A | 18+ age gate එක client + server දෙකේම enforce වෙනවා (`src/lib/validations/candidate-schema.ts:73-84`) |
| Cookie consent UI | 🟡 Partial | Banner + granular preferences + withdrawal තියෙනවා (`src/lib/cookie-consent.ts`, `src/components/cookie-consent/*`, `/cookie-policy`); analytics ඇත්තටම consent-gated. ඒත් consent එක **client-side විතරයි** — server-side record එකක් නැහැ |
| Audit infrastructure | ✅ හොඳ base එකක් | `EventLog` (IP/user-agent සමඟ), `ApiRequestLog`, `ErrorLog` models; cleanup script `scripts/cleanup-logs.ts` (manual) |
| Notification preferences | 🟡 Partial | Type එක ගානේ granular toggles (`users.notification_preferences`, `GET/PUT /api/user/notification-preferences`) — ඒත් defaults ඔක්කොම ON, emails වල unsubscribe links නැහැ |

---

## (d) List 3

### 1️⃣ දැනට තියෙන features වලට කරන්න ඕන CHANGES

| # | Change එක | කොහෙද (files) | Act ref |
|---|-----------|----------------|---------|
| C1 | Signup forms දෙකටම required consent checkboxes add කරන්න: (i) ToS + Privacy Policy acceptance, (ii) AI processing + cross-border transfer සඳහා explicit consent, (iii) optional marketing opt-in. හැම එකක්ම version, IP, timestamp සමඟ server-side consent record එකක් විදිහට save කරන්න | `src/components/auth/CandidateSignupForm.tsx`, `src/components/employer/EmployerSignupWizard.tsx`, `src/lib/validations/candidate-schema.ts` (+ employer schema), signup API routes | s.11, Schedule I, s.26(3)(a) |
| C2 | Apply flow එක: AI-scoring disclosure notice එකක් පෙන්නන්න ("ඔබේ CV එක AI මගින් analyze කරලා employer ට පේන match score එකක් හදනවා; අවසාන තීරණ ගන්නේ මිනිසුන්; ඔබට review එකක් request කරන්න පුළුවන්"); ATS trigger කරන්න කලින් `ai_processing` consent check කරන්න; withdraw කරලා නම් scoring skip කරලා application එක accept කරන්න | apply UI + `src/app/api/candidate/jobs/[id]/apply/route.ts` (`src/app/actions/ats-score.ts` call කරන) | s.18, s.26 |
| C3 | Rejection email එක: තීරණය employer (human) විසින් ගත් බව, automated scoring input එකක් වෙන්න ඇති බව, සහ automated assessment එක review කරවා ගන්න link එකක් — paragraph එකක් add කරන්න | `src/lib/job-advertisement-emails.ts` (`sendApplicationRejectedEmail`, ~line 299) | s.18 |
| C4 | Email templates ඔක්කොම: company identity, DPO contact, "manage preferences" link, non-essential mail වලට signed one-click unsubscribe link එකක් තියෙන shared footer එකක්; Resend හරහා `List-Unsubscribe` / `List-Unsubscribe-Post` headers add කරන්න | `src/lib/email.ts`, `src/lib/employer-emails.ts`, `src/lib/interview-emails.ts`, `src/lib/job-advertisement-emails.ts` | s.14 |
| C5 | Logged-in users ලාගේ cookie consent එක server-side persist කරන්න (scripts gate කරන්නේ cookie එකෙන්මයි; DB එක auditable consent record එක වෙනවා) | `src/components/providers/CookieConsentProvider.tsx` → අලුත් consent API | s.11 (consent records) |
| C6 | MIS admin views වල NIC/passport mask කරන්න (උදා: `*******123V`) — permission-gated "reveal" එකක් + audit `EventLog` entry එකක්; employer-facing payloads වල NIC නැති බව confirm කරන්න | MIS candidate views (`src/app/mis/(dashboard)/candidates/...`) | s.21, data minimisation |
| C7 | `vercel.json` එකේ broken cron entry එක fix කරන්න (`/api/cron` කියන්නේ **කිසිම route එකක් නැති** path එකක් — දැනට scheduled jobs run නොවෙනවා වෙන්න පුළුවන්!) + retention cleanup එක schedule කරන්න | `vercel.json` | s.12 (housekeeping) |
| C8 | දැනට ඉන්න users ලාට re-consent flow එකක්: dashboard load වෙද්දී current version එකේ privacy-policy consent එකක් නැත්නම් blocking accept modal එකක් පෙන්නන්න | `src/app/candidate/(dashboard)/layout.tsx`, employer equivalent | s.11 |

### 2️⃣ අලුතින් ADD කරන්න ඕන FEATURES

| # | Feature එක | Act ref |
|---|------------|---------|
| A1 | **`/privacy` + `/terms` pages** — cover කරන්න ඕන: controller identity; DPO contact; activity එක ගානේ purposes + lawful basis (accounts, applications, ATS scoring, BR verification, emails, logs); NIC/passport ඇතුළු data categories; **overseas processors නම් සහ locations සමඟ** (Supabase — Seoul; Google Gemini; Resend; Upstash; Vercel); retention periods table එක; ss.13–16 rights සහ ඒවා use කරන විදිහ; s.17 timelines + **Data Protection Authority එකට appeal අයිතිය**; s.18 automated-processing disclosure; cookies (`/cookie-policy` link). `src/app/cookie-policy/page.tsx` වල static-page pattern එක follow කරන්න | s.11, s.26 |
| A2 | **`consent_records` table** (append-only event log; types: terms, privacy_policy, marketing_email, cookie_analytics, cookie_marketing, ai_processing, cross_border; version/IP/user-agent/source save වෙනවා; account deletion එකෙන් පස්සෙත් proof එක ඉතුරු වෙන්න `onDelete: SetNull`) + `GET/POST /api/user/consent` + `sql/rls_policies.sql` වල RLS policies | s.11 |
| A3 | **"Download my data" export** — `GET /api/user/data-export`: user + profile + applications (ATS score/breakdown ඇතුළුව — s.13 access එකට ඒවත් අයිතියි), interviews, notifications, consent history, resume signed URLs — JSON එකක්. නොමිලේ; දැනට තියෙන `src/lib/rate-limit.ts` එකෙන් rate-limit කරලා | s.13 |
| A4 | **DSR (Data Subject Request) workflow** — `data_subject_requests` table (types: access, rectification, erasure, consent_withdrawal, automated_review, other; statuses; `due_date = received + මාස 1`; extension fields — උපරිම +මාස 3, pre-expiry notification timestamp එකත් එක්ක validate වෙනවා; response/refusal text; erasure එකෙන් පස්සෙත් `SetNull` + requester email එක තියාගෙන record එක ඉතුරු වෙනවා). Roles දෙකේම settings වල අලුත් "Privacy & Data" section එකක user submission UI; අලුත් `compliance` permission එකකින් gate කළ MIS compliance queue එකක් (`src/app/mis/(dashboard)/compliance/`); acknowledgment/extension/response emails — **හැම refusal email එකකම Authority appeal අයිතිය සඳහන් වෙන්නම ඕන** | ss.13–17, s.19 |
| A5 | **Automated-decision review request** — specific application එකකට link වුණු (`related_application_id`) DSR type `automated_review`; rejected applications වල candidate-side "Request review" action එකක්; MIS detail view එකේ `ats_score`/`ats_breakdown` + recompute option — human කෙනෙක් review outcome එක document කරනවා | s.18 |
| A6 | **Unsubscribe page + API** — HMAC-signed token එකක් සහිත `/unsubscribe` (login ඕන නැහැ); `notification_preferences` flip කරලා `marketing_email granted=false` consent record එකක් append කරනවා | s.14 |
| A7 | **Retention automation** — `src/lib/retention.ts` (`scripts/cleanup-logs.ts` එකෙන් port කරලා) + `/api/cron/retention-cleanup` Vercel cron (daily; `src/app/api/cron/expire-jobs/route.ts` වල `verifyCronSecret` pattern එක). Policy map එක `/privacy` එකේ ලියන්න ඕන: event_logs 90d, api_request_logs 30d, error_logs 90/180d, notifications 180d, expired tokens, orphaned storage files (පරණ resumes!), applications — job එක close වෙලා අවුරුදු N කට පස්සේ (**N counsel එක්ක confirm කරන්න; suggested default අවුරුදු 2**). හැම run එකක්ම accountability evidence විදිහට `EventLog` එකට log වෙනවා | Retention limitation, s.12 |
| A8 | **Breach incident register** — `data_breach_incidents` table (severity, status, detected/occurred/contained timestamps, s.23 සඳහා `authority_notified_at`, `subjects_notified_at`, affected count, data categories, remediation) + MIS "Breach Register" tab + optional bulk subject-notification email helper | s.23 |
| A9 | **DPO contact surface කිරීම** — `DPO_EMAIL` env var එක `/privacy` එකේ, site footer එකේ, සහ Privacy & Data settings section එකේ පෙන්නන්න | s.20 |

### 3️⃣ REMOVE / STOP කරන්න ඕන දේවල්

සම්පූර්ණයෙන් අයින් කරන්න ඕන දෙයක් නැහැ — rejection තීරණ human-made නිසා ("solely automated" නෙවෙයි) **ATS scoring එක නීත්‍යානුකූලව තියාගන්න පුළුවන්**. හැබැයි මේ practices නවත්වන්නම ඕන:

| # | Stop / remove | ඇයි |
|---|---------------|-----|
| R1 | **Disclosure/consent නැතුව CVs Google Gemini වෙත යැවීම නවත්වන්න.** දැනට `ats-score.ts` එක හැම application එකකදීම කිසිම notice එකක් නැතුව automatic fire වෙනවා. `ai_processing` consent එක මත gate කරන්න (C2) | දැනට තියෙන විදිහට s.18 + s.26 violation එකක් |
| R2 | **Indefinite retention නවත්වන්න**: notifications table එක දිගටම වැඩෙනවා; අලුත් resume එකක් upload කළාම පරණ ඒවා ඔක්කොම තියෙනවා; applications/interview records කවදාවත් purge වෙන්නේ නැහැ; log cleanup එක තියෙනවා ඒත් schedule වෙලා නැහැ | Retention limitation |
| R3 | **Admin UI එකේ plaintext NIC/passport exposure එක අයින් කරන්න** (mask — C6). Stretch goal: additive `nic_passport_enc` column එකක් + non-destructive backfill එකක් සමඟ application-layer AES-256-GCM field encryption | s.21 |
| R4 | **`vercel.json` එකේ broken `/api/cron` entry එක අයින් කරන්න** (කිසිම route එකකට point වෙන්නේ නැහැ) | Operational |
| R5 | **Unsubscribe links නැතුව සහ send කරන්න කලින් stored preferences check නොකර non-essential notification emails යැවීම නවත්වන්න** | s.14 |
| R6 | **Dead `/privacy` සහ `/terms` links අයින් කරන්න** (`src/components/layout/AuthShell.tsx` footer + `/cookie-policy` වල) — A1 ship කළාම fix වෙනවා | Transparency |

---

## (e) Implementation Roadmap (phased PRs — future work)

**Schema වෙනසක් තියෙන හැම PR එකකටම DB rule එක** (project convention): `prisma/schema.prisma` update කරන්න; **dev** එකට `prisma migrate dev/deploy`; **prod** එකට identical DDL Supabase `apply_migration` හරහා (prod එකේ Prisma migration history නැහැ — P3005); කවදාවත් destructive නැහැ; `sql/rls_policies.sql` එකට RLS policies append කරන්න (අලුත් tables වල RLS on ඒත් policies නැහැ → policies දාන කම් reads 0 rows return කරනවා).

| PR | ඇතුළත් දේවල් |
|----|--------------|
| **PR1** | `/privacy` + `/terms` pages; `ConsentRecord` model + enum + RLS; `src/lib/legal/versions.ts` (`PRIVACY_POLICY_VERSION`, `TERMS_VERSION`) |
| **PR2** | Signup checkboxes + `z.literal(true)` validation; signup එකේදී consent recording; `GET/POST /api/user/consent`; cookie-consent DB sync; dashboard layouts වල re-consent modal |
| **PR3** | `GET /api/user/data-export`; `DataSubjectRequest` model + RLS; user DSR API; settings pages දෙකේම `PrivacyDataSettings.tsx` (`SettingsClient.tsx` NAV_ITEMS + `src/components/layout/nav-config.ts` වලට wire කරලා) |
| **PR4** | MIS DSR queue: `/api/mis/dsr` routes (list / detail / extend / respond — s.17 validation: extension due date එකට කලින් විතරයි, උපරිම +මාස 3, refusal එකට හේතුවක් ඕන, response email එකේ හැමවිටම appeal paragraph එක); `src/app/mis/(dashboard)/compliance/` UI; `src/lib/mis/default-permissions.ts` වල අලුත් `compliance` permission; `dsr-emails.ts`; MIS nav item |
| **PR5** | s.18: apply-flow disclosure + ATS consent gate; rejection-email paragraph + review link; candidate "Request review" action; MIS `automated_review` handling (`ats_breakdown` පෙන්නලා recompute) |
| **PR6** | `src/lib/email-footer.ts`; `/unsubscribe` page + HMAC token API; templates ඔක්කොමට footer එක; `List-Unsubscribe` headers; non-essential sends වලට කලින් preference check |
| **PR7** | `src/lib/retention.ts`; `/api/cron/retention-cleanup`; `vercel.json` crons fix + extend; runs `EventLog` එකට log |
| **PR8** | `DataBreachIncident` model + RLS (MIS-only); `/mis/compliance` එකේ breach register tab; optional subject-notification email; footer එකේ DPO |
| **PR9** | MIS views වල NIC masking + audited reveal. *(Deferred stretch: AES-256-GCM field encryption — additive column + backfill)* |

**Implement කරද්දී verification** (සාරාංශය): checkboxes නැතුව signup → validation error, තියෙනවා නම් → consent rows record වෙනවා; DSR lifecycle එක මාස 1/3 deadlines + appeal text enforce කරනවා; export එක නොමිලේ full JSON දෙනවා; consent withdraw කළාම ATS skip වෙනවා ඒත් application succeed වෙනවා; unsubscribe logged-out වුණත් වැඩ; retention cron එක prod එකට කලින් dev එකේ dry-run; RLS verify (users ලාට පේන්නේ තමන්ගේ consent/DSR rows විතරයි).

---

## (f) Non-Code / Organizational Checklist (business + legal counsel)

- [ ] **DPO කෙනෙක් appoint කරන්න** (s.20); `dpo@jobgenie.biz` mailbox එක හදන්න; Vercel env එකේ `DPO_EMAIL` set කරන්න.
- [ ] **DPIAs (s.24)**: Gemini ATS scoring, Gemini CV extraction, BR certificate verification වලට. Authority ලිඛිත request එකක් එව්වොත් produce කරන්න පුළුවන් වෙන්න ඕන (සංශෝධිත s.24(5)).
- [ ] **s.26 transfer instruments**: Supabase, Google (Gemini API terms), Resend, Upstash, Vercel එක්ක DPAs / standard-clause equivalents execute/collect කරන්න; හැම processor කෙනෙක්ගේම data residency + sub-processor lists verify කරන්න; file එකේ තියාගන්න. (PR2 එකේ explicit consent එක fallback lawful route එක; contracts තමයි robust route එක.)
- [ ] **Data Protection Management Programme (s.12)** document එක — MIS compliance hub එක, consent records, DSR log එක, retention cron logs, breach register එක ඒකේ operational evidence.
- [ ] **Records of processing activities** (data inventory: category → purpose → processor → retention → lawful basis).
- [ ] **Breach-response runbook** (s.23): Authority notification තීරණය කරන්නේ කවුද, internal escalation, timelines.
- [ ] **PR1 ship කරන්න කලින්** `/privacy`, `/terms`, consent wording ඔක්කොම, සහ application-data retention period එක **legal review** කරන්න.

---

## (g) Cross-Border Processor Table (s.26)

| Service | Role | Region | Transfer වෙන personal data | දැනට legal basis | ඕන action |
|---|---|---|---|---|---|
| Supabase (DB + Auth + Storage) | Processor | AWS ap-northeast-2 (Seoul, South Korea) | **Rest එකේ තියෙන ඔක්කොම** — profiles, NIC, CVs, applications, payments, logs | ❌ නැහැ | DPA + s.26 instrument; privacy notice එකේ disclose; signup එකේදී explicit consent |
| Google Gemini (AI API) | Processor | Global | Full CV text, BR certificates, job descriptions | ❌ නැහැ | Disclose + explicit consent; DPIA; API data-use terms file එකේ |
| Resend (email) | Processor | US/global | Emails, නම්, verification codes, interview details | ❌ නැහැ | DPA; privacy notice එකේ disclose |
| Upstash Redis | Processor | Global | IP addresses, emails (lockout keys, ≤15 min TTL) | ❌ නැහැ | DPA; privacy notice එකේ disclose |
| Vercel (hosting + Analytics) | Processor | US/global | Traffic ඔක්කොම; analytics telemetry (දැනටමත් consent-gated) | 🟡 Partial (analytics වලට cookie consent විතරයි) | DPA; privacy notice එකේ disclose |

---

*Automated codebase audit එකකින් සකස් කළා. File paths audit දිනයේ repository එකට verify කරලා. මේක technical compliance analysis එකක් — legal advice නෙවෙයි; final wording සහ retention periods ශ්‍රී ලංකා qualified counsel කෙනෙක්ගෙන් review කරගන්න ඕන.*
