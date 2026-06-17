"use client";

import { isRestrictedPath } from "@/lib/utils/approval-utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface EmployerAccessControlProps {
    children: React.ReactNode;
    approvalStatus: "pending" | "approved" | "rejected";
}

export function EmployerAccessControl({ children, approvalStatus }: EmployerAccessControlProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (approvalStatus !== "approved") {
            if (isRestrictedPath(pathname)) {
                // Redirect to dashboard with info param
                router.push("/employer/dashboard?info=approval_pending");
            }
        }
        setIsChecking(false);
    }, [pathname, approvalStatus, router]);

    // Optional: Show loading state while checking? 
    // Usually not needed as the content will just be replaced by redirect 
    // but preventing flash of content is good.
    // However, since this wraps the whole content, hiding it might cause CLS.
    // We'll return children but the effect will trigger redirect quickly.

    return <>{children}</>;
}
