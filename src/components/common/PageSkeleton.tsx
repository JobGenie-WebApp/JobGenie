import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
    return (
        <div className="flex h-full w-full flex-col gap-6 p-4 md:p-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-8 w-[250px] md:w-[300px]" />
                <Skeleton className="h-4 w-[200px] md:w-[400px]" />
            </div>

            {/* Actions/Filters Row */}
            <div className="flex gap-2 mt-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-16" />
            </div>

            {/* Grid Content */}
            <div className="grid gap-4 mt-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-[140px] w-full rounded-xl" />
                ))}
            </div>
        </div>
    );
}
