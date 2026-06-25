"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarBrand } from "@/components/layout/SidebarBrand";
import { SidebarNavGroups } from "@/components/layout/SidebarNavGroups";
import { SidebarUserCard } from "@/components/layout/SidebarUserCard";
import { candidateNav, type NavItem } from "@/components/layout/nav-config";
import { useUnopenedInvitationCount } from "@/hooks/useInvitationCount";

interface CandidateSidebarProps {
    user: {
        firstName: string;
        lastName: string;
        email: string;
        profileImage?: string;
        membershipNo?: string;
    };
}

export function CandidateSidebar({ user }: CandidateSidebarProps) {
    const pathname = usePathname();
    const [isApproved, setIsApproved] = useState<boolean>(true);
    const [visibility, setVisibility] = useState<Record<string, boolean> | null>(null);

    const { count: unopenedCount } = useUnopenedInvitationCount();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileResponse, visibilityResponse] = await Promise.all([
                    fetch("/api/candidate/profile"),
                    fetch("/api/candidate/sidebar-visibility"),
                ]);
                const profileData = await profileResponse.json();
                if (profileData.success && profileData.data) {
                    setIsApproved(profileData.data.approval_status === "approved");
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

    const getBadgeCount = (item: NavItem) =>
        item.badge === "invitations" ? unopenedCount : 0;

    return (
        <Sidebar collapsible="icon" className="sidebar-portal">
            <SidebarHeader>
                <SidebarBrand href="/candidate/dashboard" subtitle={user.membershipNo} />
            </SidebarHeader>
            <SidebarContent>
                <SidebarNavGroups
                    groups={candidateNav}
                    pathname={pathname ?? ""}
                    isApproved={isApproved}
                    visibility={visibility}
                    getBadgeCount={getBadgeCount}
                />
            </SidebarContent>
            <SidebarFooter>
                <SidebarUserCard
                    user={user}
                    detail={user.membershipNo ? `Membership No: ${user.membershipNo}` : undefined}
                    profileHref="/candidate/profile"
                    settingsHref="/candidate/settings"
                />
            </SidebarFooter>
        </Sidebar>
    );
}
