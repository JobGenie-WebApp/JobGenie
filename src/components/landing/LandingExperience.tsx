'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BadgeCheck,
  BriefcaseBusiness,
  ChevronRight,
  CircleCheckBig,
  FileCheck2,
  Search,
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

function GenieScene({ content }: { content: LandingContent['hero'] }) {
  return (
    <div className="jg-genie-scene">
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
      <motion.div className="jg-genie" initial={{ opacity: 0, x: 45, scale: .88 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 1, delay: .15, ease: [0.22, 1, 0.36, 1] }}>
        <Image
          src="/Genie3.png"
          alt={content.genieImageAlt}
          fill
          priority
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 900px) 88vw, 560px"
          className="jg-genie-image"
        />
      </motion.div>
      <div className="jg-wish-orbit" aria-hidden="true"><i /><i /><i /></div>
    </div>
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
          <span className="jg-kicker"><WandSparkles size={13} /> {content.kicker}</span>
          <h2>{content.title} <em>{content.emphasizedTitle}</em></h2>
          <div className="jg-role-toggle" role="tablist" aria-label="Choose your journey">
            <button className={mode === 'candidate' ? 'is-active' : ''} onClick={() => setMode('candidate')}>{content.candidateLabel}</button>
            <button className={mode === 'employer' ? 'is-active' : ''} onClick={() => setMode('employer')}>{content.employerLabel}</button>
          </div>
        </Reveal>
        <motion.div className="jg-steps" key={mode} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {activeSteps.map((step, index) => {
            const StepIcon = stepIconMap[step.icon] ?? Search;
            return (
              <div className="jg-step" key={index}>
                <div className="jg-step__number">
                  <span>{step.number}</span>
                  <StepIcon size={22} />
                </div>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
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
          <blockquote>“{content.quote}”</blockquote>
          <div className="jg-author">
            <i>{content.authorInitials}</i>
            <span>
              <b>{content.authorName}</b>
              <small>{content.authorRole}</small>
            </span>
          </div>
        </Reveal>
        <div className="jg-proof__stats">
          {content.stats.map(({ value, label }, i) => (
            <Reveal className="jg-proof-stat" delay={i * 0.08} key={i}>
              <strong>{value}</strong>
              <span>{label}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const highlightImages = [
  { src: '/11.png', width: 1080, height: 1350 },
  { src: '/2.png', width: 1024, height: 1536 },
  { src: '/33.png', width: 1024, height: 1536 },
] as const;

function PlatformHighlights({ content }: { content: LandingContent['highlights'] }) {
  return (
    <section id="features" className="jg-section jg-highlights">
      <div className="jg-container">
        <div className="jg-highlight-list">
          {content.map((item, index) => {
            const image = highlightImages[index] ?? highlightImages[0];
            const [question, ...answerParts] = item.title.split('?');
            const answer = answerParts.join('?').trim();
            return (
              <Reveal className="jg-highlight" delay={index * 0.06} key={index}>
                <div className="jg-highlight__intro">
                  <div
                    className="jg-highlight__media"
                    style={{ position: 'relative', overflow: 'hidden', borderRadius: 18, background: 'var(--jg-surface-soft)' }}
                  >
                    <Image
                      src={image.src}
                      alt=""
                      width={image.width}
                      unoptimized
                      height={image.height}
                      sizes="(max-width: 640px) calc(100vw - 76px), (max-width: 900px) 150px, 320px"
                      className="jg-highlight__image"
                      style={{ display: 'block', width: '100%', height: 300, objectFit: 'contain', objectPosition: 'center' }}
                    />
                  </div>
                  <p className="jg-highlight-eyebrow">{item.eyebrow}</p>
                </div>
                <div className="jg-highlight__content">
                  <h2>{answer ? <>{question}?<em style={{ display: 'block', color: 'var(--jg-green)', fontStyle: 'normal' }}>{answer}</em></> : item.title}</h2>
                  <p>{item.description}</p>
                  <ul>
                    {item.points.map((point, pointIndex) => (
                      <li key={pointIndex}>
                        <CircleCheckBig size={17} /> {point}
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

export function LandingExperience({ content = landingContent }: { content?: LandingContent }) {
  const heroWishLine = "I’m here to grant your wish!";
  const heroDescription = content.hero.description.trim();
  const heroBaseDescription = heroDescription.endsWith(heroWishLine)
    ? heroDescription.slice(0, -heroWishLine.length).trim()
    : heroDescription;
  const heroDescriptionLines = heroBaseDescription.match(/[^.!?]+[.!?]+/g)?.map((line) => line.trim()) ?? [heroBaseDescription];

  return (
    <main>
      <MagicCursor />
      <section className="jg-hero">
        <div className="jg-aurora" aria-hidden="true" /><MagicDust />
        <div className="jg-container jg-hero__grid">
          <div className="jg-hero__copy">
            <motion.div className="jg-kicker" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}><Sparkles size={13} /> {content.hero.kicker}</motion.div>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>{content.hero.title} <em>{content.hero.emphasizedTitle}</em></motion.h1>
            <motion.p className="jg-hero__description" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.18 }}>
              {heroDescriptionLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
              <strong>{heroWishLine}</strong>
            </motion.p>
          </div>
          <div className="jg-hero__visual"><GenieScene content={content.hero} /></div>
        </div>
        <div className="jg-hero-journey-wrap">
          <HowItWorks content={content.journeys} />
        </div>
      </section>
      <div className="jg-trust-strip">
        <span>{content.trustStrip.label}</span>
        {content.trustStrip.items.map((x, i) => (
          <p className="" key={i}><BadgeCheck size={16} /> {x}</p>
        ))}
      </div>
      <PlatformHighlights content={content.highlights} />
      <Testimonial content={content.testimonial} />
    </main>
  );
}
