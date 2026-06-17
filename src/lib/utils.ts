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
