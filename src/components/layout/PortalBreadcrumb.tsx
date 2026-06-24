"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NAV_LABELS, SEGMENT_LABELS } from "./nav-config";

interface PortalBreadcrumbProps {
    /** Overrides the label of the last (current) crumb — useful for detail
     *  pages whose URL segment is an id (e.g. "/employer/jobs/123"). */
    breadcrumbOverride?: string;
}

/** Title-cases an unknown segment; collapses id-like segments to "Details". */
function labelForSegment(segment: string): string {
    if (/^[0-9]+$/.test(segment) || /^[0-9a-f-]{12,}$/i.test(segment)) {
        return "Details";
    }
    if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
    return segment
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

export function PortalBreadcrumb({ breadcrumbOverride }: PortalBreadcrumbProps) {
    const pathname = usePathname() || "";
    const parts = pathname.split("/").filter(Boolean);
    const portal = parts[0];

    const dashboardHref = `/${portal}/dashboard`;
    const crumbs: { label: string; href: string }[] = [];

    let acc = `/${portal}`;
    for (let i = 1; i < parts.length; i++) {
        acc += `/${parts[i]}`;
        if (parts[i] === "dashboard") continue;
        const label = NAV_LABELS[acc] ?? labelForSegment(parts[i]);
        crumbs.push({ label, href: acc });
    }

    if (breadcrumbOverride && crumbs.length > 0) {
        crumbs[crumbs.length - 1].label = breadcrumbOverride;
    }

    const onDashboard = crumbs.length === 0;

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    {onDashboard ? (
                        <BreadcrumbPage>Dashboard</BreadcrumbPage>
                    ) : (
                        <BreadcrumbLink asChild>
                            <Link href={dashboardHref}>Dashboard</Link>
                        </BreadcrumbLink>
                    )}
                </BreadcrumbItem>

                {crumbs.map((crumb, idx) => {
                    const isLast = idx === crumbs.length - 1;
                    return (
                        <React.Fragment key={crumb.href}>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={crumb.href}>{crumb.label}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
