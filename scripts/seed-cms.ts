/**
 * Seed the CMS tables from the constants in src/content/site.ts.
 *
 * Idempotent: existing rows keep their published values, so re-running after a
 * content edit will not stomp on what an editor changed. Safe on prod.
 *
 *   npm run cms:seed              # dev  (.env.local)
 *   ENV_FILE=.env.prod npm run cms:seed
 */
import { config } from 'dotenv';

config({ path: process.env.ENV_FILE ?? '.env.local' });
config({ path: '.env', override: false });

import postgres from 'postgres';

import { footerContent, landingContent, navigationContent } from '../src/content/site';
import { flattenText } from '../src/lib/cms/paths';

/** Footer legal links point at these but no route existed until the CMS. */
const STARTER_PAGES = [
    { slug: 'privacy', title: 'Privacy Policy' },
    { slug: 'terms', title: 'Terms of Service' },
    { slug: 'gdpr', title: 'GDPR' },
    { slug: 'pdpa', title: 'PDPA' },
    { slug: 'pricing', title: 'Pricing' },
    { slug: 'docs', title: 'Documentation' },
];

async function main() {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
    const counts = { texts: 0, nav: 0, pages: 0 };

    try {
        // --- texts -------------------------------------------------------
        // navigation.links / footer.columns live in cms_nav_items instead, so
        // their strings are skipped here to avoid two sources of truth.
        const scopes = {
            landing: flattenText(landingContent),
            navigation: flattenText(navigationContent),
            footer: flattenText(footerContent),
        };

        for (const [scope, entries] of Object.entries(scopes)) {
            for (const [path, value] of Object.entries(entries)) {
                if (scope === 'navigation' && path.startsWith('links.')) continue;
                if (scope === 'footer' && (path.startsWith('columns.') || path.startsWith('socialLinks.'))) continue;

                await sql`
                    INSERT INTO cms_texts (scope, path, value)
                    VALUES (${scope}, ${path}, ${value})
                    ON CONFLICT (scope, path) DO NOTHING
                `;
                counts.texts += 1;
            }
        }

        // --- navigation --------------------------------------------------
        const [{ count: navCount }] = await sql<{ count: string }[]>`SELECT count(*) FROM cms_nav_items`;
        if (Number(navCount) === 0) {
            for (const [index, link] of navigationContent.links.entries()) {
                await sql`
                    INSERT INTO cms_nav_items (location, label, href, sort_order)
                    VALUES ('header', ${link.label}, ${link.href}, ${index})
                `;
                counts.nav += 1;
            }

            for (const [index, column] of footerContent.columns.entries()) {
                const [{ id }] = await sql<{ id: string }[]>`
                    INSERT INTO cms_nav_items (location, label, sort_order)
                    VALUES ('footer', ${column.title}, ${index})
                    RETURNING id
                `;
                counts.nav += 1;

                for (const [linkIndex, link] of column.links.entries()) {
                    await sql`
                        INSERT INTO cms_nav_items (location, parent_id, label, href, sort_order)
                        VALUES ('footer', ${id}, ${link.label}, ${link.href}, ${linkIndex})
                    `;
                    counts.nav += 1;
                }
            }

            for (const [index, social] of footerContent.socialLinks.entries()) {
                await sql`
                    INSERT INTO cms_nav_items (location, label, href, sort_order)
                    VALUES ('footer_social', ${social.label}, ${social.href}, ${index})
                `;
                counts.nav += 1;
            }
        } else {
            console.log(`  navigation already seeded (${navCount} rows) — skipped`);
        }

        // --- pages -------------------------------------------------------
        // Created unpublished: an empty legal page must not go live by itself.
        for (const [index, page] of STARTER_PAGES.entries()) {
            await sql`
                INSERT INTO cms_pages (slug, title, sort_order, is_published)
                VALUES (${page.slug}, ${page.title}, ${index}, false)
                ON CONFLICT (slug) DO NOTHING
            `;
            counts.pages += 1;
        }

        console.log(
            `CMS seed complete — ${counts.texts} text keys, ${counts.nav} nav rows, ${counts.pages} page slugs ensured.`,
        );
    } finally {
        await sql.end();
    }
}

main().catch((error) => {
    console.error('CMS seed failed:', error);
    process.exit(1);
});
