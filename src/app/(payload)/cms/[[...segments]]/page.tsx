/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { RootPage, generatePageMetadata } from '@payloadcms/next/views';
import type { Metadata } from 'next';

import config from '@payload-config';
import { importMap } from '../importMap.js';
import { isPayloadConfigured, PayloadNotConfigured } from '@/payload/env';

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] }>;
};

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  isPayloadConfigured()
    ? generatePageMetadata({ config, params, searchParams })
    : Promise.resolve({ title: 'Payload CMS Setup Required' });

const Page = ({ params, searchParams }: Args) => {
  if (!isPayloadConfigured()) {
    return <PayloadNotConfigured />;
  }

  return RootPage({ config, params, searchParams, importMap });
};

export default Page;
