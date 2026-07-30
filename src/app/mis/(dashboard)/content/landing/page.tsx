import { redirect } from 'next/navigation';

import { EditableProvider } from '@/components/cms/EditableProvider';
import { LandingEditorBar } from '@/components/cms/LandingEditorBar';
import { SiteHome } from '@/components/landing/SiteHome';
import { getContentAccess } from '@/lib/cms/guard';
import { getSiteContent } from '@/lib/cms/site-content';
import { hasPendingChanges } from '@/lib/cms/pending';

export const dynamic = 'force-dynamic';

/**
 * The landing page editor, inside MIS.
 *
 * Renders the real landing page from draft content with every text turned into
 * an editable field, so what an editor sees is exactly what visitors get. It
 * deliberately skips MISLayout: the site header is fixed-position and the hero
 * is full-bleed, so a sidebar beside it would distort the design being edited.
 */
export default async function LandingEditorPage() {
    const { userId, canView, canEdit, canPublish } = await getContentAccess();
    if (!userId) redirect('/login');
    if (!canView) redirect('/mis/dashboard');

    const [content, pending] = await Promise.all([getSiteContent('draft'), hasPendingChanges()]);

    return (
        <EditableProvider editing={canEdit}>
            <SiteHome content={content} />
            <LandingEditorBar canPublish={canPublish} hasChanges={pending} />
        </EditableProvider>
    );
}
