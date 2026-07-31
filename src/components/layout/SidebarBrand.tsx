"use client";

import Link from "next/link";
import { JobGenieLogo } from "@/components/brand/JobGenieLogo";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

interface SidebarBrandProps {
    /** Dashboard href for this portal. */
    href: string;
    /** Secondary line under the brand name (membership no / company / "MIS System"). */
    subtitle?: string;
}

export function SidebarBrand({ href, subtitle }: SidebarBrandProps) {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent">
                    <Link href={href}>
                        <div className="flex size-9 shrink-0 items-center justify-center">
                            <JobGenieLogo
                                imageClassName="h-9 w-auto"
                                wordmarkClassName="!hidden"
                                sizes="36px"
                            />
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">
                                Job<span className="text-primary">Genie</span>
                            </span>
                            {subtitle && (
                                <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
                            )}
                        </div>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
