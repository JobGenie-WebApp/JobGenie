import 'server-only';

import { unstable_cache } from 'next/cache';

import { siteContent } from '@/content/site';
import type { SiteContent } from '@/content/types';
import { createAdminClient } from '@/lib/supabase/admin';

import { applyOverrides } from './paths';

export const SITE_CONTENT_TAG = 'site-content';

export type ContentMode = 'published' | 'draft';

/** Scopes of `cms_texts`. One scope == one Publish button. */
export const TEXT_SCOPES = ['landing', 'navigation', 'footer'] as const;
export type TextScope = (typeof TEXT_SCOPES)[number];

/** Locations of `cms_nav_items`. */
export const NAV_LOCATIONS = ['header', 'footer', 'footer_social'] as const;
export type NavLocation = (typeof NAV_LOCATIONS)[number];

export type NavRow = {
    id: string;
    location: string;
    parent_id: string | null;
    label: string | null;
    href: string | null;
    sort_order: number;
    is_visible: boolean;
    draft: Partial<Pick<NavRow, 'label' | 'href' | 'sort_order' | 'is_visible'>> | null;
    pending_delete: boolean;
    is_new: boolean;
};

/**
 * A nav row as it should appear in the given mode, or null when it should not
 * appear at all (added-but-unpublished in published mode, deleted in draft mode).
 */
function resolveNavRow(row: NavRow, mode: ContentMode): NavRow | null {
    if (mode === 'published') {
        return row.is_new ? null : row;
    }
    if (row.pending_delete) return null;
    return row.draft ? { ...row, ...row.draft } : row;
}

function sortNav(rows: NavRow[]) {
    return rows.sort((a, b) => a.sort_order - b.sort_order);
}

/** Slug-ish id used by the header section spy for anchor links. */
function navId(href: string, fallback: string) {
    return href.replace(/^[#/]/, '').split(/[?#]/)[0] || fallback;
}

async function loadSiteContent(mode: ContentMode): Promise<SiteContent> {
    const supabase = createAdminClient();

    const [texts, nav] = await Promise.all([
        supabase.from('cms_texts').select('scope, path, value, draft_value'),
        supabase
            .from('cms_nav_items')
            .select('id, location, parent_id, label, href, sort_order, is_visible, draft, pending_delete, is_new'),
    ]);

    // A CMS outage must never take the marketing site down: fall back to the constants.
    if (texts.error || nav.error) {
        console.error('[cms] falling back to static content', texts.error ?? nav.error);
        return siteContent;
    }

    const overrides: Record<TextScope, Record<string, string | null>> = {
        landing: {},
        navigation: {},
        footer: {},
    };
    for (const row of texts.data ?? []) {
        const scope = row.scope as TextScope;
        if (!overrides[scope]) continue;
        overrides[scope][row.path] = mode === 'draft' ? (row.draft_value ?? row.value) : row.value;
    }

    const merged: SiteContent = {
        landing: applyOverrides(siteContent.landing, overrides.landing),
        navigation: applyOverrides(siteContent.navigation, overrides.navigation),
        footer: applyOverrides(siteContent.footer, overrides.footer),
    };

    const rows = (nav.data ?? [])
        .map((row) => resolveNavRow(row as NavRow, mode))
        .filter((row): row is NavRow => row !== null && row.is_visible);

    const header = sortNav(rows.filter((r) => r.location === 'header'));
    const footerColumns = sortNav(rows.filter((r) => r.location === 'footer' && !r.parent_id));
    const footerSocial = sortNav(rows.filter((r) => r.location === 'footer_social'));

    // Zero rows for a location means "not seeded yet" -> keep the constant.
    if (header.length) {
        merged.navigation.links = header.map((row) => ({
            href: row.href ?? '#',
            id: navId(row.href ?? '', row.id),
            label: row.label ?? '',
            cmsId: row.id,
        }));
    }

    if (footerColumns.length) {
        merged.footer.columns = footerColumns.map((column) => ({
            title: column.label ?? '',
            cmsId: column.id,
            links: sortNav(rows.filter((r) => r.parent_id === column.id)).map((link) => ({
                label: link.label ?? '',
                href: link.href ?? '#',
                cmsId: link.id,
            })),
        }));
    }

    if (footerSocial.length) {
        merged.footer.socialLinks = footerSocial.map((row) => ({
            label: row.label ?? '',
            href: row.href ?? '#',
            cmsId: row.id,
        }));
    }

    return merged;
}

const loadPublished = unstable_cache(() => loadSiteContent('published'), ['cms-site-content'], {
    tags: [SITE_CONTENT_TAG],
});

/**
 * The site content tree, identical in shape to `siteContent` from
 * src/content/site.ts. Those constants are the fallback layer — anything the
 * CMS has not overridden (or has left blank) still renders from code.
 */
export async function getSiteContent(mode: ContentMode = 'published'): Promise<SiteContent> {
    return mode === 'draft' ? loadSiteContent('draft') : loadPublished();
}
