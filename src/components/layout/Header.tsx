'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useLandingSectionSpy } from '@/hooks/useLandingSectionSpy';
import { cn } from '@/lib/utils';

/** Order matches section layout on the landing page (top → bottom). */
const navLinks = [
    { href: '#features', id: 'features', label: 'Features' },
    { href: '#how-it-works', id: 'how-it-works', label: 'How it Works' },
    { href: '#testimonials', id: 'testimonials', label: 'Testimonials' },
    { href: '#portals', id: 'portals', label: 'Portals' },
] as const;

const navLinkIds = navLinks.map((l) => l.id);

export function Header({ showSignIn = true }: { showSignIn?: boolean }) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const activeId = useLandingSectionSpy(navLinkIds);

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    // Close menu on resize to desktop
    useEffect(() => {
        const fn = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
        window.addEventListener('resize', fn);
        return () => window.removeEventListener('resize', fn);
    }, []);

    return (
        <header
            className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300"
            style={{
                height: 'clamp(60px, 15vw, 72px)',
                padding: '0 clamp(12px, 4vw, 40px)',
                display: 'flex',
                alignItems: 'center',
                background: scrolled ? 'var(--lp-nav-bg)' : 'transparent',
                backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
                WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'none',
                borderBottom: `1px solid ${scrolled ? 'var(--lp-nav-border)' : 'transparent'}`,
            }}
        >
            {/* Logo */}
            <Link href="/"
                className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0 no-underline">
                <div
                    className="overflow-hidden rounded-full"
                    style={{
                        width: 'clamp(36px, 9vw, 44px)',
                        height: 'clamp(36px, 9vw, 44px)',
                        position: 'relative',
                        flexShrink: 0,
                        border: '1px solid var(--c-green-20)',
                        boxShadow: '0 0 12px var(--c-green-12)',
                    }}
                >
                    <Image
                        src="/logo.jpg"
                        alt="JobGenie Logo"
                        fill
                        sizes="44px"
                        className="rounded-full object-cover"
                        priority
                    />
                </div>
                <span style={{ fontWeight: 700, fontSize: 'clamp(17px, 4.5vw, 22px)', letterSpacing: '-0.02em', color: 'var(--lp-text)', whiteSpace: 'nowrap' }}>
                    Job<span style={{ color: 'var(--c-green)', fontWeight: 900 }}>Genie</span>
                </span>
            </Link>

            {/* Desktop nav — hidden below md */}
            <nav className="hidden md:flex flex-1 justify-center gap-0.5">
                {navLinks.map((l) => {
                    const isActive = activeId === l.id;
                    return (
                        <a
                            key={l.href}
                            href={l.href}
                            className={cn('lp-header-nav-link', isActive && 'is-active')}
                            aria-current={isActive ? 'location' : undefined}
                        >
                            <span className="lp-header-nav-link__label">{l.label}</span>
                        </a>
                    );
                })}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto md:ml-0">
                <ThemeToggle />

                {showSignIn && (
                    <>
                        <Link href="/login"
                            className="hidden md:inline-block"
                            style={{ padding: '7px 16px', borderRadius: 7, border: '1px solid var(--lp-border)', background: 'transparent', color: 'var(--lp-text-45)', fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'all 160ms', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--lp-text)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-green-40)'; (e.currentTarget as HTMLElement).style.background = 'var(--lp-surface)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--lp-text-45)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--lp-border)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                            Sign In
                        </Link>
                        <Link href="/candidate/signup"
                            className="hidden md:inline-block"
                            style={{ padding: '8px 18px', borderRadius: 7, background: 'var(--c-green)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 22px var(--c-green-30)', transition: 'all 160ms', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 36px var(--c-green-60)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 22px var(--c-green-30)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}>
                            Get Started →
                        </Link>
                    </>
                )}

                {/* Hamburger — visible below md */}
                <button
                    className="md:hidden flex items-center justify-center rounded-lg transition-colors touch-manipulation"
                    onClick={() => setMobileOpen(o => !o)}
                    style={{ width: 'clamp(36px, 10vw, 40px)', height: 'clamp(36px, 10vw, 40px)', minWidth: 36, minHeight: 36, background: mobileOpen ? 'var(--lp-surface)' : 'none', border: '1px solid ' + (mobileOpen ? 'var(--lp-border)' : 'transparent'), cursor: 'pointer', color: 'var(--lp-text)' }}
                    aria-label="Toggle menu"
                >
                    {mobileOpen
                        ? <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        : <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></svg>
                    }
                </button>
            </div>

            {/* Mobile dropdown menu */}
            <div
                className="md:hidden absolute left-0 right-0 overflow-hidden transition-all duration-300"
                style={{
                    top: 'clamp(60px, 15vw, 72px)',
                    maxHeight: mobileOpen ? 500 : 0,
                    opacity: mobileOpen ? 1 : 0,
                    background: 'var(--lp-nav-bg)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    borderBottom: mobileOpen ? '1px solid var(--lp-nav-border)' : 'none',
                    pointerEvents: mobileOpen ? 'auto' : 'none',
                }}
            >
                <div style={{ padding: 'clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px) clamp(16px, 4vw, 20px)' }}>
                    <nav className="flex flex-col gap-1 mb-4">
                        {navLinks.map((l) => {
                            const isActive = activeId === l.id;
                            return (
                                <a
                                    key={l.href}
                                    href={l.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={cn('lp-header-nav-link-mobile touch-manipulation', isActive && 'is-active')}
                                    aria-current={isActive ? 'location' : undefined}
                                >
                                    {l.label}
                                </a>
                            );
                        })}
                    </nav>
                    {showSignIn && (
                        <div className="flex flex-col sm:flex-row gap-2.5 pt-3" style={{ borderTop: '1px solid var(--lp-border)' }}>
                            <Link href="/login" onClick={() => setMobileOpen(false)}
                                className="flex-1 text-center touch-manipulation"
                                style={{ padding: 'clamp(11px, 3vw, 13px)', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid var(--lp-border)', background: 'transparent', color: 'var(--lp-text-60)', fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 500, textDecoration: 'none' }}>
                                Sign In
                            </Link>
                            <Link href="/candidate/signup" onClick={() => setMobileOpen(false)}
                                className="flex-1 text-center touch-manipulation"
                                style={{ padding: 'clamp(11px, 3vw, 13px)', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: 'var(--c-green)', color: '#fff', fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 20px var(--c-green-30)' }}>
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
