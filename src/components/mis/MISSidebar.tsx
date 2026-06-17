"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    UserSquare,
    Building2,
    Briefcase,
    Settings,
    BarChart3,
    Calendar,
    Shield,
    FileText,
    CreditCard,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const navigationItems = [
    {
        title: "Dashboard",
        href: "/mis/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "MIS User Management",
        href: "/mis/users",
        icon: Users,
    },
    {
        title: "Roles & Permissions",
        href: "/mis/roles",
        icon: Shield,
    },
    {
        title: "Candidates",
        href: "/mis/candidates",
        icon: UserSquare,
    },
    {
        title: "Employers",
        href: "/mis/employers",
        icon: Building2,
    },
    {
        title: "Interviews",
        href: "/mis/interviews",
        icon: Calendar,
    },
    {
        title: "Jobs",
        href: "/mis/jobs",
        icon: Briefcase,
    },
    {
        title: "Payments",
        href: "/mis/payments",
        icon: CreditCard,
    },
    {
        title: "Reports & Analytics",
        href: "/mis/reports",
        icon: BarChart3,
    },
    {
        title: "Audit Logs",
        href: "/mis/audit",
        icon: FileText,
    },
    {
        title: "Master Data",
        href: "/mis/settings",
        icon: Settings,
    },
];

export function MISSidebar() {
    const pathname = usePathname();
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    return (
        <Sidebar collapsible="icon" className={cn("shadow-sm", "sidebar-portal")}>
            {/* Header with Logo - height matches the header (h-16 = 64px) */}
            <SidebarHeader className="h-16 px-4 flex items-center">
                <Link href="/mis/dashboard" className="flex items-center gap-3">
                    {/* Logo */}
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden"
                         style={{ background: "var(--gradient-primary)" }}>
                        <Image
                            src="/logo.jpg"
                            alt="JobGenie"
                            width={36}
                            height={36}
                            className="object-contain"
                            priority
                        />
                    </div>
                    <div className={cn(
                        "flex flex-col transition-[opacity,max-width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden whitespace-nowrap",
                        isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[160px]"
                    )}>
                        <span className="text-lg font-semibold text-sidebar-foreground">
                            JobGenie
                        </span>
                        <span className="text-xs text-muted-foreground">
                            MIS System
                        </span>
                    </div>
                </Link>
            </SidebarHeader>

            {/* Navigation */}
            <SidebarContent className="p-2">
                <SidebarMenu>
                    <TooltipProvider delayDuration={0}>
                        {navigationItems.map((item) => {
                            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                            const Icon = item.icon;

                            return (
                                <SidebarMenuItem key={item.href}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                                size="lg"
                                                className={cn(
                                                    "transition-colors duration-150 hover:bg-sidebar-accent/8",
                                                    "group-data-[collapsible=icon]:!h-12 group-data-[collapsible=icon]:!w-12 group-data-[collapsible=icon]:!p-3",
                                                    isActive && "sidebar-item-active"
                                                )}
                                            >
                                                <Link href={item.href} className="gap-3 flex items-center">
                                                    <Icon className="h-6 w-6 shrink-0" />
                                                    <span className={cn(
                                                        "transition-[opacity,max-width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden whitespace-nowrap",
                                                        isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"
                                                    )}>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </TooltipTrigger>
                                        {isCollapsed && (
                                            <TooltipContent side="right" className="font-medium">
                                                {item.title}
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </SidebarMenuItem>
                            );
                        })}
                    </TooltipProvider>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    );
}
