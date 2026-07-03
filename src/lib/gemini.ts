import { GoogleGenAI } from "@google/genai";

// Shared Gemini client + retry helpers, reused by CV extraction (extract-cv.ts)
// and ATS scoring (ats-score.ts).

export const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_MAX_RETRIES = 4;
const GEMINI_BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetryableGeminiError(error: unknown): boolean {
    if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status?: number }).status;
        if (status === 503 || status === 429) return true;
    }
    const msg = error instanceof Error ? error.message : String(error);
    return (
        msg.includes('"code":503') ||
        msg.includes('"code":429') ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("Too Many Requests")
    );
}

export async function generateContentWithRetry(
    contents: Parameters<GoogleGenAI["models"]["generateContent"]>[0]["contents"]
): Promise<Awaited<ReturnType<GoogleGenAI["models"]["generateContent"]>>> {
    let lastError: unknown;
    for (let attempt = 0; attempt < GEMINI_MAX_RETRIES; attempt++) {
        try {
            return await genAI.models.generateContent({
                model: GEMINI_MODEL,
                contents,
            });
        } catch (error) {
            lastError = error;
            if (!isRetryableGeminiError(error) || attempt === GEMINI_MAX_RETRIES - 1) {
                throw error;
            }
            const delay = GEMINI_BASE_DELAY_MS * 2 ** attempt;
            await sleep(delay);
        }
    }
    throw lastError;
}
