/**
 * Dot-path helpers shared by the content merge (src/lib/cms/site-content.ts)
 * and the seed script (scripts/seed-cms.ts).
 *
 * A path addresses one string inside the content tree, arrays included:
 *   'hero.title', 'highlights.0.points.2'
 */

type Json = Record<string, unknown> | unknown[];

/** Every string leaf of `obj`, keyed by dot-path. */
export function flattenText(obj: Json, prefix = ''): Record<string, string> {
    const out: Record<string, string> = {};
    const entries = Array.isArray(obj)
        ? obj.map((v, i) => [String(i), v] as const)
        : Object.entries(obj);

    for (const [key, value] of entries) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'string') out[path] = value;
        else if (value && typeof value === 'object') Object.assign(out, flattenText(value as Json, path));
    }
    return out;
}

/**
 * Write `value` at `path`, mutating `target`. Missing intermediate containers
 * are not created — an override for a path the constants don't have is
 * ignored rather than inventing structure the components can't render.
 */
export function setByPath(target: Json, path: string, value: string): void {
    const keys = path.split('.');
    let node: unknown = target;

    for (const key of keys.slice(0, -1)) {
        if (!node || typeof node !== 'object') return;
        node = (node as Record<string, unknown>)[key];
    }

    if (!node || typeof node !== 'object') return;
    const last = keys[keys.length - 1];
    if (!(last in (node as Record<string, unknown>))) return;
    (node as Record<string, unknown>)[last] = value;
}

/**
 * Apply string overrides onto a deep-cloned copy of `base`.
 * Empty and nullish overrides are skipped so the fallback constant always wins
 * over a blank row — this is what makes every CMS field optional.
 */
export function applyOverrides<T extends object>(base: T, overrides: Record<string, string | null>): T {
    const merged = structuredClone(base);
    for (const [path, value] of Object.entries(overrides)) {
        if (value == null || value === '') continue;
        setByPath(merged as Json, path, value);
    }
    return merged;
}
