import type { MetadataRoute } from 'next';

import { listPublishedSlugs } from '@/lib/cms/pages';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    '',
    '/about-us',
    '/contact',
    '/explore-genie',
    '/faq',
    '/opportunities',
    '/talent-pool',
    '/top-employers',
    '/cookie-policy',
  ];

  const cmsRoutes = (await listPublishedSlugs()).map((slug) => `/${slug}`);

  return [...staticRoutes, ...cmsRoutes].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    priority: route === '' ? 1 : 0.5,
  }));
}
