/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes';

import config from '@payload-config';
import '@payloadcms/next/css';
import { isPayloadConfigured } from '@/payload/env';

const notConfigured = () =>
  Response.json(
    {
      error: 'Payload CMS is not configured. Set PAYLOAD_DATABASE_URL and PAYLOAD_SECRET.',
    },
    { status: 503 },
  );

export const GET = isPayloadConfigured() ? REST_GET(config) : notConfigured;
export const POST = isPayloadConfigured() ? REST_POST(config) : notConfigured;
export const DELETE = isPayloadConfigured() ? REST_DELETE(config) : notConfigured;
export const PATCH = isPayloadConfigured() ? REST_PATCH(config) : notConfigured;
export const PUT = isPayloadConfigured() ? REST_PUT(config) : notConfigured;
export const OPTIONS = isPayloadConfigured() ? REST_OPTIONS(config) : notConfigured;
