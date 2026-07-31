import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Building2, MapPin } from 'lucide-react';
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
            <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-2 lg:grid-cols-4">
              {companies.items.map((company) => {
                const initials = company.company_name.split(' ').slice(0, 2).map((word) => word[0]).join('').toUpperCase();
                const website = company.website ? websiteHref(company.website) : null;
                return (
                  <Link
                    aria-label={`View ${company.company_name}`}
                    className="group rounded-xl border border-[var(--jg-line)] bg-white outline-none transition hover:-translate-y-0.5 hover:border-green-600/35 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--jg-green)] focus-visible:ring-offset-2 dark:bg-[#0a1510]"
                    href={website || '/candidate/signup'}
                    key={company.id}
                    rel={website ? 'noreferrer' : undefined}
                    target={website ? '_blank' : undefined}
                  >
                    <article className="flex min-h-[168px] h-full flex-col p-4">
                      <div className="flex items-start justify-between gap-3">
                        <Avatar className="h-11 w-11 rounded-lg border border-[var(--jg-line)] bg-[#f1f7f3] dark:bg-white/5">
                          {company.logo_url && <AvatarImage alt={`${company.company_name} logo`} className="object-contain p-1" src={company.logo_url} />}
                          <AvatarFallback className="rounded-lg bg-transparent text-xs font-extrabold text-[var(--jg-green)]">{initials}</AvatarFallback>
                        </Avatar>
                        <ArrowUpRight className="text-[var(--jg-muted)] transition group-hover:text-[var(--jg-green)]" size={15} aria-hidden="true" />
                      </div>
                      <h2 className="mt-3 line-clamp-2 text-base font-bold leading-5 text-[var(--jg-ink)]">{company.company_name}</h2>
                      <p className="mt-1 truncate text-xs font-bold text-[var(--jg-green)]">{company.industry}</p>
                      <div className="mt-auto border-t border-[var(--jg-line)] pt-3 text-xs text-[var(--jg-muted)]">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <MapPin className="shrink-0" size={13} aria-hidden="true" />
                          <span className="truncate">{company.headoffice_location || 'Location not specified'}</span>
                        </span>
                      </div>
                    </article>
                  </Link>
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
