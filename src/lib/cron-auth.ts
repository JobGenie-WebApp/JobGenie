import type { NextRequest } from "next/server";
import crypto from "crypto";

/**
 * Verify a cron request's shared secret.
 *
 * Accepts ONLY the `Authorization: Bearer <CRON_SECRET>` header — Vercel Cron
 * sends exactly this automatically when the CRON_SECRET env var is set, so we no
 * longer accept the secret via `?secret=` query param (which leaks into request
 * logs, browser history, and referrers).
 *
 * Uses a constant-time comparison to avoid leaking the secret via timing.
 */
export function verifyCronSecret(request: NextRequest): boolean {
    const expected = process.env.CRON_SECRET;
    if (!expected) return false;

    const provided = request.headers
        .get("authorization")
        ?.replace(/^Bearer\s+/i, "")
        .trim();
    if (!provided) return false;

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    // timingSafeEqual throws if lengths differ — guard first (length itself is
    // not secret here).
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}
