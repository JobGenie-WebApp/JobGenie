import { EmployerLayout } from "@/components/employer";
import { PaymentsClient } from "./PaymentsClient";

export default function EmployerPaymentsPage() {
    return (
        <EmployerLayout
            pageTitle="Payments"
            pageDescription="View payment requests, upload payment proofs, and track payment history"
        >
            <div className="max-w-5xl mx-auto">
                <PaymentsClient />
            </div>
        </EmployerLayout>
    );
}
