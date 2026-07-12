import type { CollectionConfig } from 'payload';

import { canPublishCMS, isCMSAdmin, isCMSAuthenticated } from '../access.ts';

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'JobGenie CMS',
    useAsTitle: 'alt',
    defaultColumns: ['alt', 'filename', 'updatedAt'],
  },
  access: {
    create: isCMSAuthenticated,
    delete: isCMSAdmin,
    read: () => true,
    update: canPublishCMS,
  },
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'card',
        width: 768,
        height: 432,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1600,
        height: 900,
        position: 'centre',
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
};
