import { EmployerLayout } from "@/components/employer";
import { JobDetailClient } from "./JobDetailClient";

export default async function EmployerJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <EmployerLayout
            pageTitle="Job Detail"
            pageDescription="View and manage your job advertisement"
        >
            <div className="max-w-5xl mx-auto">
                <JobDetailClient jobId={id} />
            </div>
        </EmployerLayout>
    );
}
