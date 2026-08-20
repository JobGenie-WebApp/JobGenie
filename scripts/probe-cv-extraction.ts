/**
 * Runs the real CV extraction against a local PDF and prints what the model actually returned,
 * so "descriptions are missing" can be checked against evidence instead of re-tuning the prompt.
 *
 *   npx tsx scripts/probe-cv-extraction.ts ~/Downloads/some-cv.pdf [industry]
 *
 * The package is CJS, so the body lives in main() - tsx cannot transform a top-level await here.
 *
 * Deliberately mirrors extract-cv.ts rather than importing it: that module is "use server" and
 * pulls in Supabase request context. Keep the config block below in step with it. The model and the
 * 503/429 retry policy do come from @/lib/gemini, so the probe cannot drift from production there.
 */
import { existsSync, readFileSync } from "node:fs";
import { config } from "dotenv";
import { z } from "zod";
import { FinishReason, PartMediaResolutionLevel, ThinkingLevel } from "@google/genai";
import { buildCvExtractionPrompt } from "../src/lib/cv-extraction-prompt";
import { cvExtractionResultSchema } from "../src/lib/validations/profile-schema";

config({ path: ".env.local" });

async function main() {
const [file, industry] = process.argv.slice(2);
if (!file) throw new Error("usage: npx tsx scripts/probe-cv-extraction.ts <cv.pdf> [industry]");
if (!existsSync(file)) throw new Error(`no such file: ${file}`);

// Imported here, not at the top: the client in that module reads GEMINI_API_KEY when it is first
// evaluated, and a hoisted import would beat dotenv's config() above to it.
const { generateContentWithRetry } = await import("../src/lib/gemini");

const startedAt = Date.now();
const result = await generateContentWithRetry([{
    role: "user",
    parts: [
        { text: buildCvExtractionPrompt({ designations: [], countries: [] }) },
        {
            inlineData: { mimeType: "application/pdf", data: readFileSync(file).toString("base64") },
            mediaResolution: { level: PartMediaResolutionLevel.MEDIA_RESOLUTION_HIGH },
        },
    ],
}], {
    responseMimeType: "application/json",
    responseJsonSchema: z.toJSONSchema(cvExtractionResultSchema, { io: "output" }),
    temperature: 0,
    maxOutputTokens: 32768,
    thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
});

const finishReason = result.candidates?.[0]?.finishReason;
console.log(`\n${file}${industry ? ` (${industry})` : ""}`);
console.log(`took ${((Date.now() - startedAt) / 1000).toFixed(1)}s  finishReason=${finishReason}`);
console.log("usage:", JSON.stringify(result.usageMetadata));
if (finishReason !== FinishReason.STOP) console.log("!! TRUNCATED - raise maxOutputTokens");

const data = cvExtractionResultSchema.parse(JSON.parse(result.text || ""));

// The whole question is whether descriptions survived, so measure them rather than eyeballing JSON.
console.log(`\nwork experiences: ${data.workExperiences?.length ?? 0}`);
for (const exp of data.workExperiences ?? []) {
    const description = exp.description ?? "";
    const bullets = description.split("\n").filter((l) => l.trim()).length;
    const suspect = description.length < 120 ? "  <-- SUSPICIOUSLY SHORT" : "";
    console.log(`  ${exp.startDate}..${exp.endDate ?? "now"}  ${exp.jobTitle} @ ${exp.company}`);
    console.log(`     description: ${description.length} chars, ${bullets} line(s)${suspect}`);
    if (description) console.log(`     "${description.slice(0, 100).replace(/\n/g, " / ")}..."`);
}

console.log(`\neducations ${data.educations?.length ?? 0} | certificates ${data.certificates?.length ?? 0} | projects ${data.projects?.length ?? 0} | awards ${data.awards?.length ?? 0} | skills ${data.skills?.length ?? 0}`);
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
