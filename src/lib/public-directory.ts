import { createAdminClient } from '@/lib/supabase/admin';

export const PUBLIC_DIRECTORY_PAGE_SIZE = 12;

export type PublicJob = {
  id: string;
  job_title: string;
  location: string | null;
  advertisement_link: string | null;
  created_at: string;
  company: {
    company_name: string;
    logo_url: string | null;
    headoffice_location: string | null;
  } | null;
};

export type PublicCompany = {
  id: string;
  company_name: string;
  industry: string;
  logo_url: string | null;
  website: string | null;
  headoffice_location: string | null;
};

export type PublicCandidate = {
  id: string;
  first_name: string;
  last_name: string;
  current_position: string;
  industry: string;
  country: string | null;
  profile_image_url: string | null;
};

export type PublicDirectoryResult<T> = {
  items: T[];
  page: number;
  total: number;
  totalPages: number;
  failed: boolean;
};

function safePage(value: string | undefined) {
  const page = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function safeSearch(value: string | undefined) {
  return value?.trim().slice(0, 80).replace(/[,%().\\]/g, ' ') ?? '';
}

function result<T>(items: T[], page: number, total: number, failed = false): PublicDirectoryResult<T> {
  return {
    items,
    page,
    total,
    totalPages: Math.max(1, Math.ceil(total / PUBLIC_DIRECTORY_PAGE_SIZE)),
    failed,
  };
}

export async function getPublicJobs(params: {
  page?: string;
  query?: string;
  jobType?: string;
}): Promise<PublicDirectoryResult<PublicJob>> {
  const page = safePage(params.page);
  const queryText = safeSearch(params.query);
  const allowedTypes = new Set(['full_time', 'part_time', 'contract', 'internship', 'freelance']);
  const jobType = allowedTypes.has(params.jobType ?? '') ? params.jobType : '';
  const from = (page - 1) * PUBLIC_DIRECTORY_PAGE_SIZE;
  const to = from + PUBLIC_DIRECTORY_PAGE_SIZE - 1;

  try {
    const admin = createAdminClient();
    let query = admin
      .from('jobs')
      .select(`
        id, job_title, location, advertisement_link, created_at,
        company:companies!inner(
          company_name, logo_url, headoffice_location
        )
      `, { count: 'exact' })
      .eq('status', 'published')
      .eq('is_deleted', false)
      .eq('company.approval_status', 'approved')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (queryText) query = query.ilike('job_title', `%${queryText}%`);
    if (jobType) query = query.eq('job_type', jobType);

    const { data, error, count } = await query
      .order('published_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return result((data ?? []) as unknown as PublicJob[], page, count ?? 0);
  } catch (error) {
    console.error('Failed to load public jobs:', error);
    return result([], page, 0, true);
  }
}

export async function getPublicCompanies(params: {
  page?: string;
  query?: string;
}): Promise<PublicDirectoryResult<PublicCompany>> {
  const page = safePage(params.page);
  const queryText = safeSearch(params.query);
  const from = (page - 1) * PUBLIC_DIRECTORY_PAGE_SIZE;
  const to = from + PUBLIC_DIRECTORY_PAGE_SIZE - 1;

  try {
    const admin = createAdminClient();
    let query = admin
      .from('companies')
      .select(`
        id, company_name, industry, logo_url, website, headoffice_location
      `, { count: 'exact' })
      .eq('approval_status', 'approved')
      .eq('profile_completed', true)
      .eq('profile_visible', true);

    if (queryText) query = query.ilike('company_name', `%${queryText}%`);

    const { data, error, count } = await query
      .order('approved_at', { ascending: false, nullsFirst: false })
      .range(from, to);

    if (error) throw error;
    return result((data ?? []) as PublicCompany[], page, count ?? 0);
  } catch (error) {
    console.error('Failed to load public companies:', error);
    return result([], page, 0, true);
  }
}

export async function getPublicCandidates(params: {
  page?: string;
  query?: string;
}): Promise<PublicDirectoryResult<PublicCandidate>> {
  const page = safePage(params.page);
  const queryText = safeSearch(params.query);
  const from = (page - 1) * PUBLIC_DIRECTORY_PAGE_SIZE;
  const to = from + PUBLIC_DIRECTORY_PAGE_SIZE - 1;

  try {
    const admin = createAdminClient();
    let query = admin
      .from('candidates')
      .select(`
        id, first_name, last_name, current_position, industry, country,
        profile_image_url
      `, { count: 'exact' })
      .eq('approval_status', 'approved')
      .eq('profile_completed', true);

    if (queryText) {
      query = query.or(
        `first_name.ilike.%${queryText}%,last_name.ilike.%${queryText}%,current_position.ilike.%${queryText}%,industry.ilike.%${queryText}%`,
      );
    }

    const { data, error, count } = await query
      .order('approved_at', { ascending: false, nullsFirst: false })
      .range(from, to);

    if (error) throw error;
    return result((data ?? []) as PublicCandidate[], page, count ?? 0);
  } catch (error) {
    console.error('Failed to load public candidates:', error);
    return result([], page, 0, true);
  }
}
