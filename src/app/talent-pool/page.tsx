import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, BriefcaseBusiness, MapPin, UsersRound } from 'lucide-react';
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
            <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-2 lg:grid-cols-4">
              {candidates.items.map((candidate) => {
                const fullName = `${candidate.first_name} ${candidate.last_name}`;
                const initials = `${candidate.first_name[0] ?? ''}${candidate.last_name[0] ?? ''}`.toUpperCase();
                return (
                  <Link
                    aria-label={`View ${fullName}`}
                    className="group rounded-xl border border-[var(--jg-line)] bg-white outline-none transition hover:-translate-y-0.5 hover:border-green-600/35 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--jg-green)] focus-visible:ring-offset-2 dark:bg-[#0a1510]"
                    href="/employer/signup"
                    key={candidate.id}
                  >
                    <article className="flex min-h-[176px] h-full flex-col p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-11 w-11 shrink-0 rounded-lg bg-[#dff5e7] dark:bg-white/10">
                          {candidate.profile_image_url && <AvatarImage alt={fullName} className="object-cover" src={candidate.profile_image_url} />}
                          <AvatarFallback className="rounded-lg bg-transparent text-xs font-extrabold text-[var(--jg-green)]">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-sm font-bold text-[var(--jg-ink)]">{fullName}</h2>
                          <p className="mt-0.5 truncate text-xs font-bold text-[var(--jg-green)]">
                            {candidate.current_position || 'Open to opportunities'}
                          </p>
                        </div>
                        <ArrowUpRight className="shrink-0 text-[var(--jg-muted)] transition group-hover:text-[var(--jg-green)]" size={15} aria-hidden="true" />
                      </div>
                      <div className="mt-auto grid gap-1.5 border-t border-[var(--jg-line)] pt-3 text-xs text-[var(--jg-muted)]">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <BriefcaseBusiness className="shrink-0" size={13} aria-hidden="true" />
                          <span className="truncate">{candidate.industry}</span>
                        </span>
                        <span className="flex min-w-0 items-center gap-1.5">
                          <MapPin className="shrink-0" size={13} aria-hidden="true" />
                          <span className="truncate">{candidate.country || 'Location not specified'}</span>
                        </span>
                      </div>
                    </article>
                  </Link>
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
