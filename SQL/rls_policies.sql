-- ============================================================================
-- JobGenie — Complete RLS Policies, Helper Functions, Storage Buckets & Policies
-- ============================================================================
-- Source: jobgenie-web (project oxcmkfejolzcyxhgfdhj) — exported 2026-06-22
--
-- Run this against a target Supabase database to reproduce all Row Level
-- Security policies for the `public` schema and `storage.objects`, plus the
-- storage buckets and the SECURITY DEFINER helper functions the policies rely on.
--
-- SAFE TO RE-RUN: every CREATE POLICY is preceded by a DROP POLICY IF EXISTS,
-- buckets use ON CONFLICT DO UPDATE, functions use CREATE OR REPLACE. No data
-- is dropped or cleared by this script.
--
-- PREREQUISITES on the target DB:
--   * All referenced tables must already exist (run your Prisma migrations /
--     schema first). RLS policies cannot be created on missing tables.
--   * The `auth` schema (auth.uid()) exists (standard on every Supabase project).
--   * The "ApprovalStatus" and "JobStatus" enum types must exist (created by
--     your Prisma schema).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Helper functions (SECURITY DEFINER) used inside the policies
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_candidate()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.candidates WHERE user_id = (SELECT auth.uid())
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_employer()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.employers WHERE user_id = (SELECT auth.uid())
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_mis_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.mis_user WHERE user_id = (SELECT auth.uid())
  );
$function$;

-- Account & Security → "Active Sessions" reads/revokes the signed-in user's own
-- auth.sessions rows. SECURITY DEFINER so an authenticated user can see only their
-- own sessions without direct access to the auth schema.
-- (Used by GET/DELETE /api/user/sessions.)
CREATE OR REPLACE FUNCTION public.get_my_sessions()
 RETURNS TABLE (
   id uuid,
   user_agent text,
   ip text,
   created_at timestamptz,
   updated_at timestamptz,
   not_after timestamptz
 )
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT s.id, s.user_agent, host(s.ip)::text, s.created_at, s.updated_at, s.not_after
  FROM auth.sessions s
  WHERE s.user_id = (SELECT auth.uid())
  ORDER BY s.updated_at DESC NULLS LAST;
$function$;

CREATE OR REPLACE FUNCTION public.delete_my_session(session_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  DELETE FROM auth.sessions
  WHERE id = session_id AND user_id = (SELECT auth.uid());
$function$;

REVOKE ALL ON FUNCTION public.get_my_sessions()        FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_my_session(uuid)  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_sessions()       TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_my_session(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. Enable RLS on all public tables that have it enabled in source
-- ----------------------------------------------------------------------------

ALTER TABLE public.api_request_logs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awards                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banking_academic_education      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banking_professional_education  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banking_specialized_training    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_resumes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educations                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employers                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_logs                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_academic_education      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_professional_education  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industries                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_specializations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_reminder_sent         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_rounds                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_designations                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_invitations                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offers                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs                            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_interview_reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_permissions                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_role_permissions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_roles                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_sidebar_visibility_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_user                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_bank_details            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_pricing                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_types                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seniority_levels                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_experiences                ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. Public-schema RLS policies
-- ----------------------------------------------------------------------------

-- api_request_logs
-- Logs are written via the service-role admin client (RLS-bypassing), so no
-- authenticated INSERT policy is needed. The permissive WITH CHECK (true) policy
-- was removed in security_hardening_2026_06.sql.
DROP POLICY IF EXISTS "Authenticated can insert api request logs" ON public.api_request_logs;
DROP POLICY IF EXISTS "MIS can read api request logs" ON public.api_request_logs;
CREATE POLICY "MIS can read api request logs" ON public.api_request_logs AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- awards
DROP POLICY IF EXISTS "Candidates can delete own awards" ON public.awards;
CREATE POLICY "Candidates can delete own awards" ON public.awards AS PERMISSIVE FOR DELETE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can insert own awards" ON public.awards;
CREATE POLICY "Candidates can insert own awards" ON public.awards AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can update own awards" ON public.awards;
CREATE POLICY "Candidates can update own awards" ON public.awards AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))))
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can view own awards" ON public.awards;
CREATE POLICY "Candidates can view own awards" ON public.awards AS PERMISSIVE FOR SELECT TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Employers can view approved candidate awards" ON public.awards;
CREATE POLICY "Employers can view approved candidate awards" ON public.awards AS PERMISSIVE FOR SELECT TO authenticated
  USING (((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.approval_status = 'approved'::"ApprovalStatus"))) AND is_employer()));
DROP POLICY IF EXISTS "MIS can view all awards" ON public.awards;
CREATE POLICY "MIS can view all awards" ON public.awards AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- banking_academic_education
DROP POLICY IF EXISTS "Candidates can delete own banking academic education" ON public.banking_academic_education;
CREATE POLICY "Candidates can delete own banking academic education" ON public.banking_academic_education AS PERMISSIVE FOR DELETE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can insert own banking academic education" ON public.banking_academic_education;
CREATE POLICY "Candidates can insert own banking academic education" ON public.banking_academic_education AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can update own banking academic education" ON public.banking_academic_education;
CREATE POLICY "Candidates can update own banking academic education" ON public.banking_academic_education AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))))
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can view own banking academic education" ON public.banking_academic_education;
CREATE POLICY "Candidates can view own banking academic education" ON public.banking_academic_education AS PERMISSIVE FOR SELECT TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Employers can view approved candidate banking academic educatio" ON public.banking_academic_education;
CREATE POLICY "Employers can view approved candidate banking academic educatio" ON public.banking_academic_education AS PERMISSIVE FOR SELECT TO authenticated
  USING (((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.approval_status = 'approved'::"ApprovalStatus"))) AND is_employer()));
DROP POLICY IF EXISTS "MIS can view all banking academic education" ON public.banking_academic_education;
CREATE POLICY "MIS can view all banking academic education" ON public.banking_academic_education AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- banking_professional_education
DROP POLICY IF EXISTS "Candidates can delete own banking professional education" ON public.banking_professional_education;
CREATE POLICY "Candidates can delete own banking professional education" ON public.banking_professional_education AS PERMISSIVE FOR DELETE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can insert own banking professional education" ON public.banking_professional_education;
CREATE POLICY "Candidates can insert own banking professional education" ON public.banking_professional_education AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can update own banking professional education" ON public.banking_professional_education;
CREATE POLICY "Candidates can update own banking professional education" ON public.banking_professional_education AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))))
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can view own banking professional education" ON public.banking_professional_education;
CREATE POLICY "Candidates can view own banking professional education" ON public.banking_professional_education AS PERMISSIVE FOR SELECT TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Employers can view approved candidate banking professional educ" ON public.banking_professional_education;
CREATE POLICY "Employers can view approved candidate banking professional educ" ON public.banking_professional_education AS PERMISSIVE FOR SELECT TO authenticated
  USING (((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.approval_status = 'approved'::"ApprovalStatus"))) AND is_employer()));
DROP POLICY IF EXISTS "MIS can view all banking professional education" ON public.banking_professional_education;
CREATE POLICY "MIS can view all banking professional education" ON public.banking_professional_education AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- banking_specialized_training
DROP POLICY IF EXISTS "Candidates can delete own banking specialized training" ON public.banking_specialized_training;
CREATE POLICY "Candidates can delete own banking specialized training" ON public.banking_specialized_training AS PERMISSIVE FOR DELETE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can insert own banking specialized training" ON public.banking_specialized_training;
CREATE POLICY "Candidates can insert own banking specialized training" ON public.banking_specialized_training AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can update own banking specialized training" ON public.banking_specialized_training;
CREATE POLICY "Candidates can update own banking specialized training" ON public.banking_specialized_training AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))))
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can view own banking specialized training" ON public.banking_specialized_training;
CREATE POLICY "Candidates can view own banking specialized training" ON public.banking_specialized_training AS PERMISSIVE FOR SELECT TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Employers can view approved candidate banking specialized train" ON public.banking_specialized_training;
CREATE POLICY "Employers can view approved candidate banking specialized train" ON public.banking_specialized_training AS PERMISSIVE FOR SELECT TO authenticated
  USING (((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.approval_status = 'approved'::"ApprovalStatus"))) AND is_employer()));
DROP POLICY IF EXISTS "MIS can view all banking specialized training" ON public.banking_specialized_training;
CREATE POLICY "MIS can view all banking specialized training" ON public.banking_specialized_training AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- candidate_resumes
DROP POLICY IF EXISTS candidate_resumes_delete_own ON public.candidate_resumes;
CREATE POLICY candidate_resumes_delete_own ON public.candidate_resumes AS PERMISSIVE FOR DELETE TO public
  USING ((EXISTS ( SELECT 1 FROM candidates WHERE ((candidates.id = candidate_resumes.candidate_id) AND (candidates.user_id = auth.uid())))));
DROP POLICY IF EXISTS candidate_resumes_insert_own ON public.candidate_resumes;
CREATE POLICY candidate_resumes_insert_own ON public.candidate_resumes AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1 FROM candidates WHERE ((candidates.id = candidate_resumes.candidate_id) AND (candidates.user_id = auth.uid())))));
DROP POLICY IF EXISTS candidate_resumes_select_employer ON public.candidate_resumes;
CREATE POLICY candidate_resumes_select_employer ON public.candidate_resumes AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1 FROM (candidates c JOIN employers e ON ((e.user_id = auth.uid()))) WHERE ((c.id = candidate_resumes.candidate_id) AND (c.approval_status = 'approved'::"ApprovalStatus")))));
DROP POLICY IF EXISTS candidate_resumes_select_mis ON public.candidate_resumes;
CREATE POLICY candidate_resumes_select_mis ON public.candidate_resumes AS PERMISSIVE FOR SELECT TO public
  USING (is_mis_user());
DROP POLICY IF EXISTS candidate_resumes_select_own ON public.candidate_resumes;
CREATE POLICY candidate_resumes_select_own ON public.candidate_resumes AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1 FROM candidates WHERE ((candidates.id = candidate_resumes.candidate_id) AND (candidates.user_id = auth.uid())))));
DROP POLICY IF EXISTS candidate_resumes_update_own ON public.candidate_resumes;
CREATE POLICY candidate_resumes_update_own ON public.candidate_resumes AS PERMISSIVE FOR UPDATE TO public
  USING ((EXISTS ( SELECT 1 FROM candidates WHERE ((candidates.id = candidate_resumes.candidate_id) AND (candidates.user_id = auth.uid())))));

-- candidates
DROP POLICY IF EXISTS "Candidates can delete own profile" ON public.candidates;
CREATE POLICY "Candidates can delete own profile" ON public.candidates AS PERMISSIVE FOR DELETE TO authenticated
  USING ((user_id = ( SELECT auth.uid() AS uid)));
DROP POLICY IF EXISTS "Candidates can insert own profile" ON public.candidates;
CREATE POLICY "Candidates can insert own profile" ON public.candidates AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
DROP POLICY IF EXISTS "Candidates can update own profile" ON public.candidates;
CREATE POLICY "Candidates can update own profile" ON public.candidates AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));
DROP POLICY IF EXISTS "Candidates can view own profile" ON public.candidates;
CREATE POLICY "Candidates can view own profile" ON public.candidates AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id = ( SELECT auth.uid() AS uid)));
DROP POLICY IF EXISTS "Employers can view approved candidates" ON public.candidates;
CREATE POLICY "Employers can view approved candidates" ON public.candidates AS PERMISSIVE FOR SELECT TO authenticated
  USING (((approval_status = 'approved'::"ApprovalStatus") AND is_employer()));
DROP POLICY IF EXISTS "MIS can update any candidate" ON public.candidates;
CREATE POLICY "MIS can update any candidate" ON public.candidates AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_mis_user())
  WITH CHECK (is_mis_user());
DROP POLICY IF EXISTS "MIS can view all candidates" ON public.candidates;
CREATE POLICY "MIS can view all candidates" ON public.candidates AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- certificates
DROP POLICY IF EXISTS "Candidates can delete own certificates" ON public.certificates;
CREATE POLICY "Candidates can delete own certificates" ON public.certificates AS PERMISSIVE FOR DELETE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can insert own certificates" ON public.certificates;
CREATE POLICY "Candidates can insert own certificates" ON public.certificates AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can update own certificates" ON public.certificates;
CREATE POLICY "Candidates can update own certificates" ON public.certificates AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))))
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can view own certificates" ON public.certificates;
CREATE POLICY "Candidates can view own certificates" ON public.certificates AS PERMISSIVE FOR SELECT TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Employers can view approved candidate certificates" ON public.certificates;
CREATE POLICY "Employers can view approved candidate certificates" ON public.certificates AS PERMISSIVE FOR SELECT TO authenticated
  USING (((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.approval_status = 'approved'::"ApprovalStatus"))) AND is_employer()));
DROP POLICY IF EXISTS "MIS can view all certificates" ON public.certificates;
CREATE POLICY "MIS can view all certificates" ON public.certificates AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- companies
DROP POLICY IF EXISTS "Candidates can view companies" ON public.companies;
CREATE POLICY "Candidates can view companies" ON public.companies AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_candidate());
DROP POLICY IF EXISTS "Employers can delete own company" ON public.companies;
CREATE POLICY "Employers can delete own company" ON public.companies AS PERMISSIVE FOR DELETE TO authenticated
  USING ((id IN ( SELECT employers.company_id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Employers can insert company" ON public.companies;
CREATE POLICY "Employers can insert company" ON public.companies AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (is_employer());
DROP POLICY IF EXISTS "Employers can update own company" ON public.companies;
CREATE POLICY "Employers can update own company" ON public.companies AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((id IN ( SELECT employers.company_id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid)))))
  WITH CHECK ((id IN ( SELECT employers.company_id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Employers can view own company" ON public.companies;
CREATE POLICY "Employers can view own company" ON public.companies AS PERMISSIVE FOR SELECT TO authenticated
  USING ((id IN ( SELECT employers.company_id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "MIS can update any company" ON public.companies;
CREATE POLICY "MIS can update any company" ON public.companies AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_mis_user())
  WITH CHECK (is_mis_user());
DROP POLICY IF EXISTS "MIS can view all companies" ON public.companies;
CREATE POLICY "MIS can view all companies" ON public.companies AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- educations
DROP POLICY IF EXISTS "Candidates can delete own educations" ON public.educations;
CREATE POLICY "Candidates can delete own educations" ON public.educations AS PERMISSIVE FOR DELETE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can insert own educations" ON public.educations;
CREATE POLICY "Candidates can insert own educations" ON public.educations AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can update own educations" ON public.educations;
CREATE POLICY "Candidates can update own educations" ON public.educations AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))))
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can view own educations" ON public.educations;
CREATE POLICY "Candidates can view own educations" ON public.educations AS PERMISSIVE FOR SELECT TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Employers can view approved candidate educations" ON public.educations;
CREATE POLICY "Employers can view approved candidate educations" ON public.educations AS PERMISSIVE FOR SELECT TO authenticated
  USING (((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.approval_status = 'approved'::"ApprovalStatus"))) AND is_employer()));
DROP POLICY IF EXISTS "MIS can view all educations" ON public.educations;
CREATE POLICY "MIS can view all educations" ON public.educations AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- employers
DROP POLICY IF EXISTS "Candidates can view employers via invitations" ON public.employers;
CREATE POLICY "Candidates can view employers via invitations" ON public.employers AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_candidate());
DROP POLICY IF EXISTS "Employers can delete own profile" ON public.employers;
CREATE POLICY "Employers can delete own profile" ON public.employers AS PERMISSIVE FOR DELETE TO authenticated
  USING ((user_id = ( SELECT auth.uid() AS uid)));
DROP POLICY IF EXISTS "Employers can insert own profile" ON public.employers;
CREATE POLICY "Employers can insert own profile" ON public.employers AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
DROP POLICY IF EXISTS "Employers can update own profile" ON public.employers;
CREATE POLICY "Employers can update own profile" ON public.employers AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));
DROP POLICY IF EXISTS "Employers can view own profile" ON public.employers;
CREATE POLICY "Employers can view own profile" ON public.employers AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id = ( SELECT auth.uid() AS uid)));
DROP POLICY IF EXISTS "MIS can update any employer" ON public.employers;
CREATE POLICY "MIS can update any employer" ON public.employers AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_mis_user())
  WITH CHECK (is_mis_user());
DROP POLICY IF EXISTS "MIS can view all employers" ON public.employers;
CREATE POLICY "MIS can view all employers" ON public.employers AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- error_logs
-- Written via admin client; permissive INSERT policy removed (security_hardening_2026_06.sql).
DROP POLICY IF EXISTS "Authenticated can insert error logs" ON public.error_logs;
DROP POLICY IF EXISTS "MIS can read error logs" ON public.error_logs;
CREATE POLICY "MIS can read error logs" ON public.error_logs AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- event_logs
-- Written via admin client; permissive INSERT policy removed (security_hardening_2026_06.sql).
DROP POLICY IF EXISTS "Authenticated can insert event logs" ON public.event_logs;
DROP POLICY IF EXISTS "MIS can read event logs" ON public.event_logs;
CREATE POLICY "MIS can read event logs" ON public.event_logs AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- finance_academic_education
DROP POLICY IF EXISTS "Candidates can delete own finance academic education" ON public.finance_academic_education;
CREATE POLICY "Candidates can delete own finance academic education" ON public.finance_academic_education AS PERMISSIVE FOR DELETE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can insert own finance academic education" ON public.finance_academic_education;
CREATE POLICY "Candidates can insert own finance academic education" ON public.finance_academic_education AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can update own finance academic education" ON public.finance_academic_education;
CREATE POLICY "Candidates can update own finance academic education" ON public.finance_academic_education AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))))
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can view own finance academic education" ON public.finance_academic_education;
CREATE POLICY "Candidates can view own finance academic education" ON public.finance_academic_education AS PERMISSIVE FOR SELECT TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Employers can view approved candidate finance academic educatio" ON public.finance_academic_education;
CREATE POLICY "Employers can view approved candidate finance academic educatio" ON public.finance_academic_education AS PERMISSIVE FOR SELECT TO authenticated
  USING (((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.approval_status = 'approved'::"ApprovalStatus"))) AND is_employer()));
DROP POLICY IF EXISTS "MIS can view all finance academic education" ON public.finance_academic_education;
CREATE POLICY "MIS can view all finance academic education" ON public.finance_academic_education AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- finance_professional_education
DROP POLICY IF EXISTS "Candidates can delete own finance professional education" ON public.finance_professional_education;
CREATE POLICY "Candidates can delete own finance professional education" ON public.finance_professional_education AS PERMISSIVE FOR DELETE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can insert own finance professional education" ON public.finance_professional_education;
CREATE POLICY "Candidates can insert own finance professional education" ON public.finance_professional_education AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can update own finance professional education" ON public.finance_professional_education;
CREATE POLICY "Candidates can update own finance professional education" ON public.finance_professional_education AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))))
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can view own finance professional education" ON public.finance_professional_education;
CREATE POLICY "Candidates can view own finance professional education" ON public.finance_professional_education AS PERMISSIVE FOR SELECT TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Employers can view approved candidate finance professional educ" ON public.finance_professional_education;
CREATE POLICY "Employers can view approved candidate finance professional educ" ON public.finance_professional_education AS PERMISSIVE FOR SELECT TO authenticated
  USING (((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.approval_status = 'approved'::"ApprovalStatus"))) AND is_employer()));
DROP POLICY IF EXISTS "MIS can view all finance professional education" ON public.finance_professional_education;
CREATE POLICY "MIS can view all finance professional education" ON public.finance_professional_education AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- industries
DROP POLICY IF EXISTS "Anyone can read industries" ON public.industries;
CREATE POLICY "Anyone can read industries" ON public.industries AS PERMISSIVE FOR SELECT TO authenticated, anon
  USING (true);

-- industry_specializations
DROP POLICY IF EXISTS "Candidates can delete own industry specializations" ON public.industry_specializations;
CREATE POLICY "Candidates can delete own industry specializations" ON public.industry_specializations AS PERMISSIVE FOR DELETE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can insert own industry specializations" ON public.industry_specializations;
CREATE POLICY "Candidates can insert own industry specializations" ON public.industry_specializations AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can update own industry specializations" ON public.industry_specializations;
CREATE POLICY "Candidates can update own industry specializations" ON public.industry_specializations AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))))
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can view own industry specializations" ON public.industry_specializations;
CREATE POLICY "Candidates can view own industry specializations" ON public.industry_specializations AS PERMISSIVE FOR SELECT TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Employers can view approved candidate specializations" ON public.industry_specializations;
CREATE POLICY "Employers can view approved candidate specializations" ON public.industry_specializations AS PERMISSIVE FOR SELECT TO authenticated
  USING (((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.approval_status = 'approved'::"ApprovalStatus"))) AND is_employer()));
DROP POLICY IF EXISTS "MIS can view all specializations" ON public.industry_specializations;
CREATE POLICY "MIS can view all specializations" ON public.industry_specializations AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- interview_reminder_sent
DROP POLICY IF EXISTS "MIS full access reminder sent" ON public.interview_reminder_sent;
CREATE POLICY "MIS full access reminder sent" ON public.interview_reminder_sent AS PERMISSIVE FOR ALL TO authenticated
  USING (is_mis_user())
  WITH CHECK (is_mis_user());

-- interview_rounds
DROP POLICY IF EXISTS "Candidates can update own interview rounds" ON public.interview_rounds;
CREATE POLICY "Candidates can update own interview rounds" ON public.interview_rounds AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((EXISTS ( SELECT 1 FROM (job_invitations ji JOIN candidates c ON ((c.id = ji.candidate_id))) WHERE ((ji.id = interview_rounds.invitation_id) AND (c.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM (job_invitations ji JOIN candidates c ON ((c.id = ji.candidate_id))) WHERE ((ji.id = interview_rounds.invitation_id) AND (c.user_id = auth.uid())))));
DROP POLICY IF EXISTS "Candidates can view own interview rounds" ON public.interview_rounds;
CREATE POLICY "Candidates can view own interview rounds" ON public.interview_rounds AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1 FROM (job_invitations ji JOIN candidates c ON ((c.id = ji.candidate_id))) WHERE ((ji.id = interview_rounds.invitation_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))));
DROP POLICY IF EXISTS "Employers can create interview rounds" ON public.interview_rounds;
CREATE POLICY "Employers can create interview rounds" ON public.interview_rounds AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1 FROM (job_invitations ji JOIN employers e ON ((e.id = ji.employer_id))) WHERE ((ji.id = interview_rounds.invitation_id) AND (e.user_id = auth.uid())))));
DROP POLICY IF EXISTS "Employers can update interview rounds" ON public.interview_rounds;
CREATE POLICY "Employers can update interview rounds" ON public.interview_rounds AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((EXISTS ( SELECT 1 FROM (job_invitations ji JOIN employers e ON ((e.id = ji.employer_id))) WHERE ((ji.id = interview_rounds.invitation_id) AND (e.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM (job_invitations ji JOIN employers e ON ((e.id = ji.employer_id))) WHERE ((ji.id = interview_rounds.invitation_id) AND (e.user_id = auth.uid())))));
DROP POLICY IF EXISTS "Employers can view related interview rounds" ON public.interview_rounds;
CREATE POLICY "Employers can view related interview rounds" ON public.interview_rounds AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1 FROM (job_invitations ji JOIN employers e ON ((e.id = ji.employer_id))) WHERE ((ji.id = interview_rounds.invitation_id) AND (e.user_id = ( SELECT auth.uid() AS uid))))));
DROP POLICY IF EXISTS "MIS full access interview_rounds" ON public.interview_rounds;
CREATE POLICY "MIS full access interview_rounds" ON public.interview_rounds AS PERMISSIVE FOR ALL TO authenticated
  USING (is_mis_user())
  WITH CHECK (is_mis_user());

-- job_applications
DROP POLICY IF EXISTS candidates_own_applications ON public.job_applications;
CREATE POLICY candidates_own_applications ON public.job_applications AS PERMISSIVE FOR ALL TO public
  USING ((candidate_id = ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = auth.uid()))));
DROP POLICY IF EXISTS employers_job_applications ON public.job_applications;
CREATE POLICY employers_job_applications ON public.job_applications AS PERMISSIVE FOR SELECT TO public
  USING ((job_id IN ( SELECT j.id FROM (jobs j JOIN employers e ON ((e.company_id = j.company_id))) WHERE (e.user_id = auth.uid()))));

-- job_designations
DROP POLICY IF EXISTS "Anyone can read job designations" ON public.job_designations;
CREATE POLICY "Anyone can read job designations" ON public.job_designations AS PERMISSIVE FOR SELECT TO authenticated, anon
  USING (true);

-- job_invitations
DROP POLICY IF EXISTS "Candidates can update own invitations" ON public.job_invitations;
CREATE POLICY "Candidates can update own invitations" ON public.job_invitations AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))))
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can view own invitations" ON public.job_invitations;
CREATE POLICY "Candidates can view own invitations" ON public.job_invitations AS PERMISSIVE FOR SELECT TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Employers can create invitations" ON public.job_invitations;
CREATE POLICY "Employers can create invitations" ON public.job_invitations AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((employer_id IN ( SELECT employers.id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid)))) AND (company_id IN ( SELECT employers.company_id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid))))));
DROP POLICY IF EXISTS "Employers can update company invitations" ON public.job_invitations;
CREATE POLICY "Employers can update company invitations" ON public.job_invitations AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((company_id IN ( SELECT employers.company_id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid)))))
  WITH CHECK ((company_id IN ( SELECT employers.company_id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Employers can view company invitations" ON public.job_invitations;
CREATE POLICY "Employers can view company invitations" ON public.job_invitations AS PERMISSIVE FOR SELECT TO authenticated
  USING ((company_id IN ( SELECT employers.company_id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "MIS can update all invitations" ON public.job_invitations;
CREATE POLICY "MIS can update all invitations" ON public.job_invitations AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_mis_user())
  WITH CHECK (is_mis_user());
DROP POLICY IF EXISTS "MIS can view all invitations" ON public.job_invitations;
CREATE POLICY "MIS can view all invitations" ON public.job_invitations AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- job_offers
DROP POLICY IF EXISTS "Candidates can update own job offers" ON public.job_offers;
CREATE POLICY "Candidates can update own job offers" ON public.job_offers AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((EXISTS ( SELECT 1 FROM (job_invitations ji JOIN candidates c ON ((c.id = ji.candidate_id))) WHERE ((ji.id = job_offers.invitation_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM (job_invitations ji JOIN candidates c ON ((c.id = ji.candidate_id))) WHERE ((ji.id = job_offers.invitation_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))));
DROP POLICY IF EXISTS "Candidates can view own job offers" ON public.job_offers;
CREATE POLICY "Candidates can view own job offers" ON public.job_offers AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1 FROM (job_invitations ji JOIN candidates c ON ((c.id = ji.candidate_id))) WHERE ((ji.id = job_offers.invitation_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))));
DROP POLICY IF EXISTS "Employers can create job offers" ON public.job_offers;
CREATE POLICY "Employers can create job offers" ON public.job_offers AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1 FROM (job_invitations ji JOIN employers e ON ((e.id = ji.employer_id))) WHERE ((ji.id = job_offers.invitation_id) AND (e.user_id = auth.uid())))));
DROP POLICY IF EXISTS "Employers can update job offers" ON public.job_offers;
CREATE POLICY "Employers can update job offers" ON public.job_offers AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((EXISTS ( SELECT 1 FROM (job_invitations ji JOIN employers e ON ((e.id = ji.employer_id))) WHERE ((ji.id = job_offers.invitation_id) AND (e.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1 FROM (job_invitations ji JOIN employers e ON ((e.id = ji.employer_id))) WHERE ((ji.id = job_offers.invitation_id) AND (e.user_id = auth.uid())))));
DROP POLICY IF EXISTS "Employers can view own job offers" ON public.job_offers;
CREATE POLICY "Employers can view own job offers" ON public.job_offers AS PERMISSIVE FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1 FROM (job_invitations ji JOIN employers e ON ((e.id = ji.employer_id))) WHERE ((ji.id = job_offers.invitation_id) AND (e.user_id = ( SELECT auth.uid() AS uid))))));
DROP POLICY IF EXISTS "MIS full access job_offers" ON public.job_offers;
CREATE POLICY "MIS full access job_offers" ON public.job_offers AS PERMISSIVE FOR ALL TO authenticated
  USING (is_mis_user())
  WITH CHECK (is_mis_user());

-- jobs
DROP POLICY IF EXISTS "Candidates can view published jobs" ON public.jobs;
CREATE POLICY "Candidates can view published jobs" ON public.jobs AS PERMISSIVE FOR SELECT TO authenticated
  USING (((status = 'published'::"JobStatus") AND is_candidate()));
DROP POLICY IF EXISTS "Employers can delete own jobs" ON public.jobs;
CREATE POLICY "Employers can delete own jobs" ON public.jobs AS PERMISSIVE FOR DELETE TO authenticated
  USING ((employer_id IN ( SELECT employers.id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Employers can insert jobs" ON public.jobs;
CREATE POLICY "Employers can insert jobs" ON public.jobs AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((employer_id IN ( SELECT employers.id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Employers can update own jobs" ON public.jobs;
CREATE POLICY "Employers can update own jobs" ON public.jobs AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((employer_id IN ( SELECT employers.id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid)))))
  WITH CHECK ((employer_id IN ( SELECT employers.id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Employers can view own jobs" ON public.jobs;
CREATE POLICY "Employers can view own jobs" ON public.jobs AS PERMISSIVE FOR SELECT TO authenticated
  USING ((employer_id IN ( SELECT employers.id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "MIS can update any job" ON public.jobs;
CREATE POLICY "MIS can update any job" ON public.jobs AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_mis_user())
  WITH CHECK (is_mis_user());
DROP POLICY IF EXISTS "MIS can view all jobs" ON public.jobs;
CREATE POLICY "MIS can view all jobs" ON public.jobs AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- mis_interview_reminder_settings
DROP POLICY IF EXISTS "MIS full access reminder settings" ON public.mis_interview_reminder_settings;
CREATE POLICY "MIS full access reminder settings" ON public.mis_interview_reminder_settings AS PERMISSIVE FOR ALL TO authenticated
  USING (is_mis_user())
  WITH CHECK (is_mis_user());

-- mis_permissions
DROP POLICY IF EXISTS "MIS can read permissions" ON public.mis_permissions;
CREATE POLICY "MIS can read permissions" ON public.mis_permissions AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- mis_role_permissions
DROP POLICY IF EXISTS "MIS can read role permissions" ON public.mis_role_permissions;
CREATE POLICY "MIS can read role permissions" ON public.mis_role_permissions AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- mis_roles
DROP POLICY IF EXISTS "MIS can read roles" ON public.mis_roles;
CREATE POLICY "MIS can read roles" ON public.mis_roles AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- mis_sidebar_visibility_settings
DROP POLICY IF EXISTS "MIS can delete sidebar visibility settings" ON public.mis_sidebar_visibility_settings;
CREATE POLICY "MIS can delete sidebar visibility settings" ON public.mis_sidebar_visibility_settings AS PERMISSIVE FOR DELETE TO authenticated
  USING (is_mis_user());
DROP POLICY IF EXISTS "MIS can insert sidebar visibility settings" ON public.mis_sidebar_visibility_settings;
CREATE POLICY "MIS can insert sidebar visibility settings" ON public.mis_sidebar_visibility_settings AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (is_mis_user());
DROP POLICY IF EXISTS "MIS can read sidebar visibility settings" ON public.mis_sidebar_visibility_settings;
CREATE POLICY "MIS can read sidebar visibility settings" ON public.mis_sidebar_visibility_settings AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());
DROP POLICY IF EXISTS "MIS can update sidebar visibility settings" ON public.mis_sidebar_visibility_settings;
CREATE POLICY "MIS can update sidebar visibility settings" ON public.mis_sidebar_visibility_settings AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_mis_user())
  WITH CHECK (is_mis_user());

-- mis_user
DROP POLICY IF EXISTS "MIS can insert during invitation" ON public.mis_user;
CREATE POLICY "MIS can insert during invitation" ON public.mis_user AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
DROP POLICY IF EXISTS "MIS can update own record" ON public.mis_user;
CREATE POLICY "MIS can update own record" ON public.mis_user AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((user_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));
DROP POLICY IF EXISTS "MIS can view all MIS users" ON public.mis_user;
CREATE POLICY "MIS can view all MIS users" ON public.mis_user AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());
DROP POLICY IF EXISTS "MIS can view own record" ON public.mis_user;
CREATE POLICY "MIS can view own record" ON public.mis_user AS PERMISSIVE FOR SELECT TO authenticated
  USING ((user_id = ( SELECT auth.uid() AS uid)));

-- notifications
DROP POLICY IF EXISTS own_notifications ON public.notifications;
CREATE POLICY own_notifications ON public.notifications AS PERMISSIVE FOR ALL TO authenticated
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

-- projects
DROP POLICY IF EXISTS "Candidates can delete own projects" ON public.projects;
CREATE POLICY "Candidates can delete own projects" ON public.projects AS PERMISSIVE FOR DELETE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can insert own projects" ON public.projects;
CREATE POLICY "Candidates can insert own projects" ON public.projects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can update own projects" ON public.projects;
CREATE POLICY "Candidates can update own projects" ON public.projects AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))))
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can view own projects" ON public.projects;
CREATE POLICY "Candidates can view own projects" ON public.projects AS PERMISSIVE FOR SELECT TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Employers can view approved candidate projects" ON public.projects;
CREATE POLICY "Employers can view approved candidate projects" ON public.projects AS PERMISSIVE FOR SELECT TO authenticated
  USING (((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.approval_status = 'approved'::"ApprovalStatus"))) AND is_employer()));
DROP POLICY IF EXISTS "MIS can view all projects" ON public.projects;
CREATE POLICY "MIS can view all projects" ON public.projects AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- seniority_levels
DROP POLICY IF EXISTS "Anyone can read seniority levels" ON public.seniority_levels;
CREATE POLICY "Anyone can read seniority levels" ON public.seniority_levels AS PERMISSIVE FOR SELECT TO authenticated, anon
  USING (true);

-- users
DROP POLICY IF EXISTS "MIS can update any user" ON public.users;
CREATE POLICY "MIS can update any user" ON public.users AS PERMISSIVE FOR UPDATE TO authenticated
  USING (is_mis_user())
  WITH CHECK (is_mis_user());
DROP POLICY IF EXISTS "MIS can view all users" ON public.users;
CREATE POLICY "MIS can view all users" ON public.users AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());
DROP POLICY IF EXISTS "Users can insert during registration" ON public.users;
CREATE POLICY "Users can insert during registration" ON public.users AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((( SELECT auth.uid() AS uid) = id));
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
CREATE POLICY "Users can update own record" ON public.users AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((( SELECT auth.uid() AS uid) = id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = id));
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
CREATE POLICY "Users can view own record" ON public.users AS PERMISSIVE FOR SELECT TO authenticated
  USING ((( SELECT auth.uid() AS uid) = id));

-- work_experiences
DROP POLICY IF EXISTS "Candidates can delete own work experiences" ON public.work_experiences;
CREATE POLICY "Candidates can delete own work experiences" ON public.work_experiences AS PERMISSIVE FOR DELETE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can insert own work experiences" ON public.work_experiences;
CREATE POLICY "Candidates can insert own work experiences" ON public.work_experiences AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can update own work experiences" ON public.work_experiences;
CREATE POLICY "Candidates can update own work experiences" ON public.work_experiences AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))))
  WITH CHECK ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Candidates can view own work experiences" ON public.work_experiences;
CREATE POLICY "Candidates can view own work experiences" ON public.work_experiences AS PERMISSIVE FOR SELECT TO authenticated
  USING ((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))));
DROP POLICY IF EXISTS "Employers can view approved candidate work experiences" ON public.work_experiences;
CREATE POLICY "Employers can view approved candidate work experiences" ON public.work_experiences AS PERMISSIVE FOR SELECT TO authenticated
  USING (((candidate_id IN ( SELECT candidates.id FROM candidates WHERE (candidates.approval_status = 'approved'::"ApprovalStatus"))) AND is_employer()));
DROP POLICY IF EXISTS "MIS can view all work experiences" ON public.work_experiences;
CREATE POLICY "MIS can view all work experiences" ON public.work_experiences AS PERMISSIVE FOR SELECT TO authenticated
  USING (is_mis_user());

-- NOTE: payment_bank_details, payment_pricing, payment_proofs, payment_requests,
-- and payment_types have RLS ENABLED but no policies in source (so they are
-- effectively locked to anon/authenticated and only reachable via the service
-- role). RLS was enabled for them in section 2; no policies are added here,
-- matching the source database exactly.

-- ----------------------------------------------------------------------------
-- 4. Storage buckets
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('br-certificates', 'br-certificates', true,  5242880, ARRAY['application/pdf','image/jpeg','image/jpg','image/png','image/webp']),
  ('company-logos',   'company-logos',   true,  5242880, ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp']),
  ('cover-images',    'cover-images',    true,  5242880, ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp']),
  ('payment-proofs',  'payment-proofs',  false, 5242880, ARRAY['application/pdf','image/*']),
  ('profile-images',  'profile-images',  true,  5242880, ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp']),
  ('resume',          'resume',          true,  5242880, ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('resume_copy',     'resume_copy',     true,  5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
  SET public            = EXCLUDED.public,
      file_size_limit   = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- 5. Storage RLS policies (on storage.objects)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anon can upload BR certificate presignup" ON storage.objects;
CREATE POLICY "Anon can upload BR certificate presignup" ON storage.objects AS PERMISSIVE FOR INSERT TO anon
  WITH CHECK (((bucket_id = 'br-certificates'::text) AND ((storage.foldername(name))[1] = 'presignup'::text)));

DROP POLICY IF EXISTS "Authenticated can read own profile image" ON storage.objects;
CREATE POLICY "Authenticated can read own profile image" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING (((bucket_id = 'profile-images'::text) AND (((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid)))) OR ((storage.foldername(name))[1] IN ( SELECT (employers.id)::text AS id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid)))))));

DROP POLICY IF EXISTS "Candidates can delete own profile image" ON storage.objects;
CREATE POLICY "Candidates can delete own profile image" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated
  USING (((bucket_id = 'profile-images'::text) AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "Candidates can delete own resume" ON storage.objects;
CREATE POLICY "Candidates can delete own resume" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated
  USING (((bucket_id = 'resume'::text) AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "Candidates can delete own resume copy" ON storage.objects;
CREATE POLICY "Candidates can delete own resume copy" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated
  USING (((bucket_id = 'resume_copy'::text) AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "Candidates can read own resume" ON storage.objects;
CREATE POLICY "Candidates can read own resume" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING (((bucket_id = 'resume'::text) AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "Candidates can read own resume copy" ON storage.objects;
CREATE POLICY "Candidates can read own resume copy" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING (((bucket_id = 'resume_copy'::text) AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "Candidates can update own profile image" ON storage.objects;
CREATE POLICY "Candidates can update own profile image" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((bucket_id = 'profile-images'::text) AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid))))))
  WITH CHECK (((bucket_id = 'profile-images'::text) AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "Candidates can update own resume" ON storage.objects;
CREATE POLICY "Candidates can update own resume" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((bucket_id = 'resume'::text) AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid))))))
  WITH CHECK (((bucket_id = 'resume'::text) AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "Candidates can update own resume copy" ON storage.objects;
CREATE POLICY "Candidates can update own resume copy" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((bucket_id = 'resume_copy'::text) AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid))))))
  WITH CHECK (((bucket_id = 'resume_copy'::text) AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "Candidates can upload own profile image" ON storage.objects;
CREATE POLICY "Candidates can upload own profile image" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'profile-images'::text) AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "Candidates can upload own resume" ON storage.objects;
CREATE POLICY "Candidates can upload own resume" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'resume'::text) AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "Candidates can upload own resume copy" ON storage.objects;
CREATE POLICY "Candidates can upload own resume copy" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'resume_copy'::text) AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "Employers can delete company logo" ON storage.objects;
CREATE POLICY "Employers can delete company logo" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated
  USING (((bucket_id = 'company-logos'::text) AND is_employer()));

DROP POLICY IF EXISTS "Employers can delete own profile image" ON storage.objects;
CREATE POLICY "Employers can delete own profile image" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated
  USING (((bucket_id = 'profile-images'::text) AND ((storage.foldername(name))[1] IN ( SELECT (employers.id)::text AS id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "Employers can read approved candidate profile images" ON storage.objects;
CREATE POLICY "Employers can read approved candidate profile images" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING (((bucket_id = 'profile-images'::text) AND is_employer() AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.approval_status = 'approved'::"ApprovalStatus")))));

DROP POLICY IF EXISTS "Employers can read approved resume copies" ON storage.objects;
CREATE POLICY "Employers can read approved resume copies" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING (((bucket_id = 'resume_copy'::text) AND is_employer() AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.approval_status = 'approved'::"ApprovalStatus")))));

DROP POLICY IF EXISTS "Employers can read approved resumes" ON storage.objects;
CREATE POLICY "Employers can read approved resumes" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING (((bucket_id = 'resume'::text) AND is_employer() AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.approval_status = 'approved'::"ApprovalStatus")))));

DROP POLICY IF EXISTS "Employers can read own BR certificate" ON storage.objects;
CREATE POLICY "Employers can read own BR certificate" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING (((bucket_id = 'br-certificates'::text) AND is_employer()));

DROP POLICY IF EXISTS "Employers can read own payment proofs" ON storage.objects;
CREATE POLICY "Employers can read own payment proofs" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING (((bucket_id = 'payment-proofs'::text) AND is_employer() AND ((storage.foldername(name))[1] IN ( SELECT (employers.company_id)::text AS company_id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "Employers can update company logo" ON storage.objects;
CREATE POLICY "Employers can update company logo" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((bucket_id = 'company-logos'::text) AND is_employer()))
  WITH CHECK (((bucket_id = 'company-logos'::text) AND is_employer()));

DROP POLICY IF EXISTS "Employers can update own profile image" ON storage.objects;
CREATE POLICY "Employers can update own profile image" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((bucket_id = 'profile-images'::text) AND ((storage.foldername(name))[1] IN ( SELECT (employers.id)::text AS id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid))))))
  WITH CHECK (((bucket_id = 'profile-images'::text) AND ((storage.foldername(name))[1] IN ( SELECT (employers.id)::text AS id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "Employers can upload BR certificate" ON storage.objects;
CREATE POLICY "Employers can upload BR certificate" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'br-certificates'::text) AND is_employer()));

DROP POLICY IF EXISTS "Employers can upload company logo" ON storage.objects;
CREATE POLICY "Employers can upload company logo" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'company-logos'::text) AND is_employer()));

DROP POLICY IF EXISTS "Employers can upload own profile image" ON storage.objects;
CREATE POLICY "Employers can upload own profile image" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'profile-images'::text) AND is_employer() AND ((storage.foldername(name))[1] IN ( SELECT (employers.id)::text AS id FROM employers WHERE (employers.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "Employers can upload payment proofs" ON storage.objects;
CREATE POLICY "Employers can upload payment proofs" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'payment-proofs'::text) AND is_employer()));

DROP POLICY IF EXISTS "MIS can delete payment proof files" ON storage.objects;
CREATE POLICY "MIS can delete payment proof files" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated
  USING (((bucket_id = 'payment-proofs'::text) AND is_mis_user()));

DROP POLICY IF EXISTS "MIS can read all BR certificates" ON storage.objects;
CREATE POLICY "MIS can read all BR certificates" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING (((bucket_id = 'br-certificates'::text) AND is_mis_user()));

DROP POLICY IF EXISTS "MIS can read all payment proofs files" ON storage.objects;
CREATE POLICY "MIS can read all payment proofs files" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING (((bucket_id = 'payment-proofs'::text) AND is_mis_user()));

DROP POLICY IF EXISTS "MIS can read all profile images" ON storage.objects;
CREATE POLICY "MIS can read all profile images" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING (((bucket_id = 'profile-images'::text) AND is_mis_user()));

DROP POLICY IF EXISTS "MIS can read all resume copies" ON storage.objects;
CREATE POLICY "MIS can read all resume copies" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING (((bucket_id = 'resume_copy'::text) AND is_mis_user()));

DROP POLICY IF EXISTS "MIS can read all resumes" ON storage.objects;
CREATE POLICY "MIS can read all resumes" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
  USING (((bucket_id = 'resume'::text) AND is_mis_user()));

-- Broad public SELECT policies on these public buckets were removed in
-- security_hardening_2026_06.sql: they allowed clients to LIST every object.
-- Public buckets still serve individual objects by direct URL without an
-- explicit storage.objects SELECT policy, and all writes use the admin client.
DROP POLICY IF EXISTS "Public can read company logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read profile images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read cover images" ON storage.objects;

DROP POLICY IF EXISTS "Candidates can upload own cover image" ON storage.objects;
CREATE POLICY "Candidates can upload own cover image" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = 'cover-images'::text) AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "Candidates can update own cover image" ON storage.objects;
CREATE POLICY "Candidates can update own cover image" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((bucket_id = 'cover-images'::text) AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid))))))
  WITH CHECK (((bucket_id = 'cover-images'::text) AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid))))));

DROP POLICY IF EXISTS "Candidates can delete own cover image" ON storage.objects;
CREATE POLICY "Candidates can delete own cover image" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated
  USING (((bucket_id = 'cover-images'::text) AND ((storage.foldername(name))[1] IN ( SELECT (candidates.id)::text AS id FROM candidates WHERE (candidates.user_id = ( SELECT auth.uid() AS uid))))));

COMMIT;

-- ============================================================================
-- End of file
-- ============================================================================
