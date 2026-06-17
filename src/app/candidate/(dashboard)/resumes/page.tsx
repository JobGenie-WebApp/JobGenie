import { CandidateLayout } from "@/components/candidate";
import { ResumesClientContent } from "./ResumesClientContent";

export default function ResumesPage() {
    return (
        <CandidateLayout
            pageTitle="My Resumes"
            pageDescription="Upload up to 5 resumes. Mark one as primary for your profile."
        >
            <ResumesClientContent />
        </CandidateLayout>
    );
}
