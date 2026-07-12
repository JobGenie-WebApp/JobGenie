import { getPayload } from 'payload';

import config from '../payload.config.ts';
import {
  fallbackFooterContent,
  fallbackLandingContent,
  fallbackNavigationContent,
} from '../src/lib/cms/fallback';

async function main() {
  if (!process.env.PAYLOAD_DATABASE_URL || !process.env.PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_DATABASE_URL and PAYLOAD_SECRET are required to seed Payload CMS.');
  }

  const payload = await getPayload({ config });

  await payload.updateGlobal({
    slug: 'landing-page',
    data: {
      ...fallbackLandingContent,
      trustStrip: {
        ...fallbackLandingContent.trustStrip,
        items: fallbackLandingContent.trustStrip.items.map((label) => ({ label })),
      },
    },
    depth: 0,
  });

  await payload.updateGlobal({
    slug: 'site-navigation',
    data: fallbackNavigationContent,
    depth: 0,
  });

  await payload.updateGlobal({
    slug: 'site-footer',
    data: fallbackFooterContent,
    depth: 0,
  });

  payload.logger.info('Seeded JobGenie CMS globals.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
