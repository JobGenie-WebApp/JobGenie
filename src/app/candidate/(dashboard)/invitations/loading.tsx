import { PageShell, TitleBlock, SplitPaneSkeleton } from "@/components/skeletons/PageSkeletons";

// Invitations is a split-pane (list rail + detail) page, not a stacked list —
// mirroring it here keeps the shape stable from loading.tsx through to content.
export default function Loading() {
    return (
        <PageShell>
            <TitleBlock />
            <SplitPaneSkeleton />
        </PageShell>
    );
}
