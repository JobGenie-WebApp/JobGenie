import { EmployerLayout } from "@/components/employer";
import { JobsClient } from "./JobsClient";

export default function EmployerJobsPage() {
    return (
        <EmployerLayout
            pageTitle="Job Postings"
            pageDescription="Create and manage your job advertisements"
            fullHeight
        >
            <JobsClient />
        </EmployerLayout>
    );
}
