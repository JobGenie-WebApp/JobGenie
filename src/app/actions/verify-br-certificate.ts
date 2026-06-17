"use server";

import { GoogleGenAI } from "@google/genai";
import { brVerificationResultSchema, type BRVerificationResult } from "@/lib/validations/employer-schema";
import { logError } from "@/lib/logger";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export type BRVerificationState = {
    success: boolean;
    message: string;
    data?: BRVerificationResult;
    error?: string;
};

const VERIFICATION_PROMPT = `You are an expert document verification system analyzing a Business Registration (BR) certificate. 

Extract the following information from the provided Business Registration certificate and return it as a JSON object:

IMPORTANT:
- Return ONLY valid JSON, no markdown formatting or code blocks
- Extract the company/business name EXACTLY as shown on the certificate
- Extract the registration number/BR number EXACTLY as shown (including prefix like PV, PB, GR, HP and numbers)
- The BR number format should be: PREFIX + SPACE + NUMBERS (e.g., "PV 12345678" or "PB 12345678")
- Common prefixes: PV (Private Limited Company), PB (Public Limited Company), GR (Guarantee Company), HP (Hybrid/Other types)
- If information is not clearly visible or found, use null for that field
- Preserve the spacing and format of the registration number as it appears on the certificate

Extract this structure:
{
    "companyName": "string (exact company name from certificate)",
    "registrationNumber": "string (exact BR/registration number from certificate with prefix)",
    "extractedText": "string (any other relevant text found on the document for context)"
}

Certificate image/document is provided below. Analyze it carefully and extract the required information.
`;

export async function verifyBRCertificate(
    fileBase64: string,
    mimeType: string,
    userProvidedCompanyName: string,
    userProvidedRegNumber: string
): Promise<BRVerificationState> {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return {
                success: false,
                message: "AI verification service not configured",
                error: "GEMINI_API_KEY not found in environment variables",
            };
        }

        // Prepare the content for Gemini
        const parts = [];

        if (mimeType === "application/pdf" || mimeType.includes("image")) {
            // For PDF and images, use inline data
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: fileBase64,
                },
            });
            parts.push({ text: VERIFICATION_PROMPT });
        } else {
            return {
                success: false,
                message: "Invalid file format. Please upload a PDF or image file.",
                error: "Unsupported file type",
            };
        }

        // Call Gemini AI to extract data from certificate
        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: parts as { text: string }[] }],
        });
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
                message: "Failed to analyze certificate. The document may be unclear or in an unsupported format.",
                error: "Invalid JSON response from AI",
            };
        }

        // Extract the data
        const extractedData = parsedData as { companyName?: string; registrationNumber?: string; extractedText?: string };

        // Normalize strings for comparison (trim, lowercase, remove extra spaces)
        const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, " ");

        // Normalize BR number for comparison (remove spaces, convert to uppercase)
        const normalizeBRNumber = (str: string) => str.trim().toUpperCase().replace(/\s+/g, "");

        const extractedCompanyName = extractedData.companyName || "";
        const extractedRegNumber = extractedData.registrationNumber || "";

        const companyNameMatch =
            extractedCompanyName &&
            normalize(extractedCompanyName) === normalize(userProvidedCompanyName);

        const regNumberMatch =
            extractedRegNumber &&
            normalizeBRNumber(extractedRegNumber) === normalizeBRNumber(userProvidedRegNumber);

        // Determine match status and confidence
        let matchesInput = false;
        let confidence: "high" | "medium" | "low" = "low";

        if (companyNameMatch && regNumberMatch) {
            matchesInput = true;
            confidence = "high";
        } else if (companyNameMatch || regNumberMatch) {
            matchesInput = false;
            confidence = "medium";
        } else {
            matchesInput = false;
            confidence = "low";
        }

        const verificationResult: BRVerificationResult = {
            companyName: extractedData.companyName,
            registrationNumber: extractedData.registrationNumber,
            matchesInput,
            confidence,
            extractedText: extractedData.extractedText,
        };

        // Validate with Zod schema
        const validationResult = brVerificationResultSchema.safeParse(verificationResult);

        if (!validationResult.success) {
            console.error("Validation errors:", validationResult.error);
            return {
                success: false,
                message: "Failed to validate extracted data",
                error: "Schema validation failed",
            };
        }

        if (matchesInput) {
            return {
                success: true,
                message: "Certificate verified successfully! Company details match the provided information.",
                data: validationResult.data,
            };
        } else {
            // Build specific error messages for each mismatch
            const errors: string[] = [];
            
            if (!companyNameMatch) {
                errors.push(`❌ Company Name Mismatch:\n   • You entered: "${userProvidedCompanyName}"\n   • Certificate shows: "${extractedCompanyName || 'Not found'}"`);
            }
            
            if (!regNumberMatch) {
                errors.push(`❌ Business Registration Number Mismatch:\n   • You entered: "${userProvidedRegNumber}"\n   • Certificate shows: "${extractedRegNumber || 'Not found'}"`);
            }

            const errorMessage = `Certificate verification failed:\n\n${errors.join('\n\n')}\n\nPlease check your inputs and ensure they exactly match the information on your BR certificate.`;

            return {
                success: false,
                message: errorMessage,
                data: validationResult.data,
            };
        }
    } catch (error) {
        console.error("BR verification error:", error);
        await logError({ source: "verify-br-certificate.ts:verifyBRCertificate", errorType: "BRVerificationError", message: error instanceof Error ? error.message : String(error) });
        return {
            success: false,
            message: "Failed to verify certificate. Please try again or contact support.",
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}
