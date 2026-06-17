"use client";

import Link from "next/link";

interface MISDashboardCardProps {
    href: string;
    hoverClass: string;
    children: React.ReactNode;
}

export function MISDashboardCard({ href, hoverClass, children }: MISDashboardCardProps) {
    return (
        <div className="h-full">
            <Link
                href={href}
                className={`group flex flex-col bg-card border rounded-lg p-6 h-full ${hoverClass}`}
            >
                {children}
            </Link>
        </div>
    );
}
