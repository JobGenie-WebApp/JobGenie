import { NextResponse } from 'next/server';

import { logCmsError, requireContent } from '@/lib/cms/guard';
import { revalidateSite } from '@/lib/cms/revalidate';
import { getServerSql } from '@/lib/db/server-postgres';
import { logAudit } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/** Throw away every pending draft. The live site is untouched either way. */
export async function POST() {
    const { access, denied } = await requireContent('edit');
    if (denied) return denied;

    try {
        const sql = getServerSql();
        if (!sql) throw new Error('DATABASE_URL is not configured');
        await sql.begin(async (tx) => {
            await tx`UPDATE cms_texts SET draft_value = NULL WHERE draft_value IS NOT NULL`;
            await tx`DELETE FROM cms_nav_items WHERE is_new = true`;
            await tx`
                UPDATE cms_nav_items
                   SET draft = NULL, pending_delete = false
                 WHERE draft IS NOT NULL OR pending_delete = true
            `;
            await tx`
                UPDATE cms_pages
                   SET draft_title = NULL, draft_body = NULL
                 WHERE draft_title IS NOT NULL OR draft_body IS NOT NULL
            `;
        });

        revalidateSite();
        await logAudit('cms.discard', access.userId ?? undefined, 'mis', 'site_content');

        return NextResponse.json({ ok: true });
    } catch (error) {
        await logCmsError('cms.discard', error);
        return NextResponse.json({ error: 'Could not discard the draft' }, { status: 500 });
    }
}
