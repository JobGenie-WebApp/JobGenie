import { describe, expect, it } from "vitest";
import { isDailyQuotaExhausted, isRetryableGeminiError } from "./gemini";

// Real payloads seen in error_logs for extract-cv.ts.
const DAILY_QUOTA = new Error(
    '{"error":{"code":429,"message":"You exceeded your current quota... * Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.7-flash","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"36s"}]}}'
);
const OVERLOADED = new Error(
    '{"error":{"code":503,"message":"This model is currently experiencing high demand.","status":"UNAVAILABLE"}}'
);

describe("gemini error classification", () => {
    it("treats both overload and quota errors as retryable-shaped", () => {
        expect(isRetryableGeminiError(OVERLOADED)).toBe(true);
        expect(isRetryableGeminiError(DAILY_QUOTA)).toBe(true);
    });

    it("singles out the daily quota, which no amount of backoff recovers", () => {
        expect(isDailyQuotaExhausted(DAILY_QUOTA)).toBe(true);
        expect(isDailyQuotaExhausted(OVERLOADED)).toBe(false);
        expect(isDailyQuotaExhausted(new Error("network timeout"))).toBe(false);
    });
});
