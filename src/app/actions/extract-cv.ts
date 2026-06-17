"use server";

import { GoogleGenAI } from "@google/genai";
import { cvExtractionResultSchema, type CVExtractionResult } from "@/lib/validations/profile-schema";
import { logActivity, logError } from "@/lib/logger";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_MAX_RETRIES = 4;
const GEMINI_BASE_DELAY_MS = 1000;

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiError(error: unknown): boolean {
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

async function generateContentWithRetry(
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

export type CVExtractionState = {
    success: boolean;
    message: string;
    data?: CVExtractionResult;
    error?: string;
};

const EXTRACTION_PROMPT = `You are an expert CV/Resume parser. Extract the following information from the provided CV/resume content and return it as a JSON object.

IMPORTANT: 
- Return ONLY valid JSON, no markdown formatting or code blocks
- For dates, use format "YYYY-MM-DD" or "YYYY-MM" if day is not available
- For work experience startDate and endDate ONLY, use "YYYY-MM" (year and month, e.g. 2024-09) so they match month-only fields; never include a day component for those two fields
- If information is not found, omit the field or use null
- For isCurrent in work experience, set to true if it says "Present" or "Current" in end date

Extract this structure:
{
    "firstName": "string",
    "lastName": "string", 
    "email": "string",
    "phone": "string",
    "address": "string",
    "currentPosition": "string (most recent job title)",
    "yearsOfExperience": number,
    "professionalSummary": "string (extract or generate from CV content, 50-200 words)",
    "workExperiences": [
        {
            "jobTitle": "string",
            "company": "string",
            "startDate": "YYYY-MM",
            "endDate": "YYYY-MM or null if current",
            "description": "string",
            "isCurrent": boolean
        }
    ],
    "educations": [
        {
            "educationType": "academic or professional",
            "degreeDiploma": "string (for academic qualifications like BSc, MSc, etc., use null if professional)",
            "professionalQualification": "string (for professional qualifications like ACCA, CIMA, etc., use null if academic)",
            "institution": "string",
            "status": "complete or incomplete"
        }
    ],
    "skills": ["string array of skills"],
    "certificates": [
        {
            "certificateName": "string",
            "issuingAuthority": "string",
            "issueDate": "YYYY-MM-DD"
        }
    ],
    "projects": [
        {
            "projectName": "string",
            "description": "string",
            "demoUrl": "string or null"
        }
    ],
    "awards": [
        {
            "awardName": "string (award or achievement name)",
            "offeredBy": "string (organization or institution that gave the award)",
            "description": "string (brief description of the achievement)"
        }
    ]
}

CV Content:
`;

export async function extractCVData(
    fileBase64: string,
    mimeType: string
): Promise<CVExtractionState> {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return {
                success: false,
                message: "Gemini API key not configured",
                error: "GEMINI_API_KEY not found in environment variables",
            };
        }

        // Prepare the content based on file type
        const parts = [];

        if (mimeType === "application/pdf" || mimeType.includes("image")) {
            // For PDF and images, use inline data
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: fileBase64,
                },
            });
            parts.push({ text: EXTRACTION_PROMPT + "\n[File content provided above]" });
        } else {
            // For text-based documents, decode and include as text
            const textContent = Buffer.from(fileBase64, "base64").toString("utf-8");
            parts.push({ text: EXTRACTION_PROMPT + textContent });
        }

        const result = await generateContentWithRetry([{ role: "user", parts: parts as { text: string }[] }]);
        const text = result.text || "";

        // Clean the response (remove markdown code blocks if present)
        const cleanedText = text
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        // Parse JSON
        let parsedData: unknown;
        try {
            parsedData = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            console.error("Raw text:", cleanedText);
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
        return {
            success: false,
            message: isOverload
                ? "The AI service is busy right now. Please wait a moment and try again, or enter your details manually."
                : "Failed to extract CV data. Please try again or enter manually.",
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
