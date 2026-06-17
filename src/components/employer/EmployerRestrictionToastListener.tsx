"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

export function EmployerRestrictionToastListener() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();
    const hasShownToast = useRef(false);

    useEffect(() => {
        const info = searchParams.get("info");

        if (info === "approval_pending" && !hasShownToast.current) {
            hasShownToast.current = true;

            toast({
                className: "bg-red-500 border-red-700 text-white",
                title: "Access Restricted",
                description: "Your company profile is pending approval. You cannot access this feature until an administrator approves your company.",
                action: <AlertCircle className="h-5 w-5 text-white" />,
                duration: 4000,
            });

            // Clean up the URL
            const params = new URLSearchParams(searchParams.toString());
            params.delete("info");
            router.replace(`${pathname}?${params.toString()}`);

            // Reset the ref after a delay
            setTimeout(() => {
                hasShownToast.current = false;
            }, 1000);
        }
    }, [searchParams, router, pathname, toast]);

    return null;
}
