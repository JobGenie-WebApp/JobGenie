import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleHelp,
  UsersRound,
} from 'lucide-react';
import { PublicPageHero, PublicPageShell } from '@/components/public/PublicPageShell';

export const metadata: Metadata = {
  title: 'FAQ | JobGenie',
  description: 'Answers to common JobGenie questions for job seekers and employers.',
};

const faqs = [
  {
    category: 'Job Seekers',
    icon: UsersRound,
    description: 'Everything candidates need to know about privacy, profiles, applications and updates.',
    items: [
      {
        question: 'How often will I hear from you after I create a profile?',
        answer:
          'Once your profile is created, you will receive a confirmation mail. You will be notified when a role matches your skills and preferences.',
      },
      {
        question: 'Could I have a profile even if I am not looking out for any opportunities at the moment?',
        answer:
          'Yes, you could maintain a profile until you are ready. Until then, you can update your profile from time to time.',
      },
      {
        question: 'Do I have to pay?',
        answer: 'No, you do not have to pay to create or use a Job Genie profile.',
      },
      {
        question: 'Can I apply for more than one job posting at a time?',
        answer: 'Yes, you can apply for more than one job vacancy at a time.',
      },
      {
        question: 'What happens after I submit my resume?',
        answer:
          'You will receive an email confirming we have received your details. Our hiring team will review your profile, and if your background matches our vacancies, the recruiter will reach out directly to discuss the next steps.',
      },
    ],
  },
  {
    category: 'Employers',
    icon: BriefcaseBusiness,
    description: 'Answers for companies using JobGenie to source qualified, ready-to-review talent.',
    items: [
      {
        question: 'How quickly can we source candidates from the pipeline?',
        answer:
          'Because candidate profiles and initial qualification details are already in the talent network, time-to-hire is significantly shorter than the traditional approach.',
      },
      {
        question: 'How do you ensure candidate information is up to date?',
        answer: 'Candidates can update their profiles at regular intervals to remain relevant.',
      },
      {
        question: 'How are candidates screened before being added to the talent pool?',
        answer:
          'Profiles undergo an initial review of key skills, experience levels and career preferences to ensure high quality and accuracy before being routed to hiring teams.',
      },
      {
        question: 'Can employers browse the Talent Pool?',
        answer:
          'Employers can review approved public candidate profiles and sign up to begin a proper hiring workflow inside JobGenie.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <PublicPageShell>
      <PublicPageHero
        description="Clear answers for job seekers and employers using JobGenie to create profiles, source talent, apply for roles and move through hiring with confidence."
        eyebrow="FAQ"
        icon={CircleHelp}
        title="FAQs."
      />

      <section className="bg-[#f7fbf8] py-16 dark:bg-[#07100b] md:py-24">
        <div className="jg-container">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            {faqs.map(({ category, icon: Icon, description, items }) => (
              <section aria-labelledby={`${category.toLowerCase().replace(/\s+/g, '-')}-title`} key={category}>
                <div className="mb-5 flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-green-500/10 text-[var(--jg-green)]">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--jg-ink)]" id={`${category.toLowerCase().replace(/\s+/g, '-')}-title`}>
                      {category}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--jg-muted)]">{description}</p>
                  </div>
                </div>

                <div className="divide-y divide-[var(--jg-line)] border-y border-[var(--jg-line)]">
                  {items.map(({ question, answer }) => (
                    <details className="group bg-white px-5 py-5 dark:bg-[#0a1510] md:px-7" key={question}>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-[var(--jg-ink)]">
                        <span>{question}</span>
                        <ArrowRight
                          className="shrink-0 text-[var(--jg-green)] transition group-open:rotate-90"
                          size={18}
                          aria-hidden="true"
                        />
                      </summary>
                      <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--jg-muted)]">{answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-16 flex flex-col items-start justify-between gap-6 border-y border-[var(--jg-line)] py-10 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold text-[var(--jg-green)]">READY TO START?</p>
              <h2 className="mt-3 text-3xl font-bold text-[var(--jg-ink)]">Create your JobGenie profile today.</h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[var(--jg-green)] px-6 text-sm font-bold text-white" href="/candidate/signup">
                Job seeker signup <ArrowRight size={17} aria-hidden="true" />
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
