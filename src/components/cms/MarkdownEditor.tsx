'use client';

import '@mdxeditor/editor/style.css';

import {
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    CreateLink,
    ListsToggle,
    MDXEditor,
    type MDXEditorMethods,
    UndoRedo,
    headingsPlugin,
    linkDialogPlugin,
    linkPlugin,
    listsPlugin,
    markdownShortcutPlugin,
    quotePlugin,
    tablePlugin,
    thematicBreakPlugin,
    toolbarPlugin,
} from '@mdxeditor/editor';
import { useRef } from 'react';

/**
 * Markdown body editor for CMS pages. `@mdxeditor/editor` was already a
 * dependency (and already has overrides in globals.css) so nothing new is
 * pulled in for this. Loaded via next/dynamic by the caller — it cannot SSR.
 */
export default function MarkdownEditor({
    markdown,
    onChange,
    readOnly = false,
}: {
    markdown: string;
    onChange: (markdown: string) => void;
    readOnly?: boolean;
}) {
    const ref = useRef<MDXEditorMethods>(null);

    return (
        <MDXEditor
            className="rounded-md border bg-background"
            contentEditableClassName="prose max-w-none dark:prose-invert"
            markdown={markdown}
            onChange={onChange}
            plugins={[
                headingsPlugin(),
                listsPlugin(),
                quotePlugin(),
                linkPlugin(),
                linkDialogPlugin(),
                tablePlugin(),
                thematicBreakPlugin(),
                markdownShortcutPlugin(),
                toolbarPlugin({
                    toolbarContents: () => (
                        <>
                            <UndoRedo />
                            <BoldItalicUnderlineToggles />
                            <BlockTypeSelect />
                            <ListsToggle />
                            <CreateLink />
                        </>
                    ),
                }),
            ]}
            readOnly={readOnly}
            ref={ref}
        />
    );
}
