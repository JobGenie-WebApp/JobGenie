import { CandidateLayout } from "@/components/candidate";
import { SettingsClient } from "./SettingsClient";

export default function SettingsPage() {
    return (
        <CandidateLayout
            pageTitle="Settings"
            pageDescription="Manage your account, appearance, notifications and job preferences"
        >
            <SettingsClient />
        </CandidateLayout>
    );
}
