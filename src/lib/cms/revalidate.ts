import 'server-only';

import { revalidatePath, revalidateTag } from 'next/cache';

import { CMS_PAGES_TAG } from './pages';
import { SITE_CONTENT_TAG } from './site-content';

/**
 * Make published content visible.
 *
 * The tags drop the cached DB reads; `revalidatePath('/', 'layout')` drops the
 * prerendered route shells that embedded the old text. Both are needed — a tag
 * alone leaves statically rendered pages serving stale HTML.
 *
 * Broad on purpose: the header and footer appear on every public page, and
 * publishing is a rare, deliberate admin action.
 */
export function revalidateSite() {
    revalidateTag(SITE_CONTENT_TAG, 'max');
    revalidateTag(CMS_PAGES_TAG, 'max');
    revalidatePath('/', 'layout');
}
