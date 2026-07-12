import type { GlobalConfig } from 'payload';

import { canPublishCMS } from '../access.ts';

const linkFields = [
  { name: 'label', type: 'text' as const, required: true },
  { name: 'href', type: 'text' as const, required: true },
];

export const SiteFooter: GlobalConfig = {
  slug: 'site-footer',
  label: 'Site Footer',
  admin: {
    group: 'JobGenie CMS',
  },
  access: {
    read: () => true,
    update: canPublishCMS,
  },
  versions: {
    drafts: true,
    max: 10,
  },
  fields: [
    { name: 'brandDescription', type: 'textarea', required: true },
    {
      name: 'columns',
      type: 'array',
      minRows: 4,
      maxRows: 4,
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'links',
          type: 'array',
          minRows: 1,
          maxRows: 8,
          fields: linkFields,
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      minRows: 3,
      maxRows: 3,
      fields: linkFields,
    },
    { name: 'legalLine', type: 'text', required: true },
    { name: 'versionLabel', type: 'text', required: true },
    { name: 'statusLabel', type: 'text', required: true },
  ],
};
