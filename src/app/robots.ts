import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Authenticated areas and API routes have nothing to index.
      disallow: ['/candidate/', '/employer/', '/mis/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
