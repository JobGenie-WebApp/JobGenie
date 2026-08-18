import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    // Content-Security-Policy starter. Shipped as **Report-Only** so it surfaces
    // violations in the browser console / reporting without breaking the app.
    // Once verified clean in production, rename the header key below from
    // 'Content-Security-Policy-Report-Only' to 'Content-Security-Policy' to enforce.
    const csp = [
      "default-src 'self'",
      // Next.js + react-compiler need inline/eval; Vercel Analytics loads from va.vercel-scripts.com
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co",
      "font-src 'self' data:",
      // Supabase REST/Realtime (https + wss) and Vercel insights
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com https://*.vercel-insights.com",
      // The company profile embeds a Google Maps iframe; without frame-src it
      // falls back to default-src 'self' and would break once CSP is enforced.
      "frame-src https://maps.google.com https://www.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; ');

    return [
      // Global security headers on every route.
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Content-Security-Policy-Report-Only', value: csp },
        ],
      },
      // Cache static reference data endpoints (industries, job designations don't change frequently)
      {
        source: '/api/industries',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      // NOTE: /api/job-designations sets its own Cache-Control per response
      // (populated results are cached; empty/error results are not) so a
      // transient empty response can't poison the CDN. Do not add a blanket
      // cache header for it here.
      {
        source: '/api/seniority-levels',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
    ];
  },
};

export default nextConfig;
