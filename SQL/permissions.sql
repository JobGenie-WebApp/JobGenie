-- ============================================================================
-- JobGenie — MIS Permissions catalog
-- ============================================================================
-- Seeds the `public.mis_permissions` table with the full permission catalog.
--
-- This is the SQL source of truth for the MIS permission catalog. It mirrors
-- `src/lib/mis/default-permissions.ts` (DEFAULT_PERMISSIONS) — keep them in sync.
--
-- SAFE TO RE-RUN: uses INSERT ... ON CONFLICT (resource, action) DO UPDATE, so
-- re-running refreshes name/description and adds any new permissions WITHOUT
-- deleting existing rows or breaking role assignments (mis_role_permissions).
--
-- Permission name convention: `${resource}.${action}`.
--
-- NOTE: This only seeds the permission *catalog*. Super admins bypass all
-- permission checks via `mis_user.is_super_admin = true` (see src/lib/permissions.ts),
-- so they do not require explicit role_permission rows.
-- ============================================================================

BEGIN;

INSERT INTO public.mis_permissions (name, resource, action, description) VALUES
  -- Candidate Management
  ('candidates.view',    'candidates', 'view',    'View candidate profiles and list'),
  ('candidates.approve', 'candidates', 'approve', 'Approve or reject candidate profiles'),
  ('candidates.edit',    'candidates', 'edit',    'Edit candidate information'),
  ('candidates.delete',  'candidates', 'delete',  'Delete candidate accounts'),
  ('candidates.export',  'candidates', 'export',  'Export candidate data'),

  -- Employer Management
  ('employers.view',    'employers', 'view',    'View employer profiles and companies'),
  ('employers.approve', 'employers', 'approve', 'Approve or reject employer/company profiles'),
  ('employers.edit',    'employers', 'edit',    'Edit employer/company information'),
  ('employers.delete',  'employers', 'delete',  'Delete employer accounts'),
  ('employers.export',  'employers', 'export',  'Export employer data'),

  -- Job Management
  ('jobs.view',     'jobs', 'view',     'View all job postings'),
  ('jobs.create',   'jobs', 'create',   'Create job postings (on behalf of employers)'),
  ('jobs.edit',     'jobs', 'edit',     'Edit job postings'),
  ('jobs.delete',   'jobs', 'delete',   'Delete job postings'),
  ('jobs.moderate', 'jobs', 'moderate', 'Moderate and flag job postings'),

  -- Interview Management
  ('interviews.view',                'interviews', 'view',                'View interview schedules and details'),
  ('interviews.reschedule',          'interviews', 'reschedule',          'Reschedule interviews'),
  ('interviews.cancel',              'interviews', 'cancel',              'Cancel interviews'),
  ('interviews.configure_reminders', 'interviews', 'configure_reminders', 'Configure interview email reminder schedule (MIS)'),

  -- MIS User Management
  ('users.view',         'users', 'view',         'View MIS users list'),
  ('users.create',       'users', 'create',       'Create new MIS user accounts'),
  ('users.edit',         'users', 'edit',         'Edit MIS user information'),
  ('users.delete',       'users', 'delete',       'Delete MIS user accounts'),
  ('users.manage_roles', 'users', 'manage_roles', 'Assign roles to MIS users'),

  -- Role & Permission Management
  ('roles.view',   'roles', 'view',   'View roles and permissions'),
  ('roles.create', 'roles', 'create', 'Create new roles'),
  ('roles.edit',   'roles', 'edit',   'Edit roles and assign permissions'),
  ('roles.delete', 'roles', 'delete', 'Delete roles'),

  -- Reports & Analytics
  ('reports.view',   'reports', 'view',   'View system reports and analytics'),
  ('reports.export', 'reports', 'export', 'Export reports and data'),

  -- Audit Logs
  ('audit.view',   'audit', 'view',   'View audit logs and system activity'),
  ('audit.export', 'audit', 'export', 'Export audit logs'),

  -- Master Data Management
  ('master_data.view', 'master_data', 'view', 'View master data (industries, designations)'),
  ('master_data.edit', 'master_data', 'edit', 'Add/edit industries and job designations'),

  -- Analytics
  ('analytics.view',   'analytics', 'view',   'View analytics dashboard and reports'),
  ('analytics.export', 'analytics', 'export', 'Export analytics data')
ON CONFLICT (resource, action) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description;

COMMIT;

-- ============================================================================
-- End of file
-- ============================================================================
