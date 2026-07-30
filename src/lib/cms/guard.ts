import 'server-only';

import { NextResponse } from 'next/server';

import { logError } from '@/lib/logger';
import { getUserPermissions } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/server';

export type ContentAccess = {
    userId: string | null;
    canView: boolean;
    canEdit: boolean;
    canPublish: boolean;
};

/**
 * Resolve the caller's CMS permissions in a single pass.
 * Uses the shared `getUserPermissions` helper rather than re-inlining a
 * permission query, which is what the older MIS routes each do.
 */
export async function getContentAccess(): Promise<ContentAccess> {
    const {
        data: { user },
    } = await (await createClient()).auth.getUser();

    if (!user) return { userId: null, canView: false, canEdit: false, canPublish: false };

    const permissions = await getUserPermissions();
    const has = (action: string) => permissions.some((p) => p.resource === 'content' && p.action === action);
    const canEdit = has('edit');

    return {
        userId: user.id,
        // Being able to edit implies being able to see drafts.
        canView: canEdit || has('view'),
        canEdit,
        canPublish: has('publish'),
    };
}

/** 403 unless the caller holds `content.<action>`. */
export async function requireContent(action: 'view' | 'edit' | 'publish') {
    const access = await getContentAccess();
    const allowed = action === 'view' ? access.canView : action === 'edit' ? access.canEdit : access.canPublish;
    if (!allowed) {
        return {
            access,
            denied: NextResponse.json(
                { error: access.userId ? 'Forbidden' : 'Unauthorized' },
                { status: access.userId ? 403 : 401 },
            ),
        };
    }
    return { access, denied: null };
}

/** Structured error log for the CMS routes. */
export async function logCmsError(source: string, error: unknown, metadata?: Record<string, unknown>) {
    await logError({
        source,
        errorType: 'cms',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        metadata,
    });
}
