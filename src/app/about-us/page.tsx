import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  HeartHandshake,
  Layers3,
  LockKeyhole,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { PublicPageShell } from '@/components/public/PublicPageShell';

export const metadata: Metadata = {
  title: 'About Us | JobGenie',
  description: 'Learn how JobGenie combines intelligent matching, human review and verified profiles to build better hiring outcomes.',
};

const stats = [
  { value: 'Private', label: 'Candidate profiles stay protected' },
  { value: 'Verified', label: 'Companies and talent are reviewed' },
  { value: 'Visible', label: 'Hiring progress is easier to follow' },
];

const heroSignals = [
  { icon: ShieldCheck, label: 'Trust layer', value: 'Verified profiles before public visibility' },
  { icon: SearchCheck, label: 'Match layer', value: 'Skills, experience and preferences compared clearly' },
  { icon: ClipboardCheck, label: 'Review layer', value: 'Human judgement remains part of shortlisting' },
];

const principles = [
  {
    icon: BrainCircuit,
    title: 'Smart where it matters',
    text: 'Technology helps teams sort, compare and understand fit without losing the human judgement behind every decision.',
  },
  {
    icon: BadgeCheck,
    title: 'Skills before noise',
    text: 'Candidates are seen for what they can do, while employers get clearer signals for every role they need to fill.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust from day one',
    text: 'Approved profiles and careful review create a community where people can move forward with confidence.',
  },
];

const operatingModel = [
  {
    icon: FileSearch,
    title: 'Profiles are created with context',
    text: 'Candidates and employers build structured profiles so skills, expectations, roles and requirements are easier to understand.',
  },
  {
    icon: SearchCheck,
    title: 'Matching starts with clear signals',
    text: 'JobGenie reads the role and profile details to highlight stronger fits, relevant skills and hiring momentum.',
  },
  {
    icon: ClipboardCheck,
    title: 'Review keeps quality high',
    text: 'A professional review step helps keep shortlists relevant before candidates and hiring teams move into the next stage.',
  },
  {
    icon: Layers3,
    title: 'Progress stays visible',
    text: 'Dashboards and updates help both sides understand what is happening without chasing scattered messages.',
  },
];

const audiences = [
  {
    icon: UsersRound,
    title: 'For job seekers',
    text: 'A private, verified profile helps candidates stay ready for the right role, apply to multiple opportunities and understand progress as it happens.',
    href: '/candidate/signup',
    cta: 'Create candidate profile',
  },
  {
    icon: BriefcaseBusiness,
    title: 'For employers',
    text: 'Approved companies can post roles, discover relevant talent and reduce manual screening time with clearer candidate signals.',
    href: '/employer/signup',
    cta: 'Create employer profile',
  },
];

const commitments = [
  'Candidate privacy is treated as a core product promise.',
  'Only approved companies and completed public profiles are shown in directories.',
  'Sensitive candidate details are not exposed in the public talent pool.',
  'The platform supports faster decisions without removing human accountability.',
];

export default function AboutUsPage() {
  return (
    <PublicPageShell>
      <section className="border-b border-[var(--jg-line)] bg-[#f3faf5] pt-32 dark:bg-[#09150e] md:pt-40">
        <div className="jg-container grid items-center gap-12 pb-16 lg:grid-cols-[1.05fr_.95fr] md:pb-24">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold text-[var(--jg-green)]">
              <Sparkles size={15} aria-hidden="true" /> ABOUT JOBGENIE
            </p>
            <h1 className="mt-7 max-w-4xl text-4xl font-extrabold leading-[1.04] text-[var(--jg-ink)] md:text-6xl">
              Recruitment should feel clear, credible and human.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[var(--jg-muted)] md:text-lg">
              JobGenie exists to make recruitment feel less uncertain. We combine skills-first matching, profile verification, professional review and live progress visibility so strong candidates and serious employers can move forward with confidence.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--jg-green)] px-6 text-sm font-bold text-white" href="/explore-genie">
                Explore Genie <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[var(--jg-line)] bg-white px-6 text-sm font-bold text-[var(--jg-ink)] dark:bg-white/5" href="/opportunities">
                View opportunities <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="border-y border-[var(--jg-line)] bg-white/60 py-7 dark:bg-white/[.03] lg:px-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-[var(--jg-green)]">HOW WE THINK</p>
                <h2 className="mt-3 text-3xl font-bold leading-tight text-[var(--jg-ink)]">A cleaner hiring system, layer by layer.</h2>
              </div>
              <BrainCircuit className="hidden text-[var(--jg-green)] sm:block" size={34} aria-hidden="true" />
            </div>

            <div className="mt-8 divide-y divide-[var(--jg-line)] border-y border-[var(--jg-line)]">
              {heroSignals.map(({ icon: Icon, label, value }) => (
                <div className="grid gap-4 py-5 sm:grid-cols-[44px_1fr]" key={label}>
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-green-500/10 text-[var(--jg-green)]">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-[var(--jg-ink)]">{label}</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--jg-muted)]">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-[var(--jg-line)] bg-[var(--jg-line)] sm:grid-cols-3">
              {stats.map((stat) => (
                <div className="bg-white p-5 dark:bg-white/5" key={stat.label}>
                  <strong className="block text-lg font-extrabold text-[var(--jg-green)]">{stat.value}</strong>
                  <span className="mt-2 block text-xs font-bold leading-5 text-[var(--jg-ink)]">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 dark:bg-[#07100b] md:py-28">
        <div className="jg-container">
          <div className="grid gap-12 border-b border-[var(--jg-line)] pb-16 md:grid-cols-[.58fr_1.42fr]">
            <p className="text-xs font-bold text-[var(--jg-green)]">OUR PURPOSE</p>
            <div>
              <h2 className="max-w-4xl text-3xl font-bold leading-tight text-[var(--jg-ink)] md:text-5xl">
                Make hiring faster without making it feel careless.
              </h2>
              <p className="mt-6 max-w-4xl text-base leading-8 text-[var(--jg-muted)]">
                Traditional hiring often buries good people under admin, vague shortlists and slow communication. JobGenie organises the hiring journey around useful data, privacy, verification and human review, helping every serious match reach the right conversation faster.
              </p>
            </div>
          </div>

          <div className="grid gap-px overflow-hidden border-x border-b border-[var(--jg-line)] bg-[var(--jg-line)] md:grid-cols-2 lg:grid-cols-4">
            {operatingModel.map(({ icon: Icon, title, text }, index) => (
              <article className="min-h-[300px] bg-white p-7 dark:bg-[#0a1510] md:p-8" key={title}>
                <div className="flex items-center justify-between">
                  <Icon className="text-[var(--jg-green)]" size={25} aria-hidden="true" />
                  <span className="text-xs font-extrabold text-[var(--jg-muted)]">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h2 className="mt-9 text-xl font-bold leading-7 text-[var(--jg-ink)]">{title}</h2>
                <p className="mt-4 text-sm leading-7 text-[var(--jg-muted)]">{text}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-12 border-b border-[var(--jg-line)] py-20 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold text-[var(--jg-green)]">WHAT GUIDES US</p>
              <h2 className="mt-4 max-w-md text-3xl font-bold leading-tight text-[var(--jg-ink)] md:text-4xl">
                A recruitment platform should protect trust, not just process volume.
              </h2>
            </div>
            <div className="grid gap-px overflow-hidden border border-[var(--jg-line)] bg-[var(--jg-line)] md:grid-cols-3">
              {principles.map(({ icon: Icon, title, text }) => (
                <article className="min-h-[280px] bg-white p-7 dark:bg-[#0a1510]" key={title}>
                  <Icon className="text-[var(--jg-green)]" size={26} aria-hidden="true" />
                  <h3 className="mt-8 text-xl font-bold leading-7 text-[var(--jg-ink)]">{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--jg-muted)]">{text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-10 py-20 lg:grid-cols-2">
            {audiences.map(({ icon: Icon, title, text, href, cta }) => (
              <article className="flex min-h-[340px] flex-col border-y border-[var(--jg-line)] bg-[#f7fbf8] p-8 dark:bg-white/[.03]" key={title}>
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-green-500/10 text-[var(--jg-green)]">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <h2 className="mt-7 text-3xl font-bold text-[var(--jg-ink)]">{title}</h2>
                <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--jg-muted)]">{text}</p>
                <Link className="mt-auto inline-flex min-h-12 w-fit items-center gap-2 rounded-lg bg-[var(--jg-ink)] px-5 text-sm font-bold text-white transition hover:bg-[var(--jg-green)] dark:text-[#07130c]" href={href}>
                  {cta} <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>

          <div className="grid gap-10 border-y border-[var(--jg-line)] py-12 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold text-[var(--jg-green)]">
                <LockKeyhole size={16} aria-hidden="true" /> TRUST COMMITMENTS
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-tight text-[var(--jg-ink)]">
                Built for privacy, quality and accountability.
              </h2>
            </div>
            <ul className="grid gap-4 md:grid-cols-2">
              {commitments.map((commitment) => (
                <li className="flex gap-3 text-sm font-bold leading-6 text-[var(--jg-ink)]" key={commitment}>
                  <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--jg-green)]" size={18} aria-hidden="true" />
                  {commitment}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-16 flex flex-col items-start justify-between gap-8 border-b border-[var(--jg-line)] pb-4 md:flex-row md:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold text-[var(--jg-green)]">
                <HeartHandshake size={16} aria-hidden="true" /> BUILT FOR BOTH SIDES
              </p>
              <h2 className="mt-3 text-3xl font-bold text-[var(--jg-ink)]">Find the right next step with JobGenie.</h2>
            </div>
            <Link className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[var(--jg-green)] px-6 text-sm font-bold text-white" href="/explore-genie">
              Explore Genie <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
