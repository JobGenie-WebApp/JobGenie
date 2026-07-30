import { NextResponse } from 'next/server';
import { z } from 'zod';

import { logCmsError, requireContent } from '@/lib/cms/guard';
import { TEXT_SCOPES, type TextScope } from '@/lib/cms/site-content';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
    /** `<scope>.<dot.path>` for cms_texts, or `nav:<uuid>:<label|href>` for cms_nav_items. */
    key: z.string().min(1).max(255),
    value: z.string().max(20000),
});

const NAV_KEY = /^nav:([0-9a-f-]{36}):(label|href)$/i;

/** Save one inline edit into the draft layer. Never touches published values. */
export async function PUT(request: Request) {
    const { access, denied } = await requireContent('edit');
    if (denied) return denied;

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

    const { key, value } = parsed.data;
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    try {
        const navMatch = key.match(NAV_KEY);
        if (navMatch) {
            const [, id, field] = navMatch;
            const { data: row, error: readError } = await supabase
                .from('cms_nav_items')
                .select('draft')
                .eq('id', id)
                .maybeSingle();
            if (readError) throw readError;
            if (!row) return NextResponse.json({ error: 'Nav item not found' }, { status: 404 });

            const draft = { ...((row.draft as Record<string, unknown>) ?? {}), [field]: value };
            const { error } = await supabase
                .from('cms_nav_items')
                .update({ draft, updated_by: access.userId, updated_at: now })
                .eq('id', id);
            if (error) throw error;
            return NextResponse.json({ ok: true });
        }

        const dot = key.indexOf('.');
        const scope = key.slice(0, dot) as TextScope;
        const path = key.slice(dot + 1);
        if (dot < 1 || !path || !TEXT_SCOPES.includes(scope)) {
            return NextResponse.json({ error: 'Unknown content key' }, { status: 400 });
        }

        // Supabase bypasses Prisma @updatedAt; the column is NOT NULL.
        const { error } = await supabase
            .from('cms_texts')
            .upsert(
                { scope, path, draft_value: value, updated_by: access.userId, updated_at: now },
                { onConflict: 'scope,path' },
            );
        if (error) throw error;

        return NextResponse.json({ ok: true });
    } catch (error) {
        await logCmsError('cms.text.save', error, { key });
        return NextResponse.json({ error: 'Could not save content' }, { status: 500 });
    }
}
