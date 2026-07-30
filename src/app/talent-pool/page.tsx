import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, BriefcaseBusiness, MapPin, Sparkles, UsersRound } from 'lucide-react';
import {
  DirectoryPagination,
  DirectorySearch,
  DirectoryState,
  PublicPageHero,
  PublicPageShell,
} from '@/components/public/PublicPageShell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPublicCandidates } from '@/lib/public-directory';

export const metadata: Metadata = {
  title: 'Our Talent Pool | JobGenie',
  description: 'Discover approved candidates in the JobGenie talent pool.',
};

export const dynamic = 'force-dynamic';

function label(value: string | null) {
  return value ? value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase()) : '';
}

export default async function TalentPoolPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const candidates = await getPublicCandidates({ page: params.page, query: params.q });
  const query = params.q?.trim() ?? '';

  return (
    <PublicPageShell>
      <PublicPageHero
        eyebrow="APPROVED TALENT"
        title="Our talent pool."
        description="Explore professionally reviewed candidate profiles while keeping private contact details protected."
        icon={UsersRound}
        resultLabel={`${candidates.total} approved ${candidates.total === 1 ? 'candidate' : 'candidates'}`}
      />
      <section className="bg-[#f7fbf8] dark:bg-[#07100b]">
        <div className="jg-container">
          <DirectorySearch defaultValue={query} placeholder="Search by name, role or industry" />
          {candidates.items.length === 0 ? (
            <DirectoryState
              failed={candidates.failed}
              title="No candidates found"
              description="Try another role, candidate name or industry."
            />
          ) : (
            <div className="grid gap-px overflow-hidden border-x border-b border-[var(--jg-line)] bg-[var(--jg-line)] md:grid-cols-2 lg:grid-cols-3">
              {candidates.items.map((candidate) => {
                const fullName = `${candidate.first_name} ${candidate.last_name}`;
                const initials = `${candidate.first_name[0] ?? ''}${candidate.last_name[0] ?? ''}`.toUpperCase();
                return (
                  <article className="flex min-h-[390px] flex-col bg-white p-6 dark:bg-[#0a1510]" key={candidate.id}>
                    <div className="flex items-start justify-between gap-4">
                      <Avatar className="h-16 w-16 rounded-lg bg-[#dff5e7] dark:bg-white/10">
                        {candidate.profile_image_url && <AvatarImage alt={fullName} src={candidate.profile_image_url} />}
                        <AvatarFallback className="rounded-lg bg-transparent text-sm font-extrabold text-[var(--jg-green)]">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--jg-green)]"><BadgeCheck size={16} /> Approved</span>
                    </div>
                    <h2 className="mt-6 text-2xl font-bold leading-8 text-[var(--jg-ink)]">{fullName}</h2>
                    <p className="mt-1 text-sm font-bold text-[var(--jg-green)]">{candidate.current_position}</p>
                    <div className="mt-5 grid gap-2.5 text-sm text-[var(--jg-muted)]">
                      <span className="flex items-center gap-2"><BriefcaseBusiness size={15} /> {candidate.industry}</span>
                      {candidate.country && <span className="flex items-center gap-2"><MapPin size={15} /> {candidate.country}</span>}
                      <span className="flex items-center gap-2"><Sparkles size={15} /> {candidate.years_of_experience ?? 0} years experience</span>
                    </div>
                    {candidate.professional_summary && (
                      <p className="mt-5 line-clamp-3 text-sm leading-6 text-[var(--jg-muted)]">{candidate.professional_summary}</p>
                    )}
                    <div className="mt-5 flex flex-wrap gap-2">
                      {(candidate.expected_positions ?? []).slice(0, 2).map((position) => (
                        <span className="rounded-md bg-[#eef8f1] px-2.5 py-1 text-xs font-medium text-[var(--jg-ink)] dark:bg-white/5" key={position}>{position}</span>
                      ))}
                      {candidate.availability_status && (
                        <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
                          {label(candidate.availability_status)}
                        </span>
                      )}
                    </div>
                    <div className="mt-auto border-t border-[var(--jg-line)] pt-5">
                      <Link className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--jg-ink)] hover:text-[var(--jg-green)]" href="/employer/signup">
                        Connect with this talent <ArrowRight size={16} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <DirectoryPagination
            page={candidates.page}
            params={{ q: query }}
            pathname="/talent-pool"
            totalPages={candidates.totalPages}
          />
        </div>
      </section>
    </PublicPageShell>
  );
}
