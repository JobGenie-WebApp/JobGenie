import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

/** True when anything is staged but not yet published. Drives the editor's status line. */
export async function hasPendingChanges(): Promise<boolean> {
    const supabase = createAdminClient();

    const [texts, nav, pages] = await Promise.all([
        supabase.from('cms_texts').select('id', { count: 'exact', head: true }).not('draft_value', 'is', null),
        supabase
            .from('cms_nav_items')
            .select('id', { count: 'exact', head: true })
            .or('draft.not.is.null,is_new.eq.true,pending_delete.eq.true'),
        supabase
            .from('cms_pages')
            .select('id', { count: 'exact', head: true })
            .or('draft_title.not.is.null,draft_body.not.is.null'),
    ]);

    return [texts.count, nav.count, pages.count].some((count) => (count ?? 0) > 0);
}
