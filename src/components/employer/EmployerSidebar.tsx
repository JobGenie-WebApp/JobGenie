// prettier-ignore-file
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    Briefcase,
    FileText,
    Building2,
    Users,
    UserCog,
    Settings,
    Mail,
    CalendarDays,
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePendingInvitationCount } from "@/hooks/useInvitationCount";
import { usePendingPaymentCount } from "@/hooks/usePendingPaymentCount";

const navigationItems = [
    { title: "Dashboard",      href: "/employer/dashboard",   icon: LayoutDashboard, requiresApproval: false, visibilityKey: "dashboard" },
    { title: "Job Postings",   href: "/employer/jobs",        icon: Briefcase,       requiresApproval: true,  visibilityKey: "job-postings" },
    { title: "Applications",   href: "/employer/applications",icon: FileText,        requiresApproval: true,  visibilityKey: "applications" },
    { title: "Candidates",     href: "/employer/candidates",  icon: Users,           requiresApproval: true,  visibilityKey: "candidates" },
    { title: "Invitations",    href: "/employer/invitations", icon: Mail,            requiresApproval: true,  visibilityKey: "invitations" },
    { title: "Calendar",       href: "/employer/calendar",    icon: CalendarDays,    requiresApproval: true,  visibilityKey: "calendar" },
    { title: "Payments",       href: "/employer/payments",    icon: CreditCard,      requiresApproval: true,  visibilityKey: "payments" },
    { title: "Company Profile",href: "/employer/company",     icon: Building2,       requiresApproval: false, visibilityKey: "company-profile" },
    { title: "Company Admins", href: "/employer/admins",      icon: UserCog,         requiresApproval: true,  visibilityKey: "company-admins" },
    { title: "Settings",       href: "/employer/settings",    icon: Settings,        requiresApproval: true,  visibilityKey: "settings" },
];

const BRAND_NAME = "JobGenie";

export function EmployerSidebar() {
    const pathname = usePathname();
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
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

    return (
        <Sidebar
            collapsible="icon"
            className="border-r border-border/60 bg-background"
            style={{ boxShadow: "2px 0 8px 0 oklch(0 0 0 / 0.06), 4px 0 20px 0 oklch(0 0 0 / 0.04)" }}
        >
            <SidebarHeader className="h-14 px-3 flex items-center">
                <Link href="/employer/dashboard" className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-primary">
                        <Image src="/logo.jpg" alt={BRAND_NAME} width={36} height={36} className="object-contain" priority />
                    </div>
                    <span className={cn(
                        "text-base font-bold tracking-tight text-foreground",
                        "transition-[opacity,max-width] duration-200 overflow-hidden whitespace-nowrap",
                        isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[140px]"
                    )}>
                        {BRAND_NAME}
                    </span>
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-3 py-10">
                <SidebarMenu className="gap-4">
                    <TooltipProvider delayDuration={0}>
                        {navigationItems.map((item) => {
                            if (visibility === null) return null;
                            if (visibility[item.visibilityKey] === false) return null;

                            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                            const Icon = item.icon;
                            const isRestricted = item.requiresApproval && !isApproved;

                            if (isRestricted) {
                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className={cn(
                                                    "flex items-center gap-3 px-4 py-2.5 rounded-md cursor-not-allowed opacity-40",
                                                    "group-data-[collapsible=icon]:h-10! group-data-[collapsible=icon]:w-10! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center!"
                                                )}>
                                                    <Icon className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
                                                    <span className={cn(
                                                        "text-sm text-muted-foreground transition-[opacity,max-width] duration-200 overflow-hidden whitespace-nowrap",
                                                        isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[180px]"
                                                    )}>{item.title}</span>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                                <span>{item.title}</span>
                                                <span className="block text-xs text-amber-500">Awaiting MIS approval</span>
                                            </TooltipContent>
                                        </Tooltip>
                                    </SidebarMenuItem>
                                );
                            }

                            return (
                                <SidebarMenuItem key={item.href}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                                className={cn(
                                                    "h-10 rounded-md px-4 text-sm font-medium transition-colors duration-150",
                                                    "group-data-[collapsible=icon]:h-10! group-data-[collapsible=icon]:w-10! group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center!",
                                                    isActive
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                                )}
                                            >
                                                <Link href={item.href} className="flex items-center justify-between w-full gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <Icon className="h-[18px] w-[18px] shrink-0" />
                                                        <span className={cn(
                                                            "transition-[opacity,max-width] duration-200 overflow-hidden whitespace-nowrap",
                                                            isCollapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[180px]"
                                                        )}>{item.title}</span>
                                                    </div>
                                                    <span className={cn("transition-opacity duration-200", isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100")}>
                                                        {item.title === "Invitations" && pendingCount > 0 && (
                                                            <Badge className="h-4 min-w-4 rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                                                                {pendingCount}
                                                            </Badge>
                                                        )}
                                                        {item.title === "Payments" && pendingPaymentCount > 0 && (
                                                            <Badge className="h-4 min-w-4 rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
                                                                {pendingPaymentCount}
                                                            </Badge>
                                                        )}
                                                    </span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </TooltipTrigger>
                                        {isCollapsed && (
                                            <TooltipContent side="right">
                                                {item.title}
                                                {item.title === "Invitations" && pendingCount > 0 && (
                                                    <Badge className="ml-1.5 h-4 min-w-4 rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">{pendingCount}</Badge>
                                                )}
                                                {item.title === "Payments" && pendingPaymentCount > 0 && (
                                                    <Badge className="ml-1.5 h-4 min-w-4 rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">{pendingPaymentCount}</Badge>
                                                )}
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
