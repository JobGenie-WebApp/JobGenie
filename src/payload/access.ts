import type { AccessArgs, FieldAccess } from 'payload';

type CMSRole = 'admin' | 'publisher' | 'editor';

type CMSUser = {
  id?: number | string;
  role?: CMSRole;
  collection?: string;
};

function getCMSUser(args: AccessArgs): CMSUser | null {
  const user = args.req.user as CMSUser | null | undefined;
  if (!user || user.collection !== 'cms-users') return null;
  return user;
}

export function isCMSAuthenticated(args: AccessArgs): boolean {
  return Boolean(getCMSUser(args));
}

export function isCMSAdmin(args: AccessArgs): boolean {
  return getCMSUser(args)?.role === 'admin';
}

export function canPublishCMS(args: AccessArgs): boolean {
  const role = getCMSUser(args)?.role;
  return role === 'admin' || role === 'publisher';
}

export const canManageCMSUsers: FieldAccess = ({ req, id }) => {
  const user = req.user as CMSUser | null | undefined;
  return user?.role === 'admin' || Boolean(id && user?.id === id);
};
