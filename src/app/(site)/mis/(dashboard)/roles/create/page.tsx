import Link from "next/link";
import { MISLayout } from "@/components/mis";
import { CreateRoleForm } from "./CreateRoleForm";

export default function CreateRolePage() {
    return (
        <MISLayout
            pageTitle="Create New Role"
            pageDescription="Create a new role and assign permissions later"
        >
            <div className="max-w-2xl mx-auto">
                {/* Back Link */}
                <div className="mb-6">
                    <Link
                        href="/mis/roles"
                        className="text-sm text-muted-foreground hover:text-foreground inline-block"
                    >
                        ← Back to Roles
                    </Link>
                </div>

                {/* Form Card */}
                <div className="bg-card border rounded-lg p-6 shadow-sm">
                    <CreateRoleForm />
                </div>
            </div>
        </MISLayout>
    );
}
