-- =====================================================
-- FIX MISSING CROSS-TABLE RLS POLICIES
-- =====================================================
-- After Phase 1 RLS was applied, API routes using the user-auth
-- client (createClient) started getting null for PostgREST joins
-- to tables the user role had no SELECT policy on.
--
-- Root cause: companies and employers had no SELECT policy for
-- candidates, so PostgREST returned null for those joins, which
-- caused TypeError: Cannot read properties of null (reading 'logo_url')
-- in InvitationsClient.tsx at line 232.
-- =====================================================

-- COMPANIES: Candidates need to see company info in their invitations
-- (company name, logo, location, bio). This is public business info.
DROP POLICY IF EXISTS "Candidates can view companies" ON companies;
CREATE POLICY "Candidates can view companies"
    ON companies FOR SELECT TO authenticated
    USING (public.is_candidate());

-- EMPLOYERS: Candidates need to see employer contact info in invitations
-- (name, designation, email for scheduling). Read-only access.
DROP POLICY IF EXISTS "Candidates can view employers via invitations" ON employers;
CREATE POLICY "Candidates can view employers via invitations"
    ON employers FOR SELECT TO authenticated
    USING (public.is_candidate());

NOTIFY pgrst, 'reload schema';
