import { redirect } from 'next/navigation';

import { MISLayout } from '@/components/mis';
import { getContentAccess } from '@/lib/cms/guard';
import { listCmsPages } from '@/lib/cms/pages';
import { createAdminClient } from '@/lib/supabase/admin';
import type { NavRow } from '@/lib/cms/site-content';

import { ContentManager } from './ContentManager';

export const dynamic = 'force-dynamic';

export default async function ContentPage() {
    const access = await getContentAccess();
    if (!access.userId) redirect('/login');
    if (!access.canView) redirect('/mis/dashboard');

    const [{ data: nav }, pages] = await Promise.all([
        createAdminClient()
            .from('cms_nav_items')
            .select('id, location, parent_id, label, href, sort_order, is_visible, draft, pending_delete, is_new')
            .order('sort_order'),
        listCmsPages(),
    ]);

    return (
        <MISLayout
            pageDescription="Edit the public site: header links, footer columns and standalone pages"
            pageTitle="Site Content"
        >
            <ContentManager
                canEdit={access.canEdit}
                canPublish={access.canPublish}
                initialNav={(nav ?? []) as NavRow[]}
                initialPages={pages}
            />
        </MISLayout>
    );
}
