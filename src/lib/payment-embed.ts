// PostgREST returns a nested embed as either an object or a single-element
// array depending on how it resolves the relationship — `job_offer` under a
// payment request's invitation comes back as an array. Flatten it once here so
// every client renders `job_offer.job_title` instead of silently showing blanks.

export function one<T>(v: T | T[] | null | undefined): T | null {
    if (Array.isArray(v)) return v[0] ?? null;
    return v ?? null;
}

interface InvitationEmbed {
    id: string;
    job_id?: string | null;
    candidate?: unknown;
    job_offer?: unknown;
}

/** Normalise the `reference_invitation` embed on a payment request row. */
export function flattenInvitationEmbed<T extends { reference_invitation?: unknown }>(row: T): T {
    const invitation = one(row.reference_invitation as InvitationEmbed | InvitationEmbed[] | null);
    if (!invitation) return { ...row, reference_invitation: null };

    return {
        ...row,
        reference_invitation: {
            ...invitation,
            candidate: one(invitation.candidate as Record<string, unknown> | Record<string, unknown>[] | null),
            job_offer: one(invitation.job_offer as Record<string, unknown> | Record<string, unknown>[] | null),
        },
    };
}
