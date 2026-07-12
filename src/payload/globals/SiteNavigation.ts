import type { GlobalConfig } from 'payload';

import { canPublishCMS } from '../access.ts';

export const SiteNavigation: GlobalConfig = {
  slug: 'site-navigation',
  label: 'Site Navigation',
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
    {
      name: 'links',
      type: 'array',
      minRows: 4,
      maxRows: 4,
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
        { name: 'id', type: 'text', required: true },
      ],
    },
    {
      name: 'signIn',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    {
      name: 'getStarted',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
  ],
};
