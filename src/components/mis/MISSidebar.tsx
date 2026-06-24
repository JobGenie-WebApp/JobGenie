"use client";

import { usePathname } from "next/navigation";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarBrand } from "@/components/layout/SidebarBrand";
import { SidebarNavGroups } from "@/components/layout/SidebarNavGroups";
import { SidebarUserCard } from "@/components/layout/SidebarUserCard";
import { misNav } from "@/components/layout/nav-config";

interface MISSidebarProps {
    user: {
        firstName: string;
        lastName: string;
        email: string;
        profileImage?: string;
    };
}

export function MISSidebar({ user }: MISSidebarProps) {
    const pathname = usePathname();

    return (
        <Sidebar collapsible="icon" className="sidebar-portal">
            <SidebarHeader>
                <SidebarBrand href="/mis/dashboard" subtitle="MIS System" />
            </SidebarHeader>
            <SidebarContent>
                {/* MIS has no approval gating or visibility config — show all. */}
                <SidebarNavGroups groups={misNav} pathname={pathname ?? ""} />
            </SidebarContent>
            <SidebarFooter>
                <SidebarUserCard user={user} />
            </SidebarFooter>
        </Sidebar>
    );
}
