import { GoogleGenAI } from "@google/genai";

// Shared Gemini client + retry helpers, reused by CV extraction (extract-cv.ts)
// and ATS scoring (ats-score.ts).

export const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_MAX_RETRIES = 4;
const GEMINI_BASE_DELAY_MS = 1000;
/** Nobody waits out a 37s per-minute cooldown behind a spinner - fail to manual entry instead. */
const GEMINI_MAX_WAIT_MS = 15_000;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorText(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * A free-tier *daily* quota does not come back with backoff - retrying only burns the calls that
 * are left and makes the user wait for four failures instead of one. Fix is billing, not code.
 */
export function isDailyQuotaExhausted(error: unknown): boolean {
    return /PerDay|per day|GenerateRequestsPerDay/.test(errorText(error));
}

/** Gemini says how long to wait on a 429 ("retryDelay":"36s"). Blind backoff retries far too early. */
function serverRetryDelayMs(error: unknown): number | null {
    const match = /"retryDelay":\s*"(\d+(?:\.\d+)?)s"/.exec(errorText(error));
    return match ? Math.ceil(Number(match[1]) * 1000) : null;
}

export function isRetryableGeminiError(error: unknown): boolean {
    if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status?: number }).status;
        if (status === 503 || status === 429) return true;
    }
    const msg = errorText(error);
    return (
        msg.includes('"code":503') ||
        msg.includes('"code":429') ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("Too Many Requests")
    );
}

export async function generateContentWithRetry(
    contents: Parameters<GoogleGenAI["models"]["generateContent"]>[0]["contents"],
    config?: Parameters<GoogleGenAI["models"]["generateContent"]>[0]["config"]
): Promise<Awaited<ReturnType<GoogleGenAI["models"]["generateContent"]>>> {
    let lastError: unknown;
    for (let attempt = 0; attempt < GEMINI_MAX_RETRIES; attempt++) {
        try {
            return await genAI.models.generateContent({
                model: GEMINI_MODEL,
                contents,
                config,
            });
        } catch (error) {
            lastError = error;
            if (!isRetryableGeminiError(error) || isDailyQuotaExhausted(error) || attempt === GEMINI_MAX_RETRIES - 1) {
                throw error;
            }
            // Prefer the server's own retryDelay; give up rather than hold the request open past the cap.
            const delay = serverRetryDelayMs(error) ?? GEMINI_BASE_DELAY_MS * 2 ** attempt;
            if (delay > GEMINI_MAX_WAIT_MS) throw error;
            await sleep(delay);
        }
    }
    throw lastError;
}
