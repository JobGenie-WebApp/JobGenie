import { Skeleton } from "@/components/ui/skeleton";
import { PageShell, TitleBlock } from "@/components/skeletons/PageSkeletons";

/** Generic card-grid loading state. Shares PageShell with the page archetypes so
 *  it stays centred at the same max-width as the real content area. */
export function PageSkeleton() {
    return (
        <PageShell>
            <TitleBlock />
            <div className="flex flex-wrap gap-2">
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-16 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-3 w-1/2" />
                            </div>
                        </div>
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-4/5" />
                        <div className="flex gap-2 pt-1">
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </PageShell>
    );
}
