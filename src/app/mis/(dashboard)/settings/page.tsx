import { MISLayout } from "@/components/mis";
import { MasterDataClient } from "./MasterDataClient";

export default function SettingsPage() {
    return (
        <MISLayout
            pageTitle="Master Data Management"
            pageDescription="Manage industries, job designations, and seniority levels"
        >
            <div className="max-w-7xl mx-auto">
                <MasterDataClient />
            </div>
        </MISLayout>
    );
}
