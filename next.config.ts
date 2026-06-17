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
    return [
      // Cache static reference data endpoints (industries, job designations don't change frequently)
      {
        source: '/api/industries',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/api/job-designations',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=43200, stale-while-revalidate=86400' },
        ],
      },
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
