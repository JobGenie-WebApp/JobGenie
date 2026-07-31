import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, MapPin } from 'lucide-react';
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

function createdDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
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
            <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-2 lg:grid-cols-4">
              {jobs.items.map((job) => {
                const companyName = job.company?.company_name ?? 'Verified employer';
                const initials = companyName.split(' ').slice(0, 2).map((word) => word[0]).join('').toUpperCase();
                const externalHref = externalJobHref(job.advertisement_link);
                const href = externalHref || '/candidate/signup';
                return (
                  <Link
                    aria-label={`View ${job.job_title} at ${companyName}`}
                    className="group rounded-xl border border-[var(--jg-line)] bg-white outline-none transition hover:-translate-y-0.5 hover:border-green-600/35 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--jg-green)] focus-visible:ring-offset-2 dark:bg-[#0a1510]"
                    href={href}
                    key={job.id}
                    rel={externalHref ? 'noreferrer' : undefined}
                    target={externalHref ? '_blank' : undefined}
                  >
                    <article className="flex min-h-[176px] h-full flex-col p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-10 w-10 shrink-0 rounded-lg border border-[var(--jg-line)] bg-[#f1f7f3] dark:bg-white/5">
                          {job.company?.logo_url && <AvatarImage alt={`${companyName} logo`} className="object-contain p-1" src={job.company.logo_url} />}
                          <AvatarFallback className="rounded-lg bg-transparent text-[11px] font-extrabold text-[var(--jg-green)]">{initials}</AvatarFallback>
                        </Avatar>
                        <p className="min-w-0 flex-1 truncate text-xs font-bold text-[var(--jg-green)]">{companyName}</p>
                        <ArrowUpRight className="shrink-0 text-[var(--jg-muted)] transition group-hover:text-[var(--jg-green)]" size={15} aria-hidden="true" />
                      </div>
                      <h2 className="mt-3 line-clamp-2 text-base font-bold leading-5 text-[var(--jg-ink)]">{job.job_title}</h2>
                      <div className="mt-auto grid gap-1.5 border-t border-[var(--jg-line)] pt-3 text-xs text-[var(--jg-muted)]">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <MapPin className="shrink-0" size={13} aria-hidden="true" />
                          <span className="truncate">{job.location || job.company?.headoffice_location || 'Location flexible'}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="shrink-0" size={13} aria-hidden="true" />
                          Created {createdDate(job.created_at)}
                        </span>
                      </div>
                    </article>
                  </Link>
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
