"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NavGroup, NavItem } from "./nav-config";

interface SidebarNavGroupsProps {
    groups: NavGroup[];
    pathname: string;
    /** Whether the account is approved. Items with `requiresApproval` are
     *  disabled when this is false. Defaults to true (e.g. MIS). */
    isApproved?: boolean;
    /** Visibility config keyed by `visibilityKey`.
     *  - `undefined` → no visibility gating (show everything; MIS).
     *  - `null`      → still loading, render nothing.
     *  - object      → hide items whose key maps to `false`. */
    visibility?: Record<string, boolean> | null;
    /** Returns the badge count for an item (0 = no badge). */
    getBadgeCount?: (item: NavItem) => number;
}

function badgeClasses(badge: NavItem["badge"]): string {
    if (badge === "payments") return "bg-amber-500 text-white";
    return "bg-primary text-primary-foreground";
}

/** A nav item that expands to a list of `?section=` sub-sections. */
function CollapsibleNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
    const searchParams = useSearchParams();
    const children = item.children ?? [];

    const onPage = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const sections = children.map((c) => c.section);
    const param = searchParams.get("section");
    // The active sub-section: the URL param when valid, otherwise the first child
    // (which is what the settings page itself defaults to with no param).
    const activeSection = onPage
        ? (param && sections.includes(param) ? param : children[0]?.section)
        : null;

    // Open by default whenever we're on the page; a manual toggle overrides that.
    // (Derived rather than synced via an effect so it auto-opens on navigation.)
    const [userOpen, setUserOpen] = useState<boolean | null>(null);
    const open = userOpen ?? onPage;

    const Icon = item.icon;

    return (
        <Collapsible open={open} onOpenChange={setUserOpen} className="group/collapsible">
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton isActive={onPage} tooltip={item.title}>
                        <Icon />
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {children.map((sub) => {
                            const SubIcon = sub.icon;
                            return (
                                <SidebarMenuSubItem key={sub.section}>
                                    <SidebarMenuSubButton
                                        asChild
                                        isActive={activeSection === sub.section}
                                    >
                                        <Link href={sub.href}>
                                            <SubIcon />
                                            <span>{sub.title}</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            );
                        })}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}

export function SidebarNavGroups({
    groups,
    pathname,
    isApproved = true,
    visibility,
    getBadgeCount,
}: SidebarNavGroupsProps) {
    // Loading state for portals that gate by visibility config.
    if (visibility === null) return null;

    const isVisible = (item: NavItem) =>
        visibility === undefined ||
        !item.visibilityKey ||
        visibility[item.visibilityKey] !== false;

    return (
        <>
            {groups.map((group) => {
                const items = group.items.filter(isVisible);
                if (items.length === 0) return null;

                return (
                    <SidebarGroup key={group.label}>
                        <SidebarGroupLabel className="uppercase tracking-wider">
                            {group.label}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive =
                                        pathname === item.href ||
                                        pathname?.startsWith(`${item.href}/`);
                                    const isRestricted =
                                        !!item.requiresApproval && !isApproved;
                                    const count = getBadgeCount?.(item) ?? 0;

                                    if (isRestricted) {
                                        return (
                                            <SidebarMenuItem key={item.href}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <SidebarMenuButton
                                                            disabled
                                                            aria-disabled
                                                            className="cursor-not-allowed opacity-40"
                                                        >
                                                            <Icon />
                                                            <span>{item.title}</span>
                                                        </SidebarMenuButton>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right">
                                                        <span>{item.title}</span>
                                                        <span className="block text-xs text-amber-500">
                                                            Awaiting MIS approval
                                                        </span>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </SidebarMenuItem>
                                        );
                                    }

                                    if (item.children?.length) {
                                        return (
                                            <CollapsibleNavItem
                                                key={item.href}
                                                item={item}
                                                pathname={pathname ?? ""}
                                            />
                                        );
                                    }

                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                                tooltip={item.title}
                                            >
                                                <Link href={item.href}>
                                                    <Icon />
                                                    <span>{item.title}</span>
                                                    {count > 0 && (
                                                        <Badge
                                                            className={cn(
                                                                "ml-auto h-4 min-w-4 rounded-full px-1 text-[10px] font-semibold",
                                                                badgeClasses(item.badge),
                                                            )}
                                                        >
                                                            {count}
                                                        </Badge>
                                                    )}
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                );
            })}
        </>
    );
}
