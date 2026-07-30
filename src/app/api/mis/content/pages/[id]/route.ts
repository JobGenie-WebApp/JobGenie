import { NextResponse } from 'next/server';
import { z } from 'zod';

import { logCmsError, requireContent } from '@/lib/cms/guard';
import { revalidateSite } from '@/lib/cms/revalidate';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Every field optional — a page can be saved half-written.
const patchSchema = z.object({
    title: z.string().max(200).nullish(),
    body: z.string().max(200000).nullish(),
    seo_description: z.string().max(2000).nullish(),
    is_published: z.boolean().nullish(),
    sort_order: z.number().int().nullish(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { access, denied } = await requireContent('edit');
    if (denied) return denied;

    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

    const { title, body, seo_description, is_published, sort_order } = parsed.data;
    const update: Record<string, unknown> = { updated_by: access.userId, updated_at: new Date().toISOString() };

    // Title/body edits land in the draft layer; the rest are page settings, not content.
    if (title !== undefined && title !== null) update.draft_title = title;
    if (body !== undefined && body !== null) update.draft_body = body;
    if (seo_description !== undefined && seo_description !== null) update.seo_description = seo_description;
    if (typeof is_published === 'boolean') update.is_published = is_published;
    if (typeof sort_order === 'number') update.sort_order = sort_order;

    const { error } = await createAdminClient().from('cms_pages').update(update).eq('id', id);
    if (error) {
        await logCmsError('cms.pages.update', error, { id });
        return NextResponse.json({ error: 'Could not save the page' }, { status: 500 });
    }

    // Publish state and SEO apply immediately; body/title still wait for Publish.
    revalidateSite();
    return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { denied } = await requireContent('edit');
    if (denied) return denied;

    const { id } = await params;
    const { error } = await createAdminClient().from('cms_pages').delete().eq('id', id);
    if (error) {
        await logCmsError('cms.pages.delete', error, { id });
        return NextResponse.json({ error: 'Could not delete the page' }, { status: 500 });
    }

    revalidateSite();
    return NextResponse.json({ ok: true });
}
