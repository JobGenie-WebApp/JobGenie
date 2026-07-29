import { MISLayout } from "@/components/mis";
import { MisJobsClient } from "./MisJobsClient";

export default function MISJobsPage() {
    return (
        <MISLayout
            pageTitle="Job Advertisements"
            pageDescription="View and manage all job advertisements on the platform"
            fullHeight
        >
            <MisJobsClient />
        </MISLayout>
    );
}
