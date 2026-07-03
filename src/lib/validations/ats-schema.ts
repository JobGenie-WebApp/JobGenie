import { z } from "zod";

// Shape returned by Gemini when scoring a résumé against a job description.
// Kept permissive (coerce + clamp) because LLM output can vary slightly; the
// service layer clamps values to the 0–100 range before persisting.

const scoreField = z.coerce.number().min(0).max(100);

export const atsScoreResultSchema = z.object({
    score: scoreField,
    breakdown: z
        .object({
            skills: scoreField.optional(),
            experience: scoreField.optional(),
            education: scoreField.optional(),
            keywords: scoreField.optional(),
        })
        .partial()
        .optional(),
    matchedKeywords: z.array(z.string()).default([]),
    missingKeywords: z.array(z.string()).default([]),
    summary: z.string().optional(),
});

export type AtsScoreResult = z.infer<typeof atsScoreResultSchema>;
