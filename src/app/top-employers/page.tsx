import type { Metadata } from 'next';
import { ArrowUpRight, BadgeCheck, Building2, Globe2, MapPin, UsersRound } from 'lucide-react';
import {
  DirectoryPagination,
  DirectorySearch,
  DirectoryState,
  PublicPageHero,
  PublicPageShell,
} from '@/components/public/PublicPageShell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPublicCompanies } from '@/lib/public-directory';

export const metadata: Metadata = {
  title: 'Our Top Companies | JobGenie',
  description: 'Meet approved and verified companies hiring through JobGenie.',
};

export const dynamic = 'force-dynamic';

function websiteHref(website: string) {
  try {
    const url = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function TopEmployersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const companies = await getPublicCompanies({ page: params.page, query: params.q });
  const query = params.q?.trim() ?? '';

  return (
    <PublicPageShell>
      <PublicPageHero
        eyebrow="APPROVED COMPANIES"
        title="Our top employers."
        description="Discover verified organisations building strong teams and creating meaningful opportunities through JobGenie."
        icon={Building2}
        resultLabel={`${companies.total} approved ${companies.total === 1 ? 'company' : 'companies'}`}
      />
      <section className="bg-[#f7fbf8] dark:bg-[#07100b]">
        <div className="jg-container">
          <DirectorySearch defaultValue={query} placeholder="Search companies by name" />
          {companies.items.length === 0 ? (
            <DirectoryState
              failed={companies.failed}
              title="No companies found"
              description="Try a different company name or clear your search."
            />
          ) : (
            <div className="grid gap-px overflow-hidden border-x border-b border-[var(--jg-line)] bg-[var(--jg-line)] md:grid-cols-2 lg:grid-cols-3">
              {companies.items.map((company) => {
                const initials = company.company_name.split(' ').slice(0, 2).map((word) => word[0]).join('').toUpperCase();
                const website = company.website ? websiteHref(company.website) : null;
                return (
                  <article className="flex min-h-[360px] flex-col bg-white p-6 dark:bg-[#0a1510]" key={company.id}>
                    <div className="flex items-start justify-between gap-4">
                      <Avatar className="h-14 w-14 rounded-lg border border-[var(--jg-line)] bg-[#f1f7f3] dark:bg-white/5">
                        {company.logo_url && <AvatarImage alt={`${company.company_name} logo`} className="object-contain p-1.5" src={company.logo_url} />}
                        <AvatarFallback className="rounded-lg bg-transparent text-sm font-extrabold text-[var(--jg-green)]">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--jg-green)]"><BadgeCheck size={16} /> Verified</span>
                    </div>
                    <h2 className="mt-6 text-2xl font-bold leading-8 text-[var(--jg-ink)]">{company.company_name}</h2>
                    <p className="mt-2 text-sm font-bold text-[var(--jg-green)]">{company.industry}</p>
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--jg-muted)]">
                      {company.bio || company.description || 'A verified JobGenie employer building its next great team.'}
                    </p>
                    <div className="mt-5 grid gap-2.5 text-sm text-[var(--jg-muted)]">
                      {company.headoffice_location && <span className="flex items-center gap-2"><MapPin size={15} /> {company.headoffice_location}</span>}
                      {company.company_size && <span className="flex items-center gap-2"><UsersRound size={15} /> {company.company_size}</span>}
                    </div>
                    {(company.specialities ?? []).length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {(company.specialities ?? []).slice(0, 3).map((speciality) => (
                          <span className="rounded-md bg-[#eef8f1] px-2.5 py-1 text-xs font-medium text-[var(--jg-ink)] dark:bg-white/5" key={speciality}>{speciality}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-auto border-t border-[var(--jg-line)] pt-5">
                      {website ? (
                        <a className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[var(--jg-ink)] hover:text-[var(--jg-green)]" href={website} rel="noreferrer" target="_blank">
                          <Globe2 size={16} /> Visit website <ArrowUpRight size={15} />
                        </a>
                      ) : (
                        <span className="text-xs text-[var(--jg-muted)]">Profile verified by JobGenie</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <DirectoryPagination
            page={companies.page}
            params={{ q: query }}
            pathname="/top-employers"
            totalPages={companies.totalPages}
          />
        </div>
      </section>
    </PublicPageShell>
  );
}
