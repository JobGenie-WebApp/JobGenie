import { MISLayout } from "@/components/mis";
import { PaymentsClient, type PaymentsTabKey } from "./PaymentsClient";

const TABS = new Set<PaymentsTabKey>(["payments", "placements", "compliance", "configuration"]);

export default async function MISPaymentsPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const requestedTab = (await searchParams).tab as PaymentsTabKey | undefined;
    const initialTab = requestedTab && TABS.has(requestedTab) ? requestedTab : "payments";

    return (
        <MISLayout
            pageTitle="Payments"
            pageDescription="Manage payment requests, review proofs, and configure bank details"
        >
            <div className="max-w-7xl mx-auto">
                <PaymentsClient initialTab={initialTab} />
            </div>
        </MISLayout>
    );
}
