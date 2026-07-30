import { NextResponse } from 'next/server';
import { z } from 'zod';

import { logCmsError, requireContent } from '@/lib/cms/guard';
import { NAV_LOCATIONS } from '@/lib/cms/site-content';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const SELECT = 'id, location, parent_id, label, href, sort_order, is_visible, draft, pending_delete, is_new';

// Nothing is required: an editor can add an empty row and fill it in later.
const createSchema = z.object({
    location: z.enum(NAV_LOCATIONS),
    parent_id: z.uuid().nullish(),
    label: z.string().max(191).nullish(),
    href: z.string().max(500).nullish(),
    sort_order: z.number().int().nullish(),
});

const patchSchema = z.object({
    id: z.uuid(),
    label: z.string().max(191).nullish(),
    href: z.string().max(500).nullish(),
    sort_order: z.number().int().nullish(),
    is_visible: z.boolean().nullish(),
});

/** Draft view of every nav row, for the MIS content manager. */
export async function GET() {
    const { denied } = await requireContent('view');
    if (denied) return denied;

    const { data, error } = await createAdminClient().from('cms_nav_items').select(SELECT).order('sort_order');
    if (error) {
        await logCmsError('cms.nav.list', error);
        return NextResponse.json({ error: 'Could not load navigation' }, { status: 500 });
    }
    return NextResponse.json({ items: data ?? [] });
}

/** Add a row. It stays invisible on the live site until published. */
export async function POST(request: Request) {
    const { access, denied } = await requireContent('edit');
    if (denied) return denied;

    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

    const { data, error } = await createAdminClient()
        .from('cms_nav_items')
        .insert({
            ...parsed.data,
            parent_id: parsed.data.parent_id ?? null,
            sort_order: parsed.data.sort_order ?? 0,
            is_new: true,
            updated_by: access.userId,
            updated_at: new Date().toISOString(),
        })
        .select(SELECT)
        .single();

    if (error) {
        await logCmsError('cms.nav.create', error);
        return NextResponse.json({ error: 'Could not add the item' }, { status: 500 });
    }
    return NextResponse.json({ item: data });
}

/** Stage an edit. New rows are edited in place; published rows get a draft overlay. */
export async function PATCH(request: Request) {
    const { access, denied } = await requireContent('edit');
    if (denied) return denied;

    const parsed = patchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

    const { id, ...fields } = parsed.data;
    const changes = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined && v !== null));
    if (!Object.keys(changes).length) return NextResponse.json({ ok: true });

    const supabase = createAdminClient();
    const { data: row, error: readError } = await supabase
        .from('cms_nav_items')
        .select('draft, is_new')
        .eq('id', id)
        .maybeSingle();
    if (readError || !row) return NextResponse.json({ error: 'Nav item not found' }, { status: 404 });

    const update = row.is_new
        ? changes
        : { draft: { ...((row.draft as Record<string, unknown>) ?? {}), ...changes } };

    const { error } = await supabase
        .from('cms_nav_items')
        .update({ ...update, updated_by: access.userId, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        await logCmsError('cms.nav.update', error, { id });
        return NextResponse.json({ error: 'Could not save the item' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
}

/**
 * Remove a row. Never-published rows go immediately; live rows are only marked,
 * so the public site keeps showing them until someone publishes.
 */
export async function DELETE(request: Request) {
    const { access, denied } = await requireContent('edit');
    if (denied) return denied;

    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const supabase = createAdminClient();
    const { data: row } = await supabase.from('cms_nav_items').select('is_new').eq('id', id).maybeSingle();
    if (!row) return NextResponse.json({ error: 'Nav item not found' }, { status: 404 });

    const { error } = row.is_new
        ? await supabase.from('cms_nav_items').delete().eq('id', id)
        : await supabase
              .from('cms_nav_items')
              .update({ pending_delete: true, updated_by: access.userId, updated_at: new Date().toISOString() })
              .eq('id', id);

    if (error) {
        await logCmsError('cms.nav.delete', error, { id });
        return NextResponse.json({ error: 'Could not remove the item' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
}
