import React from "react";

interface PortalPageHeaderProps {
    title?: string;
    description?: string;
    /** Right-aligned action buttons (e.g. "Create", "Edit"). */
    actions?: React.ReactNode;
}

/** The title + subtitle + actions row rendered at the top of the content area,
 *  matching the reference dashboard layout. Renders nothing when empty. */
export function PortalPageHeader({ title, description, actions }: PortalPageHeaderProps) {
    if (!title && !description && !actions) return null;

    return (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                {title && (
                    <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">
                        {title}
                    </h1>
                )}
                {description && (
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
            )}
        </div>
    );
}
