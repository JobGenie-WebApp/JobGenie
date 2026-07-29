import { MISLayout } from "@/components/mis";
import { MisJobEditClient } from "./MisJobEditClient";

export default async function MISJobEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <MISLayout
            pageTitle="Edit Job"
            pageDescription="Edit job advertisement details"
        >
            <div className="max-w-3xl mx-auto">
                <MisJobEditClient jobId={id} />
            </div>
        </MISLayout>
    );
}
