import { MISLayout } from "@/components/mis";
import { AuditLogsClient } from "./AuditLogsClient";

export default function AuditLogsPage() {
    return (
        <MISLayout
            pageTitle="Audit Logs"
            pageDescription="View system activity, authentication events, and error logs"
        >
            <div className="max-w-7xl mx-auto">
                <AuditLogsClient />
            </div>
        </MISLayout>
    );
}
