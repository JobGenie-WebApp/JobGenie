import { NextResponse } from 'next/server';

import { logCmsError, requireContent } from '@/lib/cms/guard';
import { revalidateSite } from '@/lib/cms/revalidate';
import { logAudit } from '@/lib/logger';
import { getServerSql } from '@/lib/db/server-postgres';

export const dynamic = 'force-dynamic';

/**
 * Promote every pending draft to the live site.
 *
 * Raw SQL rather than PostgREST because these are set-based updates over whole
 * tables — copying a column onto another, and dropping the rows marked for
 * deletion — which PostgREST cannot express.
 */
export async function POST() {
    const { access, denied } = await requireContent('publish');
    if (denied) return denied;

    try {
        const sql = getServerSql();
        if (!sql) throw new Error('DATABASE_URL is not configured');
        await sql.begin(async (tx) => {
            await tx`
                UPDATE cms_texts
                   SET value = draft_value, draft_value = NULL, updated_at = now()
                 WHERE draft_value IS NOT NULL
            `;
            await tx`DELETE FROM cms_nav_items WHERE pending_delete = true`;
            await tx`
                UPDATE cms_nav_items
                   SET label      = COALESCE(draft->>'label', label),
                       href       = COALESCE(draft->>'href', href),
                       sort_order = COALESCE((draft->>'sort_order')::int, sort_order),
                       is_visible = COALESCE((draft->>'is_visible')::boolean, is_visible),
                       draft      = NULL,
                       is_new     = false,
                       updated_at = now()
                 WHERE draft IS NOT NULL OR is_new = true
            `;
            await tx`
                UPDATE cms_pages
                   SET title       = COALESCE(draft_title, title),
                       body        = COALESCE(draft_body, body),
                       draft_title = NULL,
                       draft_body  = NULL,
                       updated_at  = now()
                 WHERE draft_title IS NOT NULL OR draft_body IS NOT NULL
            `;
        });

        revalidateSite();
        await logAudit('cms.publish', access.userId ?? undefined, 'mis', 'site_content');

        return NextResponse.json({ ok: true });
    } catch (error) {
        await logCmsError('cms.publish', error);
        return NextResponse.json({ error: 'Publish failed' }, { status: 500 });
    }
}
