import { Skeleton } from "@/components/ui/skeleton";

/**
 * Page-archetype loading skeletons. Each route's `loading.tsx` renders the
 * archetype that matches the real page (dashboard → DashboardSkeleton, a list
 * page → ListSkeleton, etc.) so the loading state mirrors the page being opened.
 *
 * Note: the portal chrome (sidebar + header) lives inside each page's
 * `*Layout`, so these skeletons render the content area only — matching the
 * existing loading behaviour.
 */

/**
 * Mirrors the real content container in DashboardShell (`p-5 md:p-6` around a
 * `mx-auto w-full max-w-7xl` column). Without the max-width the skeleton spanned
 * the full viewport while the real page is centred and capped — the loading state
 * looked like a different, broken page.
 */
export function PageShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="p-5 md:p-6">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 animate-in fade-in duration-300">
                {children}
            </div>
        </div>
    );
}

/** Title + description placeholder (mirrors PortalPageHeader's text-2xl + mt-1). */
export function TitleBlock() {
    return (
        <div className="flex flex-col gap-2.5">
            <Skeleton className="h-8 w-56 max-w-[70%]" />
            <Skeleton className="h-4 w-80 max-w-full" />
        </div>
    );
}

/** One list/card row: logo tile, two text lines, status pills, trailing action. */
function CardRow() {
    return (
        <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-1/3 min-w-32" />
                <Skeleton className="h-3 w-1/2 min-w-40" />
                <div className="flex gap-2 pt-1">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
            </div>
            <Skeleton className="hidden h-9 w-24 shrink-0 rounded-lg sm:block" />
        </div>
    );
}

/* ── Dashboard: stat cards + two-column widgets ──────────────────────────── */
export function DashboardSkeleton() {
    return (
        <PageShell>
            <TitleBlock />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-5">
                <div className="flex flex-col gap-4 lg:col-span-3">
                    <Skeleton className="h-7 w-40" />
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
                <div className="flex flex-col gap-4 lg:col-span-2">
                    <Skeleton className="h-56 rounded-xl" />
                    <Skeleton className="h-40 rounded-xl" />
                    <Skeleton className="h-28 rounded-xl" />
                </div>
            </div>
        </PageShell>
    );
}

/* ── List: filter row + stacked cards ────────────────────────────────────── */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <PageShell>
            <TitleBlock />
            <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-9 w-full max-w-xs rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
            <div className="flex flex-col gap-3">
                {Array.from({ length: rows }).map((_, i) => (
                    <CardRow key={i} />
                ))}
            </div>
        </PageShell>
    );
}

/* ── Split pane: list rail + detail pane (invitations, inbox-style pages) ── */
export function SplitPaneSkeleton({ rows = 6 }: { rows?: number }) {
    return (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:h-[calc(100vh-68px-2.5rem*2)] md:min-h-[560px] md:flex-row">
            <div className="flex w-full flex-col border-border md:w-80 md:border-r xl:w-96">
                <div className="space-y-3 border-b border-border px-4 pt-4 pb-3">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-8 w-full rounded-lg" />
                </div>
                <div className="divide-y divide-border/60">
                    {Array.from({ length: rows }).map((_, i) => (
                        <div key={i} className="flex items-start gap-2.5 px-4 py-3.5">
                            <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3.5 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                                <Skeleton className="h-4 w-24 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="hidden flex-1 items-center justify-center bg-muted/10 md:flex">
                <Skeleton className="h-40 w-2/3 rounded-2xl" />
            </div>
        </div>
    );
}

/* ── Table: data-table with header + rows ────────────────────────────────── */
export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <PageShell>
            <TitleBlock />
            <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-9 w-full max-w-xs" />
                <Skeleton className="h-9 w-28" />
            </div>
            <div className="overflow-hidden rounded-xl border">
                <div className="flex gap-4 border-b bg-muted/40 p-4">
                    {Array.from({ length: cols }).map((_, i) => (
                        <Skeleton key={i} className="h-4 flex-1" />
                    ))}
                </div>
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={r} className="flex gap-4 border-b p-4 last:border-0">
                        {Array.from({ length: cols }).map((_, c) => (
                            <Skeleton key={c} className="h-4 flex-1" />
                        ))}
                    </div>
                ))}
            </div>
        </PageShell>
    );
}

/* ── Profile: cover/avatar header + about + sections ─────────────────────── */
export function ProfileSkeleton() {
    return (
        <PageShell>
            <div className="overflow-hidden rounded-xl border">
                <Skeleton className="h-40 w-full rounded-none sm:h-52" />
                <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
                    <Skeleton className="-mt-16 h-24 w-24 shrink-0 rounded-full border-4 border-background" />
                    <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64 max-w-full" />
                    </div>
                    <Skeleton className="h-9 w-28" />
                </div>
            </div>
            <div className="flex flex-col gap-3 rounded-xl border p-6">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 rounded-lg" />
                            <div className="flex flex-1 flex-col gap-1.5">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex flex-col gap-4 rounded-xl border p-6">
                <Skeleton className="h-5 w-32" />
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                        <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
                        <div className="flex flex-1 flex-col gap-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-28" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        </PageShell>
    );
}

/* ── Detail: back link + title + main/side columns ───────────────────────── */
export function DetailSkeleton() {
    return (
        <PageShell>
            <Skeleton className="h-4 w-24" />
            <div className="flex flex-col gap-2">
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="h-4 w-40" />
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="flex flex-col gap-4 lg:col-span-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-40 rounded-xl" />
                    ))}
                </div>
                <div className="flex flex-col gap-4">
                    <Skeleton className="h-48 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                </div>
            </div>
        </PageShell>
    );
}

/* ── Form: label/input rows + actions ────────────────────────────────────── */
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
    return (
        <PageShell>
            <TitleBlock />
            <div className="flex max-w-2xl flex-col gap-5 rounded-xl border p-6">
                {Array.from({ length: fields }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                ))}
                <div className="flex gap-3 pt-2">
                    <Skeleton className="h-10 w-28 rounded-md" />
                    <Skeleton className="h-10 w-24 rounded-md" />
                </div>
            </div>
        </PageShell>
    );
}

/* ── Calendar: toolbar + weekday header + month grid ─────────────────────── */
export function CalendarSkeleton() {
    return (
        <PageShell>
            <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-7 w-40" />
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-9 w-28 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
            </div>
        </PageShell>
    );
}

/* ── Settings: section header + content blocks ───────────────────────────── */
export function SettingsSkeleton() {
    return (
        <PageShell>
            <div className="flex items-center gap-3 border-b pb-5">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-56" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
            </div>
            <Skeleton className="h-40 rounded-xl" />
        </PageShell>
    );
}
