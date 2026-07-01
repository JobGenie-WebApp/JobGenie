import { CandidateLayout } from "@/components/candidate";
import { JobBoardClient } from "./JobBoardClient";
import { SavedJobsView } from "./SavedJobsView";
import { AppliedJobsView } from "./AppliedJobsView";

const SECTION_META: Record<string, { title: string; description: string }> = {
    applied: { title: "Applied Jobs", description: "Track the jobs you've applied to and their status" },
    saved: { title: "Saved Jobs", description: "Jobs you've bookmarked to revisit and apply later" },
    browse: { title: "Browse Jobs", description: "Discover new opportunities that match your skills" },
};

export default async function JobsPage({
    searchParams,
}: {
    searchParams: Promise<{ section?: string }>;
}) {
    const { section } = await searchParams;
    const active = section === "applied" || section === "saved" ? section : "browse";
    const meta = SECTION_META[active];

    return (
        <CandidateLayout pageTitle={meta.title} pageDescription={meta.description}>
            <div className="max-w-7xl mx-auto">
                {active === "applied" ? <AppliedJobsView />
                    : active === "saved" ? <SavedJobsView />
                    : <JobBoardClient />}
            </div>
        </CandidateLayout>
    );
}
