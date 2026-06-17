-- =====================================================
-- PHASE 1b: STORAGE BUCKET RLS POLICIES FOR JOBGENIE
-- =====================================================
-- Applied to dev: 2026-05-14 via MCP apply_migration
-- Apply to prod:  Supabase Dashboard SQL Editor (project oxcmkfejolzcyxhgfdhj)
-- =====================================================


-- ============================================================
-- PART 1: ENSURE BUCKETS EXIST WITH CORRECT SETTINGS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-images', 'profile-images', true, 5242880,
    ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'company-logos', 'company-logos', true, 5242880,
    ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'resume', 'resume', true, 5242880,
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'resume_copy', 'resume_copy', true, 5242880,
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'br-certificates', 'br-certificates', true, 10485760,
    ARRAY['application/pdf','image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- PART 2: DROP ALL EXISTING STORAGE POLICIES (idempotent)
-- ============================================================

-- profile-images
DROP POLICY IF EXISTS "Public can read profile images"            ON storage.objects;
DROP POLICY IF EXISTS "Candidates can upload own profile image"   ON storage.objects;
DROP POLICY IF EXISTS "Candidates can update own profile image"   ON storage.objects;
DROP POLICY IF EXISTS "Candidates can delete own profile image"   ON storage.objects;

-- company-logos
DROP POLICY IF EXISTS "Public can read company logos"             ON storage.objects;
DROP POLICY IF EXISTS "Employers can upload company logo"         ON storage.objects;
DROP POLICY IF EXISTS "Employers can update company logo"         ON storage.objects;
DROP POLICY IF EXISTS "Employers can delete company logo"         ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to company logos"                ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated employers to upload company logos"    ON storage.objects;
DROP POLICY IF EXISTS "Allow employers to update their own company logos"        ON storage.objects;
DROP POLICY IF EXISTS "Allow employers to delete their own company logos"        ON storage.objects;

-- resume
DROP POLICY IF EXISTS "Candidates can upload own resume"          ON storage.objects;
DROP POLICY IF EXISTS "Candidates can update own resume"          ON storage.objects;
DROP POLICY IF EXISTS "Candidates can delete own resume"          ON storage.objects;
DROP POLICY IF EXISTS "Candidates can read own resume"            ON storage.objects;
DROP POLICY IF EXISTS "Employers can read approved resumes"       ON storage.objects;
DROP POLICY IF EXISTS "MIS can read all resumes"                  ON storage.objects;

-- resume_copy
DROP POLICY IF EXISTS "Candidates can upload own resume copy"     ON storage.objects;
DROP POLICY IF EXISTS "Candidates can update own resume copy"     ON storage.objects;
DROP POLICY IF EXISTS "Candidates can delete own resume copy"     ON storage.objects;
DROP POLICY IF EXISTS "Candidates can read own resume copy"       ON storage.objects;
DROP POLICY IF EXISTS "Employers can read approved resume copies" ON storage.objects;
DROP POLICY IF EXISTS "MIS can read all resume copies"            ON storage.objects;

-- br-certificates
DROP POLICY IF EXISTS "Anon can upload BR certificate presignup"  ON storage.objects;
DROP POLICY IF EXISTS "Employers can upload BR certificate"        ON storage.objects;
DROP POLICY IF EXISTS "Employers can read own BR certificate"      ON storage.objects;
DROP POLICY IF EXISTS "MIS can read all BR certificates"           ON storage.objects;


-- ============================================================
-- PART 3: PROFILE-IMAGES POLICIES
-- Public bucket — anyone can read via public URL.
-- Only the owning candidate can write.
-- Path: {candidate_id}/{candidate_id}-{timestamp}.{ext}
-- NOTE: profile-images upload uses authenticated client (not admin),
--       so INSERT/UPDATE/DELETE policies are ACTIVELY enforced.
-- ============================================================

CREATE POLICY "Public can read profile images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'profile-images');

CREATE POLICY "Candidates can upload own profile image"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'profile-images'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.candidates
            WHERE user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Candidates can update own profile image"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'profile-images'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.candidates
            WHERE user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        bucket_id = 'profile-images'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.candidates
            WHERE user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Candidates can delete own profile image"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'profile-images'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.candidates
            WHERE user_id = (SELECT auth.uid())
        )
    );


-- ============================================================
-- PART 4: COMPANY-LOGOS POLICIES
-- Public bucket — anyone can read via public URL.
-- Only verified employers can write.
-- Path: {company_id}-{timestamp}.{ext} (flat — no subfolder)
-- ============================================================

CREATE POLICY "Public can read company logos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'company-logos');

CREATE POLICY "Employers can upload company logo"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'company-logos'
        AND public.is_employer()
    );

CREATE POLICY "Employers can update company logo"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'company-logos'
        AND public.is_employer()
    )
    WITH CHECK (
        bucket_id = 'company-logos'
        AND public.is_employer()
    );

CREATE POLICY "Employers can delete company logo"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'company-logos'
        AND public.is_employer()
    );


-- ============================================================
-- PART 5: RESUME POLICIES
-- Path: {candidate_id}/{filename}
-- ============================================================

CREATE POLICY "Candidates can upload own resume"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'resume'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.candidates
            WHERE user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Candidates can update own resume"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'resume'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.candidates
            WHERE user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        bucket_id = 'resume'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.candidates
            WHERE user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Candidates can delete own resume"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'resume'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.candidates
            WHERE user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Candidates can read own resume"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'resume'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.candidates
            WHERE user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Employers can read approved resumes"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'resume'
        AND public.is_employer()
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.candidates
            WHERE approval_status = 'approved'
        )
    );

CREATE POLICY "MIS can read all resumes"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'resume'
        AND public.is_mis_user()
    );


-- ============================================================
-- PART 6: RESUME_COPY POLICIES
-- Watermarked common CVs generated by the system.
-- Identical access pattern to the resume bucket.
-- Path: {candidate_id}/{filename}
-- ============================================================

CREATE POLICY "Candidates can upload own resume copy"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'resume_copy'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.candidates
            WHERE user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Candidates can update own resume copy"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'resume_copy'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.candidates
            WHERE user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        bucket_id = 'resume_copy'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.candidates
            WHERE user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Candidates can delete own resume copy"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'resume_copy'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.candidates
            WHERE user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Candidates can read own resume copy"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'resume_copy'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.candidates
            WHERE user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Employers can read approved resume copies"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'resume_copy'
        AND public.is_employer()
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.candidates
            WHERE approval_status = 'approved'
        )
    );

CREATE POLICY "MIS can read all resume copies"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'resume_copy'
        AND public.is_mis_user()
    );


-- ============================================================
-- PART 7: BR-CERTIFICATES POLICIES
-- Flow 1: Pre-signup (unauthenticated) → path = presignup/{filename}
-- Flow 2: Post-signup employer → handled via admin client
-- ============================================================

CREATE POLICY "Anon can upload BR certificate presignup"
    ON storage.objects FOR INSERT
    TO anon
    WITH CHECK (
        bucket_id = 'br-certificates'
        AND (storage.foldername(name))[1] = 'presignup'
    );

CREATE POLICY "Employers can upload BR certificate"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'br-certificates'
        AND public.is_employer()
    );

CREATE POLICY "Employers can read own BR certificate"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'br-certificates'
        AND public.is_employer()
    );

CREATE POLICY "MIS can read all BR certificates"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'br-certificates'
        AND public.is_mis_user()
    );
