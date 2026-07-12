import type { CollectionConfig } from 'payload';

import { canManageCMSUsers, isCMSAdmin, isCMSAuthenticated } from '../access.ts';

export const CMSUsers: CollectionConfig = {
  slug: 'cms-users',
  auth: true,
  admin: {
    group: 'JobGenie CMS',
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'updatedAt'],
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (operation !== 'create' || req.user || data?.role) {
          return data;
        }

        const existingUsers = await req.payload.count({
          collection: 'cms-users',
          overrideAccess: true,
        });

        if (existingUsers.totalDocs === 0) {
          return {
            ...data,
            role: 'admin',
          };
        }

        return data;
      },
    ],
  },
  access: {
    admin: isCMSAuthenticated,
    create: isCMSAdmin,
    delete: isCMSAdmin,
    read: isCMSAuthenticated,
    update: ({ req, id }) => {
      const user = req.user as { id?: number | string; role?: string } | null | undefined;
      return user?.role === 'admin' || Boolean(id && `${user?.id}` === `${id}`);
    },
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      defaultValue: 'editor',
      required: true,
      access: {
        create: canManageCMSUsers,
        update: canManageCMSUsers,
      },
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Publisher', value: 'publisher' },
        { label: 'Editor', value: 'editor' },
      ],
    },
  ],
};
