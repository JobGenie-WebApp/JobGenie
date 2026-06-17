import { CandidateLayout } from "@/components/candidate";
import { JobBoardClient } from "./JobBoardClient";

export default function JobsPage() {
    return (
        <CandidateLayout
            pageTitle="Browse Jobs"
            pageDescription="Discover new opportunities that match your skills"
        >
            <div className="max-w-5xl mx-auto">
                <JobBoardClient />
            </div>
        </CandidateLayout>
    );
}
