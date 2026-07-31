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
  ChevronRight,
  CircleCheckBig,
  FileCheck2,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  WandSparkles,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { landingContent } from '@/content/site';
import type {
  LandingContent,
  LandingStepIcon,
} from '@/content/types';
import { T } from '@/components/cms/T';

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

function MagicLamp({ active, label, onRub }: { active: boolean; label: string; onRub: () => void }) {
  return (
    <button className={`jg-lamp ${active ? 'is-rubbed' : ''}`} onClick={onRub} aria-label={label}>
      <span><T k="landing.hero.lampLabel">{label}</T></span>
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

function GenieScene({ content }: { content: LandingContent['hero'] }) {
  const [rubbed, setRubbed] = useState(false);
  const rubLamp = () => {};
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
        <Image
          src="/Genie3.png"
          alt={content.genieImageAlt}
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 900px) 88vw, 560px"
          className="jg-genie-image"
        />
      </motion.div>
      <div className="jg-wish-orbit" aria-hidden="true"><i /><i /><i /></div>
      {content.wishCards.map((card, i) => (
        <div className={`jg-wish-card ${i === 0 ? 'jg-wish-card--job' : 'jg-wish-card--talent'}`} key={i}>
          <span>{i === 0 ? <BriefcaseBusiness size={15} /> : <UsersRound size={15} />}</span>
          <div>
            <small><T k={`landing.hero.wishCards.${i}.eyebrow`}>{card.eyebrow}</T></small>
            <b><T k={`landing.hero.wishCards.${i}.title`}>{card.title}</T></b>
            <em><T k={`landing.hero.wishCards.${i}.note`}>{card.note}</T></em>
          </div>
        </div>
      ))}
      <MagicLamp active={rubbed} label={content.lampLabel} onRub={rubLamp} />
    </div>
  );
}

function HeroDashboard({ content }: { content: LandingContent['heroDashboard'] }) {
  return (
    <motion.div
      className="jg-dashboard"
      initial={{ opacity: 0, y: 35, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="jg-dashboard__top">
        <div className="jg-window-dots"><i /><i /><i /></div>
        <span><T k="landing.heroDashboard.title">{content.title}</T></span>
        <span className="jg-live"><i /> <T k="landing.heroDashboard.liveLabel">{content.liveLabel}</T></span>
      </div>
      <div className="jg-dashboard__body">
        <aside className="jg-dashboard__rail">
          <div className="is-active"><LayoutDashboard size={15} /></div>
          <div><UsersRound size={15} /></div>
          <div><CalendarCheck2 size={15} /></div>
          <div><BarChart3 size={15} /></div>
        </aside>
        <div className="jg-dashboard__content">
          <div className="jg-pipeline">
            {content.columns.map((column, col) => (
              <div className="jg-pipeline__col" key={col}>
                <div>
                  <span><T k={`landing.heroDashboard.columns.${col}.title`}>{column.title}</T></span>
                  <b><T k={`landing.heroDashboard.columns.${col}.count`}>{column.count}</T></b>
                </div>
                {column.people.map((person, index) => (
                  <div className={`jg-person ${col === 2 && index === 0 ? 'is-glowing' : ''}`} key={index}>
                    <i><T k={`landing.heroDashboard.columns.${col}.people.${index}.initials`}>{person.initials}</T></i>
                    <span>
                      <b><T k={`landing.heroDashboard.columns.${col}.people.${index}.name`}>{person.name}</T></b>
                      <small><T k={`landing.heroDashboard.columns.${col}.people.${index}.match`}>{person.match}</T></small>
                    </span>
                    {col === 2 && index === 0 && <Sparkles size={12} />}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const stepIconMap: Record<LandingStepIcon, typeof Search> = {
  file: FileCheck2,
  search: Search,
  check: CircleCheckBig,
  briefcase: BriefcaseBusiness,
  users: UsersRound,
  zap: Zap,
};

function HowItWorks({ content }: { content: LandingContent['journeys'] }) {
  const [mode, setMode] = useState<'candidate' | 'employer'>('candidate');
  const activeSteps = content[mode];

  return (
    <section id="how-it-works" className="jg-section jg-journey">
      <div className="jg-container">
        <Reveal className="jg-section-heading is-left">
          <span className="jg-kicker"><WandSparkles size={13} /> <T k="landing.journeys.kicker">{content.kicker}</T></span>
          <h2><T k="landing.journeys.title">{content.title}</T> <em><T k="landing.journeys.emphasizedTitle">{content.emphasizedTitle}</T></em></h2>
          <div className="jg-role-toggle" role="tablist" aria-label="Choose your journey">
            <button className={mode === 'candidate' ? 'is-active' : ''} onClick={() => setMode('candidate')}><T k="landing.journeys.candidateLabel">{content.candidateLabel}</T></button>
            <button className={mode === 'employer' ? 'is-active' : ''} onClick={() => setMode('employer')}><T k="landing.journeys.employerLabel">{content.employerLabel}</T></button>
          </div>
        </Reveal>
        <motion.div className="jg-steps" key={mode} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {activeSteps.map((step, index) => {
            const StepIcon = stepIconMap[step.icon] ?? Search;
            return (
              <div className="jg-step" key={index}>
                <div className="jg-step__number">
                  <span><T k={`landing.journeys.${mode}.${index}.number`}>{step.number}</T></span>
                  <StepIcon size={22} />
                </div>
                <div>
                  <h3><T k={`landing.journeys.${mode}.${index}.title`}>{step.title}</T></h3>
                  <p><T k={`landing.journeys.${mode}.${index}.text`}>{step.text}</T></p>
                </div>
                {index < 2 && <ChevronRight className="jg-step__arrow" size={20} />}
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

function Testimonial({ content }: { content: LandingContent['testimonial'] }) {
  return (
    <section id="testimonials" className="jg-section jg-proof">
      <div className="jg-container jg-proof__grid">
        <Reveal className="jg-proof__quote">
          <div className="jg-stars">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={16} fill="currentColor" />)}</div>
          <blockquote>“<T k="landing.testimonial.quote">{content.quote}</T>”</blockquote>
          <div className="jg-author">
            <i><T k="landing.testimonial.authorInitials">{content.authorInitials}</T></i>
            <span>
              <b><T k="landing.testimonial.authorName">{content.authorName}</T></b>
              <small><T k="landing.testimonial.authorRole">{content.authorRole}</T></small>
            </span>
          </div>
        </Reveal>
        <div className="jg-proof__stats">
          {content.stats.map(({ value, label }, i) => (
            <Reveal className="jg-proof-stat" delay={i * 0.08} key={i}>
              <strong><T k={`landing.testimonial.stats.${i}.value`}>{value}</T></strong>
              <span><T k={`landing.testimonial.stats.${i}.label`}>{label}</T></span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const highlightIcons = [Search, BarChart3, ShieldCheck] as const;

function PlatformHighlights({ content }: { content: LandingContent['highlights'] }) {
  return (
    <section id="features" className="jg-section jg-highlights">
      <div className="jg-container">
        <div className="jg-highlight-list">
          {content.map((item, index) => {
            const Icon = highlightIcons[index] ?? Sparkles;
            return (
              <Reveal className="jg-highlight" delay={index * 0.06} key={index}>
                <div className="jg-highlight__intro">
                  <div className="jg-highlight__meta">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <i><Icon size={20} /></i>
                  </div>
                  <p><T k={`landing.highlights.${index}.eyebrow`}>{item.eyebrow}</T></p>
                </div>
                <div className="jg-highlight__content">
                  <h2><T k={`landing.highlights.${index}.title`}>{item.title}</T></h2>
                  <p><T k={`landing.highlights.${index}.description`}>{item.description}</T></p>
                  <ul>
                    {item.points.map((point, pointIndex) => (
                      <li key={pointIndex}>
                        <CircleCheckBig size={17} /> <T k={`landing.highlights.${index}.points.${pointIndex}`}>{point}</T>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTA({ content }: { content: LandingContent['cta'] }) {
  return (
    <section className="jg-cta-wrap">
      <div className="jg-container">
        <Reveal className="jg-cta">
          <MagicDust />
          <div className="jg-cta__orb"><Sparkles size={25} /></div>
          <span className="jg-kicker"><T k="landing.cta.kicker">{content.kicker}</T></span>
          <h2><T k="landing.cta.title">{content.title}</T> <em><T k="landing.cta.emphasizedTitle">{content.emphasizedTitle}</T></em></h2>
          <p><T k="landing.cta.description">{content.description}</T></p>
          <div className="jg-cta__actions">
            <Link href={content.primaryCta.href}><T k="landing.cta.primaryCta.label">{content.primaryCta.label}</T> <ArrowRight size={17} /></Link>
            <Link href={content.secondaryCta.href}><T k="landing.cta.secondaryCta.label">{content.secondaryCta.label}</T></Link>
          </div>
          <small><ShieldCheck size={13} /> <T k="landing.cta.trustNote">{content.trustNote}</T></small>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingExperience({ content = landingContent }: { content?: LandingContent }) {
  return (
    <main>
      <MagicCursor />
      <section className="jg-hero">
        <div className="jg-aurora" aria-hidden="true" /><MagicDust />
        <div className="jg-container jg-hero__grid">
          <div className="jg-hero__copy">
            <motion.div className="jg-kicker" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}><Sparkles size={13} /> <T k="landing.hero.kicker">{content.hero.kicker}</T></motion.div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}><T k="landing.hero.title">{content.hero.title}</T> <em><T k="landing.hero.emphasizedTitle">{content.hero.emphasizedTitle}</T></em></motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.18 }}><T k="landing.hero.description">{content.hero.description}</T></motion.p>
          </div>
          <div className="jg-hero__visual"><GenieScene content={content.hero} /></div>
        </div>
        <div className="jg-container jg-hero-dashboard-wrap"><HeroDashboard content={content.heroDashboard} /></div>
      </section>
      <div className="jg-trust-strip">
        <span><T k="landing.trustStrip.label">{content.trustStrip.label}</T></span>
        {content.trustStrip.items.map((x, i) => (
          <p key={i}><BadgeCheck size={16} /> <T k={`landing.trustStrip.items.${i}`}>{x}</T></p>
        ))}
      </div>
      <PlatformHighlights content={content.highlights} />
      <HowItWorks content={content.journeys} />
      <Testimonial content={content.testimonial} />
      <CTA content={content.cta} />
    </main>
  );
}
