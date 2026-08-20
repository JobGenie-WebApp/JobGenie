-- Education is no longer split per industry. Finance/banking education rows fold into
-- `educations` (academic / professional), banking specialized training folds into
-- `certificates`, and the industry-specific tables are dropped once their rows have moved.

INSERT INTO educations (candidate_id, education_type, degree_diploma, professional_qualification, institution, status, created_at, updated_at)
SELECT candidate_id, 'academic'::"EducationType", degree_diploma, NULL, institution, status, created_at, updated_at
FROM finance_academic_education
UNION ALL
SELECT candidate_id, 'academic'::"EducationType", degree_diploma, NULL, institution, status, created_at, updated_at
FROM banking_academic_education
UNION ALL
-- degree_diploma is the column employer/MIS views read, so professional rows fill both.
SELECT candidate_id, 'professional'::"EducationType", professional_qualification, professional_qualification, institution, status, created_at, updated_at
FROM finance_professional_education
UNION ALL
SELECT candidate_id, 'professional'::"EducationType", professional_qualification, professional_qualification, institution, status, created_at, updated_at
FROM banking_professional_education;

INSERT INTO certificates (candidate_id, certificate_name, issuing_authority, issue_date, created_at, updated_at)
SELECT candidate_id, left(certificate_name, 200), issuing_authority, certificate_issue_month, created_at, updated_at
FROM banking_specialized_training;

DROP TABLE finance_academic_education;
DROP TABLE finance_professional_education;
DROP TABLE banking_academic_education;
DROP TABLE banking_professional_education;
DROP TABLE banking_specialized_training;
