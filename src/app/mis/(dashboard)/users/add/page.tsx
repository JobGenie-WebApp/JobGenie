import Link from "next/link";
import { MISLayout } from "@/components/mis";
import { AddMISUserForm } from "@/components/auth/AddMISUserForm";

export default function AddMISUserPage() {
    return (
        <MISLayout
            pageTitle="Add MIS User"
            pageDescription="Create a new MIS administrator account"
        >
            <div className="max-w-2xl mx-auto">
                {/* Back Link */}
                <div className="mb-6">
                    <Link
                        href="/mis/users"
                        className="text-sm text-muted-foreground hover:text-foreground inline-block"
                    >
                        ← Back to MIS Users
                    </Link>
                </div>

                {/* Form Card */}
                <div className="bg-card border rounded-lg p-6 shadow-sm">
                    <AddMISUserForm />
                </div>
            </div>
        </MISLayout>
    );
}
