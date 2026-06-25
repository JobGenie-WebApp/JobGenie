#!/usr/bin/env bash
# =============================================================================
# JobGenie — local static security scan
# =============================================================================
# Runs the free / open-source static security suite in one command:
#   1. npm audit            — known CVEs in production dependencies
#   2. OSV-Scanner          — lockfile vulnerability scan (Google OSV)
#   3. gitleaks             — secret scanning (working tree + full git history)
#   4. Semgrep              — SAST (OWASP Top Ten + Next.js + TS rulesets)
#
# Tools are invoked only if installed; missing ones are reported, not fatal,
# except `npm audit` which always runs. Install hints:
#   brew install osv-scanner gitleaks semgrep
#   (or)  pipx install semgrep ;  go install github.com/google/osv-scanner/cmd/osv-scanner@latest
#
# Usage:  ./scripts/security-scan.sh
# Exit:   non-zero if npm audit finds HIGH/critical prod vulns or a scanner fails.
# =============================================================================
set -uo pipefail
cd "$(dirname "$0")/.."

fail=0
have() { command -v "$1" >/dev/null 2>&1; }
section() { printf '\n\033[1;36m=== %s ===\033[0m\n' "$1"; }

section "1. npm audit (production deps)"
if npm audit --omit=dev --audit-level=high; then
  echo "✓ no high/critical production vulnerabilities"
else
  echo "✗ npm audit found high/critical vulnerabilities (see above)"
  fail=1
fi

section "2. OSV-Scanner (lockfile)"
if have osv-scanner; then
  osv-scanner --lockfile=package-lock.json || fail=1
else
  echo "– osv-scanner not installed (skipping). Install: brew install osv-scanner"
fi

section "3. gitleaks (secrets)"
if have gitleaks; then
  gitleaks detect --no-banner --redact || fail=1
else
  echo "– gitleaks not installed (skipping). Install: brew install gitleaks"
fi

section "4. Semgrep (SAST)"
if have semgrep; then
  semgrep --error --quiet \
    --config p/owasp-top-ten \
    --config p/nextjs \
    --config p/typescript \
    --config p/secrets \
    src || fail=1
else
  echo "– semgrep not installed (skipping). Install: pipx install semgrep"
fi

section "Result"
if [ "$fail" -eq 0 ]; then
  echo "✓ static security scan passed"
else
  echo "✗ static security scan reported findings — review output above"
fi
exit "$fail"
