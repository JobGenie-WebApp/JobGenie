import { EmployerLayout } from "@/components/employer";
import { JobFormClient } from "../JobFormClient";

export default function NewJobPage() {
    return (
        <EmployerLayout
            pageTitle="Post New Job"
            pageDescription="Create a new job advertisement"
            fullHeight
        >
            <JobFormClient mode="create" />
        </EmployerLayout>
    );
}
