import { postgresAdapter } from '@payloadcms/db-postgres';
import { s3Storage } from '@payloadcms/storage-s3';
import path from 'path';
import { buildConfig } from 'payload';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

import { CMSUsers } from './src/payload/collections/CMSUsers.ts';
import { Media } from './src/payload/collections/Media.ts';
import { LandingPage } from './src/payload/globals/LandingPage.ts';
import { SiteFooter } from './src/payload/globals/SiteFooter.ts';
import { SiteNavigation } from './src/payload/globals/SiteNavigation.ts';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const serverURL =
  process.env.PAYLOAD_PUBLIC_SERVER_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000';

const s3Enabled = Boolean(
  process.env.PAYLOAD_S3_BUCKET &&
    process.env.PAYLOAD_S3_ACCESS_KEY_ID &&
    process.env.PAYLOAD_S3_SECRET_ACCESS_KEY,
);

export default buildConfig({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '- JobGenie CMS',
    },
    user: CMSUsers.slug,
  },
  collections: [CMSUsers, Media],
  cookiePrefix: 'jobgenie-cms',
  cors: [serverURL],
  csrf: [serverURL],
  db: postgresAdapter({
    migrationDir: path.resolve(dirname, 'src/payload/migrations'),
    pool: {
      connectionString: process.env.PAYLOAD_DATABASE_URL || '',
    },
    push: process.env.PAYLOAD_DB_PUSH === 'true',
  }),
  defaultDepth: 1,
  graphQL: {
    disable: true,
    maxComplexity: 80,
  },
  globals: [LandingPage, SiteNavigation, SiteFooter],
  maxDepth: 3,
  plugins: [
    s3Storage({
      enabled: s3Enabled,
      bucket: process.env.PAYLOAD_S3_BUCKET || '',
      collections: {
        media: {
          prefix: 'cms',
        },
      },
      config: {
        credentials: {
          accessKeyId: process.env.PAYLOAD_S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.PAYLOAD_S3_SECRET_ACCESS_KEY || '',
        },
        endpoint: process.env.PAYLOAD_S3_ENDPOINT,
        forcePathStyle: process.env.PAYLOAD_S3_FORCE_PATH_STYLE !== 'false',
        region: process.env.PAYLOAD_S3_REGION || 'auto',
      },
    }),
  ],
  routes: {
    admin: '/cms',
    api: '/cms-api',
    graphQL: '/cms-graphql',
    graphQLPlayground: '/cms-graphql-playground',
  },
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL,
  sharp,
  telemetry: false,
  typescript: {
    outputFile: path.resolve(dirname, 'src/payload-types.ts'),
  },
});
