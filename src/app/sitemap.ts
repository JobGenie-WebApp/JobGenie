import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
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
    '/privacy',
    '/terms',
    '/gdpr',
    '/pdpa',
  ];

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    priority: route === '' ? 1 : 0.5,
  }));
}
