import 'server-only';

import { unstable_cache } from 'next/cache';

import { createAdminClient } from '@/lib/supabase/admin';

import type { ContentMode } from './site-content';

export const CMS_PAGES_TAG = 'cms-pages';

export type CmsPageRow = {
    id: string;
    slug: string;
    title: string | null;
    body: string | null;
    draft_title: string | null;
    draft_body: string | null;
    seo_description: string | null;
    is_published: boolean;
    sort_order: number;
    updated_at: string;
};

export type CmsPageView = {
    id: string;
    slug: string;
    title: string;
    body: string;
    seoDescription: string;
    isPublished: boolean;
};

const SELECT = 'id, slug, title, body, draft_title, draft_body, seo_description, is_published, sort_order, updated_at';

function view(row: CmsPageRow, mode: ContentMode): CmsPageView {
    const draft = mode === 'draft';
    return {
        id: row.id,
        slug: row.slug,
        title: (draft ? (row.draft_title ?? row.title) : row.title) ?? '',
        body: (draft ? (row.draft_body ?? row.body) : row.body) ?? '',
        seoDescription: row.seo_description ?? '',
        isPublished: row.is_published,
    };
}

async function fetchPage(slug: string): Promise<CmsPageRow | null> {
    const { data, error } = await createAdminClient().from('cms_pages').select(SELECT).eq('slug', slug).maybeSingle();
    if (error) {
        console.error('[cms] page lookup failed', slug, error);
        return null;
    }
    return (data as CmsPageRow) ?? null;
}

const fetchPageCached = unstable_cache(fetchPage, ['cms-page'], { tags: [CMS_PAGES_TAG] });

export async function getCmsPage(slug: string, mode: ContentMode = 'published'): Promise<CmsPageView | null> {
    const row = mode === 'draft' ? await fetchPage(slug) : await fetchPageCached(slug);
    return row ? view(row, mode) : null;
}

async function fetchPages(): Promise<CmsPageRow[]> {
    const { data, error } = await createAdminClient()
        .from('cms_pages')
        .select(SELECT)
        .order('sort_order')
        .order('slug');
    if (error) {
        console.error('[cms] page list failed', error);
        return [];
    }
    return (data ?? []) as CmsPageRow[];
}

export const listCmsPages = fetchPages;

/** Published page slugs, for the sitemap. */
export const listPublishedSlugs = unstable_cache(
    async () => (await fetchPages()).filter((p) => p.is_published).map((p) => p.slug),
    ['cms-published-slugs'],
    { tags: [CMS_PAGES_TAG] },
);
