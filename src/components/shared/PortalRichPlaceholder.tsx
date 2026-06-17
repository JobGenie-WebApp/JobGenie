import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PortalRichPlaceholder({
    icon: Icon,
    title,
    description,
    primaryAction,
    secondaryAction,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
    primaryAction?: { label: string; href: string };
    secondaryAction?: { label: string; href: string };
}) {
    return (
        <Card variant="glass" className="overflow-hidden border-primary/15">
            <CardContent className="flex flex-col items-center gap-5 px-6 py-14 text-center md:flex-row md:items-center md:gap-8 md:text-left">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/25 to-accent/20 ring-1 ring-primary/25">
                    <Icon className="h-9 w-9 text-primary" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                    <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground md:text-[15px]">{description}</p>
                    {(primaryAction || secondaryAction) && (
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-3 md:justify-start">
                            {primaryAction ? (
                                <Button variant="gradient" asChild>
                                    <Link href={primaryAction.href}>{primaryAction.label}</Link>
                                </Button>
                            ) : null}
                            {secondaryAction ? (
                                <Button variant="outline" className="border-primary/25" asChild>
                                    <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                                </Button>
                            ) : null}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
