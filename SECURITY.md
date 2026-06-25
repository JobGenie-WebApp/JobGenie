# JobGenie Security

This document describes JobGenie's security testing toolkit, the hardening that
is in place, and the manual steps required to fully enable protection. All tools
are free / open-source.

---

## 1. Testing toolkit (free / open-source)

| Layer | Tool | Run |
|---|---|---|
| Dependencies (CVEs) | `npm audit`, [OSV-Scanner](https://google.github.io/osv-scanner/) | `npm audit --omit=dev --audit-level=high` |
| Secrets | [gitleaks](https://github.com/gitleaks/gitleaks), [trufflehog](https://github.com/trufflesecurity/trufflehog) | `gitleaks detect` |
| SAST (code) | [Semgrep](https://semgrep.dev) (`p/owasp-top-ten`, `p/nextjs`, `p/typescript`, `p/secrets`) | `semgrep --config p/owasp-top-ten src` |
| Database / RLS | Supabase advisors | MCP `get_advisors`, or Dashboard → Advisors |
| DAST (running app) | [OWASP ZAP](https://www.zaproxy.org/) baseline | **local / staging only** |
| SQLi confirmation | [sqlmap](https://sqlmap.org/) | **local / staging only** |
| HTTP headers | [securityheaders.com](https://securityheaders.com), `curl -I` | against a deployed URL |

**One-shot static scan:** `./scripts/security-scan.sh`
**CI:** `.github/workflows/security.yml` runs npm audit, OSV-Scanner, gitleaks,
and Semgrep on every PR/push to `main`/`dev` and weekly.

> ⚠️ Run ZAP / sqlmap against a **local build or staging** deploy only — never
> fire attack traffic at production (junk data, alerts, cost, rate limits).
> Example baseline scan:
> `docker run -t ghcr.io/zaproxy/zaproxy zap-baseline.py -t http://host.docker.internal:3000`

---

## 2. Controls in place (OWASP Top 10)

| Risk | Control |
|---|---|
| A01 Broken Access Control | Role-based `src/middleware.ts`; Supabase **RLS** on all tables (`SQL/rls_policies.sql`); `companies` INSERT scoped to `is_employer()` |
| A02 Cryptographic Failures | bcrypt(12) password hashing; cookie-based Supabase sessions (no tokens in localStorage); HTTPS/HSTS |
| A03 Injection | Parameterized queries everywhere (Supabase PostgREST + `postgres.js` template literals); Zod validation; no `$queryRawUnsafe` |
| A04 Insecure Design | Email verification, approval workflows, per-account login **lockout** |
| A05 Security Misconfiguration | Security headers in `next.config.ts`; cron secured by header-only Bearer + constant-time compare |
| A06 Vulnerable Components | `npm audit` + OSV in CI; production high-severity vulns remediated |
| A07 Auth Failures | Rate limiting on auth endpoints + 5-strike account lockout (`src/lib/rate-limit.ts`) |
| A08 Data Integrity | File upload MIME allowlist + extension cross-check + size limits (`src/lib/storage.ts`) |
| A09 Logging | API request / auth / error logging via `src/lib/logger.ts` (admin client) |
| A10 SSRF | No user-supplied URLs fetched server-side; image domains allow-listed in `next.config.ts` |

### Rate limiting & DDoS
`src/lib/rate-limit.ts` (Upstash Redis) enforced in `src/middleware.ts`:
auth `10/min/IP`, AI `5/min/IP`, uploads `10/min/IP`, general API `120/min/IP`,
plus per-account login lockout (5 failures → 15-min lock). Fails **open** if
Upstash is unconfigured/unreachable so it never takes the app down.
Volumetric/network DDoS is absorbed by Vercel's edge; these limits stop
application-layer abuse and credential brute-force.

---

## 3. Required manual steps

These cannot be done from code and must be completed by an admin:

1. **Provision Upstash Redis (free):** create a DB at
   <https://console.upstash.com>, then set `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN` in Vercel (Dev + Prod) and `.env.local`.
   **Until this is set, rate limiting and lockout are disabled (fail-open).**
2. **Enable leaked-password protection** (HaveIBeenPwned) in Supabase →
   Authentication → Policies, for **both** projects (Dev + Prod).
   Ref: <https://supabase.com/docs/guides/auth/password-security>
3. **Rotate secrets** that have lived in `.env.local` (DB password, Supabase
   service-role key, Gemini/Resend keys, `CRON_SECRET`) as hygiene.
4. **Promote CSP to enforce:** the CSP currently ships as
   `Content-Security-Policy-Report-Only`. After confirming no legitimate
   violations in production, rename the header key to `Content-Security-Policy`
   in `next.config.ts`.

---

## 4. Accepted residuals (documented, low risk)

- **`is_candidate()` / `is_employer()` / `is_mis_user()` callable via RPC**
  (advisor 0028/0029, WARN): these are referenced **inside RLS policies**, so
  revoking `EXECUTE` would break policy evaluation. They only reveal the
  caller's *own* role — no data about other users — so they are left executable.
- **`get_my_sessions()` / `delete_my_session()` callable by authenticated**:
  intentional — these are the user's own session-management RPCs.
- **`payment_*` tables: RLS enabled, no policy** (advisor 0008, INFO):
  deny-all to client roles is already secure; these tables are accessed only
  via the service-role admin client.
- **`fast-uri`, `hono` npm advisories**: pulled in only by the Prisma CLI
  (`prisma` devDependency, build-time) — not part of the deployed serverless
  bundle.

---

## 5. Known follow-ups (not security regressions)

- `vercel.json` schedules a cron at `/api/cron`, but no route exists at that
  exact path (only `/api/cron/expire-jobs` and `/api/cron/interview-reminders`).
  Verify the cron wiring separately.
- Enabling the `/api/:path*` middleware matcher activates the previously-dead
  API request logging block — every API request now writes an `api_request_logs`
  row (audit trail). Ensure the `db:cleanup` retention job runs.
