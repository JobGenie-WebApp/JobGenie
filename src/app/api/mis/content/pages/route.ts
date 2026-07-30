import { NextResponse } from 'next/server';
import { z } from 'zod';

import { logCmsError, requireContent } from '@/lib/cms/guard';
import { revalidateSite } from '@/lib/cms/revalidate';
import { listCmsPages } from '@/lib/cms/pages';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
    slug: z
        .string()
        .min(1)
        .max(120)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens'),
    title: z.string().max(200).nullish(),
});

export async function GET() {
    const { denied } = await requireContent('view');
    if (denied) return denied;
    return NextResponse.json({ pages: await listCmsPages() });
}

export async function POST(request: Request) {
    const { access, denied } = await requireContent('edit');
    if (denied) return denied;

    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body' }, { status: 400 });
    }

    const { data, error } = await createAdminClient()
        .from('cms_pages')
        .insert({
            slug: parsed.data.slug,
            draft_title: parsed.data.title ?? null,
            updated_by: access.userId,
            updated_at: new Date().toISOString(),
        })
        .select('id, slug')
        .single();

    if (error) {
        if (error.code === '23505') return NextResponse.json({ error: 'That slug already exists' }, { status: 409 });
        await logCmsError('cms.pages.create', error);
        return NextResponse.json({ error: 'Could not create the page' }, { status: 500 });
    }

    // A visit to the slug before it existed cached a miss; clear it.
    revalidateSite();
    return NextResponse.json({ page: data });
}
