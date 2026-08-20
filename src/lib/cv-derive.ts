import type { CVExtractionResult } from "@/lib/validations/profile-schema";

/** Structural on purpose - the same maths runs over CV-extracted roles and the wizard's own edited ones. */
type DatedRole = { startDate?: string | null; endDate?: string | null; isCurrent?: boolean | null };
type ExtractedExperiences = NonNullable<CVExtractionResult["workExperiences"]>;

/** Gemini may return YYYY-MM-DD; <input type="month"> only accepts YYYY-MM. */
export function cvExtractedDateToMonthValue(value: string | null | undefined): string {
    if (!value) return "";
    const m = String(value).trim().match(/^(\d{4})-(\d{2})(?:-\d{2})?/);
    return m ? `${m[1]}-${m[2]}` : "";
}

/** Most CVs never print a "current position" line, so the model often returns null for it. */
export function latestJobTitle(exps: ExtractedExperiences): string {
    const current = exps.find((e) => e.isCurrent && e.jobTitle);
    if (current?.jobTitle) return current.jobTitle;
    return [...exps]
        .sort((a, b) => (b.endDate || b.startDate || "").localeCompare(a.endDate || a.startDate || ""))
        .find((e) => e.jobTitle)?.jobTitle || "";
}

/** Same for total years of experience - it has to be summed from the work history. */
// ponytail: sums every role, so concurrent jobs double-count. Merge overlapping ranges if that shows up in real CVs.
export function totalYearsOfExperience(exps: readonly DatedRole[], now: Date = new Date()): number {
    const months = exps.reduce((sum, e) => {
        const start = cvExtractedDateToMonthValue(e.startDate);
        if (!start) return sum;
        const end = e.isCurrent ? "" : cvExtractedDateToMonthValue(e.endDate);
        const [sy, sm] = start.split("-").map(Number);
        const [ey, em] = end
            ? end.split("-").map(Number)
            : [now.getFullYear(), now.getMonth() + 1];
        return sum + Math.max(0, (ey - sy) * 12 + (em - sm));
    }, 0);
    return Math.round(months / 12);
}

/**
 * Certificate dates land in a Postgres `date` column, but a CV often gives only "2022" or
 * "March 2024", so the model returns a partial date. Pad it out rather than trusting it.
 */
export function toIsoDate(value: string | null | undefined): string {
    const m = String(value ?? "").trim().match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/);
    return m ? `${m[1]}-${m[2] ?? "01"}-${m[3] ?? "01"}` : "";
}

/**
 * CVs write Sri Lankan numbers as 0771234567, 077 123 4567, 94771234567 or +94 77 123 4567,
 * but basicInfoSchema only accepts +94XXXXXXXXX. Anything we cannot map confidently (a foreign
 * number, a truncated one) returns "" so the candidate fills it in rather than failing validation.
 */
export function normalizeLkPhone(value: string | null | undefined): string {
    const digits = String(value ?? "").replace(/[^\d+]/g, "");
    const local = digits
        .replace(/^\+94/, "")
        .replace(/^94(?=\d{9}$)/, "")
        .replace(/^0(?=\d{9}$)/, "");
    return /^\d{9}$/.test(local) ? `+94${local}` : "";
}

/**
 * The wizard defaults every candidate to "entry", which is wrong for anyone with a real history.
 * Years of experience is the only signal a CV reliably gives for this.
 */
// ponytail: fixed bands. If the business defines levels differently, this is the one place to change.
export function experienceLevelFromYears(years: number): "entry" | "junior" | "mid" | "senior" | "lead" | "principal" {
    if (years >= 16) return "principal";
    if (years >= 11) return "lead";
    if (years >= 7) return "senior";
    if (years >= 4) return "mid";
    if (years >= 2) return "junior";
    return "entry";
}

/**
 * The model is given the exact allowed values for each dropdown, but a response schema cannot
 * pin a string to an enum - so anything it returns is checked against the real list before use.
 */
export function pickOption<T extends string>(
    value: string | null | undefined,
    allowed: readonly T[],
    fallback: T
): T {
    const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
    const target = norm(String(value ?? ""));
    return allowed.find((o) => norm(o) === target) ?? fallback;
}

/** Same idea for free-text lists (countries, designations) where there is no sensible fallback. */
export function matchFromList(value: string | null | undefined, list: readonly string[]): string {
    const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
    const target = norm(String(value ?? ""));
    if (!target) return "";
    return list.find((o) => norm(o) === target) ?? "";
}
