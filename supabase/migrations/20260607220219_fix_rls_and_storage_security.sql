-- ============================================================
-- Fix RLS policies and Storage bucket security
-- Issues addressed:
--   1. mis_sidebar_visibility_settings has RLS disabled
--   2. companies INSERT policy uses WITH CHECK (true) — any authenticated user can insert
--   3. api_request_logs / error_logs / event_logs INSERT use WITH CHECK (true) — overly permissive
--   4. candidate_resumes policies use role=public instead of authenticated
--   5. notifications policy uses role=public instead of authenticated
--   6. profile-images has a broad public SELECT policy that allows listing all files
--   7. company-logos has a broad public SELECT policy (any anon can list all logos)
--   8. payment-proofs bucket has no RLS policies for MIS read/delete or employer upload/read
--   9. SECURITY DEFINER trigger functions callable by anon role
--
-- NOTE: profile-images, resume, resume_copy, br-certificates buckets remain public
-- so that stored public URLs in the database continue to work. The security fix is
-- removing the broad listing policy (which allowed enumerating all files) and
-- replacing it with scoped authenticated-only listing policies.
-- ============================================================

-- ============================================================
-- 1. Enable RLS on mis_sidebar_visibility_settings
-- ============================================================
ALTER TABLE public.mis_sidebar_visibility_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MIS can read sidebar visibility settings"
  ON public.mis_sidebar_visibility_settings
  FOR SELECT
  TO authenticated
  USING (is_mis_user());

CREATE POLICY "MIS can insert sidebar visibility settings"
  ON public.mis_sidebar_visibility_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (is_mis_user());

CREATE POLICY "MIS can update sidebar visibility settings"
  ON public.mis_sidebar_visibility_settings
  FOR UPDATE
  TO authenticated
  USING (is_mis_user())
  WITH CHECK (is_mis_user());

CREATE POLICY "MIS can delete sidebar visibility settings"
  ON public.mis_sidebar_visibility_settings
  FOR DELETE
  TO authenticated
  USING (is_mis_user());

-- ============================================================
-- 2. Fix companies INSERT policy — restrict to employers only
--    Previously: WITH CHECK (true) allowed ANY authenticated user to create a company
-- ============================================================
DROP POLICY IF EXISTS "Employers can insert company" ON public.companies;

CREATE POLICY "Employers can insert company"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (is_employer());

-- ============================================================
-- 3. Fix api_request_logs INSERT — prevent users logging as others
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can insert api request logs" ON public.api_request_logs;

CREATE POLICY "Authenticated can insert api request logs"
  ON public.api_request_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IS NULL OR
    user_id = (SELECT auth.uid())
  );

-- ============================================================
-- 4. Fix error_logs INSERT — prevent users logging as others
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can insert error logs" ON public.error_logs;

CREATE POLICY "Authenticated can insert error logs"
  ON public.error_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IS NULL OR
    user_id = (SELECT auth.uid())
  );

-- ============================================================
-- 5. Fix event_logs INSERT — prevent users logging as others
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can insert event logs" ON public.event_logs;

CREATE POLICY "Authenticated can insert event logs"
  ON public.event_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IS NULL OR
    user_id = (SELECT auth.uid())
  );

-- ============================================================
-- 6. Fix candidate_resumes policies — role was 'public' (anon accessible)
--    Replace with 'authenticated' and proper employer scoping
-- ============================================================
DROP POLICY IF EXISTS "candidate_resumes_select_own" ON public.candidate_resumes;
DROP POLICY IF EXISTS "candidate_resumes_select_employer" ON public.candidate_resumes;
DROP POLICY IF EXISTS "candidate_resumes_select_mis" ON public.candidate_resumes;
DROP POLICY IF EXISTS "candidate_resumes_insert_own" ON public.candidate_resumes;
DROP POLICY IF EXISTS "candidate_resumes_update_own" ON public.candidate_resumes;
DROP POLICY IF EXISTS "candidate_resumes_delete_own" ON public.candidate_resumes;

CREATE POLICY "candidate_resumes_select_own"
  ON public.candidate_resumes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM candidates
      WHERE candidates.id = candidate_resumes.candidate_id
        AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "candidate_resumes_select_employer"
  ON public.candidate_resumes
  FOR SELECT
  TO authenticated
  USING (
    is_employer() AND
    EXISTS (
      SELECT 1 FROM candidates c
      WHERE c.id = candidate_resumes.candidate_id
        AND c.approval_status = 'approved'::"ApprovalStatus"
    )
  );

CREATE POLICY "candidate_resumes_select_mis"
  ON public.candidate_resumes
  FOR SELECT
  TO authenticated
  USING (is_mis_user());

CREATE POLICY "candidate_resumes_insert_own"
  ON public.candidate_resumes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM candidates
      WHERE candidates.id = candidate_resumes.candidate_id
        AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "candidate_resumes_update_own"
  ON public.candidate_resumes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM candidates
      WHERE candidates.id = candidate_resumes.candidate_id
        AND candidates.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM candidates
      WHERE candidates.id = candidate_resumes.candidate_id
        AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "candidate_resumes_delete_own"
  ON public.candidate_resumes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM candidates
      WHERE candidates.id = candidate_resumes.candidate_id
        AND candidates.user_id = auth.uid()
    )
  );

-- ============================================================
-- 7. Fix notifications policy — role was 'public' (anon accessible)
-- ============================================================
DROP POLICY IF EXISTS "own_notifications" ON public.notifications;

CREATE POLICY "own_notifications"
  ON public.notifications
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================
-- 8. Revoke anon EXECUTE on SECURITY DEFINER trigger functions
--    These are trigger-only functions, not public RPC endpoints.
--    Anon users should never be able to call them directly.
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.notify_on_invitation_insert() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_invitation_update() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_offer_insert() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_offer_update() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_round_insert() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_on_round_update() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_user(uuid, text, text, text, jsonb) FROM anon;

-- ============================================================
-- 9. Storage: Fix profile-images — remove broad public listing policy
--    The bucket stays public so stored public URLs continue to work.
--    The old "Public can read profile images" policy with role=public
--    allowed anyone to LIST all files (privacy risk).
--    Replace with role-scoped authenticated listing policies.
-- ============================================================
DROP POLICY IF EXISTS "Public can read profile images" ON storage.objects;

-- Candidates and employers can list their own profile image folder
CREATE POLICY "Users can list own profile image"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (
      (storage.foldername(name))[1] IN (
        SELECT (candidates.id)::text FROM candidates
        WHERE candidates.user_id = (SELECT auth.uid())
      )
      OR
      (storage.foldername(name))[1] IN (
        SELECT (employers.id)::text FROM employers
        WHERE employers.user_id = (SELECT auth.uid())
      )
    )
  );

-- Employers can list approved candidate profile image folders
CREATE POLICY "Employers can list approved candidate profile images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND is_employer()
    AND (storage.foldername(name))[1] IN (
      SELECT (candidates.id)::text FROM candidates
      WHERE candidates.approval_status = 'approved'::"ApprovalStatus"
    )
  );

-- MIS can list all profile images
CREATE POLICY "MIS can list all profile images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND is_mis_user()
  );

-- Employers: upload/update/delete own profile image
CREATE POLICY "Employers can upload own profile image"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images'
    AND is_employer()
    AND (storage.foldername(name))[1] IN (
      SELECT (employers.id)::text FROM employers
      WHERE employers.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Employers can update own profile image"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] IN (
      SELECT (employers.id)::text FROM employers
      WHERE employers.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] IN (
      SELECT (employers.id)::text FROM employers
      WHERE employers.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Employers can delete own profile image"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] IN (
      SELECT (employers.id)::text FROM employers
      WHERE employers.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- 10. Storage: Fix company-logos — remove broad anon listing policy
--     Bucket stays public for URL access. Remove the public-role SELECT
--     that allowed anonymous users to list/enumerate all company logos.
-- ============================================================
DROP POLICY IF EXISTS "Public can read company logos" ON storage.objects;

-- Only authenticated users can list company logos
CREATE POLICY "Authenticated can list company logos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'company-logos');

-- ============================================================
-- 11. Storage: Add missing payment-proofs policies
--     payment-proofs bucket had no RLS policies at all for MIS or employer SELECT
-- ============================================================
CREATE POLICY "Employers can upload payment proofs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND is_employer()
  );

CREATE POLICY "Employers can read own payment proofs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND is_employer()
    AND (storage.foldername(name))[1] IN (
      SELECT (employers.company_id)::text FROM employers
      WHERE employers.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "MIS can read all payment proof files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND is_mis_user()
  );

CREATE POLICY "MIS can delete payment proof files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND is_mis_user()
  );
