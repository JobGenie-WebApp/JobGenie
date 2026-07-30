'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ArrowLeft, ExternalLink, RotateCcw, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

/**
 * Sticky action bar for the in-dashboard landing editor.
 *
 * Pinned to the bottom of the viewport, and rendered *after* the page, so
 * Publish stays in reach no matter how far down the editor has scrolled. It
 * also keeps clear of the landing page's own fixed header at the top.
 */
export function LandingEditorBar({ canPublish, hasChanges }: { canPublish: boolean; hasChanges: boolean }) {
    const [busy, setBusy] = useState<'publish' | 'discard' | null>(null);
    const [pending, startTransition] = useTransition();
    const router = useRouter();

    const run = async (action: 'publish' | 'discard') => {
        setBusy(action);
        try {
            const response = await fetch(`/api/mis/content/${action}`, { method: 'POST' });
            if (!response.ok) throw new Error(await response.text());
            toast.success(action === 'publish' ? 'Published to the live site' : 'Draft changes discarded');
            startTransition(() => router.refresh());
        } catch (error) {
            console.error(error);
            toast.error(action === 'publish' ? 'Publish failed' : 'Could not discard the draft');
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className="sticky bottom-0 z-[300] flex flex-wrap items-center gap-2 border-t bg-background px-4 py-2.5 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
            <Button asChild size="sm" variant="ghost" className="border ml-20 hover:text-primary">
                <Link href="/mis/content">
                    <ArrowLeft size={15} /> Site Content
                </Link>
            </Button>

            <span className="mr-auto text-sm text-muted-foreground">
                {hasChanges
                    ? 'Unpublished changes — click any text below to edit, then Publish.'
                    : 'Click any text below to edit. Changes are saved as a draft until you Publish.'}
            </span>

            <Button asChild size="sm" variant="outline">
                <Link href="/" target="_blank">
                    <ExternalLink size={14} /> Live site
                </Link>
            </Button>

            <Button disabled={busy !== null || pending} onClick={() => run('discard')} size="sm" variant="ghost">
                <RotateCcw size={14} /> Discard
            </Button>

            {canPublish && (
                <Button disabled={busy !== null || pending} onClick={() => run('publish')} size="sm">
                    <Upload size={14} />
                    {busy === 'publish' ? 'Publishing…' : 'Publish'}
                </Button>
            )}
        </div>
    );
}
