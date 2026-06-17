import { MISLayout } from "@/components/mis";
import { ReportsClient } from "./ReportsClient";

export default function ReportsPage() {
    return (
        <MISLayout
            pageTitle="Reports & Analytics"
            pageDescription="System insights, statistics, and trends"
        >
            <div className="max-w-7xl mx-auto">
                <ReportsClient />
            </div>
        </MISLayout>
    );
}
