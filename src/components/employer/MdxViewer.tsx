"use client";

import "@mdxeditor/editor/style.css";
import { useEffect, useRef } from "react";
import {
    MDXEditor,
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    linkPlugin,
    tablePlugin,
    type MDXEditorMethods,
} from "@mdxeditor/editor";

interface MdxViewerProps {
    markdown: string;
}

const PLUGINS = [
    headingsPlugin(),
    listsPlugin(),
    quotePlugin(),
    thematicBreakPlugin(),
    linkPlugin(),
    tablePlugin(),
];

// Collapse 3+ consecutive blank lines to 1 so preview matches candidate view
function normalizeMarkdown(md: string): string {
    return md.replace(/\n{3,}/g, "\n\n").trim();
}

export function MdxViewer({ markdown }: MdxViewerProps) {
    const ref = useRef<MDXEditorMethods>(null);

    // Imperatively update markdown so the editor never remounts
    useEffect(() => {
        ref.current?.setMarkdown(normalizeMarkdown(markdown || ""));
    }, [markdown]);

    return (
        <MDXEditor
            ref={ref}
            markdown={normalizeMarkdown(markdown || "")}
            readOnly
            plugins={PLUGINS}
            contentEditableClassName="prose prose-sm max-w-none p-0 text-foreground"
        />
    );
}
