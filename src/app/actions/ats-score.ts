"use server";

import { generateContentWithRetry, isRetryableGeminiError } from "@/lib/gemini";
import { atsScoreResultSchema, type AtsScoreResult } from "@/lib/validations/ats-schema";
import { logError } from "@/lib/logger";

export type AtsScoreState = {
    success: boolean;
    score?: number; // 0–100
    breakdown?: { skills?: number; experience?: number; education?: number; keywords?: number };
    matchedKeywords?: string[];
    missingKeywords?: string[];
    error?: string;
};

// Gemini reliably understands PDFs and images inline; other document types are
// not parsed well, so we only send those two.
const GEMINI_SUPPORTED_MIME = new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
]);

/**
 * Download a résumé from its public Supabase Storage URL and return it as base64
 * plus its MIME type. Returns null when the file can't be fetched or isn't a type
 * Gemini can read (e.g. .doc/.docx).
 */
export async function fetchResumeAsBase64(
    url: string
): Promise<{ base64: string; mimeType: string } | null> {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;

        let mimeType = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
        // Fall back to the URL extension when the server doesn't send a useful type.
        if (!GEMINI_SUPPORTED_MIME.has(mimeType)) {
            const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
            if (ext === "pdf") mimeType = "application/pdf";
            else if (ext === "png") mimeType = "image/png";
            else if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
            else if (ext === "webp") mimeType = "image/webp";
        }
        if (!GEMINI_SUPPORTED_MIME.has(mimeType)) return null;

        const buffer = Buffer.from(await res.arrayBuffer());
        return { base64: buffer.toString("base64"), mimeType };
    } catch {
        return null;
    }
}

const ATS_PROMPT = `You are an Applicant Tracking System (ATS). Compare the attached résumé against the job below and score how well the candidate matches.

Return ONLY a valid JSON object (no markdown, no code fences) with this exact shape:
{
  "score": number,          // overall match 0-100 (integer)
  "breakdown": {
    "skills": number,       // 0-100 skill match
    "experience": number,   // 0-100 relevant experience match
    "education": number,    // 0-100 education/qualification fit
    "keywords": number      // 0-100 coverage of important job keywords
  },
  "matchedKeywords": string[],  // important job keywords/skills found in the résumé
  "missingKeywords": string[]   // important job keywords/skills the job wants but the résumé lacks
}

Scoring guidance:
- Weight skills and relevant experience most heavily, then keyword coverage, then education.
- Be objective and consistent. A strong, directly relevant candidate scores 80-100; a partial match 50-79; a weak/unrelated candidate below 50.
- Only include genuinely important keywords (technologies, tools, domain skills, certifications), max 15 each list.

JOB TITLE: {{JOB_TITLE}}
DESIRED EXPERIENCE LEVEL: {{EXPERIENCE_LEVEL}}

JOB DESCRIPTION:
{{JOB_DESCRIPTION}}
`;

function clampScore(n: number | undefined): number | undefined {
    if (typeof n !== "number" || Number.isNaN(n)) return undefined;
    return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Score a résumé PDF against a job description using Gemini. Never throws —
 * always resolves to an AtsScoreState so callers can treat failure gracefully.
 */
export async function computeAtsScore(input: {
    jobTitle: string;
    jobDescription: string;
    experienceLevel?: string | null;
    resumeBase64: string;
    mimeType: string;
}): Promise<AtsScoreState> {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return { success: false, error: "GEMINI_API_KEY not configured" };
        }
        if (!input.jobDescription?.trim()) {
            return { success: false, error: "Job description is empty" };
        }

        const prompt = ATS_PROMPT.replace("{{JOB_TITLE}}", input.jobTitle || "N/A")
            .replace("{{EXPERIENCE_LEVEL}}", input.experienceLevel || "Not specified")
            .replace("{{JOB_DESCRIPTION}}", input.jobDescription.slice(0, 12000));

        const parts = [
            { inlineData: { mimeType: input.mimeType, data: input.resumeBase64 } },
            { text: prompt },
        ];

        const result = await generateContentWithRetry([
            { role: "user", parts: parts as { text: string }[] },
        ]);

        const cleaned = (result.text || "")
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        let parsed: unknown;
        try {
            parsed = JSON.parse(cleaned);
        } catch {
            return { success: false, error: "Invalid JSON response from Gemini" };
        }

        const validated = atsScoreResultSchema.safeParse(parsed);
        if (!validated.success) {
            return { success: false, error: "Gemini response failed validation" };
        }

        const data: AtsScoreResult = validated.data;
        return {
            success: true,
            score: clampScore(data.score),
            breakdown: data.breakdown
                ? {
                      skills: clampScore(data.breakdown.skills),
                      experience: clampScore(data.breakdown.experience),
                      education: clampScore(data.breakdown.education),
                      keywords: clampScore(data.breakdown.keywords),
                  }
                : undefined,
            matchedKeywords: data.matchedKeywords.slice(0, 15),
            missingKeywords: data.missingKeywords.slice(0, 15),
        };
    } catch (error) {
        await logError({
            source: "ats-score.ts:computeAtsScore",
            errorType: "AtsScoreError",
            message: error instanceof Error ? error.message : String(error),
        });
        const busy = isRetryableGeminiError(error);
        return {
            success: false,
            error: busy ? "AI service busy" : error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// Columns written to job_applications after a scoring attempt.
export type AtsUpdate = {
    ats_score: number | null;
    ats_status: "scored" | "failed";
    ats_breakdown: AtsScoreState["breakdown"] | null;
    ats_matched_keywords: string[];
    ats_missing_keywords: string[];
    ats_scored_at: string | null;
    ats_error: string | null;
};

/**
 * Resolve a résumé, score it against a job, and produce the exact column payload
 * to persist on the job_applications row. Shared by the apply flow and the
 * employer "Check again" endpoint. Never throws.
 */
export async function buildAtsUpdate(params: {
    jobTitle: string;
    jobDescription: string | null | undefined;
    experienceLevel?: string | null;
    resumeUrl: string | null | undefined;
}): Promise<AtsUpdate> {
    const failed = (reason: string): AtsUpdate => ({
        ats_score: null,
        ats_status: "failed",
        ats_breakdown: null,
        ats_matched_keywords: [],
        ats_missing_keywords: [],
        ats_scored_at: null,
        ats_error: reason,
    });

    try {
        if (!params.resumeUrl) return failed("No résumé available to score");
        if (!params.jobDescription?.trim()) return failed("Job description is empty");

        const file = await fetchResumeAsBase64(params.resumeUrl);
        if (!file) return failed("Could not read résumé file (unsupported type or fetch failed)");

        const result = await computeAtsScore({
            jobTitle: params.jobTitle,
            jobDescription: params.jobDescription,
            experienceLevel: params.experienceLevel,
            resumeBase64: file.base64,
            mimeType: file.mimeType,
        });

        if (!result.success || typeof result.score !== "number") {
            return failed(result.error || "Scoring failed");
        }

        return {
            ats_score: result.score,
            ats_status: "scored",
            ats_breakdown: result.breakdown ?? null,
            ats_matched_keywords: result.matchedKeywords ?? [],
            ats_missing_keywords: result.missingKeywords ?? [],
            ats_scored_at: new Date().toISOString(),
            ats_error: null,
        };
    } catch (error) {
        return failed(error instanceof Error ? error.message : "Unexpected scoring error");
    }
}
