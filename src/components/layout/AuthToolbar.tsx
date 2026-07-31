'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { JobGenieLogo } from '@/components/brand/JobGenieLogo';

export function AuthToolbar() {
    return (
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-background/92 px-4 backdrop-blur-sm supports-[backdrop-filter]:bg-background/88 sm:h-[3.75rem] sm:px-6">
            <Link
                href="/"
                className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            >
                <JobGenieLogo
                    priority
                    imageClassName="h-10 w-auto sm:h-11"
                    sizes="(min-width: 640px) 44px, 40px"
                />
            </Link>
            <div className="flex items-center gap-1 sm:gap-3">
                <Link
                    href="/"
                    className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                >
                    Home
                </Link>
                <ThemeToggle />
            </div>
        </header>
    );
}
