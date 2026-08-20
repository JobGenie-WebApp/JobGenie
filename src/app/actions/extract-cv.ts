"use server";

import { z } from "zod";
import { FinishReason, PartMediaResolutionLevel, ThinkingLevel } from "@google/genai";
import { cvExtractionResultSchema, type CVExtractionResult } from "@/lib/validations/profile-schema";
import { logError } from "@/lib/logger";
import { generateContentWithRetry, isRetryableGeminiError, isDailyQuotaExhausted } from "@/lib/gemini";
import { buildCvExtractionPrompt } from "@/lib/cv-extraction-prompt";
import { createClient } from "@/lib/supabase/server";
import { getCountryNames } from "@/lib/countries";
import { resolveIndustryIdsForProfile } from "@/lib/job-designations-resolve";

/** PDF is the only format accepted for submission, and the only one the resume storage path takes. */
const PDF_MIME = "application/pdf";

export type CVExtractionState = {
    success: boolean;
    message: string;
    data?: CVExtractionResult;
    error?: string;
};

/**
 * Job titles the wizard will actually offer for this industry. Giving them to the model is what
 * makes `currentPosition` land on a real option instead of free text the Combobox cannot select.
 * Degrades to an empty list - extraction still works, the title is just unconstrained.
 */
async function designationNamesFor(industry: string): Promise<string[]> {
    if (!industry?.trim()) return [];
    try {
        const supabase = await createClient();
        const { data: industries } = await supabase.from("industries").select("industry_id, industry_name");
        const ids = resolveIndustryIdsForProfile(industry, industries ?? []);
        if (!ids.length) return [];

        const { data } = await supabase
            .from("job_designations")
            .select("designation_name")
            .in("industry_id", ids)
            .order("designation_name", { ascending: true });

        return [...new Set((data ?? []).map((d) => d.designation_name).filter(Boolean))];
    } catch (error) {
        console.warn("Could not load job designations for CV extraction:", error);
        return [];
    }
}

export async function extractCVData(
    fileBase64: string,
    mimeType: string,
    industry?: string
): Promise<CVExtractionState> {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return {
                success: false,
                message: "Gemini API key not configured",
                error: "GEMINI_API_KEY not found in environment variables",
            };
        }

        // Reject anything else here too, not just in the UI - this is a server action and is
        // reachable directly, and the resume storage path would refuse a non-PDF at submit anyway.
        if (mimeType !== PDF_MIME) {
            return {
                success: false,
                message: "Please upload your CV as a PDF.",
                error: `Unsupported mimeType ${mimeType}`,
            };
        }

        // In parallel - both are plain reference-table reads, and neither needs the other.
        const [designations, countries] = await Promise.all([
            designationNamesFor(industry ?? ""),
            getCountryNames(),
        ]);
        const prompt = buildCvExtractionPrompt({ designations, countries });

        // Prompt first, PDF second: the static instruction block is then a shared prefix across
        // uploads, which is what implicit context caching can hit. Hand the PDF over as-is -
        // the model reads the page layout and OCRs scanned pages.
        //
        // Every PDF page is tokenised as an image, and at the default resolution the small print in
        // a dense two-column or table CV is not reliably legible - which surfaces as "the
        // description was missing", never as an error. Ask for the highest fidelity per page.
        const parts = [
            { text: prompt },
            {
                inlineData: { mimeType, data: fileBase64 },
                mediaResolution: { level: PartMediaResolutionLevel.MEDIA_RESOLUTION_HIGH },
            },
        ];

        // A response schema is what makes the shape reliable across arbitrary CV layouts:
        // the model cannot invent field names, wrap the JSON in fences, or return prose.
        const startedAt = Date.now();
        const result = await generateContentWithRetry([{ role: "user", parts }], {
            responseMimeType: "application/json",
            responseJsonSchema: z.toJSONSchema(cvExtractionResultSchema, { io: "output" }),
            temperature: 0,
            // A full CV with every bullet of every role runs long. Left unset this sits at the model
            // default, and a cap reached mid-array is silent: constrained decoding still closes the
            // JSON, so a half-read CV comes back looking like a clean extraction.
            maxOutputTokens: 32768,
            // Tying a role's bullets to a heading on the *previous* page is association work, not
            // transcription, and it is the first thing to fail without thinking tokens. This was LOW
            // for latency; completeness wins. Drop it back only if page-spanning CVs stay whole.
            thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
        });
        console.log(
            `[extract-cv] ${Date.now() - startedAt}ms`,
            JSON.stringify(result.usageMetadata ?? {})
        );

        // Anything other than STOP means the model was cut off - most often at the output cap, mid
        // work-experience array. The JSON still parses, so without this a truncated CV is reported
        // to the candidate as a success with several roles quietly missing.
        const finishReason = result.candidates?.[0]?.finishReason;
        if (finishReason && finishReason !== FinishReason.STOP) {
            await logError({
                source: "extract-cv.ts:extractCVData",
                errorType: "CVExtractionIncomplete",
                message: `Generation stopped with finishReason=${finishReason}`,
            });
            return {
                success: false,
                message: "Your CV could not be read all the way through. Please try again, or enter your details manually.",
                error: `finishReason=${finishReason}`,
            };
        }

        let parsedData: unknown;
        try {
            parsedData = JSON.parse(result.text || "");
        } catch (parseError) {
            console.error("JSON parse error:", parseError, result.text);
            return {
                success: false,
                message: "Failed to parse extracted data. Please try again or enter manually.",
                error: "Invalid JSON response from Gemini",
            };
        }

        // Validate with Zod schema
        const validationResult = cvExtractionResultSchema.safeParse(parsedData);

        if (!validationResult.success) {
            console.error("Validation errors:", validationResult.error);
            // Return partial data even if validation fails
            return {
                success: true,
                message: "Extracted data (some fields may be incomplete)",
                data: parsedData as CVExtractionResult,
            };
        }

        return {
            success: true,
            message: "CV data extracted successfully!",
            data: validationResult.data,
        };
    } catch (error) {
        console.error("CV extraction error:", error);
        await logError({ source: "extract-cv.ts:extractCVData", errorType: "CVExtractionError", message: error instanceof Error ? error.message : String(error) });
        const isOverload =
            isRetryableGeminiError(error) ||
            (error instanceof Error && error.message.includes("high demand"));
        // Retrying a spent daily quota cannot succeed, so do not invite the candidate to try again.
        const message = isDailyQuotaExhausted(error)
            ? "Automatic CV reading is unavailable at the moment. Please enter your details manually - it only takes a few minutes."
            : isOverload
              ? "The AI service is busy right now. Please wait a moment and try again, or enter your details manually."
              : "Failed to extract CV data. Please try again or enter manually.";
        return {
            success: false,
            message,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

export async function generateProfessionalSummary(
    workExperiences: { jobTitle?: string; company?: string; description?: string }[],
    skills: string[],
    currentPosition: string,
    yearsOfExperience: number,
    industry: string
): Promise<{ success: boolean; summary?: string; error?: string }> {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return {
                success: false,
                error: "Gemini API key not configured",
            };
        }

        const experienceText = workExperiences
            .slice(0, 3)
            .map((exp) => `${exp.jobTitle} at ${exp.company}: ${exp.description || ""}`)
            .join("\n");

        const prompt = `Generate a professional summary for a job candidate with the following profile. 
The summary should be 50-150 words, written in first person, highlighting key strengths and experience.

Industry: ${industry}
Current Position: ${currentPosition}
Years of Experience: ${yearsOfExperience}
Key Skills: ${skills.slice(0, 10).join(", ")}
Recent Experience:
${experienceText}

Write a compelling professional summary that would be suitable for a CV/resume. Return ONLY the summary text, no quotes or formatting.`;

        const result = await generateContentWithRetry([{ role: "user", parts: [{ text: prompt }] }]);
        const summary = result.text?.trim() || "";

        return {
            success: true,
            summary,
        };
    } catch (error) {
        console.error("Summary generation error:", error);
        await logError({ source: "extract-cv.ts:generateProfessionalSummary", errorType: "SummaryGenerationError", message: error instanceof Error ? error.message : String(error) });
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
