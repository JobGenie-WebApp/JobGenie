/**
 * In-process TTL memo for reference data (countries, job designations).
 *
 * Server-side mirror of the CDN policy already used by /api/job-designations: keep a
 * populated result for 12h, never keep an empty one. That rule is the important half.
 * These lists are fed into the CV extraction prompt, and every loader here degrades to
 * an empty array when the lookup query fails. Caching one empty result would strip the
 * job titles and countries out of every prompt for the whole TTL — the model would then
 * return null for those fields and the wizard would look like it had simply stopped
 * reading CVs properly. Failures stay uncached and are retried on the next call.
 *
 * Per-process, so each warm serverless instance populates its own copy. No invalidation:
 * a designation added in MIS shows up in extraction within 12h at worst, and immediately
 * in the wizard's own dropdown, which reads the API route rather than this.
 */
const TTL_MS = 12 * 60 * 60 * 1000;

type Entry = { value: unknown[]; expiresAt: number };

const store = new Map<string, Entry>();

export async function cachedList<T>(key: string, load: () => Promise<T[]>): Promise<T[]> {
    const hit = store.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value as T[];

    const value = await load();
    if (value.length > 0) store.set(key, { value, expiresAt: Date.now() + TTL_MS });
    return value;
}
