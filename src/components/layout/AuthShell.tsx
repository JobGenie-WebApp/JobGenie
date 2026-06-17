'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { AuthCardAnimator } from '@/components/layout/AuthCardAnimator';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

// ── Cursor spotlight ──────────────────────────────────────────────────────────
function CursorSpotlight() {
    const [pos, setPos] = useState({ x: -9999, y: -9999 });
    useEffect(() => {
        const fn = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', fn, { passive: true });
        return () => window.removeEventListener('mousemove', fn);
    }, []);
    return (
        <div
            className="pointer-events-none fixed inset-0 z-1 hidden md:block"
            style={{
                background: `radial-gradient(520px at ${pos.x}px ${pos.y}px, rgba(0,200,80,0.07), transparent 40%)`,
            }}
            aria-hidden
        />
    );
}

// ── Animated ambient orbs ─────────────────────────────────────────────────────
const ORBS = [
    { size: 320, top: '-8%', left: '-6%',  duration: 22, delay: 0,  opacityDark: 0.18, opacityLight: 0.10 },
    { size: 260, top: '55%', left: '80%',  duration: 28, delay: 6,  opacityDark: 0.14, opacityLight: 0.08 },
    { size: 200, top: '30%', left: '42%',  duration: 34, delay: 12, opacityDark: 0.10, opacityLight: 0.06 },
    { size: 180, top: '80%', left: '15%',  duration: 26, delay: 4,  opacityDark: 0.12, opacityLight: 0.07 },
    { size: 140, top: '10%', left: '70%',  duration: 30, delay: 9,  opacityDark: 0.13, opacityLight: 0.07 },
];

const GLOWS = [
    { size: 44, top: '18%', left: '22%', duration: 8,  delay: 0 },
    { size: 36, top: '72%', left: '65%', duration: 10, delay: 2 },
    { size: 50, top: '45%', left: '88%', duration: 9,  delay: 4 },
    { size: 38, top: '88%', left: '38%', duration: 11, delay: 1 },
    { size: 42, top: '5%',  left: '55%', duration: 7,  delay: 3 },
];

function AuthBackground() {
    return (
        <>
            {/* Large ambient blobs — opacity differs per theme via CSS classes */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
                {ORBS.map((o, i) => (
                    <div
                        key={i}
                        className="auth-orb absolute rounded-full"
                        style={{
                            width:  o.size,
                            height: o.size,
                            top:    o.top,
                            left:   o.left,
                            filter: 'blur(60px)',
                            animation: `authOrbFloat ${o.duration}s ${o.delay}s ease-in-out infinite`,
                            willChange: 'transform',
                            // CSS vars swap with theme; see keyframe injection
                            ['--op-dark' as string]: o.opacityDark,
                            ['--op-light' as string]: o.opacityLight,
                        }}
                    />
                ))}
            </div>

            {/* Small sharp glows */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
                {GLOWS.map((g, i) => (
                    <div
                        key={i}
                        className="auth-glow absolute rounded-full"
                        style={{
                            width:  g.size,
                            height: g.size,
                            top:    g.top,
                            left:   g.left,
                            filter: 'blur(7px)',
                            animation: `authGlowFloat${i} ${g.duration}s ${g.delay}s ease-in-out infinite`,
                            willChange: 'transform',
                        }}
                    />
                ))}
            </div>

            {/* Base atmosphere gradients — theme-aware via CSS class */}
            <div className="auth-atmosphere pointer-events-none fixed inset-0 z-0" aria-hidden />

            {/* Grid — theme-aware via CSS class */}
            <div className="auth-grid pointer-events-none fixed inset-0 z-0" aria-hidden />
        </>
    );
}

// ── Keyframe + theme-aware style injection ────────────────────────────────────
function AuthKeyframes() {
    useEffect(() => {
        const id = 'auth-shell-keyframes';
        if (document.getElementById(id)) return;
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
            /* Background — dark default */
            .auth-shell-root {
                background-color: oklch(0.10 0.006 155);
            }
            /* Background — light mode */
            :root:not(.dark) .auth-shell-root {
                background-color: oklch(0.97 0.006 145);
            }

            /* Orbs */
            .auth-orb {
                background: radial-gradient(circle,
                    rgba(0,220,80, var(--op-dark, 0.14)) 0%,
                    rgba(0,180,60, calc(var(--op-dark, 0.14) * 0.5)) 40%,
                    transparent 70%);
            }
            :root:not(.dark) .auth-orb {
                background: radial-gradient(circle,
                    rgba(0,180,60, var(--op-light, 0.08)) 0%,
                    rgba(0,150,50, calc(var(--op-light, 0.08) * 0.5)) 40%,
                    transparent 70%);
            }

            /* Small glows */
            .auth-glow {
                background: radial-gradient(circle, rgba(0,255,100,0.55) 0%, rgba(0,220,80,0.30) 40%, transparent 70%);
                box-shadow: 0 0 18px rgba(0,255,100,0.35), 0 0 36px rgba(0,220,80,0.15);
            }
            :root:not(.dark) .auth-glow {
                background: radial-gradient(circle, rgba(0,200,70,0.40) 0%, rgba(0,170,60,0.20) 40%, transparent 70%);
                box-shadow: 0 0 14px rgba(0,200,70,0.25), 0 0 28px rgba(0,170,60,0.10);
            }

            /* Atmosphere */
            .auth-atmosphere {
                background:
                    radial-gradient(ellipse 75% 55% at 10% 10%, oklch(0.28 0.08 155 / 0.28), transparent 55%),
                    radial-gradient(ellipse 55% 45% at 90% 90%, oklch(0.24 0.06 175 / 0.20), transparent 50%);
            }
            :root:not(.dark) .auth-atmosphere {
                background:
                    radial-gradient(ellipse 75% 55% at 10% 10%, oklch(0.55 0.18 155 / 0.10), transparent 55%),
                    radial-gradient(ellipse 55% 45% at 90% 90%, oklch(0.52 0.16 175 / 0.08), transparent 50%);
            }

            /* Grid */
            .auth-grid {
                background-image:
                    linear-gradient(to right,  rgba(0,255,100,0.05) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0,255,100,0.05) 1px, transparent 1px);
                background-size: 48px 48px;
            }
            :root:not(.dark) .auth-grid {
                background-image:
                    linear-gradient(to right,  rgba(0,160,60,0.07) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0,160,60,0.07) 1px, transparent 1px);
                background-size: 48px 48px;
            }

            /* Header — glassmorphism */
            .auth-header {
                background: rgba(8, 14, 10, 0.55);
                backdrop-filter: blur(24px) saturate(180%);
                -webkit-backdrop-filter: blur(24px) saturate(180%);
                border-bottom: 1px solid rgba(255,255,255,0.08);
                box-shadow: 0 1px 0 rgba(0,200,80,0.06), 0 4px 24px rgba(0,0,0,0.18);
            }
            :root:not(.dark) .auth-header {
                background: rgba(247, 250, 247, 0.72);
                backdrop-filter: blur(24px) saturate(180%);
                -webkit-backdrop-filter: blur(24px) saturate(180%);
                border-bottom: 1px solid rgba(0,130,50,0.14);
                box-shadow: 0 1px 0 rgba(0,160,60,0.08), 0 4px 20px rgba(0,60,20,0.07);
            }

            /* Sidebar border */
            .auth-sidebar {
                border-right: 1px solid rgba(255,255,255,0.07);
            }
            :root:not(.dark) .auth-sidebar {
                border-right: 1px solid rgba(0,120,50,0.10);
            }

            /* Footer border */
            .auth-footer {
                border-top: 1px solid rgba(255,255,255,0.06);
            }
            :root:not(.dark) .auth-footer {
                border-top: 1px solid rgba(0,120,50,0.10);
            }

            /* Card */
            .auth-card {
                border: 1px solid rgba(255,255,255,0.13);
                background: rgba(18,28,20,0.82);
                box-shadow: 0 0 0 1px rgba(0,200,80,0.06), 0 20px 60px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.30);
            }
            :root:not(.dark) .auth-card {
                border: 1px solid rgba(0,130,55,0.22);
                background: rgba(255,255,255,0.96);
                box-shadow: 0 0 0 1px rgba(0,150,60,0.08), 0 8px 40px rgba(0,60,20,0.12), 0 2px 8px rgba(0,0,0,0.06);
            }

            @keyframes authOrbFloat {
                0%,100% { transform: translateY(0px)   scale(1);    }
                33%      { transform: translateY(-20px) scale(1.04); }
                66%      { transform: translateY(10px)  scale(0.97); }
            }
            @keyframes authGlowFloat0 {
                0%,100% { transform: translate(0,0);        opacity:.6; }
                50%     { transform: translate(14px,-18px); opacity:1;  }
            }
            @keyframes authGlowFloat1 {
                0%,100% { transform: translate(0,0);         opacity:.5; }
                50%     { transform: translate(-12px,16px);  opacity:.9; }
            }
            @keyframes authGlowFloat2 {
                0%,100% { transform: translate(0,0);        opacity:.7; }
                50%     { transform: translate(10px,12px);  opacity:1;  }
            }
            @keyframes authGlowFloat3 {
                0%,100% { transform: translate(0,0);          opacity:.5; }
                50%     { transform: translate(-16px,-14px);  opacity:.9; }
            }
            @keyframes authGlowFloat4 {
                0%,100% { transform: translate(0,0);        opacity:.6; }
                50%     { transform: translate(12px,20px);  opacity:1;  }
            }
            @media (prefers-reduced-motion: reduce) {
                .auth-orb, .auth-glow { animation: none !important; }
            }
        `;
        document.head.appendChild(style);
    }, []);
    return null;
}

// ── Shell ─────────────────────────────────────────────────────────────────────
const DEFAULT_BULLETS = [
    'Verified employers & credential-backed candidates',
    'Interview orchestration in one timeline',
    'Audit-ready trails for enterprise teams',
];

type FormWidthKey = 'md' | 'lg' | 'xl' | '2xl';

const formMaxWidth: Record<FormWidthKey, string> = {
    md:    'max-w-md',
    lg:    'max-w-lg',
    xl:    'max-w-xl',
    '2xl': 'max-w-4xl',
};

export type AuthShellProps = {
    sideHeadline:     string;
    sideDescription?: string;
    bullets?:         string[];
    formWidth?:       FormWidthKey;
    bare?:            boolean;
    children:         React.ReactNode;
};

export function AuthShell({
    sideHeadline,
    sideDescription = 'One workspace for discovery, screening, and scheduling — built for teams that treat hiring like infrastructure.',
    bullets = DEFAULT_BULLETS,
    formWidth = 'md',
    bare = false,
    children,
}: AuthShellProps) {
    const year = new Date().getFullYear();
    const mw   = formMaxWidth[formWidth];

    return (
        <div className="auth-shell-root relative flex h-screen flex-col text-foreground">
            <AuthKeyframes />
            <AuthBackground />
            <CursorSpotlight />

            {/* ── Header ── */}
            <header className="auth-header relative z-30 flex h-14 sm:h-16 shrink-0 items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-85">
                    <div className="relative h-8 w-8 sm:h-9 sm:w-9 shrink-0 overflow-hidden rounded-xl ring-1 ring-border">
                        <Image
                            src="/logo.jpg"
                            alt="JobGenie"
                            fill
                            sizes="36px"
                            className="object-cover"
                            priority
                        />
                    </div>
                    <span className="text-[15px] sm:text-base font-bold tracking-tight text-foreground">
                        Job<span className="text-primary">Genie</span>
                    </span>
                </Link>
                <div className="flex items-center gap-1.5">
                    <ThemeToggle />
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Home</span>
                    </Link>
                </div>
            </header>

            {/* ── Body ── */}
            <div className="relative z-10 flex flex-1 min-h-0">

                {/* Left brand column */}
                <aside className="auth-sidebar hidden lg:flex lg:w-[300px] xl:w-[360px] shrink-0 flex-col justify-between overflow-y-auto p-8 xl:p-10">
                    <div className="flex flex-col gap-8">
                        <div>
                            <span className="inline-block text-[10px] font-bold uppercase tracking-[0.22em] text-primary mb-4">
                                JobGenie
                            </span>
                            <h2 className="text-2xl xl:text-3xl font-bold leading-tight tracking-tight text-foreground">
                                {sideHeadline}
                            </h2>
                            <p className="mt-4 text-sm xl:text-[15px] leading-relaxed text-muted-foreground">
                                {sideDescription}
                            </p>
                        </div>

                        <ul className="space-y-3">
                            {bullets.map((item) => (
                                <li key={item} className="flex gap-3 text-sm leading-snug text-foreground/70">
                                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 ring-1 ring-primary/30 text-primary">
                                        <Check className="h-3 w-3" strokeWidth={2.5} />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="text-xs text-muted-foreground/60">© {year} JobGenie</p>
                </aside>

                {/* Right form column */}
                <main className="flex flex-1 flex-col overflow-y-auto">
                    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
                        <div className={`w-full ${mw}`}>
                            {bare ? (
                                children
                            ) : (
                                <AuthCardAnimator>
                                    <div className="auth-card rounded-2xl backdrop-blur-sm p-6 sm:p-8">
                                        {children}
                                    </div>
                                </AuthCardAnimator>
                            )}
                        </div>
                    </div>

                    <footer className="auth-footer py-4 text-center text-[12px] text-muted-foreground/60">
                        © {year} JobGenie
                        <span className="mx-2 opacity-40">·</span>
                        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                        <span className="mx-2 opacity-40">·</span>
                        <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                    </footer>
                </main>
            </div>
        </div>
    );
}
