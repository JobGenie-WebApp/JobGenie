/**
 * The job form autosaves to localStorage on every change - including the one
 * that loads the server copy. So a stored draft exists after the first visit
 * even when nothing was edited, and restoring it blindly pins the form to
 * stale local data forever. A draft only counts when it actually differs
 * from the baseline it was taken against.
 */

/** True when every field matches - i.e. the stored copy is not an unsaved edit. */
export function sameForm<T extends object>(a: T, b: T): boolean {
    const x = a as Record<string, unknown>;
    const y = b as Record<string, unknown>;
    return Object.keys(x).every((k) => x[k] === y[k]);
}

/** Parse a stored draft, discarding anything unusable. */
export function parseDraft<T extends object>(raw: string | null): T | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as T) : null;
    } catch {
        return null;
    }
}

/**
 * Decide what the form should show on load. `baseline` is the server copy in
 * edit mode, or the empty form in create mode.
 */
export function resolveDraft<T extends object>(
    baseline: T,
    raw: string | null
): { form: T; isDraft: boolean } {
    const draft = parseDraft<T>(raw);
    // Missing keys would silently blank fields, so only trust a complete draft.
    const complete = draft !== null && Object.keys(baseline).every((k) => k in draft);
    if (!complete || sameForm(draft, baseline)) return { form: baseline, isDraft: false };
    return { form: draft, isDraft: true };
}
