"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmployerStatsCardProps {
    title: string;
    value: number | string;
    description: string;
    icon: React.ReactNode;
    colorScheme?: "blue" | "green" | "amber" | "purple" | "rose" | "cyan";
}

const colorMap = {
    blue: {
        iconBg:
            "bg-[linear-gradient(135deg,oklch(from_var(--accent-sky)_l_c_h_/_0.12),oklch(from_var(--accent-sky)_l_c_h_/_0.06))]",
        iconColor: "text-blue-600 dark:text-blue-400",
    },
    green: {
        iconBg:
            "bg-[linear-gradient(135deg,oklch(from_var(--primary)_l_c_h_/_0.12),oklch(from_var(--accent)_l_c_h_/_0.06))]",
        iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    amber: {
        iconBg:
            "bg-[linear-gradient(135deg,oklch(from_var(--accent-amber)_l_c_h_/_0.12),oklch(from_var(--accent-amber)_l_c_h_/_0.06))]",
        iconColor: "text-amber-600 dark:text-amber-400",
    },
    purple: {
        iconBg:
            "bg-[linear-gradient(135deg,oklch(from_var(--accent-violet)_l_c_h_/_0.12),oklch(from_var(--accent-violet)_l_c_h_/_0.06))]",
        iconColor: "text-violet-600 dark:text-violet-400",
    },
    rose: {
        iconBg:
            "bg-[linear-gradient(135deg,oklch(from_var(--accent-rose)_l_c_h_/_0.12),oklch(from_var(--accent-rose)_l_c_h_/_0.06))]",
        iconColor: "text-rose-600 dark:text-rose-400",
    },
    cyan: {
        iconBg:
            "bg-[linear-gradient(135deg,oklch(from_var(--accent-sky)_l_c_h_/_0.12),oklch(from_var(--accent-sky)_l_c_h_/_0.06))]",
        iconColor: "text-cyan-600 dark:text-cyan-400",
    },
};

export function EmployerStatsCard({
    title,
    value,
    description,
    icon,
    colorScheme = "green",
}: EmployerStatsCardProps) {
    const colors = colorMap[colorScheme];

    return (
        <div className="h-full">
            <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <div
                        className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl",
                            colors.iconBg,
                            colors.iconColor
                        )}
                    >
                        {icon}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold tabular-nums">{value}</div>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </CardContent>
            </Card>
        </div>
    );
}
