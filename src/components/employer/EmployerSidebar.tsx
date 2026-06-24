"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarBrand } from "@/components/layout/SidebarBrand";
import { SidebarNavGroups } from "@/components/layout/SidebarNavGroups";
import { SidebarUserCard } from "@/components/layout/SidebarUserCard";
import { employerNav, type NavItem } from "@/components/layout/nav-config";
import { usePendingInvitationCount } from "@/hooks/useInvitationCount";
import { usePendingPaymentCount } from "@/hooks/usePendingPaymentCount";

interface EmployerSidebarProps {
    user: {
        firstName: string;
        lastName: string;
        email: string;
        companyName?: string;
    };
    /** Drives whether super-admin-only settings sub-sections are shown. */
    isSuperAdmin?: boolean;
}

export function EmployerSidebar({ user, isSuperAdmin = false }: EmployerSidebarProps) {
    const pathname = usePathname();

    // Hide super-admin-only settings sub-sections from regular employers.
    const nav = useMemo(
        () =>
            employerNav.map((group) => ({
                ...group,
                items: group.items.map((item) =>
                    item.children
                        ? { ...item, children: item.children.filter((c) => !c.superAdminOnly || isSuperAdmin) }
                        : item,
                ),
            })),
        [isSuperAdmin],
    );
    const [isApproved, setIsApproved] = useState<boolean>(true);
    const [visibility, setVisibility] = useState<Record<string, boolean> | null>(null);

    const { count: pendingCount } = usePendingInvitationCount();
    const { count: pendingPaymentCount } = usePendingPaymentCount();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [companyResponse, visibilityResponse] = await Promise.all([
                    fetch("/api/employer/company"),
                    fetch("/api/employer/sidebar-visibility"),
                ]);
                const companyData = await companyResponse.json();
                if (companyData.success && companyData.data) {
                    setIsApproved(companyData.data.approval_status === "approved");
                }
                const visibilityData = await visibilityResponse.json();
                if (visibilityData.success) {
                    setVisibility(visibilityData.visibility);
                }
            } catch (error) {
                console.error("Error fetching sidebar data:", error);
            }
        };
        fetchData();
    }, []);

    const getBadgeCount = (item: NavItem) => {
        if (item.badge === "invitations") return pendingCount;
        if (item.badge === "payments") return pendingPaymentCount;
        return 0;
    };

    return (
        <Sidebar collapsible="icon" className="sidebar-portal">
            <SidebarHeader>
                <SidebarBrand href="/employer/dashboard" subtitle={user.companyName} />
            </SidebarHeader>
            <SidebarContent>
                <SidebarNavGroups
                    groups={nav}
                    pathname={pathname ?? ""}
                    isApproved={isApproved}
                    visibility={visibility}
                    getBadgeCount={getBadgeCount}
                />
            </SidebarContent>
            <SidebarFooter>
                <SidebarUserCard
                    user={user}
                    detail={user.companyName}
                    settingsHref="/employer/settings"
                />
            </SidebarFooter>
        </Sidebar>
    );
}
