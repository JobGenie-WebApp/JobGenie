'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';

function useInView(threshold = 0.12) {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [threshold]);
    return [visible, ref] as const;
}

function useCountUp(end: number, duration = 2000) {
    const [count, setCount] = useState(0);
    const started = useRef(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !started.current) {
                started.current = true;
                const inc = end / (duration / 16); let s = 0;
                const t = setInterval(() => { s += inc; if (s >= end) { setCount(end); clearInterval(t); } else setCount(Math.floor(s)); }, 16);
            }
        }, { threshold: 0.3 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [end, duration]);
    return [count, ref] as const;
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOGO STRIP
═══════════════════════════════════════════════════════════════════════════ */
export function LogoStrip() {
    const companies = ['TechCorp', 'Nexus Group', 'FinancePlus', 'ScaleUp Inc', 'DataBridge', 'CloudStack', 'DesignLab', 'StartupABC', 'MediCare', 'Vertex Systems', 'GreenField Capital', 'Innovate.io'];
    const doubled = [...companies, ...companies];
    return (
        <section className="overflow-hidden py-5" style={{ background: 'var(--lp-bg-2)', borderTop: '1px solid var(--lp-border-2)', borderBottom: '1px solid var(--lp-border-2)', width: '100%', maxWidth: '100vw' }}>
            <div className="flex items-center gap-4 mb-3 px-4 sm:px-8">
                <div className="flex-1 h-px" style={{ background: 'var(--lp-border-2)' }} />
                <span style={{ fontSize: 'clamp(8px, 2vw, 9px)', fontWeight: 700, letterSpacing: '0.14em', color: 'var(--lp-text-16)', whiteSpace: 'nowrap' }}>TRUSTED BY LEADING COMPANIES</span>
                <div className="flex-1 h-px" style={{ background: 'var(--lp-border-2)' }} />
            </div>
            <div className="relative overflow-hidden" style={{ width: '100%', maxWidth: '100vw' }}>
                <div className="anim-marquee flex items-center" style={{ gap: 'clamp(32px, 10vw, 48px)', width: 'max-content', willChange: 'transform' }}>
                    {doubled.map((c, i) => (
                        <span key={i} style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', fontWeight: 600, color: 'var(--lp-text-16)', whiteSpace: 'nowrap', letterSpacing: '0.04em', fontFamily: 'monospace' }}>{c}</span>
                    ))}
                </div>
                <div className="absolute inset-y-0 left-0 w-16 sm:w-24 pointer-events-none" style={{ background: 'var(--lp-fade-left)', zIndex: 1 }} />
                <div className="absolute inset-y-0 right-0 w-16 sm:w-24 pointer-events-none" style={{ background: 'var(--lp-fade-right)', zIndex: 1 }} />
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════════════════════════════════ */
function StatItem({ end, suffix, label, icon, color }: { end: number; suffix: string; label: string; icon: React.ReactNode; color: string }) {
    const [v, ref] = useCountUp(end);
    const [hover, setHover] = useState(false);
    return (
        <div ref={ref} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
            className="relative overflow-hidden text-center py-6 xs:py-8 px-3 xs:px-4 sm:px-6 transition-colors cursor-default"
            style={{ background: hover ? 'var(--lp-surface-hover)' : 'var(--lp-surface-2)' }}>
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.55 }} />
            <div style={{ width: 'clamp(36px, 10vw, 44px)', height: 'clamp(36px, 10vw, 44px)', borderRadius: 'clamp(10px, 3vw, 12px)', background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto clamp(12px, 3vw, 16px)' }}>{icon}</div>
            <div className="font-bold mb-1.5 sm:mb-2 tabular-nums" style={{ fontSize: 'clamp(24px, 7vw, 40px)', letterSpacing: '-0.04em', color: 'var(--lp-text)', textShadow: `0 0 40px ${color}40`, fontFamily: 'monospace' }}>
                {v.toLocaleString()}{suffix}
            </div>
            <div style={{ fontSize: 'clamp(10px, 2.5vw, 12px)', color: 'var(--lp-text-28)', fontWeight: 500, lineHeight: 1.3 }}>{label}</div>
        </div>
    );
}

export function StatsSection() {
    const stats = [
        { end: 2400, suffix: '+', label: 'Active Job Listings', color: 'var(--c-blue)', icon: <svg width={'clamp(16px, 4vw, 18px)'} height={'clamp(16px, 4vw, 18px)'} viewBox="0 0 24 24" fill="none" stroke="var(--c-blue)" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg> },
        { end: 180, suffix: '+', label: 'Verified Employers', color: '#8b5cf6', icon: <svg width={'clamp(16px, 4vw, 18px)'} height={'clamp(16px, 4vw, 18px)'} viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2" /><path d="M8 6h8M8 10h8M8 14h5" /></svg> },
        { end: 45000, suffix: '+', label: 'Registered Candidates', color: 'var(--c-green)', icon: <svg width={'clamp(16px, 4vw, 18px)'} height={'clamp(16px, 4vw, 18px)'} viewBox="0 0 24 24" fill="none" stroke="var(--c-green)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
        { end: 94, suffix: '%', label: 'Placement Match Rate', color: '#f59e0b', icon: <svg width={'clamp(16px, 4vw, 18px)'} height={'clamp(16px, 4vw, 18px)'} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg> },
    ];
    return (
        <section className="px-3 xs:px-4 sm:px-8 md:px-12 py-10 xs:py-12 sm:py-16" style={{ background: 'var(--lp-bg-2)' }}>
            <div className="max-w-5xl mx-auto rounded-xl sm:rounded-2xl overflow-hidden" style={{ border: '1px solid var(--lp-border)' }}>
                <div className="grid grid-cols-2 lg:grid-cols-4">
                    {stats.map((s, i) => (
                        <div key={i} className={i % 2 === 0 && i < 2 ? 'border-r border-b lg:border-b-0' : i % 2 !== 0 && i < 2 ? 'border-b lg:border-b-0 lg:border-r' : i === 2 ? 'border-r' : ''} style={{ borderColor: 'var(--lp-border)' }}>
                            <StatItem {...s} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HOW IT WORKS
═══════════════════════════════════════════════════════════════════════════ */
function HowStep({ step, idx, visible, last }: {
    step: { n: string; title: string; desc: string; icon: React.ReactNode; color: string };
    idx: number; visible: boolean; last: boolean;
}) {
    const [hover, setHover] = useState(false);
    return (
        <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
            className="relative px-5 xs:px-6 py-8 xs:py-10 sm:px-8 sm:py-12 overflow-hidden"
            style={{
                borderRight: last ? 'none' : undefined,
                borderBottom: last ? 'none' : undefined,
                background: hover ? 'var(--lp-surface)' : 'transparent',
                opacity: visible ? 1 : 0,
                transform: visible ? 'none' : 'translateY(26px)',
                transition: `background 220ms, opacity 650ms ${idx * 140}ms ease-out, transform 650ms ${idx * 140}ms ease-out`,
            }}>
            <div className="font-bold mb-4 xs:mb-6 leading-none" style={{ fontSize: 'clamp(36px, 10vw, 48px)', color: 'var(--lp-text-12)', fontFamily: 'monospace', letterSpacing: '-0.05em' }}>{step.n}</div>
            <div style={{ width: 'clamp(40px, 11vw, 48px)', height: 'clamp(40px, 11vw, 48px)', borderRadius: 'clamp(11px, 3vw, 13px)', background: `${step.color}12`, border: `1px solid ${step.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'clamp(14px, 4vw, 18px)', boxShadow: hover ? `0 0 32px ${step.color}30` : 'none', transition: 'box-shadow 280ms' }}>{step.icon}</div>
            <h3 className="font-bold mb-2.5 xs:mb-3" style={{ fontSize: 'clamp(17px, 4.5vw, 20px)', color: 'var(--lp-text)', letterSpacing: '-0.015em', lineHeight: 1.22 }}>{step.title}</h3>
            <p style={{ fontSize: 'clamp(13px, 3.5vw, 14px)', color: 'var(--lp-text-38)', lineHeight: 1.72 }}>{step.desc}</p>
        </div>
    );
}

type HowItWorksStep = { n: string; title: string; desc: string; icon: React.ReactNode; color: string };

const howItWorksFlows = {
    candidate: {
        label: 'For Candidates',
        color: 'var(--c-green)',
        steps: [
            { n: '01', title: 'Create Your Profile', color: 'var(--c-blue)', desc: 'Sign up, complete your profile, upload your resume, and our AI starts building your match fingerprint.', icon: <svg width={'clamp(18px, 5vw, 20px)'} height={'clamp(18px, 5vw, 20px)'} viewBox="0 0 24 24" fill="none" stroke="var(--c-blue)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
            { n: '02', title: 'Get Matched & Apply', color: 'var(--c-green)', desc: 'Browse AI-ranked job listings tailored to your skills and experience. One-click applications to verified employers only.', icon: <svg width={'clamp(18px, 5vw, 20px)'} height={'clamp(18px, 5vw, 20px)'} viewBox="0 0 24 24" fill="none" stroke="var(--c-green)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg> },
            { n: '03', title: 'Track Every Step', color: '#8b5cf6', desc: 'Get real-time updates as you move through rounds. Accept interviews, view roadmaps, and sign your offer — all in one place.', icon: <svg width={'clamp(18px, 5vw, 20px)'} height={'clamp(18px, 5vw, 20px)'} viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg> },
        ] satisfies HowItWorksStep[],
    },
    employer: {
        label: 'For Employers',
        color: 'var(--c-blue)',
        steps: [
            { n: '01', title: 'Register & Post Roles', color: 'var(--c-blue)', desc: 'Create your company account, complete verification, and publish job listings to reach qualified candidates on JobGenie.', icon: <svg width={'clamp(18px, 5vw, 20px)'} height={'clamp(18px, 5vw, 20px)'} viewBox="0 0 24 24" fill="none" stroke="var(--c-blue)" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg> },
            { n: '02', title: 'Screen & Shortlist', color: 'var(--c-green)', desc: 'Review AI-ranked applicants on a drag-and-drop pipeline, invite top talent, and collaborate with your hiring team in real time.', icon: <svg width={'clamp(18px, 5vw, 20px)'} height={'clamp(18px, 5vw, 20px)'} viewBox="0 0 24 24" fill="none" stroke="var(--c-green)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
            { n: '03', title: 'Interview & Hire', color: '#8b5cf6', desc: 'Schedule multi-round interviews, compare feedback, extend offers, and track every hire from first application to signed contract.', icon: <svg width={'clamp(18px, 5vw, 20px)'} height={'clamp(18px, 5vw, 20px)'} viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></svg> },
        ] satisfies HowItWorksStep[],
    },
} as const;

function HowItWorksTiles({ steps, visible }: { steps: HowItWorksStep[]; visible: boolean }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3">
            {steps.map((step, i) => (
                <div key={step.n} className={i < steps.length - 1 ? 'border-b sm:border-b-0 sm:border-r' : ''} style={{ borderColor: 'var(--lp-border)' }}>
                    <HowStep step={step} idx={i} visible={visible} last={i === steps.length - 1} />
                </div>
            ))}
        </div>
    );
}

export function HowItWorksSection() {
    const [visible, ref] = useInView(0.1);
    const [activeFlow, setActiveFlow] = useState<'candidate' | 'employer'>('candidate');
    const flow = howItWorksFlows[activeFlow];

    return (
        <section id="how-it-works" className="px-3 xs:px-4 sm:px-8 md:px-12 py-12 xs:py-14 sm:py-20 lg:py-24" style={{ background: 'var(--lp-bg-2)', borderTop: '1px solid var(--lp-border-2)' }}>
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8 xs:mb-10 sm:mb-12 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full mb-3 sm:mb-4" style={{ border: '1px solid var(--lp-border)', background: 'var(--lp-surface)' }}>
                        <span style={{ fontSize: 'clamp(9px, 2.5vw, 10px)', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--lp-text-38)' }}>HOW IT WORKS</span>
                    </div>
                    <h2 className="font-extrabold mb-3 sm:mb-4" style={{ fontSize: 'clamp(28px, 7vw, 44px)', letterSpacing: '-0.03em', color: 'var(--lp-text)', lineHeight: 1.1 }}>
                        Up and running in 3 steps.
                    </h2>
                    <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', color: 'var(--lp-text-38)', lineHeight: 1.65, maxWidth: 520, margin: '0 auto' }}>
                        Whether you&apos;re finding your next role or building your team, JobGenie keeps the process simple.
                    </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 mb-6 xs:mb-8 px-4">
                    {(Object.keys(howItWorksFlows) as Array<keyof typeof howItWorksFlows>).map((key) => {
                        const item = howItWorksFlows[key];
                        const isActive = activeFlow === key;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActiveFlow(key)}
                                className="px-3.5 xs:px-4 py-1.5 xs:py-2 rounded-lg font-semibold transition-all touch-manipulation"
                                style={{
                                    fontSize: 'clamp(12px, 3vw, 14px)',
                                    minHeight: 36,
                                    border: '1px solid',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                    background: isActive ? item.color : 'var(--lp-surface)',
                                    color: isActive ? '#fff' : 'var(--lp-text-38)',
                                    borderColor: isActive ? item.color : 'var(--lp-border)',
                                    boxShadow: isActive ? `0 0 28px ${item.color}35` : 'none',
                                }}
                            >
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                <div ref={ref} key={activeFlow} className="rounded-xl sm:rounded-2xl overflow-hidden" style={{ border: '1px solid var(--lp-border)', animation: 'fadeInUp 300ms ease-out' }}>
                    <HowItWorksTiles steps={[...flow.steps]} visible={visible} />
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TESTIMONIALS
═══════════════════════════════════════════════════════════════════════════ */
function TestiCard({ quote: q, idx, visible }: {
    quote: { text: string; name: string; role: string; color: string; initials: string; stars: number };
    idx: number; visible: boolean;
}) {
    const [hover, setHover] = useState(false);
    return (
        <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
            className="relative overflow-hidden rounded-xl sm:rounded-2xl p-5 xs:p-6 sm:p-8 flex flex-col gap-4 xs:gap-5"
            style={{
                background: hover ? 'var(--lp-surface-hover)' : 'var(--lp-surface-2)',
                border: `1px solid ${hover ? 'var(--lp-border)' : 'var(--lp-border-2)'}`,
                boxShadow: hover ? '0 20px 56px rgba(0,0,0,0.1)' : 'none',
                opacity: visible ? 1 : 0,
                transform: visible ? 'none' : 'translateY(26px)',
                transition: `background 220ms, border-color 220ms, box-shadow 220ms, opacity 650ms ${idx * 140}ms ease-out, transform 650ms ${idx * 140}ms ease-out`,
            }}>
            <div className="absolute top-2 xs:top-3 right-3 xs:right-4 font-bold leading-none pointer-events-none select-none" style={{ fontSize: 'clamp(48px, 15vw, 70px)', color: 'var(--lp-text-12)', fontFamily: 'Georgia,serif' }}>&ldquo;</div>
            <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map(i => (
                    <svg key={i} width={'clamp(11px, 3vw, 13px)'} height={'clamp(11px, 3vw, 13px)'} viewBox="0 0 24 24" fill={i < q.stars ? '#f59e0b' : 'var(--lp-border)'} stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
                    </svg>
                ))}
            </div>
            <p className="flex-1 italic relative" style={{ fontSize: 'clamp(13px, 3.5vw, 15px)', color: 'var(--lp-text-60)', lineHeight: 1.78 }}>&ldquo;{q.text}&rdquo;</p>
            <div className="flex items-center gap-2.5 xs:gap-3 pt-3 xs:pt-4" style={{ borderTop: '1px solid var(--lp-border-2)' }}>
                <div style={{ width: 'clamp(36px, 9vw, 40px)', height: 'clamp(36px, 9vw, 40px)', minWidth: 36, minHeight: 36, borderRadius: '50%', background: `${q.color}14`, border: `1.5px solid ${q.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(11px, 3vw, 12px)', fontWeight: 700, color: q.color, flexShrink: 0 }}>{q.initials}</div>
                <div className="min-w-0">
                    <div style={{ fontSize: 'clamp(12px, 3vw, 13px)', fontWeight: 600, color: 'var(--lp-text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.name}</div>
                    <div style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', color: 'var(--lp-text-28)', marginTop: 1, lineHeight: 1.3 }}>{q.role}</div>
                </div>
            </div>
        </div>
    );
}

export function TestimonialsSection() {
    const [visible, ref] = useInView();
    const quotes = [
        { text: "As a hiring manager, I've tried every ATS on the market. JobGenie is the first that gives me genuine, real-time pipeline visibility. It's become the backbone of our entire talent operation.", name: 'Omar Hassan', role: 'CPO, Nexus Technologies', color: 'var(--c-blue)', initials: 'OH', stars: 5 },
        { text: "I signed up on Tuesday, had three interview invites by Thursday. The AI matching is genuinely accurate — no noise, only roles where I was actually qualified and excited about.", name: 'Alex Chen', role: 'Senior Engineer · Hired at TechCorp', color: 'var(--c-green)', initials: 'AC', stars: 5 },
        { text: "The MIS audit trail alone saved us during a compliance review. Everything is logged, timestamped, exportable. Our ops team has reclaimed 12+ hours per week.", name: 'Rachel Tan', role: 'Head of Operations, MIS Division', color: '#8b5cf6', initials: 'RT', stars: 5 },
    ];
    return (
        <section id="testimonials" className="px-3 xs:px-4 sm:px-8 md:px-12 py-12 xs:py-14 sm:py-20 lg:py-24" style={{ background: 'var(--lp-bg)', borderTop: '1px solid var(--lp-border-2)' }}>
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8 xs:mb-10 sm:mb-14 px-4">
                    <div className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full mb-3 sm:mb-4" style={{ border: '1px solid var(--lp-border)', background: 'var(--lp-surface)' }}>
                        <span style={{ fontSize: 'clamp(9px, 2.5vw, 10px)', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--lp-text-38)' }}>TESTIMONIALS</span>
                    </div>
                    <h2 className="font-extrabold" style={{ fontSize: 'clamp(28px, 7vw, 44px)', letterSpacing: '-0.03em', color: 'var(--lp-text)', lineHeight: 1.1 }}>Trusted by teams<br />who move fast.</h2>
                </div>
                <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 xs:gap-4">
                    {quotes.map((q, i) => <TestiCard key={i} quote={q} idx={i} visible={visible} />)}
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PORTAL SHOWCASE
═══════════════════════════════════════════════════════════════════════════ */
const portals = {
    candidate: { label: 'Candidate Portal', light: '#007a1c', dark: '#00bb30', headline: 'Your career command centre.', desc: 'Browse AI-matched jobs, track every application through custom stages, attend interviews, and accept offers — all from one clean dashboard.', features: ['AI job recommendations & match scores', 'Application status tracking', 'Multi-round interview calendar', 'Resume vault & profile builder'], href: '/candidate/signup' },
    employer: { label: 'Employer Portal', light: '#1a4ec7', dark: '#3b82f6', headline: 'Hire with precision and speed.', desc: 'Post verified roles, review applicants intelligently, run multi-round interviews with your team, and extend offers — with full pipeline transparency.', features: ['Drag-and-drop Kanban pipeline', 'Smart candidate search & invite', 'Team collaboration tools', 'Offer management & contracts'], href: '/employer/signup' },
};

export function PortalShowcase() {
    const [active, setActive] = useState<'candidate' | 'employer'>('candidate');
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const getColor = (key: keyof typeof portals) => isDark ? portals[key].dark : portals[key].light;
    const p = portals[active];
    const color = getColor(active);
    const candidateIcon = <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={getColor('candidate')} strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    const employerIcon = <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={getColor('employer')} strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>;
    const icons = { candidate: candidateIcon, employer: employerIcon };
    return (
        <section id="portals" className="px-3 xs:px-4 sm:px-8 md:px-12 py-12 xs:py-14 sm:py-20 lg:py-24" style={{ background: 'var(--lp-bg-2)', borderTop: '1px solid var(--lp-border-2)' }}>
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-8 xs:mb-10 sm:mb-12 px-4">
                    <div className="inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full mb-3 sm:mb-4" style={{ border: '1px solid var(--lp-border)', background: 'var(--lp-surface)' }}>
                        <span style={{ fontSize: 'clamp(9px, 2.5vw, 10px)', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--lp-text-38)' }}>TWO PORTALS</span>
                    </div>
                    <h2 className="font-extrabold" style={{ fontSize: 'clamp(28px, 7vw, 44px)', letterSpacing: '-0.03em', color: 'var(--lp-text)', lineHeight: 1.1 }}>Purpose-built for<br />every stakeholder.</h2>
                </div>

                {/* Tab buttons */}
                <div className="flex flex-wrap justify-center gap-2 mb-6 xs:mb-8 px-4">
                    {(Object.keys(portals) as Array<keyof typeof portals>).map(key => {
                        const kc = getColor(key);
                        return (
                            <button key={key} onClick={() => setActive(key)}
                                className="px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg font-semibold transition-all touch-manipulation"
                                style={{ fontSize: 'clamp(12px, 3vw, 14px)', minHeight: 36, border: '1px solid', cursor: 'pointer', fontFamily: 'inherit', background: active === key ? kc : 'var(--lp-surface)', color: active === key ? '#fff' : 'var(--lp-text-38)', borderColor: active === key ? kc : 'var(--lp-border)', boxShadow: active === key ? `0 0 28px ${kc}55` : 'none' }}>
                                {portals[key].label}
                            </button>
                        );
                    })}
                </div>

                {/* Portal card */}
                <div key={active} className="rounded-xl sm:rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2" style={{ border: '1px solid var(--lp-border)', animation: 'fadeInUp 300ms ease-out' }}>
                    {/* Visual */}
                    <div className="relative flex items-center justify-center py-10 xs:py-12 px-6 xs:px-8 min-h-[200px] sm:min-h-[280px]" style={{ background: 'var(--lp-surface)', borderBottom: '1px solid var(--lp-border-2)' }}>
                        <div className="dot-grid absolute inset-0" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div style={{ width: 'clamp(160px, 40vw, 200px)', height: 'clamp(160px, 40vw, 200px)', borderRadius: '50%', background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`, filter: 'blur(22px)' }} />
                        </div>
                        <div className="text-center relative z-10">
                            <div style={{ width: 'clamp(64px, 18vw, 80px)', height: 'clamp(64px, 18vw, 80px)', borderRadius: 'clamp(18px, 5vw, 22px)', background: `${color}15`, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto clamp(12px, 3vw, 16px)', boxShadow: `0 0 40px ${color}30` }}>{icons[active]}</div>
                            <div style={{ fontSize: 'clamp(9px, 2.5vw, 10px)', fontWeight: 700, letterSpacing: '0.1em', color: color, marginBottom: 'clamp(6px, 2vw, 8px)', textTransform: 'uppercase' }}>{p.label}</div>
                            <div className="font-bold" style={{ fontSize: 'clamp(16px, 4vw, 18px)', color: 'var(--lp-text)', letterSpacing: '-0.02em' }}>{p.headline}</div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 xs:p-6 sm:p-10 flex flex-col justify-center">
                        <p className="mb-5 xs:mb-6" style={{ fontSize: 'clamp(13px, 3.5vw, 15px)', color: 'var(--lp-text-45)', lineHeight: 1.78 }}>{p.desc}</p>
                        <ul className="space-y-2.5 xs:space-y-3 mb-6 xs:mb-7">
                            {p.features.map(f => (
                                <li key={f} className="flex items-start gap-2 xs:gap-2.5">
                                    <div style={{ width: 'clamp(16px, 4.5vw, 18px)', height: 'clamp(16px, 4.5vw, 18px)', minWidth: 16, minHeight: 16, marginTop: 2, borderRadius: '50%', background: `${color}18`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <svg width={'clamp(8px, 2.2vw, 9px)'} height={'clamp(8px, 2.2vw, 9px)'} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                    </div>
                                    <span style={{ fontSize: 'clamp(12px, 3vw, 13px)', color: 'var(--lp-text-45)', fontWeight: 500, lineHeight: 1.5 }}>{f}</span>
                                </li>
                            ))}
                        </ul>
                        <Link href={p.href}
                            className="self-start inline-flex items-center gap-1.5 xs:gap-2 font-semibold px-3.5 xs:px-4 py-2 xs:py-2.5 rounded-lg transition-all touch-manipulation"
                            style={{ fontSize: 'clamp(12px, 3vw, 14px)', minHeight: 40, border: `1.5px solid ${color}55`, background: `${color}10`, color: color, textDecoration: 'none' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}22`; (e.currentTarget as HTMLElement).style.borderColor = color; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${color}10`; (e.currentTarget as HTMLElement).style.borderColor = `${color}55`; }}>
                            Open {p.label}
                            <svg width={'clamp(11px, 3vw, 13px)'} height={'clamp(11px, 3vw, 13px)'} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CTA SECTION
═══════════════════════════════════════════════════════════════════════════ */
export function CTASection() {
    return (
        <section id="contact" className="relative overflow-hidden px-4 xs:px-5 sm:px-8 py-16 xs:py-20 sm:py-28 lg:py-36" style={{ background: 'var(--lp-bg)', borderTop: '1px solid var(--lp-border-2)' }}>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div style={{ width: 'min(900px, 100vw)', height: 'clamp(400px, 100vw, 600px)', borderRadius: '50%', background: 'radial-gradient(ellipse, var(--c-green-06) 0%, transparent 65%)' }} />
            </div>
            <div className="dot-grid absolute inset-0 pointer-events-none" />

            <div className="max-w-2xl mx-auto text-center relative z-10 px-4">
                <div className="anim-glow-pulse rounded-2xl flex items-center justify-center mx-auto mb-6 xs:mb-8" style={{ width: 'clamp(56px, 15vw, 64px)', height: 'clamp(56px, 15vw, 64px)', background: 'var(--c-green-08)', border: '1px solid var(--c-green-20)' }}>
                    <svg width={'clamp(22px, 6vw, 26px)'} height={'clamp(22px, 6vw, 26px)'} viewBox="0 0 24 24" fill="none" stroke="var(--c-green)" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                </div>

                <h2 className="font-extrabold mb-4 xs:mb-5" style={{ fontSize: 'clamp(28px, 8vw, 54px)', letterSpacing: '-0.035em', color: 'var(--lp-text)', lineHeight: 1.08 }}>
                    Ready to transform<br />how you hire?
                </h2>
                <p className="max-w-lg mx-auto mb-8 xs:mb-10" style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', color: 'var(--lp-text-38)', lineHeight: 1.78 }}>
                    Join thousands of companies and candidates already using JobGenie to move faster, hire smarter, and stay fully accountable.
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5 xs:gap-3 justify-center mb-5 xs:mb-6">
                    <Link href="/candidate/signup"
                        className="text-center font-bold text-white rounded-full transition-all touch-manipulation"
                        style={{ fontSize: 'clamp(13px, 3.5vw, 15px)', padding: 'clamp(12px, 3vw, 14px) clamp(24px, 6vw, 28px)', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-green)', textDecoration: 'none', boxShadow: '0 0 44px var(--c-green-40)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 60px var(--c-green-60)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 0 44px var(--c-green-40)'; }}>
                        Join as Candidate
                    </Link>
                    <Link href="/employer/signup"
                        className="text-center font-semibold rounded-full transition-all touch-manipulation"
                        style={{ fontSize: 'clamp(13px, 3.5vw, 15px)', padding: 'clamp(12px, 3vw, 14px) clamp(24px, 6vw, 28px)', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', background: 'var(--lp-surface)', color: 'var(--lp-text-60)', border: '1px solid var(--lp-border)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-green-40)'; (e.currentTarget as HTMLElement).style.color = 'var(--lp-text)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--lp-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--lp-text-60)'; }}>
                        Join as Employer
                    </Link>
                </div>
                <p style={{ fontSize: 'clamp(11px, 2.8vw, 12px)', color: 'var(--lp-text-16)', lineHeight: 1.5 }}>No credit card required · Free to start · Setup in under 5 minutes</p>
            </div>
        </section>
    );
}
