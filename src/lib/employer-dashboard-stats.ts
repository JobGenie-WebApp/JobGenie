/** Pure counting rules behind the employer dashboard cards, kept out of the
 *  'use server' module so they can be tested without a database. */

/** Published postings whose deadline falls inside the next `windowMs`. Already-lapsed
 *  postings are excluded — they are not "expiring soon", they are gone. */
export function countExpiringSoon(
    jobs: { status?: unknown; expires_at?: unknown }[],
    now = Date.now(),
    windowMs = 7 * 864e5,
): number {
    return jobs.filter((j) => {
        if (j.status !== 'published' || !j.expires_at) return false;
        const at = Date.parse(j.expires_at as string);
        return at >= now && at <= now + windowMs;
    }).length;
}

/** Hires, counted once. Accepting an offer marks both the invitation and the application
 *  it came from as hired, so applications already represented by a hired invitation are
 *  dropped instead of counted a second time. */
export function countHires(
    invitations: { pipeline_status?: string | null; application_id?: string | null }[],
    applications: { id?: unknown; status?: unknown }[],
): number {
    const hiredInvitations = invitations.filter((i) => i.pipeline_status === 'hired');
    const viaInvitation = new Set(hiredInvitations.map((i) => i.application_id).filter(Boolean));
    return (
        hiredInvitations.length +
        applications.filter((a) => a.status === 'hired' && !viaInvitation.has(a.id as string)).length
    );
}

/** A posting is live only while it is published and its deadline has not passed.
 *  Nothing flips `published` -> `expired` in the database, so every reader has to
 *  apply the deadline itself — the candidate job board already does. */
export function isLive(job: { status?: unknown; expires_at?: unknown }, now = Date.now()): boolean {
    if (job.status !== 'published') return false;
    if (!job.expires_at) return true;
    return Date.parse(job.expires_at as string) > now;
}
