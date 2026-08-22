"use client";

import Image from "next/image";
import Link from "next/link";
import {
    ArrowLeft,
    BadgeCheck,
    Check,
    ShieldCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { JobGenieLogo } from "@/components/brand/JobGenieLogo";
import { cn } from "@/lib/utils";

const DEFAULT_BULLETS = [
    "Verified employers & credential-backed candidates",
    "Interview orchestration in one timeline",
    "Audit-ready trails for enterprise teams",
];

type FormWidthKey = "md" | "lg" | "xl" | "2xl";

const formMaxWidth: Record<FormWidthKey, string> = {
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-4xl",
};

export type AuthShellProps = {
    sideHeadline: string;
    sideDescription?: string;
    bullets?: string[];
    formWidth?: FormWidthKey;
    bare?: boolean;
    children: React.ReactNode;
};

function Brand() {
    return (
        <Link
            href="/"
            className="group inline-flex min-h-11 items-center gap-3 rounded-xl outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="JobGenie home"
        >
            <JobGenieLogo
                priority
                imageClassName="h-12 w-auto"
                wordmarkClassName="!hidden"
            />
        </Link>
    );
}

function TrustPanel({
    headline,
    description,
    bullets,
}: {
    headline: string;
    description: string;
    bullets: string[];
}) {
    return (
        <aside className="relative hidden h-dvh min-h-0 overflow-hidden bg-[#07150e] px-8 pb-10 pt-28 text-white lg:flex lg:flex-col lg:justify-between xl:px-12">
            <div
                className="pointer-events-none absolute inset-0 opacity-90"
                style={{
                    background:
                        "radial-gradient(circle at 15% 10%, rgba(53,199,120,.26), transparent 32%), radial-gradient(circle at 90% 70%, rgba(53,199,120,.16), transparent 36%), linear-gradient(145deg, rgba(255,255,255,.03), transparent 50%)",
                }}
                aria-hidden="true"
            />
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.14]"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)",
                    backgroundSize: "44px 44px",
                    maskImage: "linear-gradient(to bottom, black, transparent 80%)",
                }}
                aria-hidden="true"
            />

            <div className="relative z-10 max-w-lg">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Trusted hiring workspace
                </div>

                <h2 className="mt-6 max-w-md text-3xl font-bold leading-[1.08] tracking-[-0.04em] text-white xl:text-[2.7rem]">
                    {headline}
                </h2>
                <p className="mt-5 max-w-md text-[15px] leading-7 text-white/62">
                    {description}
                </p>

                <ul className="mt-8 max-w-md space-y-3.5">
                    {bullets.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm leading-6 text-white/78">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-300/15 text-emerald-300 ring-1 ring-emerald-200/20">
                                <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                            </span>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="pointer-events-none absolute -bottom-28 -right-24 z-[1] h-[650px] w-[440px] opacity-[0.32] xl:-right-16 xl:opacity-[0.44]" aria-hidden="true">
                <Image
                    src="/Genie3.png"
                    alt=""
                    fill
                    sizes="440px"
                    className="object-contain object-bottom"
                    priority
                />
            </div>

            <div className="relative z-10 max-w-sm rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-300/15 text-emerald-300 ring-1 ring-emerald-200/20">
                        <BadgeCheck className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-white">Built around verified trust</p>
                        <p className="mt-0.5 text-xs leading-5 text-white/55">
                            One secure platform for candidates and hiring teams.
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export function AuthShell({
    sideHeadline,
    sideDescription = "One workspace for discovery, screening, and scheduling — built for teams that treat hiring like infrastructure.",
    bullets = DEFAULT_BULLETS,
    formWidth = "md",
    bare = false,
    children,
}: AuthShellProps) {
    const year = new Date().getFullYear();

    return (
        <div className="relative h-dvh overflow-hidden bg-background text-foreground">
            <div className="pointer-events-none fixed inset-0 z-0 lg:left-[42%]" aria-hidden="true">
                <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-primary/[0.08] blur-3xl" />
                <div className="absolute -bottom-36 left-0 h-80 w-80 rounded-full bg-primary/[0.06] blur-3xl" />
                <div
                    className="absolute inset-0 opacity-[0.24] dark:opacity-[0.12]"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle at center, color-mix(in oklch, var(--primary) 28%, transparent) 1px, transparent 1px)",
                        backgroundSize: "28px 28px",
                        maskImage: "radial-gradient(circle at 60% 40%, black, transparent 72%)",
                    }}
                />
            </div>

            <header className="absolute inset-x-0 top-0 z-30 flex h-20 items-center justify-between px-4 sm:px-7 lg:px-10 xl:px-12">
                <Brand />
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <Link
                        href="/"
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/80 bg-background/70 px-3.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-md transition-colors hover:border-primary/30 hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Back home</span>
                        <span className="sm:hidden">Home</span>
                    </Link>
                </div>
            </header>

            <div className="relative z-10 grid h-dvh min-h-0 overflow-hidden lg:grid-cols-[42%_58%]">
                <TrustPanel headline={sideHeadline} description={sideDescription} bullets={bullets} />

                <main className="flex h-dvh min-h-0 flex-col overflow-hidden pt-20">
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
                        <div className="flex min-h-full items-center justify-center px-4 py-8 sm:px-7 sm:py-10 xl:px-12">
                            <div className={cn("w-full", formMaxWidth[formWidth])}>
                                {bare ? (
                                    children
                                ) : (
                                    <div className="rounded-[1.5rem] border border-border/80 bg-card/95 p-6 shadow-[0_20px_70px_-36px_rgba(0,0,0,.42)] ring-1 ring-primary/[0.05] backdrop-blur-xl sm:p-8">
                                        {children}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <footer className="flex shrink-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-border/60 bg-background/70 px-4 py-4 text-xs text-muted-foreground backdrop-blur-md">
                        <span>© {year} JobGenie</span>
                        <span aria-hidden="true">·</span>
                        <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
                        <span aria-hidden="true">·</span>
                        <Link href="/terms" className="transition-colors hover:text-foreground">Terms</Link>
                    </footer>
                </main>
            </div>
        </div>
    );
}
