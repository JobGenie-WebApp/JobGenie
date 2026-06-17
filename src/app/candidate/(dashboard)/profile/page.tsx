import { CandidateLayout } from "@/components/candidate";
import { ProfileContent } from "@/components/candidate/profile/ProfileContent";

export default function ProfilePage() {
    return (
        <CandidateLayout pageTitle="My Profile" pageDescription="View your professional profile">
            <ProfileContent />
        </CandidateLayout>
    );
}
