-- =====================================================
-- PHASE 1a: COMPLETE RLS POLICIES FOR JOBGENIE
-- =====================================================
-- Applied to dev: 2026-05-14 via MCP apply_migration
-- Apply to prod:  Supabase Dashboard SQL Editor (project oxcmkfejolzcyxhgfdhj)
-- =====================================================


-- ============================================================
-- PART 1: SECURITY DEFINER HELPER FUNCTIONS
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
-- PART 2: TABLE-LEVEL GRANTS
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users                      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.candidates                 TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.employers                  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.companies                  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.jobs                       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.job_invitations            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.interview_rounds           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mis_user                   TO authenticated;
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

-- Log tables: MIS reads; authenticated can insert (service_role bypasses anyway)
GRANT SELECT, INSERT ON TABLE public.event_logs       TO authenticated;
GRANT SELECT, INSERT ON TABLE public.error_logs       TO authenticated;
GRANT SELECT, INSERT ON TABLE public.api_request_logs TO authenticated;

-- Reference / lookup tables
GRANT SELECT ON TABLE public.industries        TO authenticated, anon;
GRANT SELECT ON TABLE public.job_designations  TO authenticated, anon;
GRANT SELECT ON TABLE public.seniority_levels  TO authenticated, anon;


-- ============================================================
-- PART 3: ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE public.users                         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employers                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs                          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_invitations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_rounds              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_user                      ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.event_logs                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industries                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_designations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seniority_levels              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mis_interview_reminder_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_reminder_sent       ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PART 4: PERFORMANCE INDEXES
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
-- PART 5: RLS POLICIES
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
DROP POLICY IF EXISTS "Employers can view related interview rounds" ON interview_rounds;
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

CREATE POLICY "MIS full access interview_rounds"
    ON interview_rounds FOR ALL TO authenticated
    USING   (public.is_mis_user())
    WITH CHECK (public.is_mis_user());


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


-- Trigger PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
