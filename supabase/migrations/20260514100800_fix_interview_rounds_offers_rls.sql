-- =====================================================
-- FIX MISSING RLS WRITE POLICIES FOR INTERVIEW FLOW
-- =====================================================
-- Root cause: interview_rounds and job_offers tables had SELECT-only
-- policies for employers and candidates, but the API routes need
-- write access to create/update rounds, create offers, and respond
-- to rounds.
-- =====================================================

-- INTERVIEW_ROUNDS: Employers need to INSERT (create next rounds) and UPDATE (confirm, add feedback)
DROP POLICY IF EXISTS "Employers can create interview rounds" ON interview_rounds;
CREATE POLICY "Employers can create interview rounds"
    ON interview_rounds FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM job_invitations ji
            JOIN employers e ON e.id = ji.employer_id
            WHERE ji.id = interview_rounds.invitation_id
            AND e.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Employers can update interview rounds" ON interview_rounds;
CREATE POLICY "Employers can update interview rounds"
    ON interview_rounds FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM job_invitations ji
            JOIN employers e ON e.id = ji.employer_id
            WHERE ji.id = interview_rounds.invitation_id
            AND e.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM job_invitations ji
            JOIN employers e ON e.id = ji.employer_id
            WHERE ji.id = interview_rounds.invitation_id
            AND e.user_id = auth.uid()
        )
    );

-- INTERVIEW_ROUNDS: Candidates need UPDATE to respond (accept/decline rounds)
DROP POLICY IF EXISTS "Candidates can update own interview rounds" ON interview_rounds;
CREATE POLICY "Candidates can update own interview rounds"
    ON interview_rounds FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM job_invitations ji
            JOIN candidates c ON c.id = ji.candidate_id
            WHERE ji.id = interview_rounds.invitation_id
            AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM job_invitations ji
            JOIN candidates c ON c.id = ji.candidate_id
            WHERE ji.id = interview_rounds.invitation_id
            AND c.user_id = auth.uid()
        )
    );

-- JOB_OFFERS: Employers need to INSERT (create offers) and UPDATE (modify offers)
DROP POLICY IF EXISTS "Employers can create job offers" ON job_offers;
CREATE POLICY "Employers can create job offers"
    ON job_offers FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM job_invitations ji
            JOIN employers e ON e.id = ji.employer_id
            WHERE ji.id = job_offers.invitation_id
            AND e.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Employers can update job offers" ON job_offers;
CREATE POLICY "Employers can update job offers"
    ON job_offers FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM job_invitations ji
            JOIN employers e ON e.id = ji.employer_id
            WHERE ji.id = job_offers.invitation_id
            AND e.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM job_invitations ji
            JOIN employers e ON e.id = ji.employer_id
            WHERE ji.id = job_offers.invitation_id
            AND e.user_id = auth.uid()
        )
    );

-- SECURITY: Properly revoke EXECUTE on SECURITY DEFINER helper functions from PUBLIC
-- (Previous attempts only revoked from 'anon', but need to revoke from PUBLIC which includes anon)
REVOKE EXECUTE ON FUNCTION public.is_candidate() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_employer() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_mis_user() FROM PUBLIC;

-- Grant back to authenticated and service_role only
GRANT EXECUTE ON FUNCTION public.is_candidate() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_employer() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_mis_user() TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
