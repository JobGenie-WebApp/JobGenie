'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, LayoutTemplate, Plus, RotateCcw, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CmsPageRow } from '@/lib/cms/pages';
import type { NavRow } from '@/lib/cms/site-content';

import { PageEditor } from './PageEditor';

/** Draft values shown in the manager: the pending edit if there is one, else live. */
function draftOf(row: NavRow) {
    return { ...row, ...(row.draft ?? {}) };
}

export function ContentManager({
    canEdit,
    canPublish,
    initialNav,
    initialPages,
}: {
    canEdit: boolean;
    canPublish: boolean;
    initialNav: NavRow[];
    initialPages: CmsPageRow[];
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [busy, setBusy] = useState(false);

    const refresh = () => startTransition(() => router.refresh());

    const call = async (input: string, init: RequestInit, okMessage?: string) => {
        setBusy(true);
        try {
            const response = await fetch(input, init);
            if (!response.ok) {
                const detail = await response.json().catch(() => null);
                throw new Error(detail?.error ?? 'Request failed');
            }
            if (okMessage) toast.success(okMessage);
            refresh();
            return true;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong');
            return false;
        } finally {
            setBusy(false);
        }
    };

    const navJson = (method: string, body: unknown) => ({
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const addItem = (location: NavRow['location'], parentId?: string) =>
        call('/api/mis/content/nav', navJson('POST', {
            location,
            parent_id: parentId ?? null,
            label: 'New item',
            href: '/',
            sort_order: 999,
        }), 'Added — remember to Publish');

    const patchItem = (id: string, changes: Record<string, unknown>) =>
        call('/api/mis/content/nav', navJson('PATCH', { id, ...changes }));

    const removeItem = (id: string) =>
        call(`/api/mis/content/nav?id=${id}`, { method: 'DELETE' }, 'Removed — remember to Publish');

    const move = (rows: NavRow[], row: NavRow, direction: -1 | 1) => {
        const ordered = [...rows].sort((a, b) => draftOf(a).sort_order - draftOf(b).sort_order);
        const index = ordered.findIndex((r) => r.id === row.id);
        const swap = ordered[index + direction];
        if (!swap) return;
        void patchItem(row.id, { sort_order: draftOf(swap).sort_order });
        void patchItem(swap.id, { sort_order: draftOf(row).sort_order });
    };

    const header = initialNav.filter((r) => r.location === 'header' && !r.pending_delete);
    const footerColumns = initialNav.filter((r) => r.location === 'footer' && !r.parent_id && !r.pending_delete);
    const footerSocial = initialNav.filter((r) => r.location === 'footer_social' && !r.pending_delete);
    const childrenOf = (id: string) => initialNav.filter((r) => r.parent_id === id && !r.pending_delete);

    const hasPendingChanges =
        initialNav.some((r) => r.draft || r.is_new || r.pending_delete) ||
        initialPages.some((p) => p.draft_title !== null || p.draft_body !== null);

    function NavRowEditor({ row, siblings, showVisibility = true }: { row: NavRow; siblings: NavRow[]; showVisibility?: boolean }) {
        const value = draftOf(row);
        return (
            <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2">
                <Input
                    className="h-9 min-w-0 flex-1"
                    defaultValue={value.label ?? ''}
                    disabled={!canEdit}
                    onBlur={(e) => e.target.value !== (value.label ?? '') && patchItem(row.id, { label: e.target.value })}
                    placeholder="Label"
                />
                <Input
                    className="h-9 min-w-0 flex-1 font-mono text-xs"
                    defaultValue={value.href ?? ''}
                    disabled={!canEdit}
                    onBlur={(e) => e.target.value !== (value.href ?? '') && patchItem(row.id, { href: e.target.value })}
                    placeholder="/path"
                />
                {showVisibility && (
                    <label className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
                        <Switch
                            checked={value.is_visible}
                            disabled={!canEdit}
                            onCheckedChange={(checked) => patchItem(row.id, { is_visible: checked })}
                        />
                        Visible
                    </label>
                )}
                {(row.is_new || row.draft) && (
                    <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600">DRAFT</span>
                )}
                <Button disabled={!canEdit || busy} onClick={() => move(siblings, row, -1)} size="icon" variant="ghost">
                    <ChevronUp size={15} />
                </Button>
                <Button disabled={!canEdit || busy} onClick={() => move(siblings, row, 1)} size="icon" variant="ghost">
                    <ChevronDown size={15} />
                </Button>
                <Button disabled={!canEdit || busy} onClick={() => removeItem(row.id)} size="icon" variant="ghost">
                    <Trash2 className="text-destructive" size={15} />
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Link
                className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4 transition hover:border-primary/60 hover:bg-accent/40"
                href="/mis/content/landing"
            >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                    <LayoutTemplate size={20} />
                </span>
                <span className="min-w-0">
                    <span className="block font-semibold">Edit landing page text</span>
                    <span className="block text-sm text-muted-foreground">
                        Opens the real landing page with every text editable — click a heading or paragraph and type.
                    </span>
                </span>
                <span className="ml-auto text-sm font-semibold text-primary">Open editor →</span>
            </Link>

            <Tabs defaultValue="header">
                <TabsList>
                    <TabsTrigger value="header">Header</TabsTrigger>
                    <TabsTrigger value="footer">Footer</TabsTrigger>
                    <TabsTrigger value="pages">Pages</TabsTrigger>
                </TabsList>

                <TabsContent className="space-y-3 pt-4" value="header">
                    <p className="text-sm text-muted-foreground">
                        Links shown in the site header. Wording can also be edited inline on the live page.
                    </p>
                    {header.map((row) => (
                        <NavRowEditor key={row.id} row={row} siblings={header} />
                    ))}
                    <Button disabled={!canEdit || busy} onClick={() => addItem('header')} size="sm" variant="outline">
                        <Plus size={14} /> Add header link
                    </Button>
                </TabsContent>

                <TabsContent className="space-y-6 pt-4" value="footer">
                    {footerColumns.map((column) => {
                        const links = childrenOf(column.id);
                        return (
                            <section className="space-y-3 rounded-lg border p-4" key={column.id}>
                                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Column</div>
                                <NavRowEditor row={column} showVisibility={false} siblings={footerColumns} />
                                <div className="space-y-2 border-l-2 pl-4">
                                    {links.map((link) => (
                                        <NavRowEditor key={link.id} row={link} showVisibility={false} siblings={links} />
                                    ))}
                                    <Button
                                        disabled={!canEdit || busy}
                                        onClick={() => addItem('footer', column.id)}
                                        size="sm"
                                        variant="outline"
                                    >
                                        <Plus size={14} /> Add page link
                                    </Button>
                                </div>
                            </section>
                        );
                    })}
                    <Button disabled={!canEdit || busy} onClick={() => addItem('footer')} size="sm" variant="outline">
                        <Plus size={14} /> Add footer column
                    </Button>

                    <section className="space-y-3 rounded-lg border p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Social links</div>
                        {footerSocial.map((row) => (
                            <NavRowEditor key={row.id} row={row} showVisibility={false} siblings={footerSocial} />
                        ))}
                        <Button
                            disabled={!canEdit || busy}
                            onClick={() => addItem('footer_social')}
                            size="sm"
                            variant="outline"
                        >
                            <Plus size={14} /> Add social link
                        </Button>
                    </section>
                </TabsContent>

                <TabsContent className="pt-4" value="pages">
                    <PageEditor canEdit={canEdit} onChanged={refresh} pages={initialPages} />
                </TabsContent>
            </Tabs>

            {/* Pinned to the bottom so Publish is reachable without scrolling back up. */}
            <div className="sticky bottom-0 z-40 -mx-1 flex flex-wrap items-center gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur">
                <p className="mr-auto text-sm text-muted-foreground">
                    {hasPendingChanges
                        ? 'You have unpublished changes. The live site keeps showing the old version until you publish.'
                        : 'Everything is published. Edits are saved as drafts first.'}
                </p>
                <Button asChild size="sm" variant="outline">
                    <Link href="/" target="_blank">
                        <ExternalLink size={14} /> Live site
                    </Link>
                </Button>
                <Button
                    disabled={!canEdit || busy || pending}
                    onClick={() => call('/api/mis/content/discard', { method: 'POST' }, 'Draft changes discarded')}
                    size="sm"
                    variant="ghost"
                >
                    <RotateCcw size={14} /> Discard
                </Button>
                {canPublish && (
                    <Button
                        disabled={busy || pending}
                        onClick={() => call('/api/mis/content/publish', { method: 'POST' }, 'Published to the live site')}
                        size="sm"
                    >
                        <Upload size={14} /> Publish
                    </Button>
                )}
            </div>
        </div>
    );
}
