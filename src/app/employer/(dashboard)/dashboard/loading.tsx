import { Skeleton } from "@/components/ui/skeleton";
import { PageShell, TitleBlock } from "@/components/skeletons/PageSkeletons";

// Mirrors the employer dashboard: stat row → shortcuts grid → two rows of
// three widget cards. Kept local since no other page shares this shape.
export default function Loading() {
    return (
        <PageShell>
            <TitleBlock />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-xl" />
                ))}
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-xl" />
                    ))}
                </div>
            </div>

            {Array.from({ length: 2 }).map((_, row) => (
                <div key={row} className="grid gap-6 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-72 rounded-2xl" />
                    ))}
                </div>
            ))}
        </PageShell>
    );
}
