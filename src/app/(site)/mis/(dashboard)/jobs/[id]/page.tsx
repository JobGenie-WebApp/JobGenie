import { MISLayout } from "@/components/mis";
import { MisJobDetailClient } from "./MisJobDetailClient";

export default async function MISJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <MISLayout
            pageTitle="Job Detail"
            pageDescription="View and manage job advertisement"
        >
            <div className="max-w-5xl mx-auto">
                <MisJobDetailClient jobId={id} />
            </div>
        </MISLayout>
    );
}
