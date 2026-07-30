import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, ArrowRight, Search, Sparkles } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { getSiteContent } from '@/lib/cms/site-content';

export async function PublicPageShell({ children }: { children: React.ReactNode }) {
  const content = await getSiteContent();
  return (
    <div className="landing-page jobgenie-home min-h-screen">
      <Header navigation={content.navigation} />
      <main className="min-h-[70vh] overflow-hidden">{children}</main>
      <Footer brand={content.navigation.brand} content={content.footer} />
    </div>
  );
}

export function PublicPageHero({
  eyebrow,
  title,
  description,
  icon: Icon = Sparkles,
  resultLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  resultLabel?: string;
}) {
  return (
    <header className="border-b border-[var(--jg-line)] bg-[#eef8f1] pt-32 dark:bg-[#09150e] md:pt-40">
      <div className="jg-container pb-14 md:pb-20">
        <div className="flex items-center gap-3 text-xs font-bold text-[var(--jg-green)]">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/80 dark:bg-white/5">
            <Icon size={18} aria-hidden="true" />
          </span>
          {eyebrow}
        </div>
        <h1 className="mt-7 max-w-4xl text-4xl font-extrabold leading-[1.06] text-[var(--jg-ink)] md:text-6xl">
          {title}
        </h1>
        <div className="mt-7 flex max-w-4xl flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <p className="max-w-2xl text-base leading-7 text-[var(--jg-muted)] md:text-lg">{description}</p>
          {resultLabel && (
            <span className="w-fit whitespace-nowrap rounded-md border border-[var(--jg-line)] bg-white/70 px-3 py-2 text-xs font-bold text-[var(--jg-ink)] dark:bg-white/5">
              {resultLabel}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

export function DirectorySearch({
  defaultValue,
  placeholder,
  children,
}: {
  defaultValue: string;
  placeholder: string;
  children?: React.ReactNode;
}) {
  return (
    <form className="flex flex-col gap-3 border-b border-[var(--jg-line)] py-6 sm:flex-row" method="get">
      <label className="relative min-w-0 flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--jg-muted)]" size={17} aria-hidden="true" />
        <span className="sr-only">Search</span>
        <input
          className="h-12 w-full rounded-lg border border-[var(--jg-line)] bg-white pl-11 pr-4 text-sm text-[var(--jg-ink)] outline-none transition focus:border-[var(--jg-green)] focus:ring-2 focus:ring-green-500/15 dark:bg-white/5"
          defaultValue={defaultValue}
          name="q"
          placeholder={placeholder}
          type="search"
        />
      </label>
      {children}
      <button className="h-12 rounded-lg bg-[var(--jg-green)] px-6 text-sm font-bold text-white transition hover:brightness-95" type="submit">
        Search
      </button>
    </form>
  );
}

export function DirectoryState({
  failed,
  title,
  description,
}: {
  failed: boolean;
  title: string;
  description: string;
}) {
  return (
    <div className="my-12 border-y border-[var(--jg-line)] py-20 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-green-500/10 text-[var(--jg-green)]">
        <Search size={21} aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-2xl font-bold text-[var(--jg-ink)]">{failed ? 'We could not load this directory' : title}</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--jg-muted)]">
        {failed ? 'Please refresh the page in a moment.' : description}
      </p>
    </div>
  );
}

function pageHref(pathname: string, page: number, params: Record<string, string>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  if (page > 1) query.set('page', String(page));
  const suffix = query.toString();
  return suffix ? `${pathname}?${suffix}` : pathname;
}

export function DirectoryPagination({
  pathname,
  page,
  totalPages,
  params,
}: {
  pathname: string;
  page: number;
  totalPages: number;
  params: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Directory pagination" className="flex items-center justify-between border-t border-[var(--jg-line)] py-8">
      {page > 1 ? (
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-[var(--jg-ink)] hover:text-[var(--jg-green)]" href={pageHref(pathname, page - 1, params)}>
          <ArrowLeft size={16} /> Previous
        </Link>
      ) : <span />}
      <span className="text-xs font-bold text-[var(--jg-muted)]">Page {page} of {totalPages}</span>
      {page < totalPages ? (
        <Link className="inline-flex items-center gap-2 text-sm font-bold text-[var(--jg-ink)] hover:text-[var(--jg-green)]" href={pageHref(pathname, page + 1, params)}>
          Next <ArrowRight size={16} />
        </Link>
      ) : <span />}
    </nav>
  );
}
