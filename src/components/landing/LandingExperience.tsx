'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck2,
  Check,
  ChevronRight,
  CircleCheckBig,
  FileCheck2,
  Fingerprint,
  LayoutDashboard,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  WandSparkles,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const reveal = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0 },
};

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={reveal}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function MagicDust() {
  return (
    <div className="jg-dust" aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => (
        <i key={i} style={{ '--i': i } as React.CSSProperties} />
      ))}
    </div>
  );
}

function MagicCursor() {
  useEffect(() => {
    const root = document.documentElement;
    const move = (event: PointerEvent) => {
      root.style.setProperty('--jg-pointer-x', `${event.clientX}px`);
      root.style.setProperty('--jg-pointer-y', `${event.clientY}px`);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);
  return <div className="jg-magic-cursor" aria-hidden="true" />;
}

function MagicLamp({ active, onRub }: { active: boolean; onRub: () => void }) {
  return (
    <button className={`jg-lamp ${active ? 'is-rubbed' : ''}`} onClick={onRub} aria-label="Rub the JobGenie magic lamp">
      <span>Rub the lamp</span>
      <svg viewBox="0 0 250 150" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="lampGold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff1a7"/><stop offset=".32" stopColor="#f7bd3c"/><stop offset=".68" stopColor="#b96a08"/><stop offset="1" stopColor="#ffe17b"/></linearGradient>
          <linearGradient id="lampDark" x1="0" x2="1"><stop stopColor="#6f3804"/><stop offset=".5" stopColor="#d98c17"/><stop offset="1" stopColor="#6c3402"/></linearGradient>
          <filter id="lampGlow"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <ellipse cx="137" cy="137" rx="80" ry="8" fill="rgba(0,0,0,.18)"/>
        <path d="M63 72c-22 8-39 7-52-2 15 25 41 34 78 22" fill="none" stroke="url(#lampGold)" strokeWidth="12" strokeLinecap="round"/>
        <path d="M58 61c18-12 94-15 126 4 18 11 17 47-13 59-32 13-85 8-108-11-14-12-17-42-5-52Z" fill="url(#lampGold)" stroke="#8b4b06" strokeWidth="3"/>
        <path d="M75 63c18 12 79 14 101 1-10 22-21 34-48 38-28 4-44-12-53-39Z" fill="rgba(255,244,163,.24)"/>
        <path d="M184 67c20-8 40-4 47 8-17-5-31 1-39 15" fill="none" stroke="url(#lampGold)" strokeWidth="13" strokeLinecap="round"/>
        <path d="M228 74l14-7-8 15Z" fill="#f3b52f" stroke="#8b4b06" strokeWidth="2"/>
        <path d="M87 124h76l17 12H68Z" fill="url(#lampDark)" stroke="#713802" strokeWidth="2"/>
        <path d="M86 48c5-14 19-22 42-22s38 8 43 22" fill="url(#lampGold)" stroke="#8b4b06" strokeWidth="3"/>
        <path d="M109 27c4-9 12-13 20-13s16 4 20 13" fill="url(#lampDark)"/>
        <circle cx="129" cy="13" r="6" fill="#ffe379" filter="url(#lampGlow)"/>
      </svg>
      <i className="jg-lamp-shine" />
    </button>
  );
}

function GenieScene() {
  const [rubbed, setRubbed] = useState(false);
  const rubLamp = () => {
    setRubbed(false);
    requestAnimationFrame(() => setRubbed(true));
    window.setTimeout(() => setRubbed(false), 2400);
  };
  return (
    <div className={`jg-genie-scene ${rubbed ? 'is-awake' : ''}`}>
      <div className="jg-magic-moon"><span>JG</span>{Array.from({ length: 3 }, (_, i) => <i key={i} />)}</div>
      <svg className="jg-smoke-ribbons" viewBox="0 0 620 760" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="smokeGreen" x1="0" y1="1" x2=".6" y2="0"><stop stopColor="#2ee879" stopOpacity=".95"/><stop offset=".5" stopColor="#82ffb3" stopOpacity=".5"/><stop offset="1" stopColor="#d8ffe7" stopOpacity="0"/></linearGradient>
          <filter id="smokeBlur"><feGaussianBlur stdDeviation="8"/></filter>
        </defs>
        <path className="jg-smoke jg-smoke--one" d="M330 755C160 666 465 625 302 548S130 406 340 364 493 213 324 153 284 46 384 6" />
        <path className="jg-smoke jg-smoke--two" d="M342 756C470 658 206 639 360 544S507 404 325 354 199 224 350 153 418 55 332 7" />
        <path className="jg-smoke jg-smoke--blur" d="M330 760C195 652 440 620 312 540S180 407 341 357 455 211 330 151 311 63 368 7" />
      </svg>
      <div className="jg-spark-burst" aria-hidden="true">{Array.from({ length: 22 }, (_, i) => <i key={i} style={{ '--n': i } as React.CSSProperties} />)}</div>
      <motion.div className="jg-genie" initial={{ opacity: 0, x: 45, scale: .88 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 1, delay: .15, ease: [0.22, 1, 0.36, 1] }}>
        <Image src="/Genie.png" alt="The JobGenie emerging from a magic lamp" fill priority sizes="(max-width: 900px) 88vw, 560px" />
      </motion.div>
      <div className="jg-wish-orbit" aria-hidden="true"><i /><i /><i /></div>
      <div className="jg-wish-card jg-wish-card--job"><span><BriefcaseBusiness size={15} /></span><div><small>WISH MATCHED</small><b>Product Designer</b><em>94% match</em></div></div>
      <div className="jg-wish-card jg-wish-card--talent"><span><UsersRound size={15} /></span><div><small>TOP TALENT FOUND</small><b>3 verified candidates</b><em>Ready to interview</em></div></div>
      <MagicLamp active={rubbed} onRub={rubLamp} />
    </div>
  );
}

function HeroDashboard() {
  return (
    <motion.div
      className="jg-dashboard"
      initial={{ opacity: 0, y: 35, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="jg-dashboard__top">
        <div className="jg-window-dots"><i /><i /><i /></div>
        <span>Recruitment command center</span>
        <span className="jg-live"><i /> LIVE</span>
      </div>
      <div className="jg-dashboard__body">
        <aside className="jg-dashboard__rail">
          <div className="is-active"><LayoutDashboard size={15} /></div>
          <div><UsersRound size={15} /></div>
          <div><CalendarCheck2 size={15} /></div>
          <div><BarChart3 size={15} /></div>
        </aside>
        <div className="jg-dashboard__content">
          <div className="jg-mini-heading">
            <div><small>OPEN ROLE</small><strong>Senior Product Designer</strong></div>
            <span>18 candidates</span>
          </div>
          <div className="jg-pipeline">
            {[
              ['New', '08', ['AM', 'DK', 'SL']],
              ['Shortlist', '05', ['NR', 'JT']],
              ['Interview', '03', ['KM', 'RB']],
              ['Offer', '02', ['EP']],
            ].map(([title, count, people], col) => (
              <div className="jg-pipeline__col" key={title as string}>
                <div><span>{title as string}</span><b>{count as string}</b></div>
                {(people as string[]).map((person, index) => (
                  <div className={`jg-person ${col === 2 && index === 0 ? 'is-glowing' : ''}`} key={person}>
                    <i>{person}</i>
                    <span><b>{['Alex Morgan', 'Dinu K.', 'Sara Lee', 'Nina R.', 'James T.', 'Kavi M.', 'Ravi B.', 'Emma P.'][(col * 2 + index) % 8]}</b><small>{96 - col * 7 - index * 3}% match</small></span>
                    {col === 2 && index === 0 && <Sparkles size={12} />}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="jg-match-pop">
        <span><Sparkles size={15} /></span>
        <div><small>GENIE MATCH</small><strong>Top candidate found</strong></div>
        <b>96%</b>
      </div>
    </motion.div>
  );
}

const featureCards = [
  { icon: WandSparkles, eyebrow: 'AI MATCHING', title: 'The right match, without the guesswork.', text: 'Skills, experience and ambition are translated into clear match signals your team can trust.', className: 'is-wide is-green', visual: 'match' },
  { icon: Fingerprint, eyebrow: 'TRUST LAYER', title: 'Verified from day one.', text: 'Build confidence with verified candidate and employer profiles.', className: '', visual: 'verify' },
  { icon: CalendarCheck2, eyebrow: 'INTERVIEWS', title: 'From shortlist to scheduled.', text: 'Coordinate every round, reminder and response in one calm workspace.', className: '', visual: 'calendar' },
  { icon: BarChart3, eyebrow: 'PIPELINE', title: 'See hiring momentum.', text: 'Live pipeline analytics reveal bottlenecks before they slow your team down.', className: '', visual: 'chart' },
  { icon: MessageSquareText, eyebrow: 'COLLABORATION', title: 'One source of truth for the whole team.', text: 'Notes, decisions, invitations and status updates stay connected to every candidate.', className: 'is-wide', visual: 'team' },
];

function FeatureVisual({ type }: { type: string }) {
  if (type === 'match') return (
    <div className="jg-feature-match">
      <div><i>NM</i><span><small>TOP TALENT</small><b>Nethmi M.</b><em>Product Designer</em></span></div>
      <div className="jg-score-ring"><strong>96</strong><small>%</small></div>
      <ul><li><Check size={11} /> Skills</li><li><Check size={11} /> Experience</li><li><Check size={11} /> Culture</li></ul>
    </div>
  );
  if (type === 'verify') return <div className="jg-feature-center"><div className="jg-verify-orbit"><BadgeCheck size={31} /><i /><i /></div><span>Identity verified</span></div>;
  if (type === 'calendar') return <div className="jg-calendar"><span>MON<small>08</small></span><span className="is-picked">TUE<small>09</small></span><span>WED<small>10</small></span><div><i /> Interview confirmed · 10:30</div></div>;
  if (type === 'chart') return <div className="jg-chart">{[38, 52, 45, 68, 61, 82, 94].map((n, i) => <i key={i} style={{ height: `${n}%` }} />)}<span>+28% this month</span></div>;
  return <div className="jg-team"><div>{['AM', 'KD', 'NR', 'ST'].map(x => <i key={x}>{x}</i>)}</div><span><b>Hiring team</b><small>4 people reviewing now</small></span><strong><i /> Live</strong></div>;
}

function Features() {
  return (
    <section id="features" className="jg-section jg-features">
      <div className="jg-container">
        <Reveal className="jg-section-heading">
          <span className="jg-kicker"><Sparkles size={13} /> ONE POWERFUL WORKSPACE</span>
          <h2>Less admin. More <em>magic.</em></h2>
          <p>Everything candidates and hiring teams need, beautifully orchestrated in one recruitment platform.</p>
        </Reveal>
        <div className="jg-bento">
          {featureCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <Reveal className={`jg-feature-card ${card.className}`} delay={i * 0.06} key={card.title}>
                <div className="jg-feature-card__copy">
                  <span><Icon size={15} /> {card.eyebrow}</span>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </div>
                <FeatureVisual type={card.visual} />
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const journeys = {
  candidate: [
    ['01', 'Create your profile', 'Tell your story once. Your skills, CV and preferences become a polished professional profile.', FileCheck2],
    ['02', 'Discover your matches', 'Search trusted opportunities and let JobGenie surface the roles that truly fit.', Search],
    ['03', 'Track every step', 'Applications, interviews and offers stay organised in one clear timeline.', CircleCheckBig],
  ],
  employer: [
    ['01', 'Publish the role', 'Create a trusted company profile and launch a polished job post in minutes.', BriefcaseBusiness],
    ['02', 'Meet top talent', 'Review verified candidates, AI match signals and team feedback side by side.', UsersRound],
    ['03', 'Make the hire', 'Coordinate interviews, decisions and offers without losing momentum.', Zap],
  ],
};

function HowItWorks() {
  const [mode, setMode] = useState<'candidate' | 'employer'>('candidate');
  return (
    <section id="how-it-works" className="jg-section jg-journey">
      <div className="jg-container">
        <Reveal className="jg-section-heading is-left">
          <span className="jg-kicker"><WandSparkles size={13} /> YOUR WISH, IN MOTION</span>
          <h2>A better career story starts in <em>three steps.</em></h2>
          <div className="jg-role-toggle" role="tablist" aria-label="Choose your journey">
            <button className={mode === 'candidate' ? 'is-active' : ''} onClick={() => setMode('candidate')}>I&apos;m a candidate</button>
            <button className={mode === 'employer' ? 'is-active' : ''} onClick={() => setMode('employer')}>I&apos;m an employer</button>
          </div>
        </Reveal>
        <motion.div className="jg-steps" key={mode} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {journeys[mode].map(([number, title, text, Icon], index) => {
            const StepIcon = Icon as typeof Search;
            return (
              <div className="jg-step" key={title as string}>
                <div className="jg-step__number"><span>{number as string}</span><StepIcon size={22} /></div>
                <div><h3>{title as string}</h3><p>{text as string}</p></div>
                {index < 2 && <ChevronRight className="jg-step__arrow" size={20} />}
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section id="testimonials" className="jg-section jg-proof">
      <div className="jg-container jg-proof__grid">
        <Reveal className="jg-proof__quote">
          <div className="jg-stars">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={16} fill="currentColor" />)}</div>
          <blockquote>“JobGenie turned a scattered hiring process into one clear rhythm. We spend less time chasing updates and more time talking to the right people.”</blockquote>
          <div className="jg-author"><i>AS</i><span><b>Amaya Silva</b><small>Head of People · Northstar Labs</small></span></div>
        </Reveal>
        <div className="jg-proof__stats">
          {[['3×', 'faster shortlisting'], ['96%', 'top match accuracy'], ['100%', 'pipeline visibility']].map(([value, label], i) => (
            <Reveal className="jg-proof-stat" delay={i * 0.08} key={value}><strong>{value}</strong><span>{label}</span></Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PortalShowcase() {
  const [portal, setPortal] = useState<'candidate' | 'employer'>('employer');
  return (
    <section id="portals" className="jg-section jg-portals">
      <div className="jg-container">
        <Reveal className="jg-section-heading">
          <span className="jg-kicker"><LayoutDashboard size={13} /> DESIGNED FOR BOTH SIDES</span>
          <h2>One platform. <em>Two brilliant experiences.</em></h2>
          <p>Focused workspaces give everyone exactly what they need—and nothing they don&apos;t.</p>
        </Reveal>
        <div className="jg-portal-tabs">
          <button onClick={() => setPortal('candidate')} className={portal === 'candidate' ? 'is-active' : ''}>Candidate portal</button>
          <button onClick={() => setPortal('employer')} className={portal === 'employer' ? 'is-active' : ''}>Employer portal</button>
        </div>
        <motion.div className="jg-portal-window" key={portal} initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
          <div className="jg-portal-sidebar">
            <div className="jg-portal-mark"><Sparkles size={17} /></div>
            {[LayoutDashboard, portal === 'employer' ? UsersRound : Search, CalendarCheck2, MessageSquareText].map((Icon, i) => <span className={i === 0 ? 'is-active' : ''} key={i}><Icon size={16} /></span>)}
          </div>
          <div className="jg-portal-main">
            <div className="jg-portal-head"><div><small>GOOD MORNING</small><h3>{portal === 'employer' ? 'Your hiring overview' : 'Your career dashboard'}</h3></div><span><i /> All caught up</span></div>
            <div className="jg-portal-metrics">
              {(portal === 'employer' ? [['Active roles', '12'], ['New candidates', '48'], ['Interviews', '09']] : [['Applications', '14'], ['Profile views', '62'], ['Interviews', '04']]).map(([label, value], i) => <div key={label}><span>{label}</span><strong>{value}</strong><small>↗ {8 + i * 4}% this week</small></div>)}
            </div>
            <div className="jg-portal-lower">
              <div><span>{portal === 'employer' ? 'Hiring activity' : 'Application activity'}</span><div className="jg-line-chart"><svg viewBox="0 0 500 120" preserveAspectRatio="none"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#22c55e" stopOpacity=".28"/><stop offset="1" stopColor="#22c55e" stopOpacity="0"/></linearGradient></defs><path d="M0,100 C70,92 70,65 140,72 S230,85 280,42 S370,70 500,18 L500,120 L0,120Z" fill="url(#chartFill)"/><path d="M0,100 C70,92 70,65 140,72 S230,85 280,42 S370,70 500,18" fill="none" stroke="#22c55e" strokeWidth="3"/></svg></div></div>
              <div className="jg-next-list"><span>Up next</span>{['Design interview', 'Review shortlist', 'Team sync'].map((x, i) => <p key={x}><i>{10 + i}:30</i><b>{x}</b><small>{i === 0 ? 'Today' : 'Tomorrow'}</small></p>)}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="jg-cta-wrap">
      <div className="jg-container">
        <Reveal className="jg-cta">
          <MagicDust />
          <div className="jg-cta__orb"><Sparkles size={25} /></div>
          <span className="jg-kicker">YOUR NEXT CHAPTER IS WAITING</span>
          <h2>Ready to make your career wish <em>real?</em></h2>
          <p>Join JobGenie today—where ambitious talent and remarkable teams find each other.</p>
          <div className="jg-cta__actions"><Link href="/candidate/signup">Find my next role <ArrowRight size={17} /></Link><Link href="/employer/signup">Start hiring</Link></div>
          <small><ShieldCheck size={13} /> Verified profiles · Transparent hiring · Built for trust</small>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingExperience() {
  return (
    <main>
      <MagicCursor />
      <section className="jg-hero">
        <div className="jg-aurora" aria-hidden="true" /><MagicDust />
        <div className="jg-container jg-hero__grid">
          <div className="jg-hero__copy">
            <motion.div className="jg-kicker" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}><Sparkles size={13} /> YOUR CAREER WISH, GRANTED</motion.div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>Where great talent meets its <em>perfect match.</em></motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.18 }}>JobGenie brings trusted talent, intelligent matching and effortless hiring together—so candidates move forward and teams hire with confidence.</motion.p>
            <motion.div className="jg-hero__actions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.28 }}>
              <Link className="jg-button is-primary" href="/candidate/signup">Find your opportunity <ArrowRight size={17} /></Link>
              <Link className="jg-button is-secondary" href="/employer/signup">Hire exceptional talent</Link>
            </motion.div>
            <motion.div className="jg-hero__trust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}>
              <span>{[1, 2, 3, 4].map(x => <i key={x} />)}</span><div><div>{[1,2,3,4,5].map(x => <Star key={x} size={11} fill="currentColor" />)}</div><small>Trusted by modern hiring teams</small></div>
            </motion.div>
          </div>
          <div className="jg-hero__visual"><GenieScene /></div>
        </div>
        <div className="jg-container jg-hero-dashboard-wrap"><HeroDashboard /></div>
      </section>
      <div className="jg-trust-strip"><span>BUILT FOR MODERN RECRUITMENT</span>{['Verified talent', 'Intelligent matching', 'Clear pipelines', 'Faster decisions'].map(x => <p key={x}><BadgeCheck size={16} /> {x}</p>)}</div>
      <Features />
      <HowItWorks />
      <Testimonial />
      <PortalShowcase />
      <CTA />
    </main>
  );
}
