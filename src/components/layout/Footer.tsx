'use client';

import Link from 'next/link';

const cols = [
    { title: 'Product', links: ['Features', 'How It Works', 'Pricing', 'Enterprise', 'Changelog'] },
    { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press', 'Partners'] },
    { title: 'Resources', links: ['Documentation', 'API Reference', 'Status', 'Community'] },
    { title: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'] },
];

const hrefMap: Record<string, string> = {
    Features: '#features', 'How It Works': '#how-it-works', Pricing: '#', Enterprise: '#', Changelog: '#',
    About: '#', Blog: '#', Careers: '#', Press: '#', Partners: '#',
    Documentation: '#', 'API Reference': '#', Status: '#', Community: '#',
    'Privacy Policy': '/privacy', 'Terms of Service': '/terms', 'Cookie Policy': '#', GDPR: '#',
};

export function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer style={{ background: 'var(--lp-footer-bg)', borderTop: '1px solid var(--lp-border-2)', padding: 'clamp(40px, 10vw, 60px) clamp(20px, 5vw, 56px) clamp(24px, 6vw, 32px)', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 xs:gap-8 lg:gap-10 mb-10 sm:mb-12">
                    {/* Brand */}
                    <div className="col-span-2 sm:col-span-3 lg:col-span-1">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 'clamp(12px, 3vw, 16px)' }}>
                            <div style={{ width: 'clamp(26px, 6vw, 28px)', height: 'clamp(26px, 6vw, 28px)', borderRadius: 7, background: 'var(--c-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px var(--c-green-30)' }}>
                                <svg width={'clamp(12px, 3vw, 13px)'} height={'clamp(12px, 3vw, 13px)'} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 'clamp(14px, 3.5vw, 15px)', letterSpacing: '-0.02em', color: 'var(--lp-text)' }}>
                                Job<span style={{ color: 'var(--c-green)' }}>Genie</span>
                            </span>
                        </div>
                        <p style={{ fontSize: 'clamp(12px, 3vw, 13px)', color: 'var(--lp-text-22)', lineHeight: 1.72, maxWidth: '100%', marginBottom: 'clamp(16px, 4vw, 20px)' }}>
                            The recruitment operating system for teams who value clarity, speed, and accountability.
                        </p>
                        <div style={{ display: 'flex', gap: 'clamp(6px, 2vw, 8px)', flexWrap: 'wrap' }}>
                            {[
                                { label: 'Twitter', icon: <svg width={'clamp(11px, 3vw, 12px)'} height={'clamp(11px, 3vw, 12px)'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.7 5.3 4.3 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg> },
                                { label: 'LinkedIn', icon: <svg width={'clamp(11px, 3vw, 12px)'} height={'clamp(11px, 3vw, 12px)'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg> },
                                { label: 'GitHub', icon: <svg width={'clamp(11px, 3vw, 12px)'} height={'clamp(11px, 3vw, 12px)'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg> },
                            ].map(s => (
                                <div key={s.label}
                                    className="touch-manipulation"
                                    style={{ width: 'clamp(30px, 8vw, 32px)', height: 'clamp(30px, 8vw, 32px)', minWidth: 30, minHeight: 30, borderRadius: 8, background: 'var(--lp-surface)', border: '1px solid var(--lp-border)', color: 'var(--lp-text-28)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 160ms' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--c-green-40)'; (e.currentTarget as HTMLElement).style.background = 'var(--lp-surface-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--lp-text)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--lp-border)'; (e.currentTarget as HTMLElement).style.background = 'var(--lp-surface)'; (e.currentTarget as HTMLElement).style.color = 'var(--lp-text-28)'; }}
                                    aria-label={s.label}>
                                    {s.icon}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {cols.map(col => (
                        <div key={col.title}>
                            <div style={{ fontSize: 'clamp(9px, 2.3vw, 10px)', fontWeight: 700, color: 'var(--lp-text-22)', letterSpacing: '0.12em', marginBottom: 'clamp(10px, 3vw, 14px)', textTransform: 'uppercase' }}>{col.title}</div>
                            {col.links.map(l => (
                                <div key={l} style={{ marginBottom: 'clamp(7px, 2vw, 9px)' }}>
                                    <Link href={hrefMap[l] ?? '#'}
                                        style={{ fontSize: 'clamp(12px, 3vw, 13px)', color: 'var(--lp-text-28)', transition: 'color 150ms', textDecoration: 'none', display: 'block' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--c-green)'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--lp-text-28)'; }}>
                                        {l}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" style={{ borderTop: '1px solid var(--lp-border-2)', paddingTop: 'clamp(18px, 5vw, 22px)' }}>
                    <span style={{ fontSize: 'clamp(11px, 2.8vw, 12px)', color: 'var(--lp-text-16)', lineHeight: 1.5 }}>
                        © {year} JobGenie Technologies Ltd. All rights reserved.
                    </span>
                    <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 xs:gap-4">
                        <span style={{ fontSize: 'clamp(9px, 2.3vw, 10px)', color: 'var(--lp-text-12)', letterSpacing: '0.08em', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>TALENT OS v1.0</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1.2vw, 5px)' }}>
                            <div className="anim-pulse-green" style={{ width: 'clamp(5px, 1.5vw, 6px)', height: 'clamp(5px, 1.5vw, 6px)', minWidth: 5, minHeight: 5, borderRadius: '50%', background: 'var(--c-green)' }} />
                            <span style={{ fontSize: 'clamp(10px, 2.5vw, 11px)', color: 'var(--lp-text-22)', fontWeight: 500, whiteSpace: 'nowrap' }}>All systems operational</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
