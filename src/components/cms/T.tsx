'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { useEditing } from './EditableProvider';

/**
 * One inline-editable string.
 *
 *   <T k="landing.hero.title">{content.hero.title}</T>   -> cms_texts
 *   <T k={navKey(link.cmsId, 'label')}>{link.label}</T>  -> cms_nav_items
 *
 * Outside edit mode this renders `children` with NO wrapper element, so the
 * public DOM is byte-for-byte what it was before the CMS existed.
 */
export function T({ k, children }: { k?: string; children: React.ReactNode }) {
    const editing = useEditing();
    const [saving, setSaving] = useState(false);
    // Text as last persisted, so an unchanged blur does not hit the network.
    const saved = useRef<string | null>(null);

    if (!editing || !k) return <>{children}</>;

    const save = async (event: React.FocusEvent<HTMLSpanElement>) => {
        const value = event.currentTarget.textContent ?? '';
        if (saved.current === null) saved.current = typeof children === 'string' ? children : value;
        if (value === saved.current) return;

        setSaving(true);
        try {
            const response = await fetch('/api/mis/content/text', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: k, value }),
            });
            if (!response.ok) throw new Error(await response.text());
            saved.current = value;
            toast.success('Draft saved');
        } catch (error) {
            console.error(error);
            toast.error('Could not save this text');
        } finally {
            setSaving(false);
        }
    };

    return (
        <span
            className="cms-editable"
            contentEditable
            data-cms-key={k}
            data-saving={saving || undefined}
            onBlur={save}
            onKeyDown={(event) => {
                if (event.key === 'Escape') event.currentTarget.blur();
            }}
            suppressContentEditableWarning
        >
            {children}
        </span>
    );
}

/** Key for a `cms_nav_items` field. Returns undefined when the row isn't in the CMS yet. */
export function navKey(cmsId: string | undefined, field: 'label' | 'href') {
    return cmsId ? `nav:${cmsId}:${field}` : undefined;
}
