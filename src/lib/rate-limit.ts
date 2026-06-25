import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Distributed rate limiting for serverless (Vercel) using Upstash Redis.
 *
 * Each Vercel serverless instance has its own memory, so an in-memory limiter
 * would not protect against distributed abuse. Upstash gives us a single shared
 * counter across all instances.
 *
 * Behaviour:
 *  - If UPSTASH_REDIS_REST_URL / _TOKEN are not configured, limiting is disabled
 *    (fail-open) and a one-time warning is logged. This keeps local dev and any
 *    misconfigured environment from locking everyone out.
 *  - On a Redis outage at request time we also fail open (log, allow the request)
 *    so a Redis incident never takes the whole app down.
 *
 * Configure in Vercel env (Dev + Prod):
 *   UPSTASH_REDIS_REST_URL=...
 *   UPSTASH_REDIS_REST_TOKEN=...
 */

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let warned = false;
function warnOnce() {
    if (!warned) {
        warned = true;
        console.warn(
            "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — rate limiting is DISABLED (fail-open). " +
            "Set these env vars in production to enable DDoS / brute-force protection.",
        );
    }
}

const redis = url && token ? new Redis({ url, token }) : null;

/** Build a limiter, or null when Redis is not configured. */
function makeLimiter(
    tokens: number,
    window: Parameters<typeof Ratelimit.slidingWindow>[1],
    prefix: string,
): Ratelimit | null {
    if (!redis) return null;
    return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(tokens, window),
        analytics: false,
        prefix: `jobgenie:rl:${prefix}`,
    });
}

/** Strict limiter for auth endpoints (login / signup / verify / reset) — keyed by IP. */
export const authLimiter = makeLimiter(10, "1 m", "auth");

/** AI endpoints (BR-certificate verify, CV extract) — keyed by IP. Protects Gemini cost. */
export const aiLimiter = makeLimiter(5, "1 m", "ai");

/** Pre-signup uploads / deletes — keyed by IP. Protects against upload DoS. */
export const uploadLimiter = makeLimiter(10, "1 m", "upload");

/**
 * General API flood guard — keyed by IP. Set generously so a busy SPA (many
 * concurrent requests on page load, users behind shared NAT) is never throttled
 * during normal use; it only catches abusive flooding.
 */
export const apiLimiter = makeLimiter(120, "1 m", "api");

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    /** Epoch ms when the window resets. */
    reset: number;
    /** Seconds the client should wait before retrying (>= 0). */
    retryAfter: number;
}

/**
 * Check a limiter for a given identifier. Fails open (success=true) when the
 * limiter is disabled or Redis errors, so a Redis problem never blocks traffic.
 */
export async function checkRateLimit(
    limiter: Ratelimit | null,
    identifier: string,
): Promise<RateLimitResult> {
    if (!limiter) {
        warnOnce();
        return { success: true, limit: 0, remaining: 0, reset: 0, retryAfter: 0 };
    }
    try {
        const { success, limit, remaining, reset } = await limiter.limit(identifier);
        return {
            success,
            limit,
            remaining,
            reset,
            retryAfter: Math.max(0, Math.ceil((reset - Date.now()) / 1000)),
        };
    } catch (err) {
        // Fail open on Redis errors — never take the app down because of the limiter.
        console.error("[rate-limit] limiter error, failing open:", err);
        return { success: true, limit: 0, remaining: 0, reset: 0, retryAfter: 0 };
    }
}

/** Extract the best-effort client IP from request headers (Vercel / proxies). */
export function getClientIp(headers: Headers): string {
    return (
        headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headers.get("x-real-ip") ||
        "unknown"
    );
}

// ---------------------------------------------------------------------------
// Per-account login lockout (brute-force protection layer on top of the
// IP-based authLimiter). Counts consecutive failed logins per email and locks
// the account for a cooldown window once the threshold is reached.
// Fails open (no lockout) when Redis is not configured.
// ---------------------------------------------------------------------------

const LOCKOUT_THRESHOLD = 5; // failed attempts before lock
const LOCKOUT_WINDOW_SECONDS = 15 * 60; // counter TTL / lock duration

function lockoutKey(email: string): string {
    return `jobgenie:lockout:${email.trim().toLowerCase()}`;
}

export interface LockoutStatus {
    locked: boolean;
    /** Seconds until the lock clears (when locked). */
    retryAfter: number;
}

/** Returns whether the account is currently locked due to failed logins. */
export async function checkLoginLockout(email: string): Promise<LockoutStatus> {
    if (!redis) {
        warnOnce();
        return { locked: false, retryAfter: 0 };
    }
    try {
        const key = lockoutKey(email);
        const count = (await redis.get<number>(key)) ?? 0;
        if (count >= LOCKOUT_THRESHOLD) {
            const ttl = await redis.ttl(key);
            return { locked: true, retryAfter: ttl > 0 ? ttl : LOCKOUT_WINDOW_SECONDS };
        }
        return { locked: false, retryAfter: 0 };
    } catch (err) {
        console.error("[rate-limit] lockout check error, failing open:", err);
        return { locked: false, retryAfter: 0 };
    }
}

/** Record a failed login attempt; sets the TTL on the first failure. */
export async function recordLoginFailure(email: string): Promise<void> {
    if (!redis) return;
    try {
        const key = lockoutKey(email);
        const count = await redis.incr(key);
        if (count === 1) {
            await redis.expire(key, LOCKOUT_WINDOW_SECONDS);
        }
    } catch (err) {
        console.error("[rate-limit] lockout record error:", err);
    }
}

/** Clear failed-login state after a successful login. */
export async function clearLoginFailures(email: string): Promise<void> {
    if (!redis) return;
    try {
        await redis.del(lockoutKey(email));
    } catch (err) {
        console.error("[rate-limit] lockout clear error:", err);
    }
}

/** Build a standard 429 JSON Response with a Retry-After header. */
export function tooManyRequests(result: RateLimitResult): Response {
    const retryAfter = result.retryAfter || 60;
    return new Response(
        JSON.stringify({
            error: "Too many requests. Please slow down and try again shortly.",
            retryAfter,
        }),
        {
            status: 429,
            headers: {
                "Content-Type": "application/json",
                "Retry-After": String(retryAfter),
                "RateLimit-Limit": String(result.limit),
                "RateLimit-Remaining": String(result.remaining),
                "RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
            },
        },
    );
}
