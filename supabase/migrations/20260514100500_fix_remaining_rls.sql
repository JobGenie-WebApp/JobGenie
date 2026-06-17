-- =====================================================
-- PHASE 1 SUPPLEMENT: FIX REMAINING SECURITY ADVISOR ERRORS
-- =====================================================
-- Applied to dev: 2026-05-14 via MCP apply_migration
-- Apply to prod:  Supabase Dashboard SQL Editor (project oxcmkfejolzcyxhgfdhj)
--
-- Fixes:
-- 1. Enable RLS + policies on job_offers (was missing from original file)
-- 2. Enable RLS + policies on mis_permissions, mis_roles, mis_role_permissions
-- 3. Add policies on mis_interview_reminder_settings and interview_reminder_sent
--    (RLS was enabled but no policies existed)
-- 4. Revoke anon EXECUTE on SECURITY DEFINER helper functions
-- =====================================================


-- ============================================================
-- SECTION 1: job_offers — RLS + Policies
-- Links: invitation_id -> job_invitations -> candidate/employer
-- ============================================================

ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.job_offers TO authenticated;

DROP POLICY IF EXISTS "Candidates can view own job offers"  ON job_offers;
DROP POLICY IF EXISTS "Candidates can update own job offers" ON job_offers;
DROP POLICY IF EXISTS "Employers can view own job offers"   ON job_offers;
DROP POLICY IF EXISTS "MIS full access job_offers"          ON job_offers;

CREATE POLICY "Candidates can view own job offers"
    ON job_offers FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM job_invitations ji
            JOIN candidates c ON c.id = ji.candidate_id
            WHERE ji.id = job_offers.invitation_id
              AND c.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Candidates can update own job offers"
    ON job_offers FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM job_invitations ji
            JOIN candidates c ON c.id = ji.candidate_id
            WHERE ji.id = job_offers.invitation_id
              AND c.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM job_invitations ji
            JOIN candidates c ON c.id = ji.candidate_id
            WHERE ji.id = job_offers.invitation_id
              AND c.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Employers can view own job offers"
    ON job_offers FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM job_invitations ji
            JOIN employers e ON e.id = ji.employer_id
            WHERE ji.id = job_offers.invitation_id
              AND e.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "MIS full access job_offers"
    ON job_offers FOR ALL TO authenticated
    USING   (public.is_mis_user())
    WITH CHECK (public.is_mis_user());


-- ============================================================
-- SECTION 2: MIS lookup tables — RLS + read-only policies
-- ============================================================

ALTER TABLE public.mis_permissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_role_permissions ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.mis_permissions      TO authenticated;
GRANT SELECT ON TABLE public.mis_roles            TO authenticated;
GRANT SELECT ON TABLE public.mis_role_permissions TO authenticated;

DROP POLICY IF EXISTS "MIS can read permissions"      ON mis_permissions;
DROP POLICY IF EXISTS "MIS can read roles"            ON mis_roles;
DROP POLICY IF EXISTS "MIS can read role permissions" ON mis_role_permissions;

CREATE POLICY "MIS can read permissions"
    ON mis_permissions FOR SELECT TO authenticated
    USING (public.is_mis_user());

CREATE POLICY "MIS can read roles"
    ON mis_roles FOR SELECT TO authenticated
    USING (public.is_mis_user());

CREATE POLICY "MIS can read role permissions"
    ON mis_role_permissions FOR SELECT TO authenticated
    USING (public.is_mis_user());


-- ============================================================
-- SECTION 3: Add policies to RLS-enabled-but-no-policy tables
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mis_interview_reminder_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.interview_reminder_sent          TO authenticated;

DROP POLICY IF EXISTS "MIS full access reminder settings" ON mis_interview_reminder_settings;
DROP POLICY IF EXISTS "MIS full access reminder sent"     ON interview_reminder_sent;

CREATE POLICY "MIS full access reminder settings"
    ON mis_interview_reminder_settings FOR ALL TO authenticated
    USING   (public.is_mis_user())
    WITH CHECK (public.is_mis_user());

CREATE POLICY "MIS full access reminder sent"
    ON interview_reminder_sent FOR ALL TO authenticated
    USING   (public.is_mis_user())
    WITH CHECK (public.is_mis_user());


-- ============================================================
-- SECTION 4: Revoke EXECUTE on SECURITY DEFINER helpers from anon
-- These are only needed inside RLS policies (authenticated role).
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.is_mis_user()  FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_candidate() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_employer()  FROM anon;


NOTIFY pgrst, 'reload schema';
