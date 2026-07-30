import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, BriefcaseBusiness, Clock3, MapPin, WalletCards } from 'lucide-react';
import {
  DirectoryPagination,
  DirectorySearch,
  DirectoryState,
  PublicPageHero,
  PublicPageShell,
} from '@/components/public/PublicPageShell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPublicJobs } from '@/lib/public-directory';

export const metadata: Metadata = {
  title: 'Our Opportunities | JobGenie',
  description: 'Explore verified job opportunities from approved employers on JobGenie.',
};

export const dynamic = 'force-dynamic';

const JOB_TYPES = ['full_time', 'part_time', 'contract', 'internship', 'freelance'];

function label(value: string | null) {
  return value ? value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase()) : 'Not specified';
}

function salary(min: number | null, max: number | null, currency: string | null) {
  if (min === null && max === null) return 'Salary on application';
  const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  const range = min !== null && max !== null
    ? `${formatter.format(min)} - ${formatter.format(max)}`
    : formatter.format(min ?? max ?? 0);
  return `${currency ?? 'LKR'} ${range}`;
}

function externalJobHref(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}) {
  const params = await searchParams;
  const jobs = await getPublicJobs({
    page: params.page,
    query: params.q,
    jobType: params.type,
  });
  const query = params.q?.trim() ?? '';
  const jobType = params.type ?? '';

  return (
    <PublicPageShell>
      <PublicPageHero
        eyebrow="VERIFIED OPPORTUNITIES"
        title="Our opportunities."
        description="Explore current roles from approved companies. Every listing is presented clearly, so you can focus on finding the right fit."
        icon={BriefcaseBusiness}
        resultLabel={`${jobs.total} open ${jobs.total === 1 ? 'role' : 'roles'}`}
      />
      <section className="bg-[#f7fbf8] dark:bg-[#07100b]">
        <div className="jg-container">
          <DirectorySearch defaultValue={query} placeholder="Search by job title">
            <select
              aria-label="Filter by job type"
              className="h-12 rounded-lg border border-[var(--jg-line)] bg-white px-4 text-sm text-[var(--jg-ink)] outline-none focus:border-[var(--jg-green)] dark:bg-[#0b1710]"
              defaultValue={jobType}
              name="type"
            >
              <option value="">All job types</option>
              {JOB_TYPES.map((type) => <option key={type} value={type}>{label(type)}</option>)}
            </select>
          </DirectorySearch>

          {jobs.items.length === 0 ? (
            <DirectoryState
              failed={jobs.failed}
              title="No opportunities found"
              description="Try another job title or remove the job-type filter."
            />
          ) : (
            <div className="grid gap-px overflow-hidden border-x border-b border-[var(--jg-line)] bg-[var(--jg-line)] md:grid-cols-2">
              {jobs.items.map((job) => {
                const companyName = job.company?.company_name ?? 'Verified employer';
                const initials = companyName.split(' ').slice(0, 2).map((word) => word[0]).join('').toUpperCase();
                const externalHref = externalJobHref(job.advertisement_link);
                const href = externalHref || '/candidate/signup';
                return (
                  <article className="flex min-h-[330px] flex-col bg-white p-6 dark:bg-[#0a1510] md:p-8" key={job.id}>
                    <div className="flex items-start justify-between gap-4">
                      <Avatar className="h-12 w-12 rounded-lg border border-[var(--jg-line)] bg-[#f1f7f3] dark:bg-white/5">
                        {job.company?.logo_url && <AvatarImage alt={`${companyName} logo`} className="object-contain p-1.5" src={job.company.logo_url} />}
                        <AvatarFallback className="rounded-lg bg-transparent text-xs font-extrabold text-[var(--jg-green)]">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="rounded-md bg-green-500/10 px-2.5 py-1.5 text-xs font-bold text-[var(--jg-green)]">{label(job.job_type)}</span>
                    </div>
                    <div className="mt-7">
                      <p className="text-sm font-bold text-[var(--jg-green)]">{companyName}</p>
                      <h2 className="mt-2 text-2xl font-bold leading-8 text-[var(--jg-ink)]">{job.job_title}</h2>
                    </div>
                    <div className="mt-5 grid gap-3 text-sm text-[var(--jg-muted)] sm:grid-cols-2">
                      <span className="flex items-center gap-2"><MapPin size={15} /> {job.location || job.company?.headoffice_location || 'Location flexible'}</span>
                      <span className="flex items-center gap-2"><BriefcaseBusiness size={15} /> {job.industry || 'General'}</span>
                      <span className="flex items-center gap-2"><WalletCards size={15} /> {salary(job.salary_min, job.salary_max, job.salary_currency)}</span>
                      <span className="flex items-center gap-2"><Clock3 size={15} /> {job.experience_level ? label(job.experience_level) : 'All experience levels'}</span>
                    </div>
                    <div className="mt-auto flex items-end justify-between gap-4 border-t border-[var(--jg-line)] pt-6">
                      <p className="text-xs text-[var(--jg-muted)]">
                        {job.positions_available ?? 1} {(job.positions_available ?? 1) === 1 ? 'position' : 'positions'}
                      </p>
                      <Link
                        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--jg-ink)] px-4 text-sm font-bold text-white transition hover:bg-[var(--jg-green)] dark:text-[#07130c]"
                        href={href}
                        rel={externalHref ? 'noreferrer' : undefined}
                        target={externalHref ? '_blank' : undefined}
                      >
                        View opportunity <ArrowUpRight size={16} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <DirectoryPagination
            page={jobs.page}
            params={{ q: query, type: jobType }}
            pathname="/opportunities"
            totalPages={jobs.totalPages}
          />
        </div>
      </section>
    </PublicPageShell>
  );
}
