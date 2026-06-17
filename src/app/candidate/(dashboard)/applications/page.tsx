import { CandidateLayout } from "@/components/candidate";
import { ApplicationsClient } from "./ApplicationsClient";

export default function ApplicationsPage() {
    return (
        <CandidateLayout
            pageTitle="My Applications"
            pageDescription="Track the status of your job applications"
        >
            <div className="max-w-4xl mx-auto">
                <ApplicationsClient />
            </div>
        </CandidateLayout>
    );
}
