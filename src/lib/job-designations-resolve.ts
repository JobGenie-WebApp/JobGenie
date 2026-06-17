/**
 * Map candidate profile industry keys (Zod enum) to rows in `public.industries`.
 *
 * Supports multiple naming conventions (see `docs/Industry & Jobs/industries_rows.csv`):
 * - IT: "Information Technology", "IT / Software Development", etc.
 * - Split banking vs finance: "Banking", "Finance & Investment"
 * - Legacy combined row: "Banking & Finance"
 */
function normIndustryName(s: string): string {
    return s.toLowerCase().trim();
}

/** True if this industry row is the IT / software bucket (not banking or finance). */
function isItSoftwareIndustryName(name: string): boolean {
    const n = normIndustryName(name);
    if (n.includes("information technology")) return true;
    if (n.includes("software development")) return true;
    if (n.includes("it /") || n.includes("it/")) return true;
    return false;
}

export function resolveIndustryIdsForProfile(
    profileKey: string,
    industries: { industry_id: number; industry_name: string }[]
): number[] {
    if (!profileKey?.trim() || !industries.length) return [];

    if (profileKey === "it_software") {
        return industries.filter((r) => isItSoftwareIndustryName(r.industry_name)).map((r) => r.industry_id);
    }

    if (profileKey === "banking") {
        return industries
            .filter((r) => {
                const n = normIndustryName(r.industry_name);
                if (isItSoftwareIndustryName(r.industry_name)) return false;
                return n.includes("banking");
            })
            .map((r) => r.industry_id);
    }

    if (profileKey === "finance_investment") {
        return industries
            .filter((r) => {
                const n = normIndustryName(r.industry_name);
                if (isItSoftwareIndustryName(r.industry_name)) return false;
                return n.includes("finance") || n.includes("investment");
            })
            .map((r) => r.industry_id);
    }

    return [];
}
