import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatIndustry(industry: string | null | undefined): string {
    if (!industry) return "";

    const industryMap: Record<string, string> = {
        "finance_investment": "Finance Industry",
        "banking": "Banking Industry",
        "it_software": "Information Technology Industry",
    };

    if (industryMap[industry]) {
        return industryMap[industry];
    }

    // Fallback: capitalize each word and replace underscores with spaces
    return industry
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}
/**
 * Turns a stored enum value into something a person can read: "open_to_opportunities" ->
 * "Open To Opportunities", "1_month" -> "1 Month". Screens must never print the raw value.
 */
export function formatLabel(value: string | null | undefined, fallback = ""): string {
    if (!value) return fallback;
    return value
        .split(/[_\s]+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export function getEducationWeight(educationName: string | null | undefined): number {
    if (!educationName) return 99;

    const name = educationName.toLowerCase();

    if (name.includes('phd') || name.includes('ph.d') || name.includes('doctorate') || name.includes('doctor ')) {
        return 1;
    }
    if (name.includes('master') || name.includes('msc') || name.includes('m.sc') || name.includes('mba') || name.includes('m.a') || name.includes('ma ') || name.includes('m.b.a')) {
        return 2;
    }
    if (name.includes('post graduate') || name.includes('postgraduate') || name.includes('pgd')) {
        return 3;
    }
    if (name.includes('bachelor') || name.includes('bsc') || name.includes('b.sc') || name.includes('b.a') || name.includes('ba ') || name.includes('beng') || name.includes('b.eng') || name.includes('degree') || name.includes('undergraduate')) {
        return 4;
    }
    if (name.includes('advanced diploma') || name.includes('adv diploma') || name.includes('adv. diploma') || name.includes('higher national diploma') || name.includes('hnd')) {
        return 5;
    }
    if (name.includes('diploma') || name.includes('nd ')) {
        return 6;
    }
    if (name.includes('certificate') || name.includes('cert') || name.includes('certification') || name.includes('cpa') || name.includes('acca') || name.includes('cima') || name.includes('cfa')) {
        return 7;
    }
    if (name.includes('a/l') || name.includes('a level') || name.includes('advanced level')) {
        return 8;
    }
    if (name.includes('o/l') || name.includes('o level') || name.includes('ordinary level')) {
        return 9;
    }

    return 10;
}

export function sortEducations<T extends { degree_diploma?: string | null, professional_qualification?: string | null, certificate_name?: string | null }>(educations: T[]): T[] {
    if (!educations) return [];

    return [...educations].sort((a, b) => {
        const nameA = a.degree_diploma || a.professional_qualification || a.certificate_name || "";
        const nameB = b.degree_diploma || b.professional_qualification || b.certificate_name || "";

        return getEducationWeight(nameA) - getEducationWeight(nameB);
    });
}

export function formatPhoneNumber(phone: string | null | undefined): string {
    if (!phone) return "";

    // Remove all whitespace and dashes first to get the clean number
    const cleaned = phone.replace(/[\s-]/g, "");

    // If it's a valid +94 number, format it as +94 xx xxx xxxx
    if (/^\+94\d{9}$/.test(cleaned)) {
        return `+94 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    }

    // Return the cleaned string if it doesn't match the expected length/format
    return cleaned;
}

/**
 * Build a framable Google Maps URL for a company/venue location.
 *
 * `map_link` holds whatever the employer pasted, which has included plain
 * website URLs — those used to be dropped straight into an iframe, so the
 * "Location" box rendered someone's marketing site instead of a map. Google also
 * refuses to be framed on its normal /maps UI, so a share link never works
 * either. We therefore only ever return a maps embed: the stored link is used
 * when it is already embeddable or carries a place/coordinates, and otherwise
 * the map is derived from the postal address. Returns null when neither works.
 */
export function toMapEmbedUrl(
    mapLink: string | null | undefined,
    address?: string | null,
): string | null {
    const embed = (q: string) =>
        `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
    const link = mapLink?.trim();

    // Already the /maps/embed URL Google hands out under "Embed a map".
    if (link && /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(link)) return link;

    if (link && /^https:\/\/([a-z0-9-]+\.)*google\.[a-z.]+\//i.test(link)) {
        // .../@6.9271,79.8612,15z/... — coordinates are the most precise signal.
        const coords = link.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
        if (coords) return embed(`${coords[1]},${coords[2]}`);

        const place = link.match(/\/maps\/place\/([^/?#]+)/i);
        if (place) return embed(decodeURIComponent(place[1]).replace(/\+/g, " "));
    }

    const fallback = address?.trim();
    return fallback ? embed(fallback) : null;
}

/** The "View larger map" target: the employer's own link when it points at a
 *  map, otherwise a Google Maps search for the address. */
export function toMapViewUrl(
    mapLink: string | null | undefined,
    address?: string | null,
): string | null {
    const link = mapLink?.trim();
    if (link && /^https:\/\/([a-z0-9-]+\.)*(google\.[a-z.]+|goo\.gl)\//i.test(link)) return link;

    const fallback = address?.trim();
    return fallback
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallback)}`
        : null;
}
