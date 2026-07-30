'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { CmsPageRow } from '@/lib/cms/pages';

const MarkdownEditor = dynamic(() => import('@/components/cms/MarkdownEditor'), {
    ssr: false,
    loading: () => <div className="rounded-md border p-6 text-sm text-muted-foreground">Loading editor…</div>,
});

/** Draft view of a page: pending edit if there is one, else the published value. */
function draftOf(page: CmsPageRow) {
    return {
        title: page.draft_title ?? page.title ?? '',
        body: page.draft_body ?? page.body ?? '',
        seo: page.seo_description ?? '',
    };
}

export function PageEditor({
    canEdit,
    pages,
    onChanged,
}: {
    canEdit: boolean;
    pages: CmsPageRow[];
    onChanged: () => void;
}) {
    const [selectedId, setSelectedId] = useState(pages[0]?.id ?? null);
    const selected = pages.find((p) => p.id === selectedId) ?? null;
    const [draft, setDraft] = useState(() => (selected ? draftOf(selected) : { title: '', body: '', seo: '' }));
    const [newSlug, setNewSlug] = useState('');
    const [busy, setBusy] = useState(false);

    const select = (page: CmsPageRow) => {
        setSelectedId(page.id);
        setDraft(draftOf(page));
    };

    const call = async (input: string, init: RequestInit, okMessage: string) => {
        setBusy(true);
        try {
            const response = await fetch(input, init);
            if (!response.ok) {
                const detail = await response.json().catch(() => null);
                throw new Error(detail?.error ?? 'Request failed');
            }
            toast.success(okMessage);
            onChanged();
            return true;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Something went wrong');
            return false;
        } finally {
            setBusy(false);
        }
    };

    const json = (method: string, body: unknown) => ({
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const createPage = async () => {
        const slug = newSlug.trim();
        if (!slug) return;
        if (await call('/api/mis/content/pages', json('POST', { slug }), 'Page created')) setNewSlug('');
    };

    return (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="space-y-3">
                <div className="space-y-2 rounded-lg border p-3">
                    <Input
                        disabled={!canEdit}
                        onChange={(e) => setNewSlug(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && createPage()}
                        placeholder="new-page-slug"
                        value={newSlug}
                    />
                    <Button className="w-full" disabled={!canEdit || busy || !newSlug.trim()} onClick={createPage} size="sm">
                        <Plus size={14} /> Create page
                    </Button>
                </div>

                <nav className="space-y-1">
                    {pages.map((page) => (
                        <button
                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                                page.id === selectedId ? 'bg-accent font-semibold' : 'hover:bg-accent/50'
                            }`}
                            key={page.id}
                            onClick={() => select(page)}
                            type="button"
                        >
                            <span className="truncate">/{page.slug}</span>
                            <span className="ml-2 flex shrink-0 gap-1">
                                {(page.draft_title !== null || page.draft_body !== null) && (
                                    <span className="rounded bg-amber-500/15 px-1.5 text-[10px] font-bold text-amber-600">
                                        DRAFT
                                    </span>
                                )}
                                {!page.is_published && (
                                    <span className="rounded bg-muted px-1.5 text-[10px] font-bold text-muted-foreground">
                                        HIDDEN
                                    </span>
                                )}
                            </span>
                        </button>
                    ))}
                    {pages.length === 0 && <p className="px-1 text-sm text-muted-foreground">No pages yet.</p>}
                </nav>
            </aside>

            {selected ? (
                <section className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <code className="rounded bg-muted px-2 py-1 text-xs">/{selected.slug}</code>
                        <label className="flex items-center gap-2 text-sm">
                            <Switch
                                checked={selected.is_published}
                                disabled={!canEdit}
                                onCheckedChange={(checked) =>
                                    call(
                                        `/api/mis/content/pages/${selected.id}`,
                                        json('PATCH', { is_published: checked }),
                                        checked ? 'Page is now visible' : 'Page hidden from the public site',
                                    )
                                }
                            />
                            Published
                        </label>
                        <Button asChild size="sm" variant="ghost">
                            <Link href={`/${selected.slug}`} target="_blank">
                                <ExternalLink size={14} /> View
                            </Link>
                        </Button>
                        <Button
                            className="ml-auto"
                            disabled={!canEdit || busy}
                            onClick={() =>
                                call(
                                    `/api/mis/content/pages/${selected.id}`,
                                    { method: 'DELETE' },
                                    'Page deleted',
                                )
                            }
                            size="sm"
                            variant="ghost"
                        >
                            <Trash2 className="text-destructive" size={14} /> Delete
                        </Button>
                    </div>

                    <Input
                        disabled={!canEdit}
                        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                        placeholder="Page title"
                        value={draft.title}
                    />
                    <Textarea
                        disabled={!canEdit}
                        onChange={(e) => setDraft({ ...draft, seo: e.target.value })}
                        placeholder="Search engine description (optional)"
                        rows={2}
                        value={draft.seo}
                    />

                    <MarkdownEditor
                        key={selected.id}
                        markdown={draft.body}
                        onChange={(body) => setDraft((current) => ({ ...current, body }))}
                        readOnly={!canEdit}
                    />

                    <Button
                        disabled={!canEdit || busy}
                        onClick={() =>
                            call(
                                `/api/mis/content/pages/${selected.id}`,
                                json('PATCH', { title: draft.title, body: draft.body, seo_description: draft.seo }),
                                'Draft saved — publish to make it live',
                            )
                        }
                    >
                        <Save size={15} /> Save draft
                    </Button>
                </section>
            ) : (
                <p className="text-sm text-muted-foreground">Create a page to get started.</p>
            )}
        </div>
    );
}
