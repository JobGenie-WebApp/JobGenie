import { MISLayout } from "@/components/mis";
import { PaymentsClient } from "./PaymentsClient";

export default function MISPaymentsPage() {
    return (
        <MISLayout
            pageTitle="Payments"
            pageDescription="Manage payment requests, review proofs, and configure bank details"
        >
            <div className="max-w-7xl mx-auto">
                <PaymentsClient />
            </div>
        </MISLayout>
    );
}
