"use client";

import Link from "next/link";
import Image from "next/image";
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
                        <div className="flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary">
                            <Image src="/logo.jpg" alt="JobGenie" width={32} height={32} className="object-contain" priority />
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">JobGenie</span>
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
