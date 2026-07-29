import { EmployerLayout } from "@/components/employer";
import { JobFormClient } from "../../JobFormClient";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <EmployerLayout
            pageTitle="Edit Job"
            pageDescription="Update your job advertisement"
            fullHeight
        >
            <JobFormClient mode="edit" jobId={id} />
        </EmployerLayout>
    );
}
