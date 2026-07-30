import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  CircleCheckBig,
  FileText,
  Gauge,
  MessagesSquare,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { PublicPageShell } from '@/components/public/PublicPageShell';

export const metadata: Metadata = {
  title: 'Explore Genie | JobGenie',
  description: 'See how JobGenie supports candidates and employers through every stage of recruitment.',
};

const paths = [
  {
    icon: Search,
    eyebrow: 'FOR CANDIDATES',
    title: 'Turn your experience into the right opportunity.',
    text: 'Build a verified profile, understand your skills match and follow every application from one clear dashboard.',
    points: ['Verified professional profile', 'Skills-first job matching', 'Real-time progress updates'],
    href: '/candidate/signup',
    cta: 'Join as a candidate',
  },
  {
    icon: BriefcaseBusiness,
    eyebrow: 'FOR EMPLOYERS',
    title: 'Move from open role to strong shortlist faster.',
    text: 'Publish opportunities, review approved talent and coordinate hiring decisions without losing momentum.',
    points: ['Approved candidate pool', 'Clear match signals', 'One connected hiring workflow'],
    href: '/employer/signup',
    cta: 'Join as an employer',
  },
];

const heroWorkflow = [
  { icon: FileText, label: 'Profile data', value: 'CV, skills, role details and preferences become structured signals.' },
  { icon: ShieldCheck, label: 'Verification', value: 'Approved profiles create a safer network for both sides.' },
  { icon: Search, label: 'Matching', value: 'Relevant talent and roles surface with clearer context.' },
  { icon: CalendarCheck2, label: 'Next steps', value: 'Progress, shortlists and interviews stay easier to follow.' },
];

const heroMetrics = [
  { value: 'Talent', label: 'Build a private, verified profile' },
  { value: 'Teams', label: 'Review approved candidates faster' },
  { value: 'Genie', label: 'Keep the journey connected' },
];

const candidateJourney = [
  {
    icon: FileText,
    title: 'Create your profile',
    text: 'Add your CV, career details, skills and preferences so JobGenie can understand what kind of role fits you.',
  },
  {
    icon: BadgeCheck,
    title: 'Get verified',
    text: 'Profile checks help keep the talent pool trustworthy while protecting your privacy from public exposure.',
  },
  {
    icon: Gauge,
    title: 'See match signals',
    text: 'Understand how your skills line up with suitable opportunities before moving forward.',
  },
  {
    icon: BellRing,
    title: 'Follow each update',
    text: 'Stay informed when your profile matches a role, moves into review or needs a next-step action.',
  },
];

const employerJourney = [
  {
    icon: BriefcaseBusiness,
    title: 'Create a company profile',
    text: 'Set up your company details and complete approval so your brand can appear as a trusted employer.',
  },
  {
    icon: FileText,
    title: 'Post opportunities',
    text: 'Publish clear roles with requirements, salary details, locations and application instructions.',
  },
  {
    icon: UsersRound,
    title: 'Review talent',
    text: 'Explore approved candidates and shortlists with useful skill, experience and preference context.',
  },
  {
    icon: CalendarCheck2,
    title: 'Move to interview',
    text: 'Coordinate hiring decisions, interviews and updates from one connected workflow.',
  },
];

const capabilities = [
  {
    icon: ShieldCheck,
    title: 'Verification layer',
    text: 'Approved profiles reduce fake signals and help serious candidates and companies move with confidence.',
  },
  {
    icon: Search,
    title: 'Skills-first matching',
    text: 'The platform compares experience, preferences and role requirements so the strongest matches are easier to see.',
  },
  {
    icon: MessagesSquare,
    title: 'Clear communication',
    text: 'Updates and dashboards reduce uncertainty across applications, shortlists and hiring stages.',
  },
];

const directoryLinks = [
  {
    title: 'Our Opportunities',
    text: 'Browse published jobs from approved companies.',
    href: '/opportunities',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Our Top Employers',
    text: 'Explore verified companies with public profiles.',
    href: '/top-employers',
    icon: BadgeCheck,
  },
  {
    title: 'Our Talent Pool',
    text: 'View approved candidates ready for serious hiring conversations.',
    href: '/talent-pool',
    icon: UsersRound,
  },
];

function JourneySection({
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: typeof candidateJourney;
}) {
  return (
    <section className="border-b border-[var(--jg-line)] py-20">
      <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <p className="text-xs font-bold text-[var(--jg-green)]">{eyebrow}</p>
          <h2 className="mt-4 max-w-xl text-3xl font-bold leading-tight text-[var(--jg-ink)] md:text-4xl">{title}</h2>
          <p className="mt-5 max-w-lg text-sm leading-7 text-[var(--jg-muted)]">{description}</p>
        </div>
        <div className="grid gap-px overflow-hidden border border-[var(--jg-line)] bg-[var(--jg-line)] md:grid-cols-2">
          {items.map(({ icon: Icon, title: itemTitle, text }, index) => (
            <article className="min-h-[250px] bg-white p-7 dark:bg-[#0a1510]" key={itemTitle}>
              <div className="flex items-center justify-between">
                <Icon className="text-[var(--jg-green)]" size={24} aria-hidden="true" />
                <span className="text-xs font-extrabold text-[var(--jg-muted)]">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-8 text-xl font-bold leading-7 text-[var(--jg-ink)]">{itemTitle}</h3>
              <p className="mt-4 text-sm leading-7 text-[var(--jg-muted)]">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ExploreGeniePage() {
  return (
    <PublicPageShell>
      <section className="border-b border-[var(--jg-line)] bg-[#f3faf5] pt-32 dark:bg-[#09150e] md:pt-40">
        <div className="jg-container grid min-h-[620px] items-center gap-12 pb-16 lg:grid-cols-[1.02fr_.98fr] md:pb-20">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold text-[var(--jg-green)]">
              <Sparkles size={15} aria-hidden="true" /> EXPLORE GENIE
            </p>
            <h1 className="mt-7 max-w-4xl text-4xl font-extrabold leading-[1.04] text-[var(--jg-ink)] md:text-6xl">
              One connected journey for talent and hiring teams.
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[var(--jg-muted)] md:text-lg">
              Explore how JobGenie helps candidates stay visible for the right roles and helps employers find approved talent faster. From profile creation to shortlisting, every stage is designed to be clearer, faster and more trustworthy.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--jg-green)] px-6 text-sm font-bold text-white" href="/candidate/signup">
                Start as candidate <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[var(--jg-line)] bg-white px-6 text-sm font-bold text-[var(--jg-ink)] dark:bg-white/5" href="/employer/signup">
                Start as employer <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="border-y border-[var(--jg-line)] bg-white/60 py-7 dark:bg-white/[.03] lg:px-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-[var(--jg-green)]">WORKFLOW VIEW</p>
                <h2 className="mt-3 text-3xl font-bold leading-tight text-[var(--jg-ink)]">From profile to progress in one rhythm.</h2>
              </div>
              <MessagesSquare className="hidden text-[var(--jg-green)] sm:block" size={34} aria-hidden="true" />
            </div>

            <div className="mt-8 divide-y divide-[var(--jg-line)] border-y border-[var(--jg-line)]">
              {heroWorkflow.map(({ icon: Icon, label, value }) => (
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
              {heroMetrics.map((metric) => (
                <div className="bg-white p-5 dark:bg-white/5" key={metric.label}>
                  <strong className="block text-lg font-extrabold text-[var(--jg-green)]">{metric.value}</strong>
                  <span className="mt-2 block text-xs font-bold leading-5 text-[var(--jg-ink)]">{metric.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 dark:bg-[#07100b] md:py-28">
        <div className="jg-container">
          <div className="grid gap-px overflow-hidden border border-[var(--jg-line)] bg-[var(--jg-line)] lg:grid-cols-2">
            {paths.map(({ icon: Icon, eyebrow, title, text, points, href, cta }) => (
              <article className="flex min-h-[430px] flex-col bg-[#f7fbf8] p-7 dark:bg-[#0a1510] md:p-10" key={title}>
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-green-500/10 text-[var(--jg-green)]">
                  <Icon size={22} aria-hidden="true" />
                </div>
                <p className="mt-8 text-xs font-bold text-[var(--jg-green)]">{eyebrow}</p>
                <h2 className="mt-4 max-w-xl text-3xl font-bold leading-tight text-[var(--jg-ink)] md:text-4xl">{title}</h2>
                <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--jg-muted)]">{text}</p>
                <ul className="mt-8 grid gap-4">
                  {points.map((point) => (
                    <li className="flex items-center gap-3 text-sm font-bold text-[var(--jg-ink)]" key={point}>
                      <CircleCheckBig className="shrink-0 text-[var(--jg-green)]" size={18} aria-hidden="true" /> {point}
                    </li>
                  ))}
                </ul>
                <Link className="mt-auto inline-flex min-h-12 w-fit items-center gap-2 rounded-lg bg-[var(--jg-ink)] px-5 text-sm font-bold text-white transition hover:bg-[var(--jg-green)] dark:text-[#07130c]" href={href}>
                  {cta} <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>

          <JourneySection
            description="Candidates can stay ready for the right opportunity even before actively searching. The profile, verification and dashboard flow keeps the journey private and understandable."
            eyebrow="CANDIDATE JOURNEY"
            items={candidateJourney}
            title="From profile to progress, every step is clearer."
          />

          <JourneySection
            description="Employers get a more structured way to post jobs, view qualified talent and move strong candidates toward interviews without losing hiring momentum."
            eyebrow="EMPLOYER JOURNEY"
            items={employerJourney}
            title="From vacancy to shortlist, teams move faster."
          />

          <section className="border-b border-[var(--jg-line)] py-20">
            <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
              <div>
                <p className="text-xs font-bold text-[var(--jg-green)]">PLATFORM CAPABILITIES</p>
                <h2 className="mt-4 max-w-lg text-3xl font-bold leading-tight text-[var(--jg-ink)] md:text-4xl">
                  The details that make the hiring journey feel less scattered.
                </h2>
              </div>
              <div className="grid gap-px overflow-hidden border border-[var(--jg-line)] bg-[var(--jg-line)] md:grid-cols-3">
                {capabilities.map(({ icon: Icon, title, text }) => (
                  <article className="min-h-[280px] bg-white p-7 dark:bg-[#0a1510]" key={title}>
                    <Icon className="text-[var(--jg-green)]" size={25} aria-hidden="true" />
                    <h3 className="mt-8 text-xl font-bold leading-7 text-[var(--jg-ink)]">{title}</h3>
                    <p className="mt-4 text-sm leading-7 text-[var(--jg-muted)]">{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="py-20">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-bold text-[var(--jg-green)]">EXPLORE THE NETWORK</p>
                <h2 className="mt-4 text-3xl font-bold text-[var(--jg-ink)] md:text-4xl">Browse what is already active.</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-[var(--jg-muted)]">
                Public pages make it easy to see available roles, approved companies and visible talent profiles before choosing your next action.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden border border-[var(--jg-line)] bg-[var(--jg-line)] md:grid-cols-3">
              {directoryLinks.map(({ title, text, href, icon: Icon }) => (
                <Link className="group min-h-[230px] bg-white p-7 transition hover:bg-[#eef8f1] dark:bg-[#0a1510] dark:hover:bg-white/[.04]" href={href} key={title}>
                  <div className="flex items-center justify-between">
                    <Icon className="text-[var(--jg-green)]" size={24} aria-hidden="true" />
                    <ArrowRight className="text-[var(--jg-green)] transition group-hover:translate-x-1" size={18} aria-hidden="true" />
                  </div>
                  <h3 className="mt-8 text-xl font-bold text-[var(--jg-ink)]">{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--jg-muted)]">{text}</p>
                </Link>
              ))}
            </div>
          </section>

          <div className="flex flex-col items-start justify-between gap-8 border-y border-[var(--jg-line)] py-10 md:flex-row md:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold text-[var(--jg-green)]">
                <CheckCircle2 size={16} aria-hidden="true" /> READY WHEN YOU ARE
              </p>
              <h2 className="mt-3 text-3xl font-bold text-[var(--jg-ink)]">Choose the path that fits your next move.</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--jg-green)] px-6 text-sm font-bold text-white" href="/candidate/signup">
                Candidate signup <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[var(--jg-line)] bg-white px-6 text-sm font-bold text-[var(--jg-ink)] dark:bg-white/5" href="/employer/signup">
                Employer signup <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
