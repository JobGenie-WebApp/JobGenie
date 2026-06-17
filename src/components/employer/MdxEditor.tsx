"use client";

import "@mdxeditor/editor/style.css";
import {
    MDXEditor,
    headingsPlugin,
    listsPlugin,
    quotePlugin,
    thematicBreakPlugin,
    markdownShortcutPlugin,
    linkPlugin,
    linkDialogPlugin,
    tablePlugin,
    toolbarPlugin,
    BoldItalicUnderlineToggles,
    BlockTypeSelect,
    CreateLink,
    InsertTable,
    ListsToggle,
    UndoRedo,
    Separator,
    type MDXEditorMethods,
} from "@mdxeditor/editor";
import { forwardRef } from "react";

interface MdxEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    className?: string;
}

const MdxEditor = forwardRef<MDXEditorMethods, MdxEditorProps>(
    ({ value, onChange, placeholder, readOnly = false, className }, ref) => {
        return (
            <div className={`border border-input rounded-md bg-background text-foreground ${className ?? ""}`}>
                <MDXEditor
                    ref={ref}
                    markdown={value || ""}
                    onChange={onChange}
                    readOnly={readOnly}
                    placeholder={placeholder}
                    plugins={[
                        headingsPlugin(),
                        listsPlugin(),
                        quotePlugin(),
                        thematicBreakPlugin(),
                        markdownShortcutPlugin(),
                        linkPlugin(),
                        linkDialogPlugin(),
                        tablePlugin(),
                        toolbarPlugin({
                            toolbarContents: () => (
                                <>
                                    <UndoRedo />
                                    <Separator />
                                    <BoldItalicUnderlineToggles />
                                    <Separator />
                                    <BlockTypeSelect />
                                    <Separator />
                                    <ListsToggle />
                                    <Separator />
                                    <CreateLink />
                                    <InsertTable />
                                </>
                            ),
                        }),
                    ]}
                    contentEditableClassName="min-h-[120px] p-3 prose prose-sm max-w-none focus:outline-none text-foreground"
                />
            </div>
        );
    }
);

MdxEditor.displayName = "MdxEditor";

export { MdxEditor };
