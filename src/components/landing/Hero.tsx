'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

function CursorSpotlight() {
    const [pos, setPos] = useState({ x: -2000, y: -2000 });
    useEffect(() => {
        const fn = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', fn, { passive: true });
        return () => window.removeEventListener('mousemove', fn);
    }, []);
    return (
        <div
            className="pointer-events-none fixed inset-0 z-[1] hidden md:block"
            style={{ background: `radial-gradient(600px at ${pos.x}px ${pos.y}px, rgba(0,200,60,0.07), transparent 40%)` }}
        />
    );
}

function FloatingLightOrbs() {
    // Large ambient orbs flowing across the screen
    const ambientOrbs = [
        { size: 150, duration: 25, delay: 0, opacity: 0.08 },
        { size: 120, duration: 30, delay: 5, opacity: 0.1 },
        { size: 180, duration: 28, delay: 10, opacity: 0.07 },
        { size: 100, duration: 35, delay: 15, opacity: 0.09 },
        { size: 140, duration: 32, delay: 8, opacity: 0.08 },
        { size: 110, duration: 27, delay: 12, opacity: 0.1 },
    ];

    // Small floating glows - independent of mouse
    const smallGlows = [
        { size: 40, duration: 8, delay: 0, startX: 20, startY: 30 },
        { size: 35, duration: 10, delay: 2, startX: 70, startY: 50 },
        { size: 45, duration: 9, delay: 4, startX: 40, startY: 70 },
        { size: 38, duration: 11, delay: 1, startX: 85, startY: 20 },
        { size: 42, duration: 7, delay: 3, startX: 15, startY: 60 },
        { size: 36, duration: 12, delay: 5, startX: 60, startY: 40 },
    ];

    return (
        <>
            {/* Large ambient orbs - desktop */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden hidden md:block">
                {ambientOrbs.map((orb, i) => (
                    <div
                        key={`ambient-${i}`}
                        className="floating-orb"
                        style={{
                            position: 'absolute',
                            width: `${orb.size}px`,
                            height: `${orb.size}px`,
                            borderRadius: '50%',
                            background: `radial-gradient(circle, rgba(0,255,80,${orb.opacity}) 0%, rgba(0,220,60,${orb.opacity * 0.6}) 40%, transparent 70%)`,
                            filter: 'blur(40px)',
                            animation: `floatingOrb${i} ${orb.duration}s ${orb.delay}s ease-in-out infinite`,
                            opacity: orb.opacity,
                            willChange: 'transform, opacity',
                        }}
                    />
                ))}
            </div>
            
            {/* Small independent glows - all devices */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {smallGlows.map((glow, i) => (
                    <div
                        key={`glow-${i}`}
                        style={{
                            position: 'absolute',
                            left: `${glow.startX}%`,
                            top: `${glow.startY}%`,
                            width: `${glow.size}px`,
                            height: `${glow.size}px`,
                            borderRadius: '50%',
                            background: `radial-gradient(circle, rgba(0,255,100,0.6) 0%, rgba(0,220,80,0.4) 30%, rgba(0,200,60,0.2) 60%, transparent 100%)`,
                            filter: 'blur(8px)',
                            boxShadow: '0 0 20px rgba(0,255,100,0.4), 0 0 40px rgba(0,220,80,0.2)',
                            animation: `floatGlow${i} ${glow.duration}s ${glow.delay}s ease-in-out infinite`,
                            willChange: 'transform',
                            zIndex: 3,
                        }}
                    />
                ))}
            </div>
        </>
    );
}

function HeroBg() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ width: '100%', maxWidth: '100vw' }}>
            <div className="dot-grid absolute inset-0 opacity-70" />

            {/* Blobs - only green */}
            <div className="absolute rounded-full" style={{ top: '-18%', right: '-5%', width: 'clamp(250px, 50vw, 900px)', height: 'clamp(250px, 50vw, 900px)', background: 'radial-gradient(circle, var(--lp-blob-green) 0%, transparent 58%)', filter: 'blur(32px)', animation: 'blobFloat 22s ease-in-out infinite', willChange: 'transform' }} />
            {/* Removed blue blob to avoid line appearance */}

            {/* Removed static glare beams and center pulse */}

            <div className="absolute bottom-0 left-0 right-0 h-64" style={{ background: 'var(--lp-fade-bottom)' }} />
            <div className="absolute inset-0" style={{ background: 'var(--lp-vignette)' }} />
        </div>
    );
}

function PipelineCard({ fluid = false }: { fluid?: boolean }) {
    const stages = [
        { label: 'Applied', n: 124, color: '#f59e0b' },
        { label: 'Screened', n: 47, color: '#3b82f6' },
        { label: 'Interview', n: 19, color: '#8b5cf6' },
        { label: 'Offer', n: 6, color: 'var(--c-green)' },
    ];
    return (
        <div style={{ padding: 'clamp(10px, 3vw, 14px)', borderRadius: 'clamp(12px, 3.5vw, 14px)', width: fluid ? '100%' : 240, minWidth: fluid ? 0 : 200, background: 'var(--lp-glass-bg)', border: '1px solid var(--lp-glass-border)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', boxShadow: 'var(--lp-glass-shadow)', animation: 'floatB 9s ease-in-out infinite' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(8px, 2.5vw, 10px)' }}>
                <span style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', fontWeight: 600, color: 'var(--lp-text-60)' }}>Hiring Pipeline</span>
                <span style={{ fontSize: 'clamp(7px, 2vw, 8px)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.7vw, 3px)', color: 'var(--c-green)' }}>
                    <span className="anim-pulse-green" style={{ width: 'clamp(3px, 1vw, 4px)', height: 'clamp(3px, 1vw, 4px)', borderRadius: '50%', background: 'var(--c-green)', display: 'inline-block' }} />LIVE
                </span>
            </div>
            {stages.map((s, i) => (
                <div key={i} style={{ marginBottom: i < stages.length - 1 ? 'clamp(5px, 1.5vw, 7px)' : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'clamp(2px, 0.7vw, 3px)' }}>
                        <span style={{ fontSize: 'clamp(8px, 2.2vw, 9px)', color: 'var(--lp-text-38)', fontWeight: 500 }}>{s.label}</span>
                        <span style={{ fontSize: 'clamp(8px, 2.2vw, 9px)', color: s.color, fontWeight: 700, fontFamily: 'monospace' }}>{s.n}</span>
                    </div>
                    <div style={{ height: 'clamp(2.5px, 0.8vw, 3px)', borderRadius: 99, background: 'var(--lp-border)' }}>
                        <div style={{ height: '100%', width: `${(s.n / 124) * 100}%`, borderRadius: 99, background: s.color, boxShadow: `0 0 6px ${s.color}70` }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function MatchCard({ fluid = false }: { fluid?: boolean }) {
    const pct = 96;
    const circ = 2 * Math.PI * 38;
    return (
        <div style={{ padding: 'clamp(10px, 3vw, 14px)', borderRadius: 'clamp(12px, 3.5vw, 14px)', width: fluid ? '100%' : 195, minWidth: fluid ? 0 : 160, background: 'var(--lp-glass-bg)', border: '1px solid var(--lp-glass-border)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', boxShadow: 'var(--lp-glass-shadow)', animation: 'floatA 8s ease-in-out 0.8s infinite' }}>
            <div style={{ fontSize: 'clamp(7px, 2vw, 8px)', fontWeight: 700, letterSpacing: '0.11em', color: 'var(--lp-text-28)', marginBottom: 'clamp(6px, 2vw, 8px)' }}>AI MATCH SCORE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(7px, 2vw, 9px)' }}>
                <div style={{ position: 'relative', width: 'clamp(35px, 10vw, 40px)', height: 'clamp(35px, 10vw, 40px)', flexShrink: 0 }}>
                    <svg width={'clamp(35px, 10vw, 40px)'} height={'clamp(35px, 10vw, 40px)'} viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="44" cy="44" r="38" fill="none" stroke="var(--lp-border)" strokeWidth="7" />
                        <circle cx="44" cy="44" r="38" fill="none" stroke="var(--c-green)" strokeWidth="7" strokeDasharray={`${(pct / 100) * circ} ${circ}`} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 9px var(--c-green-60))' }} />
                    </svg>
                    <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(9px, 2.5vw, 10px)', fontWeight: 700, color: 'var(--lp-text)', fontFamily: 'monospace' }}>{pct}%</span>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', fontWeight: 600, color: 'var(--lp-text)', marginBottom: 'clamp(1px, 0.5vw, 2px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Senior Engineer</div>
                    <div style={{ fontSize: 'clamp(8px, 2.2vw, 9px)', color: 'var(--lp-text-28)', marginBottom: 'clamp(4px, 1.2vw, 5px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>TechCorp · Remote</div>
                    <span style={{ fontSize: 'clamp(7px, 2vw, 8px)', fontWeight: 800, padding: '2px clamp(4px, 1.2vw, 5px)', borderRadius: 'clamp(3px, 1vw, 4px)', letterSpacing: '0.05em', background: 'var(--c-green-12)', color: 'var(--c-green)', border: '1px solid var(--c-green-30)', whiteSpace: 'nowrap', display: 'inline-block' }}>✦ TOP MATCH</span>
                </div>
            </div>
        </div>
    );
}

function NotifPill({ text, sub, color = 'var(--c-green)', animClass = 'anim-float-c', fluid = false, borderPosition = 'left' }: {
    text: string; sub: string; color?: string; animClass?: string; fluid?: boolean; borderPosition?: 'left' | 'right';
}) {
    const borderStyle = borderPosition === 'left' 
        ? { left: 0, borderRadius: 'clamp(10px, 3vw, 12px) 0 0 clamp(10px, 3vw, 12px)' }
        : { right: 0, borderRadius: '0 clamp(10px, 3vw, 12px) clamp(10px, 3vw, 12px) 0' };
    
    return (
        <div className={animClass} style={{ padding: 'clamp(7px, 2vw, 11px)', borderRadius: 'clamp(10px, 3vw, 12px)', background: 'var(--lp-glass-bg)', border: '1px solid var(--lp-glass-border)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', boxShadow: 'var(--lp-glass-shadow)', display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 8px)', position: 'relative', width: fluid ? '100%' : undefined, maxWidth: fluid ? undefined : 220, minWidth: fluid ? 0 : 180 }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, width: 'clamp(2px, 0.7vw, 3px)', background: color, opacity: 0.8, ...borderStyle }} />
            <div style={{ width: 'clamp(20px, 5.5vw, 22px)', height: 'clamp(20px, 5.5vw, 22px)', borderRadius: 'clamp(5px, 1.5vw, 6px)', background: `${color}18`, border: `1px solid ${color}30`, marginLeft: borderPosition === 'left' ? 'clamp(3px, 1vw, 4px)' : 0, marginRight: borderPosition === 'right' ? 'clamp(3px, 1vw, 4px)' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, order: borderPosition === 'right' ? 2 : 0 }}>
                <svg width={'clamp(8px, 2.2vw, 9px)'} height={'clamp(8px, 2.2vw, 9px)'} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0, order: 1 }}>
                <div style={{ fontSize: 'clamp(9px, 2.5vw, 10px)', fontWeight: 700, color: 'var(--lp-text)', marginBottom: 'clamp(0.5px, 0.3vw, 1px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</div>
                <div style={{ fontSize: 'clamp(8px, 2.2vw, 9px)', color: 'var(--lp-text-28)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>
            </div>
        </div>
    );
}

function useFadeIn() {
    const [show, setShow] = useState(false);
    useEffect(() => { const t = setTimeout(() => setShow(true), 50); return () => clearTimeout(t); }, []);
    return show;
}

function useTextSwap(intervalMs = 5000) {
    const [isEmployer, setIsEmployer] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setIsEmployer(prev => !prev);
                setIsTransitioning(false);
            }, 400);
        }, intervalMs);
        
        return () => clearInterval(interval);
    }, [intervalMs]);
    
    return { isEmployer, isTransitioning };
}

const heroCtaPrimary: React.CSSProperties = {
    background: 'var(--c-green)',
    color: '#fff',
    border: '1px solid transparent',
    boxShadow: '0 0 36px var(--c-green-40)',
};

const heroCtaSecondary: React.CSSProperties = {
    background: 'var(--lp-surface)',
    color: 'var(--lp-text-60)',
    border: '1px solid var(--lp-border)',
    boxShadow: 'none',
};

function heroCtaStyle(active: boolean): React.CSSProperties {
    return active ? heroCtaPrimary : heroCtaSecondary;
}

function heroCtaHover(el: HTMLElement, active: boolean, entering: boolean) {
    if (active) {
        if (entering) {
            el.style.transform = 'translateY(-2px)';
            el.style.boxShadow = '0 8px 48px var(--c-green-60)';
        } else {
            el.style.transform = 'none';
            el.style.boxShadow = heroCtaPrimary.boxShadow as string;
        }
        return;
    }
    if (entering) {
        el.style.borderColor = 'var(--c-green-40)';
        el.style.color = 'var(--lp-text)';
    } else {
        el.style.borderColor = 'var(--lp-border)';
        el.style.color = 'var(--lp-text-60)';
    }
}

export function Hero() {
    const show = useFadeIn();
    const { isEmployer, isTransitioning } = useTextSwap(10000);
    
    const fd = (delay: number): React.CSSProperties => ({
        opacity: show ? 1 : 0,
        transform: show ? 'none' : 'translateY(20px)',
        transition: `opacity 500ms ${delay}ms ease-out, transform 500ms ${delay}ms ease-out`,
    });

    const textTransition = (delay: number = 0): React.CSSProperties => ({
        opacity: show ? (isTransitioning ? 0 : 1) : 0,
        transform: show ? (isTransitioning ? 'translateY(-10px)' : 'translateY(0)') : 'translateY(20px)',
        transition: `opacity ${show ? '400ms' : `500ms ${delay}ms`} ease-in-out, transform ${show ? '400ms' : `500ms ${delay}ms`} ease-in-out`,
    });

    const content = {
        employer: {
            badge: 'Recruitment OS for modern teams',
            headline: 'Hire the right people,',
            highlightWord: 'faster.',
            subtext: 'A unified recruitment platform where candidates are verified, employers are trusted, and every step of the hiring journey is transparent and trackable.',
        },
        candidate: {
            badge: 'Your career journey starts here',
            headline: 'Find your dream job,',
            highlightWord: 'faster.',
            subtext: 'Get verified, showcase your skills, and track every opportunity in one place. Connect with trusted employers who value transparency.',
        },
    };

    const currentContent = isEmployer ? content.employer : content.candidate;

    return (
        <>
            <CursorSpotlight />
            <section className="relative overflow-hidden min-h-screen flex items-center" style={{ background: 'var(--lp-bg)', width: '100%', maxWidth: '100vw' }}>
                <HeroBg />
                <FloatingLightOrbs />

                {/* Background genie — desktop: right side, mobile: centered faded */}
                <div className="pointer-events-none absolute select-none hidden lg:block" style={{ bottom: 0, right: -150, height: '95%', zIndex: 1, maxWidth: '50%' }}>
                    <Image src="/genie.png" alt="" aria-hidden width={700} height={900}
                        className="h-full w-auto anim-genie-bob"
                        style={{ opacity: 0.35, filter: 'saturate(1.2) brightness(1.05)', maxWidth: '75%', height: 'auto', transform: 'scaleY(-1)' }} priority />
                </div>

                {/* Genie mobile — centered, natural aspect ratio with animation */}
                <div className="pointer-events-none absolute select-none lg:hidden" style={{ top: '40%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1, width: 'min(72vw, 300px)', maxWidth: '90%' }}>
                    <div className="anim-genie-bob">
                        <Image src="/genie.png" alt="" aria-hidden width={400} height={520}
                            className="w-full h-auto"
                            style={{ opacity: 0.2, filter: 'saturate(1.3) brightness(1.1)', maxWidth: '100%' }} priority />
                    </div>
                </div>

                {/* Sparkles — visible on all devices, responsive sizing */}
                {/* Right side sparkles */}
                {[
                    { r: '9%', b: '8%', s: 5, d: 0 }, 
                    { r: '13%', b: '18%', s: 3.5, d: 0.4 },
                    { r: '7%', b: '28%', s: 4, d: 0.8 }, 
                    { r: '17%', b: '12%', s: 3, d: 1.1 },
                    { r: '22%', b: '22%', s: 3.5, d: 0.6 },
                    { r: '5%', b: '35%', s: 3, d: 1.3 },
                ].map((p, i) => (
                    <div key={`right-${i}`} className="pointer-events-none absolute rounded-full" style={{ right: p.r, bottom: p.b, width: `clamp(${p.s * 0.6}px, ${p.s * 0.2}vw, ${p.s}px)`, height: `clamp(${p.s * 0.6}px, ${p.s * 0.2}vw, ${p.s}px)`, background: 'var(--c-green)', boxShadow: `0 0 ${p.s * 2}px var(--c-green-60)`, animation: `sparkleUp ${1.8 + i * 0.25}s ${p.d}s ease-out infinite`, zIndex: 2, opacity: i >= 4 ? 0.7 : 1 }} />
                ))}
                {/* Left side sparkles (mobile-friendly) */}
                {[
                    { l: '10%', b: '15%', s: 4, d: 0.3 },
                    { l: '15%', b: '25%', s: 3, d: 0.9 },
                    { l: '7%', b: '10%', s: 3.5, d: 1.2 },
                ].map((p, i) => (
                    <div key={`left-${i}`} className="pointer-events-none absolute rounded-full lg:hidden" style={{ left: p.l, bottom: p.b, width: `clamp(${p.s * 0.6}px, ${p.s * 0.2}vw, ${p.s}px)`, height: `clamp(${p.s * 0.6}px, ${p.s * 0.2}vw, ${p.s}px)`, background: 'var(--c-green)', boxShadow: `0 0 ${p.s * 2}px var(--c-green-60)`, animation: `sparkleUp ${2.0 + i * 0.3}s ${p.d}s ease-out infinite`, zIndex: 2, opacity: 0.7 }} />
                ))}

                {/* ── Main content ── */}
                <div className="relative w-full z-[2] mx-auto" style={{ maxWidth: 1300, overflowX: 'hidden' }}>

                    {/* ═══ MOBILE LAYOUT (< lg) ═══ */}
                    <div className="lg:hidden px-4 xs:px-5 sm:px-6 pt-20 xs:pt-24 sm:pt-28 pb-8 sm:pb-10 flex flex-col items-center text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border mb-4 sm:mb-6 max-w-[95vw]" style={{ ...fd(0), borderColor: 'var(--c-green-30)', background: 'var(--c-green-06)' }}>
                            <span style={{ padding: '2px 6px sm:2px 8px', borderRadius: 99, background: 'var(--c-green)', color: '#fff', fontSize: 'clamp(8px, 2vw, 9px)', fontWeight: 800, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>NEW</span>
                            <span style={{ ...textTransition(0), fontSize: 'clamp(10px, 2.5vw, 11px)', fontWeight: 500, color: 'var(--lp-text-45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentContent.badge}</span>
                        </div>

                        {/* Headline */}
                        <h1 style={{ ...fd(50), fontSize: 'clamp(32px, 9.5vw, 58px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.06, color: 'var(--lp-heading)', marginBottom: 'clamp(12px, 3vw, 16px)', maxWidth: '100%', wordWrap: 'break-word' }}>
                            <span style={textTransition(50)}>{currentContent.headline}</span><br />
                            <span style={{ ...textTransition(50), color: 'var(--c-green)', textShadow: '0 0 60px var(--c-green-30)' }}>{currentContent.highlightWord}</span>
                        </h1>

                        {/* Subtext */}
                        <p style={{ ...textTransition(100), fontSize: 'clamp(14px, 3.5vw, 16px)', color: 'var(--lp-text-45)', lineHeight: 1.75, maxWidth: 'min(360px, 90vw)', marginBottom: 'clamp(20px, 5vw, 28px)', paddingLeft: 'clamp(8px, 2vw, 16px)', paddingRight: 'clamp(8px, 2vw, 16px)' }}>
                            {currentContent.subtext}
                        </p>

                        {/* CTA buttons */}
                        <div style={fd(130)} className="flex flex-col gap-2.5 sm:gap-3 w-full max-w-[min(320px,90vw)] px-4 mb-6 sm:mb-8">
                            <Link href="/candidate/signup" className="text-center touch-manipulation"
                                style={{ 
                                    padding: 'clamp(12px, 3vw, 14px) clamp(20px, 5vw, 26px)', 
                                    minHeight: 44, 
                                    borderRadius: 9999, 
                                    fontSize: 'clamp(14px, 3.5vw, 15px)', 
                                    fontWeight: isEmployer ? 600 : 700, 
                                    textDecoration: 'none', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    transition: 'background 400ms ease-in-out, color 400ms ease-in-out, box-shadow 400ms ease-in-out, border-color 400ms ease-in-out, font-weight 400ms ease-in-out, transform 200ms ease-out',
                                    ...heroCtaStyle(!isEmployer),
                                }}
                                onMouseEnter={(e) => heroCtaHover(e.currentTarget, !isEmployer, true)}
                                onMouseLeave={(e) => heroCtaHover(e.currentTarget, !isEmployer, false)}
                            >Start as Candidate</Link>
                            <Link href="/employer/signup" className="text-center touch-manipulation"
                                style={{ 
                                    padding: 'clamp(12px, 3vw, 14px) clamp(20px, 5vw, 26px)', 
                                    minHeight: 44, 
                                    borderRadius: 9999, 
                                    fontSize: 'clamp(14px, 3.5vw, 15px)', 
                                    fontWeight: isEmployer ? 700 : 600, 
                                    textDecoration: 'none', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    transition: 'background 400ms ease-in-out, color 400ms ease-in-out, box-shadow 400ms ease-in-out, border-color 400ms ease-in-out, font-weight 400ms ease-in-out, transform 200ms ease-out',
                                    ...heroCtaStyle(isEmployer),
                                }}
                                onMouseEnter={(e) => heroCtaHover(e.currentTarget, isEmployer, true)}
                                onMouseLeave={(e) => heroCtaHover(e.currentTarget, isEmployer, false)}
                            >Register Company</Link>
                        </div>

                        {/* Social proof */}
                        <div style={fd(160)} className="flex flex-col xs:flex-row items-center gap-2.5 xs:gap-3 mb-8 sm:mb-10 px-4">
                            <div className="flex">
                                {['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444'].map((c, i) => (
                                    <div key={i} style={{ width: 'clamp(24px, 6vw, 26px)', height: 'clamp(24px, 6vw, 26px)', borderRadius: '50%', background: c, border: '2px solid var(--lp-bg)', marginLeft: i > 0 ? 'clamp(-8px, -2vw, -7px)' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(7px, 2vw, 8px)', fontWeight: 700, color: '#fff' }}>
                                        {['AC', 'NV', 'TW', 'EM', 'JP'][i]}
                                    </div>
                                ))}
                            </div>
                            <div className="text-center xs:text-left">
                                <div style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', fontWeight: 600, color: 'var(--lp-text-60)' }}>Trusted by 45,000+ professionals</div>
                                <div className="flex gap-0.5 mt-0.5 items-center justify-center xs:justify-start">
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <svg key={i} width={'clamp(9px, 2.5vw, 10px)'} height={'clamp(9px, 2.5vw, 10px)'} viewBox="0 0 24 24" fill={i < 4 ? '#f59e0b' : 'var(--lp-border)'} stroke="none">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
                                        </svg>
                                    ))}
                                    <span style={{ fontSize: 'clamp(8px, 2vw, 9px)', color: 'var(--lp-text-28)', marginLeft: 3 }}>4.9 / 5</span>
                                </div>
                            </div>
                        </div>

                        {/* Mobile widget cards — fully fluid and responsive */}
                        <div className="w-full grid gap-2.5 sm:gap-3 mb-4 px-2" style={{ ...fd(190), gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', maxWidth: '100%', overflowX: 'hidden' }}>
                            <div className="col-span-full">
                                <PipelineCard fluid />
                            </div>
                            <div className="col-span-full xs:col-span-1">
                                <MatchCard fluid />
                            </div>
                            <div className="flex flex-col gap-2 col-span-full xs:col-span-1">
                                <NotifPill text="Interview Confirmed" sub="TechCorp · Round 2" animClass="anim-float-a" fluid />
                                <NotifPill text="Offer Received! 🎉" sub="Nexus · $120k" color="#f59e0b" animClass="anim-float-b" fluid />
                            </div>
                        </div>
                    </div>

                    {/* ═══ DESKTOP LAYOUT (lg+) ═══ */}
                    <div className="hidden lg:grid grid-cols-2 gap-12 xl:gap-16 items-center px-12 xl:px-20 py-24 xl:py-28">

                        {/* Left copy */}
                        <div>
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-8" style={{ ...fd(0), borderColor: 'var(--c-green-30)', background: 'var(--c-green-06)' }}>
                                <span style={{ padding: '2px 8px', borderRadius: 99, background: 'var(--c-green)', color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em' }}>NEW</span>
                                <span style={{ ...textTransition(0), fontSize: 12, fontWeight: 500, color: 'var(--lp-text-45)' }}>{currentContent.badge}</span>
                            </div>

                            <h1 style={{ ...fd(50), fontSize: 'clamp(42px, 5vw, 72px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.04, color: 'var(--lp-heading)', marginBottom: 20 }}>
                                <span style={textTransition(50)}>{currentContent.headline}</span><br />
                                <span style={{ ...textTransition(50), color: 'var(--c-green)', textShadow: '0 0 60px var(--c-green-30)' }}>{currentContent.highlightWord}</span>
                            </h1>

                            <p style={{ ...textTransition(100), fontSize: 'clamp(14px, 1.4vw, 17px)', color: 'var(--lp-text-45)', lineHeight: 1.78, maxWidth: 480, marginBottom: 32 }}>
                                {currentContent.subtext}
                            </p>

                            {/* CTA buttons */}
                            <div style={fd(140)} className="flex gap-3 mb-10">
                                <Link href="/candidate/signup"
                                    style={{ 
                                        padding: '13px 26px', 
                                        borderRadius: 9999, 
                                        fontSize: 15, 
                                        fontWeight: isEmployer ? 600 : 700, 
                                        textDecoration: 'none', 
                                        transition: 'background 400ms ease-in-out, color 400ms ease-in-out, box-shadow 400ms ease-in-out, border-color 400ms ease-in-out, font-weight 400ms ease-in-out, transform 200ms ease-out',
                                        ...heroCtaStyle(!isEmployer),
                                    }}
                                    onMouseEnter={(e) => heroCtaHover(e.currentTarget, !isEmployer, true)}
                                    onMouseLeave={(e) => heroCtaHover(e.currentTarget, !isEmployer, false)}
                                >Start as Candidate</Link>
                                <Link href="/employer/signup"
                                    style={{ 
                                        padding: '13px 26px', 
                                        borderRadius: 9999, 
                                        fontSize: 15, 
                                        fontWeight: isEmployer ? 700 : 600, 
                                        textDecoration: 'none', 
                                        transition: 'background 400ms ease-in-out, color 400ms ease-in-out, box-shadow 400ms ease-in-out, border-color 400ms ease-in-out, font-weight 400ms ease-in-out, transform 200ms ease-out',
                                        ...heroCtaStyle(isEmployer),
                                    }}
                                    onMouseEnter={(e) => heroCtaHover(e.currentTarget, isEmployer, true)}
                                    onMouseLeave={(e) => heroCtaHover(e.currentTarget, isEmployer, false)}
                                >Start as Employer</Link>
                            </div>

                            {/* Social proof */}
                            <div style={fd(170)} className="flex items-center gap-4">
                                <div className="flex">
                                    {['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444'].map((c, i) => (
                                        <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: '2px solid var(--lp-bg)', marginLeft: i > 0 ? -7 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>
                                            {['AC', 'NV', 'TW', 'EM', 'JP'][i]}
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--lp-text-60)' }}>Trusted by 45,000+ professionals</div>
                                    <div className="flex gap-0.5 mt-1 items-center">
                                        {[0, 1, 2, 3, 4].map(i => (
                                            <svg key={i} width={11} height={11} viewBox="0 0 24 24" fill={i < 4 ? '#f59e0b' : 'var(--lp-border)'} stroke="none">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
                                            </svg>
                                        ))}
                                        <span style={{ fontSize: 10, color: 'var(--lp-text-28)', marginLeft: 3 }}>4.9 / 5</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right widget cluster */}
                        <div style={{ ...fd(70), position: 'relative', height: 520 }}>
                            <div className="absolute" style={{ top: 24, left: 0 }}><PipelineCard /></div>
                            <div className="absolute" style={{ top: 0, right: 0, zIndex: 2 }}><MatchCard /></div>
                            
                            {/* Genie for Interview Confirmed card - flipped horizontally + vertically */}
                            <div className="absolute pointer-events-none" style={{ bottom: 100, right: 70, zIndex: 4 }}>
                                <Image src="/genie.png" alt="" aria-hidden width={120} height={156}
                                    className="anim-genie-bob"
                                    style={{ opacity: 0.85, filter: 'saturate(1.2) brightness(1.05)', transform: 'scale(1, -1)', width: 120, height: 'auto' }} />
                            </div>
                            
                            <div className="absolute" style={{ bottom: 140, right: 150, zIndex: 3 }}>
                                <NotifPill text="Interview Confirmed" sub="TechCorp · Round 2 · May 26" animClass="anim-float-a" borderPosition="right" />
                            </div>
                            
                            {/* Genie for Offer Received card - normal direction */}
                            <div className="absolute pointer-events-none" style={{ bottom: 0, left: -30, zIndex: 3 }}>
                                <Image src="/genie2.png" alt="" aria-hidden width={110} height={143}
                                    className="anim-genie-bob"
                                    style={{ opacity: 0.85, filter: 'saturate(1.2) brightness(1.05)', transform: 'scale(-1, -1)', width: 110, height: 'auto' }} />
                            </div>
                            
                            <div className="absolute" style={{ bottom: 44, left: 50, zIndex: 2 }}>
                                <NotifPill text="Offer Received! 🎉" sub="Nexus Tech · $120k package" color="#f59e0b" animClass="anim-float-b" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll cue — sm+ only */}
                <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-1 hidden sm:flex" style={{ opacity: 0.3, zIndex: 2 }}>
                    <div style={{ width: 20, height: 32, borderRadius: 99, border: '1.5px solid var(--lp-border)', display: 'flex', justifyContent: 'center', paddingTop: 5 }}>
                        <div className="anim-bounce-dot" style={{ width: 3, height: 6, borderRadius: 99, background: 'var(--lp-text-45)' }} />
                    </div>
                </div>
            </section>
        </>
    );
}
