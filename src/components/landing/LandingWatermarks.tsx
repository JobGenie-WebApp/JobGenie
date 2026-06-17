/**
 * Decorative background typography — low contrast, never interactive.
 * Pair with a parent that has `relative overflow-hidden`.
 */
export function LandingWatermarks({ variant }: { variant: 'hero' | 'features' | 'contact' }) {
    if (variant === 'hero') {
        return (
            <div
                className="pointer-events-none absolute inset-0 overflow-hidden select-none"
                aria-hidden
            >
                <span className="absolute -right-4 top-16 max-w-[100vw] font-black uppercase leading-none tracking-tighter text-foreground/[0.035] dark:text-foreground/[0.048] sm:-right-8 sm:top-20 lg:block xl:text-[min(12rem,18vw)] max-lg:hidden text-[clamp(5rem,16vw,11rem)]">
                    Match
                </span>
                <span className="absolute -bottom-4 -left-6 font-black uppercase leading-none tracking-tighter text-foreground/[0.022] dark:text-foreground/[0.034] max-sm:hidden sm:-left-10 sm:bottom-8 text-[clamp(3.5rem,11vw,8rem)] -rotate-[10deg]">
                    Hire
                </span>
                <span className="absolute right-[8%] top-[38%] hidden max-w-[40%] text-right font-mono text-[10px] font-medium uppercase leading-relaxed tracking-[0.32em] text-foreground/[0.055] dark:text-foreground/[0.075] lg:block">
                    Talent · Verify · Grow
                </span>
            </div>
        );
    }

    if (variant === 'features') {
        return (
            <div
                className="pointer-events-none absolute inset-0 overflow-hidden select-none"
                aria-hidden
            >
                <span className="absolute -left-8 top-1/4 font-black uppercase leading-none tracking-tighter text-foreground/[0.028] dark:text-foreground/[0.04] max-md:hidden text-[clamp(4rem,18vw,14rem)]">
                    Platform
                </span>
                <span className="absolute -right-6 bottom-8 font-black uppercase leading-none tracking-tighter text-foreground/[0.02] dark:text-foreground/[0.032] max-lg:hidden text-[clamp(3rem,12vw,9rem)] rotate-6">
                    Scale
                </span>
            </div>
        );
    }

    /* contact */
    return (
        <div
            className="pointer-events-none absolute inset-0 overflow-hidden select-none"
            aria-hidden
        >
            <span className="absolute -right-10 top-8 font-black uppercase leading-none tracking-tighter text-foreground/[0.03] dark:text-foreground/[0.042] max-md:hidden text-[clamp(3.5rem,14vw,10rem)]">
                Reach
            </span>
            <span className="absolute bottom-12 left-4 font-mono text-[11px] uppercase tracking-[0.28em] text-foreground/[0.05] dark:text-foreground/[0.065] max-sm:hidden">
                JobGenie · Enterprise
            </span>
        </div>
    );
}
