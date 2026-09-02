# JobGenie — Feature Ideas

A list of features that could be added to JobGenie, each with what it does, who it's for, and what
existing part of the codebase it builds on.

Nothing here is built yet. Everything here reuses plumbing JobGenie already has — the Gemini client,
the ATS scoring fields, the notification and email systems, the cron jobs, the reference tables.

---

## A. Matching & Discovery

### 1. Job Match Score

**For:** Candidate
**What:** Every job card on the board shows a 0–100 fit badge — how well this candidate matches this
job. Green/amber/red so it's readable at a glance. Candidates stop scrolling blind and stop wasting
applications on jobs they can't win. Sortable, so "best fit first" becomes the default view.
**Builds on:** the Gemini scoring prompt in `src/app/actions/ats-score.ts` (currently only runs at
apply time, against a résumé) — here it runs against the structured profile instead, so it works
even for candidates with no CV uploaded. Reuses `candidates.industry`, `experience_level`,
`years_of_experience`, `expected_monthly_salary`, `expected_positions`.

### 2. Recommended Jobs Feed

**For:** Candidate
**What:** A personalised "Jobs for you" feed on the candidate dashboard — the top N open jobs ranked
by match score, refreshed daily, instead of making the candidate build filters themselves. This is
the difference between a job board and a job *platform*.
**Builds on:** feature #1's score, plus the existing dashboard data loader
`src/app/actions/candidate-dashboard-data.ts` and the reference cache in `src/lib/reference-cache.ts`.

### 3. Reverse Matching (Employer Sourcing)

**For:** Employer
**What:** On a published job, a "Candidates you should invite" panel — approved candidates from the
talent pool ranked against that job, whether or not they applied. Turns the invitation system from
"employer searches manually" into "platform suggests". This is the highest-value feature on this list
because it directly drives the invitation → interview → hiring-fee flow that JobGenie monetises.
**Builds on:** the same scoring logic, the existing `JobInvitation` flow, and
`src/app/employer/(dashboard)/candidates/CandidateTable.tsx` for the UI shell.

### 4. Semantic Search (pgvector)

**For:** Candidate + Employer + MIS
**What:** Search that understands meaning, not just spelling. "Accounts person" finds "Finance
Executive"; "React dev" finds "Frontend Engineer". Today's search only matches literal strings, so
good matches are invisible when the words differ — a real problem across a Sinhala/English market
with inconsistent job titles.
**Builds on:** Supabase already runs Postgres — enable the `pgvector` extension, embed job
descriptions and candidate profiles, store the vectors alongside the existing rows. Replaces the
keyword filtering in `JobBoardClient.tsx` and the employer candidate search.

### 5. Job Alerts & Saved Searches

**For:** Candidate
**What:** A candidate saves a search ("Finance, Colombo, 5+ years") and gets an email when matching
jobs are posted — daily or weekly, their choice. Brings candidates back to the platform without
them having to remember to check.
**Builds on:** the cron infrastructure already used by `src/lib/process-job-expiry.ts` and
`src/lib/process-interview-reminders.ts` (registered in `vercel.json`), plus Resend and the email
templates in `src/lib/job-advertisement-emails.ts`.

---

## B. CV & ATS Tooling

### 6. Standalone ATS Checker

**For:** Candidate
**What:** "Check my CV against this job" — run the ATS score *before* applying, on demand, from the
job page or a dedicated tool page. The candidate sees their score, sub-scores, matched keywords and
missing keywords, and can fix the CV and re-check. Right now this scoring runs silently at apply
time and only the employer benefits from it.
**Builds on:** `src/app/actions/ats-score.ts` almost as-is — the scoring function already returns
breakdown, matched and missing keywords. Needs rate limiting via `src/lib/rate-limit.ts` so it isn't
abused, and a place to store repeat checks.

### 7. CV Improvement Suggestions

**For:** Candidate
**What:** Turns `ats_missing_keywords` from a list of words into actual advice: which section to add
them to, how to phrase the bullet, what's weak about the current summary. A missing-keywords list
tells you *that* you failed; this tells you *how to fix it*.
**Builds on:** feature #6's result plus one more Gemini call through
`generateContentWithRetry()` in `src/lib/gemini.ts`.

### 8. Profile Strength Meter

**For:** Candidate
**What:** A completeness score on the profile page with a ranked "next best action" list — *add a
work experience*, *set your expected salary*, *upload a résumé*. Employers filter on fields
candidates leave blank, so incomplete profiles are invisible in search. This is a pure-SQL feature
with no AI cost and it directly improves match quality for everything else on this list.
**Builds on:** the `Candidate` model's existing relations (`work_experiences`, `educations`,
`certificates`, `projects`, `awards`, `industry_specializations`, `resumes`) and
`profile_completed`. Fits in the profile UI under `src/components/profile/`.

### 9. Skill Gap Report

**For:** Candidate
**What:** "For the roles you want, employers are asking for X, Y, Z — your profile shows X only."
Aggregated across open jobs in the candidate's target designation, not a single job. Optionally
pairs with suggested certifications.
**Builds on:** aggregate over `jobs.description` for the candidate's `expected_positions` /
`industry`, compared against the profile. Reuses the reference tables `JobDesignation` and
`SeniorityLevel`.

### 10. JobGenie CV Builder

**For:** Candidate
**What:** Generate a clean, ATS-friendly, JobGenie-branded PDF CV straight from the structured
profile the candidate already filled in. Many candidates in this market have no CV, or one that
parses badly. The platform already holds better structured data than most CVs contain — this just
renders it.
**Builds on:** `src/lib/pdf-generator.ts` already exists, and the profile relations listed in #8
are the exact content of a CV. Stores the output alongside uploads in `CandidateResume`.

---

## C. Employer & Hiring Tools

### 11. Applicant Auto-Ranking

**For:** Employer
**What:** Sort and filter the applicant list by ATS score, with a "top 10 only" view and a minimum
score threshold. For a job with 200 applicants, this is the difference between a usable pipeline and
an unread inbox.
**Builds on:** almost free — `job_applications.ats_score` is already populated at apply time and
already has a database index (`@@index([ats_score])`). This is mostly a UI and query change.

### 12. AI Job Description Writer

**For:** Employer
**What:** Employer picks title, industry, seniority and job type; gets a complete draft JD —
responsibilities, requirements, benefits — which they then edit. Removes the blank-page problem that
stalls job posting, and produces better-structured descriptions, which in turn makes every matching
feature above more accurate.
**Builds on:** `src/lib/gemini.ts`, the reference tables (`Industry`, `JobDesignation`,
`SeniorityLevel`), and the existing MDX editor already used for job descriptions.

### 13. JD Quality & Bias Check

**For:** Employer + MIS
**What:** Before publishing, flag problems in the posting: no salary range, vague requirements,
discriminatory language (age, gender, marital status, "fresh graduates only"), unrealistic
experience demands. Employer sees a score and specific fixes. Protects the platform's reputation and
supports the compliance posture already documented in the PDPA audit.
**Builds on:** the `JobComplianceFlag` model and the MIS moderation screens under
`src/app/mis/(dashboard)/jobs/` already exist for post-hoc flagging — this is the pre-publish
counterpart.

### 14. Screening / Knockout Questions

**For:** Employer
**What:** Employer attaches a few questions to a job ("Do you have a valid driving licence?",
"Years of SAP experience?"). Candidates answer at apply time; disqualifying answers are auto-filtered
or clearly marked. Filters on facts a CV can't reliably express.
**Builds on:** the apply flow in `src/app/actions/candidate.ts` and the `JobApplication` model — the
answers sit naturally in a JSON column, the same pattern `JobInvitation.given_time_slots` already
uses.

### 15. Interview Scorecards

**For:** Employer
**What:** Structured per-round evaluation — rate the candidate on defined criteria, record a
recommendation, compare candidates side by side. Replaces free-text notes, which don't compare and
don't aggregate. Also gives the platform real signal on what a successful hire looks like.
**Builds on:** `InterviewRound` already models rounds with `RoundStatus` and `RoundOutcome`; this
adds structured ratings to it rather than inventing a new pipeline.

### 16. Hiring Funnel Analytics

**For:** Employer + MIS
**What:** Per job and per company: applications → shortlisted → interviewed → offered → hired, with
time-to-hire, drop-off at each stage, and which stage is leaking. Employers get to see the value
they're paying for; MIS gets platform health metrics.
**Builds on:** every stage is already timestamped — `JobApplication.applied_at`,
`JobInvitation.sent_at` / `responded_at` / `confirmed_at`, `InterviewRound`, `JobOffer`. Extends
`src/lib/employer-dashboard-stats.ts`, which already computes employer stats with the correct
company scoping.

### 17. Bulk Actions & Canned Responses

**For:** Employer
**What:** Select many applicants, move them all to a status, and send a templated (but personalised)
email — especially rejections. Most candidates in most systems never hear back at all; a two-click
polite rejection fixes that, and it costs the employer nothing.
**Builds on:** the Resend integration and the existing template pattern in
`src/lib/employer-emails.ts` and `src/lib/interview-emails.ts`.

---

## D. Platform & Trust

### 18. Interview Prep Pack

**For:** Candidate
**What:** Once an interview is confirmed, the candidate gets a prep page: likely questions for this
role, key facts about the company, what to bring, directions or the meeting link. Reduces no-shows
and improves interview quality — both of which matter to JobGenie because the hiring fee sits at the
end of that funnel.
**Builds on:** `JobInvitation` already holds the confirmed time, mode, `meeting_link`,
`interview_address` and `map_link`; the company profile supplies context; Gemini generates the
question set. Slots into the reminder emails that `process-interview-reminders.ts` already sends.

### 19. Salary Benchmarking

**For:** Candidate + Employer
**What:** "Roles like this in your industry pay LKR X–Y." Candidates set realistic expectations;
employers see whether their range is competitive before they post. Genuinely scarce information in
the Sri Lankan market, and JobGenie is accumulating the data to answer it.
**Builds on:** aggregate `jobs.salary_min` / `salary_max` / `salary_currency` by `JobDesignation`,
`Industry` and `Country`, with `candidates.expected_monthly_salary` as the other side of the market.
Currency handling already exists in `src/lib/currencies.ts`.

### 20. Verified Employer Badge

**For:** Employer (public-facing)
**What:** Surface business-registration verification publicly — a badge on the job card, the company
page and the top-employers listing. Job scams are the main trust problem on any job board; visible
verification is the cheapest defence.
**Builds on:** `src/app/actions/verify-br-certificate.ts` and the
`/api/verify-br-certificate` route already verify BR certificates at signup — the result just isn't
shown anywhere public. Displays via `src/lib/public-directory.ts` and the top-employers page.

### 21. Notification Preferences Centre

**For:** Candidate + Employer
**What:** Per-event, per-channel control — which emails and in-app notifications a user receives, and
a single unsubscribe path. Users currently get everything or nothing.
**Builds on:** the `Notification` model and Realtime components already exist; this adds the
preference layer the sending code checks. Also closes a consent gap flagged in
`PDPA_COMPLIANCE_AUDIT_EN.md`.

---

## If you only build three

1. **#11 Applicant Auto-Ranking** — the scores and the database index already exist. This is a query
   and a sort order, and it makes the employer side immediately more usable.
2. **#6 Standalone ATS Checker** — the scoring engine is already written and already paid for. This
   exposes it to candidates as a visible, shareable, marketable feature.
3. **#3 Reverse Matching** — the most work of the three, but it's the one that drives invitations,
   and invitations are where JobGenie makes money.

**#8 Profile Strength Meter** is the honourable mention: no AI cost, small diff, and it improves the
data quality that every other feature on this list depends on.
