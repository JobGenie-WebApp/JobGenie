'use client';

import { useEffect, useRef, useState } from 'react';

function useInView(threshold = 0.1) {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [threshold]);
    return [visible, ref] as const;
}

function AIMatchingVisual({ hover }: { hover: boolean }) {
    const candidates = [
        { init: 'AC', name: 'Alice Chen', score: 96, color: 'var(--c-green)' },
        { init: 'BP', name: 'Ben Park', score: 87, color: 'var(--c-blue)' },
        { init: 'CL', name: 'Chris Lee', score: 72, color: '#8b5cf6' },
        { init: 'DW', name: 'Dana Wu', score: 61, color: '#f59e0b' },
    ];
    return (
        <div style={{ width: '100%', maxWidth: 'min(290px, 90vw)', borderRadius: 'clamp(12px, 3.5vw, 14px)', overflow: 'hidden', background: 'var(--lp-card-bg)', border: `1px solid ${hover ? 'var(--c-blue-30)' : 'var(--lp-border)'}`, boxShadow: hover ? '0 0 48px var(--c-blue-15)' : 'var(--lp-glass-shadow)', transition: 'border-color 280ms, box-shadow 280ms', margin: '0 auto' }}>
            <div style={{ padding: 'clamp(8px, 2.5vw, 13px)', borderBottom: '1px solid var(--lp-border-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', fontWeight: 600, color: 'var(--lp-text-45)' }}>AI Match Ranking</span>
                <span style={{ fontSize: 'clamp(8px, 2vw, 9px)', background: 'var(--c-blue-10)', color: 'var(--c-blue)', padding: '2px clamp(5px, 1.5vw, 7px)', borderRadius: 4, fontWeight: 700, border: '1px solid var(--c-blue-20)', whiteSpace: 'nowrap' }}>RANKED</span>
            </div>
            {candidates.map((c, i) => (
                <div key={i} style={{ padding: 'clamp(7px, 2vw, 9px) clamp(8px, 2.5vw, 13px)', borderBottom: i < 3 ? '1px solid var(--lp-border-2)' : 'none', background: i === 0 ? 'rgba(0,180,60,0.03)' : 'transparent', display: 'flex', alignItems: 'center', gap: 'clamp(7px, 2vw, 9px)' }}>
                    <div style={{ width: 'clamp(24px, 6vw, 26px)', height: 'clamp(24px, 6vw, 26px)', minWidth: 24, minHeight: 24, borderRadius: 'clamp(5px, 1.5vw, 6px)', background: `${c.color}18`, border: `1px solid ${c.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(7px, 2vw, 8px)', fontWeight: 700, color: c.color, flexShrink: 0 }}>{c.init}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(3px, 1vw, 4px)', gap: 6 }}>
                            <span style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', fontWeight: 600, color: 'var(--lp-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                            <span style={{ fontSize: 'clamp(9px, 2.3vw, 10px)', fontWeight: 700, color: c.color, flexShrink: 0, fontFamily: 'monospace' }}>{c.score}%</span>
                        </div>
                        <div style={{ height: 'clamp(2px, 0.6vw, 2.5px)', borderRadius: 99, background: 'var(--lp-border)' }}>
                            <div style={{ height: '100%', width: `${c.score}%`, borderRadius: 99, background: c.color, boxShadow: `0 0 6px ${c.color}50` }} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function PipelineKanbanVisual({ hover }: { hover: boolean }) {
    const cols = [
        { label: 'Applied', color: '#f59e0b', cards: [{ i: 'AC' }, { i: 'BL' }, { i: 'NM' }] },
        { label: 'Interview', color: '#3b82f6', cards: [{ i: 'RK' }, { i: 'TW' }] },
        { label: 'Offer', color: '#00bb30', cards: [{ i: 'VP' }] },
    ];
    return (
        <div style={{ width: '100%', maxWidth: 'min(300px, 90vw)', borderRadius: 'clamp(12px, 3.5vw, 14px)', overflow: 'hidden', background: 'var(--lp-card-bg)', border: `1px solid ${hover ? 'var(--c-green-40)' : 'var(--lp-border)'}`, boxShadow: hover ? '0 0 48px var(--c-green-12)' : 'var(--lp-glass-shadow)', transition: 'border-color 280ms, box-shadow 280ms', margin: '0 auto' }}>
            <div style={{ padding: 'clamp(8px, 2.5vw, 13px)', borderBottom: '1px solid var(--lp-border-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', fontWeight: 600, color: 'var(--lp-text-45)' }}>Pipeline Board</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(3px, 1vw, 5px)' }}>
                    <span style={{ fontSize: 'clamp(8px, 2vw, 9px)', color: 'var(--lp-text-28)', whiteSpace: 'nowrap' }}>6 candidates</span>
                    <div className="anim-pulse-green" style={{ width: 'clamp(4px, 1vw, 5px)', height: 'clamp(4px, 1vw, 5px)', minWidth: 4, minHeight: 4, borderRadius: '50%', background: 'var(--c-green)', flexShrink: 0 }} />
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(5px, 1.5vw, 7px)', padding: 'clamp(9px, 2.5vw, 11px)' }}>
                {cols.map((col, ci) => (
                    <div key={ci}>
                        <div style={{ fontSize: 'clamp(7px, 2vw, 8px)', fontWeight: 700, color: col.color, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 'clamp(4px, 1.5vw, 6px)', display: 'flex', alignItems: 'center', gap: 'clamp(2px, 0.7vw, 3px)' }}>
                            <span style={{ width: 'clamp(2.5px, 0.7vw, 3px)', height: 'clamp(2.5px, 0.7vw, 3px)', minWidth: 2, minHeight: 2, borderRadius: '50%', background: col.color, display: 'inline-block', flexShrink: 0 }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.label}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(3px, 1vw, 5px)' }}>
                            {col.cards.map((card, i) => (
                                <div key={i} style={{ padding: 'clamp(4px, 1.2vw, 5px) clamp(5px, 1.5vw, 6px)', borderRadius: 'clamp(4px, 1.2vw, 5px)', background: 'var(--lp-surface)', border: '1px solid var(--lp-border-2)', display: 'flex', alignItems: 'center', gap: 'clamp(3px, 1vw, 4px)' }}>
                                    <div style={{ width: 'clamp(13px, 3.5vw, 15px)', height: 'clamp(13px, 3.5vw, 15px)', minWidth: 13, minHeight: 13, borderRadius: 'clamp(2.5px, 0.7vw, 3px)', background: `${col.color}18`, border: `1px solid ${col.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(6px, 1.6vw, 6.5px)', fontWeight: 700, color: col.color, flexShrink: 0 }}>{card.i}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ height: 'clamp(1.5px, 0.5vw, 2px)', borderRadius: 99, background: 'var(--lp-border)', width: '85%' }} />
                                        <div style={{ height: 'clamp(1px, 0.4vw, 1.5px)', borderRadius: 99, background: 'var(--lp-border-2)', width: '55%', marginTop: 'clamp(1.5px, 0.5vw, 2px)' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function VerifyVisual({ hover }: { hover: boolean }) {
    const steps = [
        { label: 'Identity Document', done: true, active: false, time: 'Verified 2h ago' },
        { label: 'Work Authorization', done: true, active: false, time: 'Verified 1h ago' },
        { label: 'Business Registration', done: true, active: false, time: 'Verified 30m ago' },
        { label: 'Background Check', done: false, active: true, time: 'In progress...' },
    ];
    return (
        <div style={{ width: '100%', maxWidth: 'min(268px, 90vw)', borderRadius: 'clamp(12px, 3.5vw, 14px)', overflow: 'hidden', background: 'var(--lp-card-bg)', border: `1px solid ${hover ? 'rgba(139,92,246,0.45)' : 'var(--lp-border)'}`, boxShadow: hover ? '0 0 48px rgba(139,92,246,0.14)' : 'var(--lp-glass-shadow)', transition: 'border-color 280ms, box-shadow 280ms', margin: '0 auto' }}>
            <div style={{ padding: 'clamp(8px, 2.5vw, 13px)', borderBottom: '1px solid var(--lp-border-2)' }}>
                <span style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', fontWeight: 600, color: 'var(--lp-text-45)' }}>Verification Status</span>
            </div>
            <div style={{ padding: 'clamp(9px, 2.5vw, 11px) clamp(8px, 2.5vw, 13px)', display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 2vw, 8px)' }}>
                {steps.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(7px, 2vw, 9px)' }}>
                        <div style={{ width: 'clamp(16px, 4.5vw, 18px)', height: 'clamp(16px, 4.5vw, 18px)', minWidth: 16, minHeight: 16, borderRadius: '50%', flexShrink: 0, background: s.done ? 'var(--c-green-12)' : s.active ? 'rgba(139,92,246,0.12)' : 'var(--lp-surface)', border: `1.5px solid ${s.done ? 'var(--c-green-40)' : s.active ? 'rgba(139,92,246,0.55)' : 'var(--lp-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {s.done && <svg width={'clamp(7px, 2vw, 8px)'} height={'clamp(7px, 2vw, 8px)'} viewBox="0 0 24 24" fill="none" stroke="var(--c-green)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
                            {s.active && <div style={{ width: 'clamp(3.5px, 1vw, 4px)', height: 'clamp(3.5px, 1vw, 4px)', minWidth: 3, minHeight: 3, borderRadius: '50%', background: '#8b5cf6' }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 'clamp(9px, 2.5vw, 10px)', fontWeight: 500, color: s.done ? 'var(--lp-text-60)' : s.active ? '#8b5cf6' : 'var(--lp-text-22)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</div>
                            <div style={{ fontSize: 'clamp(7.5px, 2vw, 8.5px)', color: 'var(--lp-text-22)', marginTop: 'clamp(0.5px, 0.3vw, 1px)' }}>{s.time}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AnalyticsVisual({ hover }: { hover: boolean }) {
    const [inView, ref] = useInView(0.1);
    const [ready, setReady] = useState(false);
    useEffect(() => { if (inView) { const t = setTimeout(() => setReady(true), 180); return () => clearTimeout(t); } }, [inView]);
    const bars = [{ d: 'M', v: 45 }, { d: 'T', v: 72 }, { d: 'W', v: 58 }, { d: 'T', v: 92 }, { d: 'F', v: 76 }, { d: 'S', v: 38 }];
    const maxH = 60;
    return (
        <div ref={ref} style={{ width: '100%', maxWidth: 'min(290px, 90vw)', borderRadius: 'clamp(12px, 3.5vw, 14px)', overflow: 'hidden', background: 'var(--lp-card-bg)', border: `1px solid ${hover ? 'rgba(245,158,11,0.45)' : 'var(--lp-border)'}`, boxShadow: hover ? '0 0 48px rgba(245,158,11,0.12)' : 'var(--lp-glass-shadow)', transition: 'border-color 280ms, box-shadow 280ms', margin: '0 auto' }}>
            <div style={{ padding: 'clamp(8px, 2.5vw, 13px)', borderBottom: '1px solid var(--lp-border-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', fontWeight: 600, color: 'var(--lp-text-45)' }}>Hiring Velocity</span>
                <span style={{ fontSize: 'clamp(9px, 2.3vw, 10px)', color: 'var(--c-green)', fontWeight: 700, background: 'var(--c-green-08)', padding: '2px clamp(5px, 1.5vw, 7px)', borderRadius: 4, border: '1px solid var(--c-green-20)', whiteSpace: 'nowrap' }}>↑ 34%</span>
            </div>
            <div style={{ padding: 'clamp(10px, 3vw, 12px) clamp(8px, 2.5vw, 13px)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'clamp(4px, 1.2vw, 5px)', height: 'clamp(50px, 15vw, 66px)', marginBottom: 'clamp(6px, 2vw, 8px)' }}>
                    {bars.map((b, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(2px, 0.7vw, 3px)', height: '100%', justifyContent: 'flex-end' }}>
                            <div style={{ width: '100%', height: ready ? `${(b.v / 100) * 100}%` : '0%', borderRadius: '3px 3px 0 0', background: i === 3 ? 'linear-gradient(to top, #f59e0b, #fbbf24)' : 'rgba(245,158,11,0.22)', boxShadow: i === 3 ? '0 0 14px rgba(245,158,11,0.4)' : 'none', transition: `height 700ms ${i * 55}ms cubic-bezier(0.34,1.4,0.64,1)` }} />
                            <span style={{ fontSize: 'clamp(6.5px, 1.8vw, 7.5px)', color: 'var(--lp-text-22)', fontWeight: 500 }}>{b.d}</span>
                        </div>
                    ))}
                </div>
                <div style={{ borderTop: '1px solid var(--lp-border-2)', paddingTop: 'clamp(7px, 2vw, 9px)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(4px, 1.2vw, 5px)' }}>
                    {[{ l: 'Applications', v: '1,284' }, { l: 'Interviews', v: '342' }, { l: 'Offers', v: '67' }].map((m, i) => (
                        <div key={i} style={{ textAlign: 'center', padding: 'clamp(4px, 1.2vw, 5px) clamp(2px, 0.7vw, 3px)', borderRadius: 'clamp(4px, 1.2vw, 5px)', background: 'var(--lp-surface)' }}>
                            <div style={{ fontSize: 'clamp(11px, 3vw, 13px)', fontWeight: 700, color: 'var(--lp-text)', letterSpacing: '-0.03em', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.v}</div>
                            <div style={{ fontSize: 'clamp(7px, 2vw, 8px)', color: 'var(--lp-text-22)', marginTop: 'clamp(1px, 0.5vw, 2px)', lineHeight: 1.2 }}>{m.l}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

type VisualComponent = React.FC<{ hover: boolean }>;

function FeatureRow({ row, idx, visible }: {
    row: { tag: string; color: string; title: string; desc: string; pills: string[]; Visual: VisualComponent; right: boolean };
    idx: number; visible: boolean;
}) {
    const [hover, setHover] = useState(false);
    const { Visual } = row;

    return (
        <div
            onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
            className="border-b last:border-b-0 flex flex-col lg:grid"
            style={{
                gridTemplateColumns: row.right ? '1fr minmax(280px, 340px)' : 'minmax(280px, 340px) 1fr',
                background: hover ? 'var(--lp-surface-hover)' : 'var(--lp-surface-2)',
                borderBottomColor: 'var(--lp-border-2)',
                opacity: visible ? 1 : 0,
                transform: visible ? 'none' : 'translateY(30px)',
                transition: `background 220ms, opacity 580ms ${idx * 100}ms ease-out, transform 580ms ${idx * 100}ms ease-out`,
            }}
        >
            {/* Visual — top on mobile, side on desktop */}
            <div
                className={`flex items-center justify-center py-6 xs:py-8 px-4 xs:px-6 sm:px-10 ${row.right ? 'lg:order-last' : 'lg:order-first'}`}
                style={{ background: 'var(--lp-surface)', borderBottom: '1px solid var(--lp-border-2)' }}
            >
                <div className="w-full flex justify-center max-w-full overflow-hidden">
                    <Visual hover={hover} />
                </div>
            </div>

            {/* Text */}
            <div className="px-5 xs:px-6 py-6 xs:py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-14 flex flex-col justify-center">
                <div style={{ fontSize: 'clamp(9px, 2.5vw, 10px)', fontWeight: 700, letterSpacing: '0.13em', color: row.color, marginBottom: 'clamp(8px, 2.5vw, 12px)' }}>{row.tag}</div>
                <h3 className="font-bold mb-3 xs:mb-4" style={{ fontSize: 'clamp(20px, 5.5vw, 28px)', letterSpacing: '-0.022em', color: 'var(--lp-text)', lineHeight: 1.22, whiteSpace: 'pre-line' }}>{row.title}</h3>
                <p className="mb-5 xs:mb-6" style={{ fontSize: 'clamp(13px, 3.5vw, 15px)', color: 'var(--lp-text-38)', lineHeight: 1.78 }}>{row.desc}</p>
                <div className="flex flex-col gap-2 xs:gap-2.5">
                    {row.pills.map(p => (
                        <div key={p} className="flex items-center gap-2 xs:gap-2.5">
                            <div style={{ width: 'clamp(15px, 4vw, 17px)', height: 'clamp(15px, 4vw, 17px)', minWidth: 15, minHeight: 15, borderRadius: '50%', background: `${row.color}14`, border: `1px solid ${row.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width={'clamp(7px, 2vw, 8px)'} height={'clamp(7px, 2vw, 8px)'} viewBox="0 0 24 24" fill="none" stroke={row.color} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            </div>
                            <span style={{ fontSize: 'clamp(12px, 3vw, 13px)', color: 'var(--lp-text-45)', fontWeight: 500, lineHeight: 1.4 }}>{p}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function Features() {
    const [visible, ref] = useInView();
    const rows = [
        { tag: 'INTELLIGENT MATCHING', color: 'var(--c-blue)', title: 'Find the right fit.\nEvery single time.', desc: 'Our AI engine scores every candidate against each job using skills, experience, location, and culture signals. No more resume pile sorting — just relevant matches, ranked by confidence.', pills: ['Skill graph analysis', 'Culture fit scoring', 'Real-time re-ranking'], Visual: AIMatchingVisual, right: false },
        { tag: 'PIPELINE MANAGEMENT', color: 'var(--c-green)', title: 'Every candidate.\nEvery stage. In view.', desc: 'Drag-and-drop Kanban boards replace spreadsheet chaos. Move candidates through custom stages, add round feedback, and see where every person stands in real time.', pills: ['Drag-and-drop Kanban', 'Round feedback & ratings', 'Multi-recruiter pipeline'], Visual: PipelineKanbanVisual, right: true },
        { tag: 'TRUST & VERIFICATION', color: '#8b5cf6', title: 'Only verified parties.\nOn both sides.', desc: 'Every employer submits business registration and goes through MIS approval. Every candidate is document-verified before they can apply. No fake listings. No ghost candidates.', pills: ['Business registration check', 'Document verification', 'Admin approval gate'], Visual: VerifyVisual, right: false },
        { tag: 'REAL-TIME ANALYTICS', color: '#f59e0b', title: 'Full visibility.\nZero blind spots.', desc: 'Live dashboards track your hiring velocity, offer acceptance rate, pipeline health, and team performance. Export everything, anytime, in one click.', pills: ['Hiring funnel analytics', 'Velocity tracking', 'CSV & report exports'], Visual: AnalyticsVisual, right: true },
    ];

    return (
        <section id="features" className="px-3 xs:px-4 sm:px-8 md:px-12 py-12 xs:py-14 sm:py-20 lg:py-24" style={{ background: 'var(--lp-bg)' }}>
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-10 xs:mb-12 sm:mb-16 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full mb-3 sm:mb-4" style={{ border: '1px solid var(--c-green-30)', background: 'var(--c-green-06)' }}>
                        <span style={{ fontSize: 'clamp(9px, 2.5vw, 10px)', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--c-green)' }}>PLATFORM CAPABILITIES</span>
                    </div>
                    <h2 className="font-extrabold mb-2.5 sm:mb-3" style={{ fontSize: 'clamp(28px, 7vw, 48px)', letterSpacing: '-0.033em', color: 'var(--lp-text)', lineHeight: 1.1 }}>Built for every stage<br />of hiring.</h2>
                    <p className="max-w-md mx-auto" style={{ fontSize: 'clamp(13px, 3.5vw, 16px)', color: 'var(--lp-text-38)', lineHeight: 1.72 }}>From first application to signed offer — every step is transparent and auditable.</p>
                </div>
                <div ref={ref} className="rounded-xl sm:rounded-2xl overflow-hidden" style={{ border: '1px solid var(--lp-border)' }}>
                    {rows.map((row, i) => <FeatureRow key={i} row={row} idx={i} visible={visible} />)}
                </div>
            </div>
        </section>
    );
}
