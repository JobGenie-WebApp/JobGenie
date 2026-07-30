import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

import { PublicPageHero, PublicPageShell } from '@/components/public/PublicPageShell';
import { getContentAccess } from '@/lib/cms/guard';
import { getCmsPage } from '@/lib/cms/pages';

/**
 * CMS-managed standalone pages: terms, privacy, pricing, docs, and anything
 * else an editor adds to the footer. Static routes win over this dynamic
 * segment in the App Router, so the hand-built public pages are unaffected.
 */

/** Unpublished pages are visible to editors only, so they can proof-read before publishing. */
async function loadPage(slug: string) {
    const page = await getCmsPage(slug);
    if (page?.isPublished) return page;

    const { canView } = await getContentAccess();
    if (!canView) return null;
    return getCmsPage(slug, 'draft');
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const page = await getCmsPage(slug);
    if (!page) return {};
    return {
        title: page.title || undefined,
        description: page.seoDescription || undefined,
        robots: page.isPublished ? undefined : { index: false, follow: false },
    };
}

export default async function CmsSlugPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const page = await loadPage(slug);
    if (!page) notFound();

    return (
        <PublicPageShell>
            <PublicPageHero
                description={page.seoDescription}
                eyebrow={page.isPublished ? 'JobGenie' : 'UNPUBLISHED DRAFT'}
                title={page.title || slug}
            />
            <div className="jg-container py-14">
                <div className="prose prose-neutral max-w-3xl dark:prose-invert">
                    <ReactMarkdown>{page.body}</ReactMarkdown>
                </div>
            </div>
        </PublicPageShell>
    );
}
