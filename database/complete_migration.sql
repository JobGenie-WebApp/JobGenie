-- =====================================================
-- JobGenie Complete Database Migration
-- =====================================================
-- This file contains all database setup including:
-- 1. Extensions
-- 2. Helper functions (SECURITY DEFINER)
-- 3. Table-level grants
-- 4. Row Level Security (RLS) enablement
-- 5. Performance indexes
-- 6. RLS policies for all tables
-- 7. Notification system (triggers and functions)
-- 8. Storage bucket configuration
-- =====================================================
-- NOTE: Run Prisma migrations first to create tables:
--       prisma migrate deploy
-- Then apply this file for RLS, permissions, and features
-- =====================================================

-- ============================================================
-- PART 1: EXTENSIONS
-- ============================================================

-- Install pg_cron extension for scheduling (interview reminders)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Install pg_net extension for HTTP requests from cron jobs
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant pg_cron schema access to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Comments documenting the purpose
COMMENT ON EXTENSION pg_cron IS 'pg_cron: Job scheduler for PostgreSQL - used for interview reminder scheduling';
COMMENT ON EXTENSION pg_net IS 'pg_net: Async HTTP client for PostgreSQL - used by pg_cron to call Edge Functions';

-- ============================================================
-- PART 2: SECURITY DEFINER HELPER FUNCTIONS
-- ============================================================
-- These bypass RLS on the inner query (runs as function owner),
-- avoiding recursive policy evaluation and PostgREST ABORT.

CREATE OR REPLACE FUNCTION public.is_mis_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.mis_user WHERE user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_candidate()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.candidates WHERE user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_employer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employers WHERE user_id = (SELECT auth.uid())
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_mis_user()  TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_candidate() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_employer()  TO authenticated;

-- ============================================================
-- PART 3: TABLE-LEVEL GRANTS
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users                      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.candidates                 TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.employers                  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.companies                  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.jobs                       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.job_invitations            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.interview_rounds           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.job_offers                 TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mis_user                   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mis_roles                  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mis_permissions            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mis_role_permissions       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.work_experiences           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.educations                 TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.awards                     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.projects                   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.certificates               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.industry_specializations   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.finance_academic_education    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.finance_professional_education TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.banking_academic_education    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.banking_professional_education TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.banking_specialized_training  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mis_interview_reminder_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.interview_reminder_sent    TO authenticated;

-- Log tables: MIS reads; authenticated can insert (service_role bypasses anyway)
GRANT SELECT, INSERT ON TABLE public.event_logs       TO authenticated;
GRANT SELECT, INSERT ON TABLE public.error_logs       TO authenticated;
GRANT SELECT, INSERT ON TABLE public.api_request_logs TO authenticated;

-- Reference / lookup tables
GRANT SELECT ON TABLE public.industries        TO authenticated, anon;
GRANT SELECT ON TABLE public.job_designations  TO authenticated, anon;
GRANT SELECT ON TABLE public.seniority_levels  TO authenticated, anon;

-- ============================================================
-- PART 4: ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE public.users                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employers                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_invitations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_rounds              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offers                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_user                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_roles                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_permissions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_role_permissions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_experiences              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educations                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awards                        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_specializations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_academic_education    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_professional_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banking_academic_education    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banking_professional_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banking_specialized_training  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_logs                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industries                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_designations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seniority_levels              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_interview_reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_reminder_sent       ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 5: PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_candidates_user_id          ON candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_reviewed_by      ON candidates(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_employers_user_id           ON employers(user_id);
CREATE INDEX IF NOT EXISTS idx_job_invitations_candidate_id ON job_invitations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_invitations_employer_id  ON job_invitations(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_invitations_company_id   ON job_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id             ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_interview_rounds_invitation_id ON interview_rounds(invitation_id);
CREATE INDEX IF NOT EXISTS idx_mis_user_user_id             ON mis_user(user_id);

-- ============================================================
-- PART 6: RLS POLICIES
-- ============================================================

-- -----------------------------------------------------------
-- USERS
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own record"            ON users;
DROP POLICY IF EXISTS "Users can insert during registration" ON users;
DROP POLICY IF EXISTS "Users can update own record"          ON users;
DROP POLICY IF EXISTS "MIS can view all users"               ON users;
DROP POLICY IF EXISTS "MIS can update any user"              ON users;

CREATE POLICY "Users can view own record"
    ON users FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert during registration"
    ON users FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own record"
    ON users FOR UPDATE TO authenticated
    USING   ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "MIS can view all users"
    ON users FOR SELECT TO authenticated
    USING (public.is_mis_user());

CREATE POLICY "MIS can update any user"
    ON users FOR UPDATE TO authenticated
    USING   (public.is_mis_user())
    WITH CHECK (public.is_mis_user());

-- -----------------------------------------------------------
-- CANDIDATES
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Candidates can view own profile"   ON candidates;
DROP POLICY IF EXISTS "Candidates can insert own profile" ON candidates;
DROP POLICY IF EXISTS "Candidates can update own profile" ON candidates;
DROP POLICY IF EXISTS "Candidates can delete own profile" ON candidates;
DROP POLICY IF EXISTS "Employers can view approved candidates" ON candidates;
DROP POLICY IF EXISTS "MIS can view all candidates"       ON candidates;
DROP POLICY IF EXISTS "MIS can update any candidate"      ON candidates;

CREATE POLICY "Candidates can view own profile"
    ON candidates FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Candidates can insert own profile"
    ON candidates FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Candidates can update own profile"
    ON candidates FOR UPDATE TO authenticated
    USING   (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Candidates can delete own profile"
    ON candidates FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Employers can view approved candidates"
    ON candidates FOR SELECT TO authenticated
    USING (approval_status = 'approved' AND public.is_employer());

CREATE POLICY "MIS can view all candidates"
    ON candidates FOR SELECT TO authenticated
    USING (public.is_mis_user());

CREATE POLICY "MIS can update any candidate"
    ON candidates FOR UPDATE TO authenticated
    USING   (public.is_mis_user())
    WITH CHECK (public.is_mis_user());

-- -----------------------------------------------------------
-- WORK_EXPERIENCES
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Candidates can view own work experiences"              ON work_experiences;
DROP POLICY IF EXISTS "Candidates can insert own work experiences"            ON work_experiences;
DROP POLICY IF EXISTS "Candidates can update own work experiences"            ON work_experiences;
DROP POLICY IF EXISTS "Candidates can delete own work experiences"            ON work_experiences;
DROP POLICY IF EXISTS "Employers can view approved candidate work experiences" ON work_experiences;
DROP POLICY IF EXISTS "MIS can view all work experiences"                     ON work_experiences;

CREATE POLICY "Candidates can view own work experiences"
    ON work_experiences FOR SELECT TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can insert own work experiences"
    ON work_experiences FOR INSERT TO authenticated
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can update own work experiences"
    ON work_experiences FOR UPDATE TO authenticated
    USING   (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())))
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can delete own work experiences"
    ON work_experiences FOR DELETE TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Employers can view approved candidate work experiences"
    ON work_experiences FOR SELECT TO authenticated
    USING (
        candidate_id IN (SELECT id FROM candidates WHERE approval_status = 'approved')
        AND public.is_employer()
    );

CREATE POLICY "MIS can view all work experiences"
    ON work_experiences FOR SELECT TO authenticated
    USING (public.is_mis_user());

-- -----------------------------------------------------------
-- EDUCATIONS
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Candidates can view own educations"              ON educations;
DROP POLICY IF EXISTS "Candidates can insert own educations"            ON educations;
DROP POLICY IF EXISTS "Candidates can update own educations"            ON educations;
DROP POLICY IF EXISTS "Candidates can delete own educations"            ON educations;
DROP POLICY IF EXISTS "Employers can view approved candidate educations" ON educations;
DROP POLICY IF EXISTS "MIS can view all educations"                     ON educations;

CREATE POLICY "Candidates can view own educations"
    ON educations FOR SELECT TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can insert own educations"
    ON educations FOR INSERT TO authenticated
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can update own educations"
    ON educations FOR UPDATE TO authenticated
    USING   (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())))
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can delete own educations"
    ON educations FOR DELETE TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Employers can view approved candidate educations"
    ON educations FOR SELECT TO authenticated
    USING (
        candidate_id IN (SELECT id FROM candidates WHERE approval_status = 'approved')
        AND public.is_employer()
    );

CREATE POLICY "MIS can view all educations"
    ON educations FOR SELECT TO authenticated
    USING (public.is_mis_user());

-- -----------------------------------------------------------
-- AWARDS
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Candidates can view own awards"              ON awards;
DROP POLICY IF EXISTS "Candidates can insert own awards"            ON awards;
DROP POLICY IF EXISTS "Candidates can update own awards"            ON awards;
DROP POLICY IF EXISTS "Candidates can delete own awards"            ON awards;
DROP POLICY IF EXISTS "Employers can view approved candidate awards" ON awards;
DROP POLICY IF EXISTS "MIS can view all awards"                     ON awards;

CREATE POLICY "Candidates can view own awards"
    ON awards FOR SELECT TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can insert own awards"
    ON awards FOR INSERT TO authenticated
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can update own awards"
    ON awards FOR UPDATE TO authenticated
    USING   (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())))
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can delete own awards"
    ON awards FOR DELETE TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Employers can view approved candidate awards"
    ON awards FOR SELECT TO authenticated
    USING (
        candidate_id IN (SELECT id FROM candidates WHERE approval_status = 'approved')
        AND public.is_employer()
    );

CREATE POLICY "MIS can view all awards"
    ON awards FOR SELECT TO authenticated
    USING (public.is_mis_user());

-- -----------------------------------------------------------
-- PROJECTS
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Candidates can view own projects"              ON projects;
DROP POLICY IF EXISTS "Candidates can insert own projects"            ON projects;
DROP POLICY IF EXISTS "Candidates can update own projects"            ON projects;
DROP POLICY IF EXISTS "Candidates can delete own projects"            ON projects;
DROP POLICY IF EXISTS "Employers can view approved candidate projects" ON projects;
DROP POLICY IF EXISTS "MIS can view all projects"                     ON projects;

CREATE POLICY "Candidates can view own projects"
    ON projects FOR SELECT TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can insert own projects"
    ON projects FOR INSERT TO authenticated
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can update own projects"
    ON projects FOR UPDATE TO authenticated
    USING   (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())))
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can delete own projects"
    ON projects FOR DELETE TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Employers can view approved candidate projects"
    ON projects FOR SELECT TO authenticated
    USING (
        candidate_id IN (SELECT id FROM candidates WHERE approval_status = 'approved')
        AND public.is_employer()
    );

CREATE POLICY "MIS can view all projects"
    ON projects FOR SELECT TO authenticated
    USING (public.is_mis_user());

-- -----------------------------------------------------------
-- CERTIFICATES
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Candidates can view own certificates"              ON certificates;
DROP POLICY IF EXISTS "Candidates can insert own certificates"            ON certificates;
DROP POLICY IF EXISTS "Candidates can update own certificates"            ON certificates;
DROP POLICY IF EXISTS "Candidates can delete own certificates"            ON certificates;
DROP POLICY IF EXISTS "Employers can view approved candidate certificates" ON certificates;
DROP POLICY IF EXISTS "MIS can view all certificates"                     ON certificates;

CREATE POLICY "Candidates can view own certificates"
    ON certificates FOR SELECT TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can insert own certificates"
    ON certificates FOR INSERT TO authenticated
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can update own certificates"
    ON certificates FOR UPDATE TO authenticated
    USING   (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())))
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can delete own certificates"
    ON certificates FOR DELETE TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Employers can view approved candidate certificates"
    ON certificates FOR SELECT TO authenticated
    USING (
        candidate_id IN (SELECT id FROM candidates WHERE approval_status = 'approved')
        AND public.is_employer()
    );

CREATE POLICY "MIS can view all certificates"
    ON certificates FOR SELECT TO authenticated
    USING (public.is_mis_user());

-- -----------------------------------------------------------
-- INDUSTRY_SPECIALIZATIONS
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Candidates can view own industry specializations"              ON industry_specializations;
DROP POLICY IF EXISTS "Candidates can insert own industry specializations"            ON industry_specializations;
DROP POLICY IF EXISTS "Candidates can update own industry specializations"            ON industry_specializations;
DROP POLICY IF EXISTS "Candidates can delete own industry specializations"            ON industry_specializations;
DROP POLICY IF EXISTS "Employers can view approved candidate specializations"         ON industry_specializations;
DROP POLICY IF EXISTS "MIS can view all specializations"                             ON industry_specializations;

CREATE POLICY "Candidates can view own industry specializations"
    ON industry_specializations FOR SELECT TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can insert own industry specializations"
    ON industry_specializations FOR INSERT TO authenticated
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can update own industry specializations"
    ON industry_specializations FOR UPDATE TO authenticated
    USING   (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())))
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can delete own industry specializations"
    ON industry_specializations FOR DELETE TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Employers can view approved candidate specializations"
    ON industry_specializations FOR SELECT TO authenticated
    USING (
        candidate_id IN (SELECT id FROM candidates WHERE approval_status = 'approved')
        AND public.is_employer()
    );

CREATE POLICY "MIS can view all specializations"
    ON industry_specializations FOR SELECT TO authenticated
    USING (public.is_mis_user());

-- -----------------------------------------------------------
-- FINANCE_ACADEMIC_EDUCATION
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Candidates can view own finance academic education"              ON finance_academic_education;
DROP POLICY IF EXISTS "Candidates can insert own finance academic education"            ON finance_academic_education;
DROP POLICY IF EXISTS "Candidates can update own finance academic education"            ON finance_academic_education;
DROP POLICY IF EXISTS "Candidates can delete own finance academic education"            ON finance_academic_education;
DROP POLICY IF EXISTS "Employers can view approved candidate finance academic education" ON finance_academic_education;
DROP POLICY IF EXISTS "MIS can view all finance academic education"                     ON finance_academic_education;

CREATE POLICY "Candidates can view own finance academic education"
    ON finance_academic_education FOR SELECT TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can insert own finance academic education"
    ON finance_academic_education FOR INSERT TO authenticated
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can update own finance academic education"
    ON finance_academic_education FOR UPDATE TO authenticated
    USING   (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())))
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can delete own finance academic education"
    ON finance_academic_education FOR DELETE TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Employers can view approved candidate finance academic education"
    ON finance_academic_education FOR SELECT TO authenticated
    USING (
        candidate_id IN (SELECT id FROM candidates WHERE approval_status = 'approved')
        AND public.is_employer()
    );

CREATE POLICY "MIS can view all finance academic education"
    ON finance_academic_education FOR SELECT TO authenticated
    USING (public.is_mis_user());

-- -----------------------------------------------------------
-- FINANCE_PROFESSIONAL_EDUCATION
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Candidates can view own finance professional education"              ON finance_professional_education;
DROP POLICY IF EXISTS "Candidates can insert own finance professional education"            ON finance_professional_education;
DROP POLICY IF EXISTS "Candidates can update own finance professional education"            ON finance_professional_education;
DROP POLICY IF EXISTS "Candidates can delete own finance professional education"            ON finance_professional_education;
DROP POLICY IF EXISTS "Employers can view approved candidate finance professional education" ON finance_professional_education;
DROP POLICY IF EXISTS "MIS can view all finance professional education"                     ON finance_professional_education;

CREATE POLICY "Candidates can view own finance professional education"
    ON finance_professional_education FOR SELECT TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can insert own finance professional education"
    ON finance_professional_education FOR INSERT TO authenticated
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can update own finance professional education"
    ON finance_professional_education FOR UPDATE TO authenticated
    USING   (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())))
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can delete own finance professional education"
    ON finance_professional_education FOR DELETE TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Employers can view approved candidate finance professional education"
    ON finance_professional_education FOR SELECT TO authenticated
    USING (
        candidate_id IN (SELECT id FROM candidates WHERE approval_status = 'approved')
        AND public.is_employer()
    );

CREATE POLICY "MIS can view all finance professional education"
    ON finance_professional_education FOR SELECT TO authenticated
    USING (public.is_mis_user());

-- -----------------------------------------------------------
-- BANKING_ACADEMIC_EDUCATION
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Candidates can view own banking academic education"              ON banking_academic_education;
DROP POLICY IF EXISTS "Candidates can insert own banking academic education"            ON banking_academic_education;
DROP POLICY IF EXISTS "Candidates can update own banking academic education"            ON banking_academic_education;
DROP POLICY IF EXISTS "Candidates can delete own banking academic education"            ON banking_academic_education;
DROP POLICY IF EXISTS "Employers can view approved candidate banking academic education" ON banking_academic_education;
DROP POLICY IF EXISTS "MIS can view all banking academic education"                     ON banking_academic_education;

CREATE POLICY "Candidates can view own banking academic education"
    ON banking_academic_education FOR SELECT TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can insert own banking academic education"
    ON banking_academic_education FOR INSERT TO authenticated
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can update own banking academic education"
    ON banking_academic_education FOR UPDATE TO authenticated
    USING   (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())))
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can delete own banking academic education"
    ON banking_academic_education FOR DELETE TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Employers can view approved candidate banking academic education"
    ON banking_academic_education FOR SELECT TO authenticated
    USING (
        candidate_id IN (SELECT id FROM candidates WHERE approval_status = 'approved')
        AND public.is_employer()
    );

CREATE POLICY "MIS can view all banking academic education"
    ON banking_academic_education FOR SELECT TO authenticated
    USING (public.is_mis_user());

-- -----------------------------------------------------------
-- BANKING_PROFESSIONAL_EDUCATION
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Candidates can view own banking professional education"              ON banking_professional_education;
DROP POLICY IF EXISTS "Candidates can insert own banking professional education"            ON banking_professional_education;
DROP POLICY IF EXISTS "Candidates can update own banking professional education"            ON banking_professional_education;
DROP POLICY IF EXISTS "Candidates can delete own banking professional education"            ON banking_professional_education;
DROP POLICY IF EXISTS "Employers can view approved candidate banking professional education" ON banking_professional_education;
DROP POLICY IF EXISTS "MIS can view all banking professional education"                     ON banking_professional_education;

CREATE POLICY "Candidates can view own banking professional education"
    ON banking_professional_education FOR SELECT TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can insert own banking professional education"
    ON banking_professional_education FOR INSERT TO authenticated
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can update own banking professional education"
    ON banking_professional_education FOR UPDATE TO authenticated
    USING   (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())))
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can delete own banking professional education"
    ON banking_professional_education FOR DELETE TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Employers can view approved candidate banking professional education"
    ON banking_professional_education FOR SELECT TO authenticated
    USING (
        candidate_id IN (SELECT id FROM candidates WHERE approval_status = 'approved')
        AND public.is_employer()
    );

CREATE POLICY "MIS can view all banking professional education"
    ON banking_professional_education FOR SELECT TO authenticated
    USING (public.is_mis_user());

-- -----------------------------------------------------------
-- BANKING_SPECIALIZED_TRAINING
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Candidates can view own banking specialized training"              ON banking_specialized_training;
DROP POLICY IF EXISTS "Candidates can insert own banking specialized training"            ON banking_specialized_training;
DROP POLICY IF EXISTS "Candidates can update own banking specialized training"            ON banking_specialized_training;
DROP POLICY IF EXISTS "Candidates can delete own banking specialized training"            ON banking_specialized_training;
DROP POLICY IF EXISTS "Employers can view approved candidate banking specialized training" ON banking_specialized_training;
DROP POLICY IF EXISTS "MIS can view all banking specialized training"                     ON banking_specialized_training;

CREATE POLICY "Candidates can view own banking specialized training"
    ON banking_specialized_training FOR SELECT TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can insert own banking specialized training"
    ON banking_specialized_training FOR INSERT TO authenticated
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can update own banking specialized training"
    ON banking_specialized_training FOR UPDATE TO authenticated
    USING   (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())))
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can delete own banking specialized training"
    ON banking_specialized_training FOR DELETE TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Employers can view approved candidate banking specialized training"
    ON banking_specialized_training FOR SELECT TO authenticated
    USING (
        candidate_id IN (SELECT id FROM candidates WHERE approval_status = 'approved')
        AND public.is_employer()
    );

CREATE POLICY "MIS can view all banking specialized training"
    ON banking_specialized_training FOR SELECT TO authenticated
    USING (public.is_mis_user());

-- -----------------------------------------------------------
-- EMPLOYERS
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Employers can view own profile"   ON employers;
DROP POLICY IF EXISTS "Employers can insert own profile" ON employers;
DROP POLICY IF EXISTS "Employers can update own profile" ON employers;
DROP POLICY IF EXISTS "Employers can delete own profile" ON employers;
DROP POLICY IF EXISTS "MIS can view all employers"       ON employers;
DROP POLICY IF EXISTS "MIS can update any employer"      ON employers;

CREATE POLICY "Employers can view own profile"
    ON employers FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Employers can insert own profile"
    ON employers FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Employers can update own profile"
    ON employers FOR UPDATE TO authenticated
    USING   (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Employers can delete own profile"
    ON employers FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()));

CREATE POLICY "MIS can view all employers"
    ON employers FOR SELECT TO authenticated
    USING (public.is_mis_user());

CREATE POLICY "MIS can update any employer"
    ON employers FOR UPDATE TO authenticated
    USING   (public.is_mis_user())
    WITH CHECK (public.is_mis_user());

-- -----------------------------------------------------------
-- COMPANIES
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Employers can view own company"   ON companies;
DROP POLICY IF EXISTS "Employers can insert company"     ON companies;
DROP POLICY IF EXISTS "Employers can update own company" ON companies;
DROP POLICY IF EXISTS "Employers can delete own company" ON companies;
DROP POLICY IF EXISTS "MIS can view all companies"       ON companies;
DROP POLICY IF EXISTS "MIS can update any company"       ON companies;

CREATE POLICY "Employers can view own company"
    ON companies FOR SELECT TO authenticated
    USING (id IN (SELECT company_id FROM employers WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Employers can insert company"
    ON companies FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Employers can update own company"
    ON companies FOR UPDATE TO authenticated
    USING   (id IN (SELECT company_id FROM employers WHERE user_id = (SELECT auth.uid())))
    WITH CHECK (id IN (SELECT company_id FROM employers WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Employers can delete own company"
    ON companies FOR DELETE TO authenticated
    USING (id IN (SELECT company_id FROM employers WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "MIS can view all companies"
    ON companies FOR SELECT TO authenticated
    USING (public.is_mis_user());

CREATE POLICY "MIS can update any company"
    ON companies FOR UPDATE TO authenticated
    USING   (public.is_mis_user())
    WITH CHECK (public.is_mis_user());

-- -----------------------------------------------------------
-- JOBS
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Employers can view own jobs"      ON jobs;
DROP POLICY IF EXISTS "Employers can insert jobs"        ON jobs;
DROP POLICY IF EXISTS "Employers can update own jobs"    ON jobs;
DROP POLICY IF EXISTS "Employers can delete own jobs"    ON jobs;
DROP POLICY IF EXISTS "Candidates can view published jobs" ON jobs;
DROP POLICY IF EXISTS "MIS can view all jobs"            ON jobs;
DROP POLICY IF EXISTS "MIS can update any job"           ON jobs;

CREATE POLICY "Employers can view own jobs"
    ON jobs FOR SELECT TO authenticated
    USING (employer_id IN (SELECT id FROM employers WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Employers can insert jobs"
    ON jobs FOR INSERT TO authenticated
    WITH CHECK (employer_id IN (SELECT id FROM employers WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Employers can update own jobs"
    ON jobs FOR UPDATE TO authenticated
    USING   (employer_id IN (SELECT id FROM employers WHERE user_id = (SELECT auth.uid())))
    WITH CHECK (employer_id IN (SELECT id FROM employers WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Employers can delete own jobs"
    ON jobs FOR DELETE TO authenticated
    USING (employer_id IN (SELECT id FROM employers WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Candidates can view published jobs"
    ON jobs FOR SELECT TO authenticated
    USING (status = 'published' AND public.is_candidate());

CREATE POLICY "MIS can view all jobs"
    ON jobs FOR SELECT TO authenticated
    USING (public.is_mis_user());

CREATE POLICY "MIS can update any job"
    ON jobs FOR UPDATE TO authenticated
    USING   (public.is_mis_user())
    WITH CHECK (public.is_mis_user());

-- -----------------------------------------------------------
-- MIS_USER
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "MIS can view own record"        ON mis_user;
DROP POLICY IF EXISTS "MIS can insert during invitation" ON mis_user;
DROP POLICY IF EXISTS "MIS can update own record"      ON mis_user;
DROP POLICY IF EXISTS "MIS can view all MIS users"     ON mis_user;

CREATE POLICY "MIS can view own record"
    ON mis_user FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

CREATE POLICY "MIS can insert during invitation"
    ON mis_user FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "MIS can update own record"
    ON mis_user FOR UPDATE TO authenticated
    USING   (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "MIS can view all MIS users"
    ON mis_user FOR SELECT TO authenticated
    USING (public.is_mis_user());

-- -----------------------------------------------------------
-- MIS RBAC TABLES
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "MIS can view roles" ON mis_roles;
DROP POLICY IF EXISTS "MIS super admin can manage roles" ON mis_roles;

CREATE POLICY "MIS can view roles"
    ON mis_roles FOR SELECT TO authenticated
    USING (public.is_mis_user());

CREATE POLICY "MIS super admin can manage roles"
    ON mis_roles FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM mis_user 
            WHERE user_id = (SELECT auth.uid()) 
            AND is_super_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM mis_user 
            WHERE user_id = (SELECT auth.uid()) 
            AND is_super_admin = true
        )
    );

DROP POLICY IF EXISTS "MIS can view permissions" ON mis_permissions;

CREATE POLICY "MIS can view permissions"
    ON mis_permissions FOR SELECT TO authenticated
    USING (public.is_mis_user());

DROP POLICY IF EXISTS "MIS can view role permissions" ON mis_role_permissions;
DROP POLICY IF EXISTS "MIS super admin can manage role permissions" ON mis_role_permissions;

CREATE POLICY "MIS can view role permissions"
    ON mis_role_permissions FOR SELECT TO authenticated
    USING (public.is_mis_user());

CREATE POLICY "MIS super admin can manage role permissions"
    ON mis_role_permissions FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM mis_user 
            WHERE user_id = (SELECT auth.uid()) 
            AND is_super_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM mis_user 
            WHERE user_id = (SELECT auth.uid()) 
            AND is_super_admin = true
        )
    );

-- -----------------------------------------------------------
-- JOB_INVITATIONS
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Candidates can view own invitations"      ON job_invitations;
DROP POLICY IF EXISTS "Employers can view company invitations"   ON job_invitations;
DROP POLICY IF EXISTS "MIS can view all invitations"             ON job_invitations;
DROP POLICY IF EXISTS "Employers can create invitations"         ON job_invitations;
DROP POLICY IF EXISTS "Candidates can update own invitations"    ON job_invitations;
DROP POLICY IF EXISTS "Employers can update company invitations" ON job_invitations;
DROP POLICY IF EXISTS "MIS can update all invitations"           ON job_invitations;

CREATE POLICY "Candidates can view own invitations"
    ON job_invitations FOR SELECT TO authenticated
    USING (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Employers can view company invitations"
    ON job_invitations FOR SELECT TO authenticated
    USING (company_id IN (SELECT company_id FROM employers WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "MIS can view all invitations"
    ON job_invitations FOR SELECT TO authenticated
    USING (public.is_mis_user());

CREATE POLICY "Employers can create invitations"
    ON job_invitations FOR INSERT TO authenticated
    WITH CHECK (
        employer_id IN (SELECT id FROM employers WHERE user_id = (SELECT auth.uid()))
        AND company_id IN (SELECT company_id FROM employers WHERE user_id = (SELECT auth.uid()))
    );

CREATE POLICY "Candidates can update own invitations"
    ON job_invitations FOR UPDATE TO authenticated
    USING   (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())))
    WITH CHECK (candidate_id IN (SELECT id FROM candidates WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "Employers can update company invitations"
    ON job_invitations FOR UPDATE TO authenticated
    USING   (company_id IN (SELECT company_id FROM employers WHERE user_id = (SELECT auth.uid())))
    WITH CHECK (company_id IN (SELECT company_id FROM employers WHERE user_id = (SELECT auth.uid())));

CREATE POLICY "MIS can update all invitations"
    ON job_invitations FOR UPDATE TO authenticated
    USING   (public.is_mis_user())
    WITH CHECK (public.is_mis_user());

-- -----------------------------------------------------------
-- INTERVIEW_ROUNDS
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Candidates can view own interview rounds"    ON interview_rounds;
DROP POLICY IF EXISTS "Candidates can update own interview rounds"  ON interview_rounds;
DROP POLICY IF EXISTS "Employers can view related interview rounds" ON interview_rounds;
DROP POLICY IF EXISTS "Employers can manage related interview rounds" ON interview_rounds;
DROP POLICY IF EXISTS "MIS full access interview_rounds"            ON interview_rounds;

CREATE POLICY "Candidates can view own interview rounds"
    ON interview_rounds FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM job_invitations ji
            JOIN candidates c ON c.id = ji.candidate_id
            WHERE ji.id = interview_rounds.invitation_id
              AND c.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Candidates can update own interview rounds"
    ON interview_rounds FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM job_invitations ji
            JOIN candidates c ON c.id = ji.candidate_id
            WHERE ji.id = interview_rounds.invitation_id
              AND c.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM job_invitations ji
            JOIN candidates c ON c.id = ji.candidate_id
            WHERE ji.id = interview_rounds.invitation_id
              AND c.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Employers can view related interview rounds"
    ON interview_rounds FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM job_invitations ji
            JOIN employers e ON e.id = ji.employer_id
            WHERE ji.id = interview_rounds.invitation_id
              AND e.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Employers can manage related interview rounds"
    ON interview_rounds FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM job_invitations ji
            JOIN employers e ON e.id = ji.employer_id
            WHERE ji.id = interview_rounds.invitation_id
              AND e.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM job_invitations ji
            JOIN employers e ON e.id = ji.employer_id
            WHERE ji.id = interview_rounds.invitation_id
              AND e.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "MIS full access interview_rounds"
    ON interview_rounds FOR ALL TO authenticated
    USING   (public.is_mis_user())
    WITH CHECK (public.is_mis_user());

-- -----------------------------------------------------------
-- JOB_OFFERS
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Candidates can view own job offers"      ON job_offers;
DROP POLICY IF EXISTS "Candidates can update own job offers"    ON job_offers;
DROP POLICY IF EXISTS "Employers can view company job offers"   ON job_offers;
DROP POLICY IF EXISTS "Employers can manage company job offers" ON job_offers;
DROP POLICY IF EXISTS "MIS full access job_offers"              ON job_offers;

CREATE POLICY "Candidates can view own job offers"
    ON job_offers FOR SELECT TO authenticated
    USING (
        invitation_id IN (
            SELECT id FROM job_invitations ji
            JOIN candidates c ON c.id = ji.candidate_id
            WHERE c.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Candidates can update own job offers"
    ON job_offers FOR UPDATE TO authenticated
    USING (
        invitation_id IN (
            SELECT id FROM job_invitations ji
            JOIN candidates c ON c.id = ji.candidate_id
            WHERE c.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        invitation_id IN (
            SELECT id FROM job_invitations ji
            JOIN candidates c ON c.id = ji.candidate_id
            WHERE c.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Employers can view company job offers"
    ON job_offers FOR SELECT TO authenticated
    USING (
        invitation_id IN (
            SELECT id FROM job_invitations ji
            JOIN employers e ON e.id = ji.employer_id
            WHERE e.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Employers can manage company job offers"
    ON job_offers FOR ALL TO authenticated
    USING (
        invitation_id IN (
            SELECT id FROM job_invitations ji
            JOIN employers e ON e.id = ji.employer_id
            WHERE e.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        invitation_id IN (
            SELECT id FROM job_invitations ji
            JOIN employers e ON e.id = ji.employer_id
            WHERE e.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "MIS full access job_offers"
    ON job_offers FOR ALL TO authenticated
    USING   (public.is_mis_user())
    WITH CHECK (public.is_mis_user());

-- -----------------------------------------------------------
-- NOTIFICATIONS
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "own_notifications" ON notifications;

CREATE POLICY "own_notifications" 
    ON notifications FOR ALL TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- -----------------------------------------------------------
-- LOG TABLES
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "MIS can read event logs"              ON event_logs;
DROP POLICY IF EXISTS "Authenticated can insert event logs"  ON event_logs;
DROP POLICY IF EXISTS "MIS can read api request logs"        ON api_request_logs;
DROP POLICY IF EXISTS "Authenticated can insert api request logs" ON api_request_logs;
DROP POLICY IF EXISTS "MIS can read error logs"              ON error_logs;
DROP POLICY IF EXISTS "Authenticated can insert error logs"  ON error_logs;

CREATE POLICY "MIS can read event logs"
    ON event_logs FOR SELECT TO authenticated
    USING (public.is_mis_user());

CREATE POLICY "Authenticated can insert event logs"
    ON event_logs FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "MIS can read api request logs"
    ON api_request_logs FOR SELECT TO authenticated
    USING (public.is_mis_user());

CREATE POLICY "Authenticated can insert api request logs"
    ON api_request_logs FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "MIS can read error logs"
    ON error_logs FOR SELECT TO authenticated
    USING (public.is_mis_user());

CREATE POLICY "Authenticated can insert error logs"
    ON error_logs FOR INSERT TO authenticated
    WITH CHECK (true);

-- -----------------------------------------------------------
-- REFERENCE / LOOKUP TABLES
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read industries"       ON industries;
DROP POLICY IF EXISTS "Anyone can read job designations" ON job_designations;
DROP POLICY IF EXISTS "Anyone can read seniority levels" ON seniority_levels;

CREATE POLICY "Anyone can read industries"
    ON industries FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Anyone can read job designations"
    ON job_designations FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Anyone can read seniority levels"
    ON seniority_levels FOR SELECT TO anon, authenticated
    USING (true);

-- -----------------------------------------------------------
-- INTERVIEW REMINDER SETTINGS
-- -----------------------------------------------------------
DROP POLICY IF EXISTS "MIS can view reminder settings" ON mis_interview_reminder_settings;
DROP POLICY IF EXISTS "MIS can update reminder settings" ON mis_interview_reminder_settings;

CREATE POLICY "MIS can view reminder settings"
    ON mis_interview_reminder_settings FOR SELECT TO authenticated
    USING (public.is_mis_user());

CREATE POLICY "MIS can update reminder settings"
    ON mis_interview_reminder_settings FOR UPDATE TO authenticated
    USING   (public.is_mis_user())
    WITH CHECK (public.is_mis_user());

DROP POLICY IF EXISTS "MIS can view reminder history" ON interview_reminder_sent;

CREATE POLICY "MIS can view reminder history"
    ON interview_reminder_sent FOR SELECT TO authenticated
    USING (public.is_mis_user());

-- ============================================================
-- PART 7: NOTIFICATION SYSTEM
-- ============================================================

-- Helper function to insert notifications
CREATE OR REPLACE FUNCTION public.notify_user(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_body TEXT DEFAULT NULL,
    p_data JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (p_user_id, p_type, p_title, p_body, p_data)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- Notification trigger functions
CREATE OR REPLACE FUNCTION public.notify_on_invitation_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_employer_user_id UUID;
    v_candidate_user_id UUID;
BEGIN
    -- Only notify on status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Get candidate user_id
        SELECT c.user_id INTO v_candidate_user_id
        FROM candidates c WHERE c.id = NEW.candidate_id;
        
        -- Get employer user_id
        SELECT e.user_id INTO v_employer_user_id
        FROM employers e WHERE e.id = NEW.employer_id;
        
        -- Notify based on new status
        IF NEW.status = 'accepted' AND v_employer_user_id IS NOT NULL THEN
            PERFORM notify_user(
                v_employer_user_id,
                'invitation_accepted',
                'Candidate Accepted Invitation',
                'A candidate has accepted your job invitation',
                jsonb_build_object('invitation_id', NEW.id, 'candidate_id', NEW.candidate_id)
            );
        ELSIF NEW.status = 'declined' AND v_employer_user_id IS NOT NULL THEN
            PERFORM notify_user(
                v_employer_user_id,
                'invitation_declined',
                'Candidate Declined Invitation',
                'A candidate has declined your job invitation',
                jsonb_build_object('invitation_id', NEW.id, 'candidate_id', NEW.candidate_id)
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_round_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_employer_user_id UUID;
    v_candidate_user_id UUID;
BEGIN
    -- Only notify on interview confirmation or completion
    IF OLD.interview_confirmed = false AND NEW.interview_confirmed = true THEN
        -- Get candidate and employer user_ids via invitation
        SELECT c.user_id, e.user_id INTO v_candidate_user_id, v_employer_user_id
        FROM job_invitations ji
        JOIN candidates c ON c.id = ji.candidate_id
        JOIN employers e ON e.id = ji.employer_id
        WHERE ji.id = NEW.invitation_id;
        
        IF v_candidate_user_id IS NOT NULL THEN
            PERFORM notify_user(
                v_candidate_user_id,
                'interview_confirmed',
                'Interview Confirmed',
                'Your interview round ' || NEW.round_number || ' has been confirmed',
                jsonb_build_object('round_id', NEW.id, 'invitation_id', NEW.invitation_id)
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_offer_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_candidate_user_id UUID;
BEGIN
    -- Get candidate user_id via invitation
    SELECT c.user_id INTO v_candidate_user_id
    FROM job_invitations ji
    JOIN candidates c ON c.id = ji.candidate_id
    WHERE ji.id = NEW.invitation_id;
    
    IF v_candidate_user_id IS NOT NULL THEN
        PERFORM notify_user(
            v_candidate_user_id,
            'offer_received',
            'Job Offer Received',
            'You have received a job offer!',
            jsonb_build_object('offer_id', NEW.id, 'invitation_id', NEW.invitation_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_on_offer_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_employer_user_id UUID;
BEGIN
    -- Only notify on status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Get employer user_id via invitation
        SELECT e.user_id INTO v_employer_user_id
        FROM job_invitations ji
        JOIN employers e ON e.id = ji.employer_id
        WHERE ji.id = NEW.invitation_id;
        
        IF v_employer_user_id IS NOT NULL THEN
            IF NEW.status = 'accepted' THEN
                PERFORM notify_user(
                    v_employer_user_id,
                    'offer_accepted',
                    'Offer Accepted',
                    'A candidate has accepted your job offer!',
                    jsonb_build_object('offer_id', NEW.id, 'invitation_id', NEW.invitation_id)
                );
            ELSIF NEW.status = 'declined' THEN
                PERFORM notify_user(
                    v_employer_user_id,
                    'offer_declined',
                    'Offer Declined',
                    'A candidate has declined your job offer',
                    jsonb_build_object('offer_id', NEW.id, 'invitation_id', NEW.invitation_id)
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_invitation_status ON job_invitations;
CREATE TRIGGER trigger_notify_invitation_status
    AFTER UPDATE ON job_invitations
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_invitation_status_change();

DROP TRIGGER IF EXISTS trigger_notify_round_status ON interview_rounds;
CREATE TRIGGER trigger_notify_round_status
    AFTER UPDATE ON interview_rounds
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_round_status_change();

DROP TRIGGER IF EXISTS trigger_notify_offer_created ON job_offers;
CREATE TRIGGER trigger_notify_offer_created
    AFTER INSERT ON job_offers
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_offer_created();

DROP TRIGGER IF EXISTS trigger_notify_offer_status ON job_offers;
CREATE TRIGGER trigger_notify_offer_status
    AFTER UPDATE ON job_offers
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_offer_status_change();

-- ============================================================
-- PART 8: STORAGE RLS POLICIES
-- ============================================================
-- NOTE: Storage buckets must be created manually via Supabase Dashboard
-- or programmatically. These policies assume buckets exist:
-- - profile-images
-- - company-logos
-- - resume
-- - resume_copy
-- - br-certificates

-- Profile images: candidates can upload/update their own; employers/MIS can view approved
DROP POLICY IF EXISTS "Candidates upload own profile image" ON storage.objects;
DROP POLICY IF EXISTS "Public read profile images" ON storage.objects;

CREATE POLICY "Candidates upload own profile image"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'profile-images'
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
        AND public.is_candidate()
    );

CREATE POLICY "Public read profile images"
    ON storage.objects FOR SELECT TO authenticated, anon
    USING (bucket_id = 'profile-images');

-- Company logos: employers can upload for their company; public can view approved
DROP POLICY IF EXISTS "Employers upload company logo" ON storage.objects;
DROP POLICY IF EXISTS "Public read company logos" ON storage.objects;

CREATE POLICY "Employers upload company logo"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'company-logos'
        AND public.is_employer()
    );

CREATE POLICY "Public read company logos"
    ON storage.objects FOR SELECT TO authenticated, anon
    USING (bucket_id = 'company-logos');

-- Resumes: candidates upload their own; employers view approved candidates' resumes
DROP POLICY IF EXISTS "Candidates upload own resume" ON storage.objects;
DROP POLICY IF EXISTS "Employers view approved resumes" ON storage.objects;

CREATE POLICY "Candidates upload own resume"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id IN ('resume', 'resume_copy')
        AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
        AND public.is_candidate()
    );

CREATE POLICY "Employers view approved resumes"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id IN ('resume', 'resume_copy')
        AND (
            public.is_candidate()
            OR public.is_employer()
            OR public.is_mis_user()
        )
    );

-- BR Certificates: employers upload for their company; MIS can view for approval
DROP POLICY IF EXISTS "Employers upload BR certificate" ON storage.objects;
DROP POLICY IF EXISTS "MIS view BR certificates" ON storage.objects;

CREATE POLICY "Employers upload BR certificate"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'br-certificates'
        AND public.is_employer()
    );

CREATE POLICY "MIS view BR certificates"
    ON storage.objects FOR SELECT TO authenticated
    USING (
        bucket_id = 'br-certificates'
        AND (public.is_employer() OR public.is_mis_user())
    );

-- ============================================================
-- COMPLETE
-- ============================================================
-- Trigger PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
