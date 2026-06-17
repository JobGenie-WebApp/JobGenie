import { CandidateLayout } from "@/components/candidate";
import { JobDetailClient } from "./JobDetailClient";

export default async function CandidateJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <CandidateLayout
            pageTitle="Job Details"
            pageDescription="View job details and apply"
        >
            <div className="max-w-4xl mx-auto">
                <JobDetailClient jobId={id} />
            </div>
        </CandidateLayout>
    );
}
