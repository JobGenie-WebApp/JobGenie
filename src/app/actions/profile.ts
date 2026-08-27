"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { completeProfileSchema, type CompleteProfileData } from "@/lib/validations/profile-schema";
import { logActivity, logError } from "@/lib/logger";

export type ProfileActionState = {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
    redirectTo?: string;
};

export async function completeProfile(
    _prevState: ProfileActionState | null,
    formData: FormData
): Promise<ProfileActionState> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                message: "You must be logged in to complete your profile.",
            };
        }

        // Extract form data
        const industry = formData.get("industry") as string;
        const currentPosition = formData.get("currentPosition") as string;
        const yearsOfExperience = parseInt(formData.get("yearsOfExperience") as string) || 0;
        const experienceLevel = formData.get("experienceLevel") as string;
        const professionalSummary = formData.get("professionalSummary") as string;
        const expectedMonthlySalary = formData.get("expectedMonthlySalary") as string;
        const availabilityStatus = formData.get("availabilityStatus") as string;
        const noticePeriod = formData.get("noticePeriod") as string;
        const employmentType = formData.get("employmentType") as string;
        const country = formData.get("country") as string;
        const qualificationsStr = formData.get("qualifications") as string;

        // Validation
        const errors: Record<string, string[]> = {};

        if (!industry?.trim()) {
            errors.industry = ["Industry is required"];
        }
        if (!currentPosition?.trim()) {
            errors.currentPosition = ["Current position is required"];
        }
        if (!professionalSummary?.trim()) {
            errors.professionalSummary = ["Professional summary is required"];
        }
        if (professionalSummary && professionalSummary.length < 50) {
            errors.professionalSummary = ["Professional summary must be at least 50 characters"];
        }

        if (Object.keys(errors).length > 0) {
            return {
                success: false,
                message: "Please fix the errors below.",
                errors,
            };
        }

        // Parse qualifications
        let qualifications: string[] = [];
        if (qualificationsStr) {
            try {
                qualifications = JSON.parse(qualificationsStr);
            } catch {
                qualifications = [];
            }
        }

        // Update candidate profile
        const { error: updateError } = await supabase
            .from("candidates")
            .update({
                industry: industry.trim(),
                current_position: currentPosition.trim(),
                years_of_experience: yearsOfExperience,
                experience_level: experienceLevel || "entry",
                professional_summary: professionalSummary.trim(),
                expected_monthly_salary: expectedMonthlySalary ? parseFloat(expectedMonthlySalary) : null,
                availability_status: availabilityStatus || "available",
                notice_period: noticePeriod || "immediate",
                employment_type: employmentType || "full_time",
                country: country?.trim() || null,
                qualifications: qualifications,
                profile_completed: true,
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id);

        if (updateError) {
            console.error("Profile update error:", updateError);
            return {
                success: false,
                message: "Failed to update profile. Please try again.",
            };
        }

        revalidatePath("/candidate/dashboard");
        revalidatePath("/candidate/profile");

        await logActivity("profile_completed", user.id, "candidate", "candidate", undefined, { industry });
        return {
            success: true,
            message: "Profile completed successfully!",
            redirectTo: "/candidate/dashboard",
        };
    } catch (error) {
        console.error("Complete profile error:", error);
        await logError({ source: "profile.ts:completeProfile", errorType: "ProfileCompletionError", message: error instanceof Error ? error.message : String(error) });
        return {
            success: false,
            message: "An unexpected error occurred. Please try again.",
        };
    }
}

// Comprehensive profile completion for multi-step form
export async function completeFullProfile(
    userId: string,
    profileData: CompleteProfileData
): Promise<ProfileActionState> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.id !== userId) {
            return {
                success: false,
                message: "Unauthorized. Please log in again.",
            };
        }

        // Validate with Zod
        const validation = completeProfileSchema.safeParse(profileData);
        if (!validation.success) {
            const fieldErrors: Record<string, string[]> = {};
            validation.error.issues.forEach((err) => {
                const path = err.path.join(".");
                if (!fieldErrors[path]) fieldErrors[path] = [];
                fieldErrors[path].push(err.message);
            });
            return {
                success: false,
                message: "Validation failed. Please check your inputs.",
                errors: fieldErrors,
            };
        }

        const data = validation.data;

        // Get candidate ID
        const { data: candidate, error: candidateError } = await supabase
            .from("candidates")
            .select("id")
            .eq("user_id", userId)
            .single();

        if (candidateError || !candidate) {
            console.error("Candidate lookup error:", candidateError);
            return {
                success: false,
                message: "Could not find your profile.",
            };
        }

        const candidateId = candidate.id;

        // Update basic candidate info
        const { error: updateError } = await supabase
            .from("candidates")
            .update({
                industry: data.industry,
                first_name: data.basicInfo.firstName,
                last_name: data.basicInfo.lastName,
                email: data.basicInfo.email,
                phone: data.basicInfo.phone,
                alternative_phone: data.basicInfo.alternativePhone || null,
                address: data.basicInfo.address,
                country: data.basicInfo.country || null,
                current_position: data.basicInfo.currentPosition,
                years_of_experience: Math.round(data.basicInfo.yearsOfExperience), // Convert to integer
                experience_level: data.basicInfo.experienceLevel,
                expected_monthly_salary: data.basicInfo.expectedMonthlySalary || null,
                expected_salary_currency: data.basicInfo.expectedSalaryCurrency || "LKR",
                availability_status: data.basicInfo.availabilityStatus,
                notice_period: data.basicInfo.noticePeriod || null,
                employment_type: data.basicInfo.employmentType,
                expected_positions: data.basicInfo.expectedPositions ?? [],
                highest_qualification: data.basicInfo.highestQualification || null,
                professional_summary: data.professionalSummary,
                profile_completed: true,
                // Reset approval status for resubmission
                approval_status: "pending",
                approval_status_message_seen: false,
                rejected_at: null,
                rejection_reason: null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", candidateId);

        if (updateError) {
            console.error("Candidate update error:", updateError);
            return {
                success: false,
                message: "Failed to update profile.",
            };
        }

        // Clear existing related records and insert new ones
        // Work Experiences
        await supabase.from("work_experiences").delete().eq("candidate_id", candidateId);
        if (data.workExperiences.length > 0) {
            const now = new Date().toISOString();
            const workExpRecords = data.workExperiences.map((exp) => ({
                candidate_id: candidateId,
                job_title: exp.jobTitle,
                company: exp.company,
                employment_type: exp.employmentType || "full_time",
                location: exp.location || null,
                location_type: exp.locationType || "onsite",
                // Convert YYYY-MM format to YYYY-MM-DD for database
                start_date: exp.startDate ? `${exp.startDate}-01` : null,
                end_date: exp.isCurrent ? null : (exp.endDate ? `${exp.endDate}-01` : null),
                description: exp.description || null,
                is_current: exp.isCurrent || false,
                created_at: now,
                updated_at: now,
            }));
            const { error: expError } = await supabase.from("work_experiences").insert(workExpRecords);
            if (expError) console.error("Work experience insert error:", expError);
        }

        // Education
        await supabase.from("educations").delete().eq("candidate_id", candidateId);
        if (data.educations.length > 0) {
            const now = new Date().toISOString();
            const eduRecords = data.educations.map((edu) => ({
                candidate_id: candidateId,
                education_type: edu.educationType || "academic",
                // The wizard captures one qualification name. Employer/MIS views read
                // degree_diploma and the profile page reads professional_qualification,
                // so a professional entry has to land in both columns.
                degree_diploma: edu.degreeDiploma,
                professional_qualification: edu.educationType === "professional" ? edu.degreeDiploma : null,
                institution: edu.institution,
                status: edu.status || "incomplete", // Changed from 'complete' to match schema
                created_at: now,
                updated_at: now,
            }));
            const { error: eduError } = await supabase.from("educations").insert(eduRecords);
            if (eduError) console.error("Education insert error:", eduError);
        }

        // Awards
        await supabase.from("awards").delete().eq("candidate_id", candidateId);
        if (data.awards.length > 0) {
            const now = new Date().toISOString();
            const awardRecords = data.awards.map((award) => ({
                candidate_id: candidateId,
                nature_of_award: award.natureOfAward,
                offered_by: award.offeredBy || null,
                description: award.description || null,
                created_at: now,
                updated_at: now,
            }));
            const { error: awardError } = await supabase.from("awards").insert(awardRecords);
            if (awardError) console.error("Award insert error:", awardError);
        }

        // IT Industry: Projects
        if (data.projects && data.projects.length > 0) {
            await supabase.from("projects").delete().eq("candidate_id", candidateId);
            const now = new Date().toISOString();
            const projectRecords = data.projects.map((proj) => ({
                candidate_id: candidateId,
                project_name: proj.projectName,
                description: proj.description || null,
                demo_url: proj.demoUrl || null,
                is_current: proj.isCurrent || false,
                created_at: now,
                updated_at: now,
            }));
            const { error: projError } = await supabase.from("projects").insert(projectRecords);
            if (projError) console.error("Project insert error:", projError);
        }

        // IT Industry: Certificates
        if (data.certificates && data.certificates.length > 0) {
            await supabase.from("certificates").delete().eq("candidate_id", candidateId);
            const now = new Date().toISOString();
            const certRecords = data.certificates.map((cert) => ({
                candidate_id: candidateId,
                certificate_name: cert.certificateName,
                issuing_authority: cert.issuingAuthority || null,
                issue_date: cert.issueDate || null,
                expiry_date: cert.expiryDate || null,
                credential_id: cert.credentialId || null,
                credential_url: cert.credentialUrl || null,
                description: cert.description || null,
                created_at: now,
                updated_at: now,
            }));
            const { error: certError } = await supabase.from("certificates").insert(certRecords);
            if (certError) console.error("Certificate insert error:", certError);
        }

        revalidatePath("/candidate/dashboard");
        revalidatePath("/candidate/profile");
        revalidatePath("/candidate/create-profile");

        await logActivity("full_profile_completed", userId, "candidate", "candidate", candidateId, { industry: data.industry });
        return {
            success: true,
            message: "Profile completed successfully!",
            redirectTo: "/candidate/dashboard",
        };
    } catch (error) {
        console.error("Complete full profile error:", error);
        await logError({ source: "profile.ts:completeFullProfile", errorType: "FullProfileCompletionError", message: error instanceof Error ? error.message : String(error) });
        return {
            success: false,
            message: "An unexpected error occurred. Please try again.",
        };
    }
}

// Transactional profile completion with CV upload
export async function completeFullProfileWithCV(
    formData: FormData
): Promise<ProfileActionState> {
    try {
        const supabase = await createClient(); // Server client for Auth
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                message: "Unauthorized. Please log in again.",
            };
        }

        const profileDataJson = formData.get("profileData") as string;
        const cvFile = formData.get("cvFile") as File | null;
        const profileImageFile = formData.get("profileImageFile") as File | null;
        let profileData: CompleteProfileData;

        try {
            profileData = JSON.parse(profileDataJson);
        } catch {
            return { success: false, message: "Invalid profile data format." };
        }

        // Validate with Zod
        const validation = completeProfileSchema.safeParse(profileData);
        if (!validation.success) {
            const fieldErrors: Record<string, string[]> = {};
            validation.error.issues.forEach((err) => {
                const path = err.path.join(".");
                if (!fieldErrors[path]) fieldErrors[path] = [];
                fieldErrors[path].push(err.message);
            });
            return {
                success: false,
                message: "Validation failed. Please check your inputs.",
                errors: fieldErrors,
            };
        }

        const data = validation.data;

        // 1. Generate Candidate ID (UUID)
        // We need to fetch the existing candidate ID associated with the user, 
        // OR if we are inserting a brand new one (which shouldn't happen for 'update').
        // The previous logic queries `candidates` by `user_id`.

        const { data: candidate, error: candidateError } = await supabase
            .from("candidates")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (candidateError || !candidate) {
            console.error("Candidate lookup error:", candidateError);
            return {
                success: false,
                message: "Could not find your profile.",
            };
        }

        const candidateId = candidate.id;

        // 2. Storage work — the slowest part of this action, and none of it depends on the
        // database writes below. The profile image, the uploaded CV and the generated common
        // CV are independent of each other, so they run together instead of end to end.
        // Imported here rather than at the top of the file so the other actions in this
        // module don't pay pdf-lib's load cost on a cold start.
        const [{ StorageService }, { generateCommonCV }] = await Promise.all([
            import("@/lib/storage"),
            import("@/lib/pdf-generator"),
        ]);

        const candidateBasicInfo = {
            firstName: data.basicInfo.firstName,
            lastName: data.basicInfo.lastName,
            email: data.basicInfo.email,
            phone: data.basicInfo.phone,
            address: data.basicInfo.address,
            currentPosition: data.basicInfo.currentPosition,
            industry: data.industry,
            yearsOfExperience: data.basicInfo.yearsOfExperience,
            professionalSummary: data.professionalSummary,
        };

        const [imageOutcome, cvOutcome, commonCvOutcome] = await Promise.allSettled([
            profileImageFile && profileImageFile.size > 0
                ? StorageService.uploadProfileImage(candidateId, profileImageFile)
                : null,
            cvFile && cvFile.size > 0
                ? StorageService.uploadResume(candidateId, cvFile)
                : null,
            generateCommonCV(data, candidateBasicInfo).then((buffer) =>
                StorageService.uploadCommonCV(candidateId, buffer)
            ),
        ]);

        const uploadedProfileImageUrl = imageOutcome.status === "fulfilled" ? imageOutcome.value?.url ?? null : null;
        const uploadedProfileImagePath = imageOutcome.status === "fulfilled" ? imageOutcome.value?.filePath ?? null : null;
        const uploadedCvUrl = cvOutcome.status === "fulfilled" ? cvOutcome.value?.url ?? null : null;
        const uploadedCvPath = cvOutcome.status === "fulfilled" ? cvOutcome.value?.filePath ?? null : null;
        const uploadedCommonCvUrl = commonCvOutcome.status === "fulfilled" ? commonCvOutcome.value.url : null;
        const uploadedCommonCvPath = commonCvOutcome.status === "fulfilled" ? commonCvOutcome.value.filePath : null;

        /**
         * Delete whatever actually reached storage. Because the three run concurrently, a
         * failure in one can leave the other two uploaded, so every rollback path clears all
         * of them. deleteProfileImage takes a storage path, not a URL — passing the URL here
         * silently no-opped before.
         */
        const rollbackUploads = async () => {
            const results = await Promise.allSettled([
                uploadedCvPath ? StorageService.deleteResume(uploadedCvPath) : null,
                uploadedCommonCvPath ? StorageService.deleteCommonCV(uploadedCommonCvPath) : null,
                uploadedProfileImagePath ? StorageService.deleteProfileImage(uploadedProfileImagePath) : null,
            ]);
            for (const result of results) {
                if (result.status === "rejected") {
                    console.error("CRITICAL: storage rollback failed:", result.reason);
                }
            }
        };

        const uploadFailure =
            imageOutcome.status === "rejected"
                ? { reason: imageOutcome.reason, message: "Failed to upload profile image. Please try again." }
                : cvOutcome.status === "rejected"
                  ? { reason: cvOutcome.reason, message: "Failed to upload CV. Please try again." }
                  : commonCvOutcome.status === "rejected"
                    ? { reason: commonCvOutcome.reason, message: "Failed to generate common CV. Please try again." }
                    : null;

        if (uploadFailure) {
            console.error("Profile submission storage step failed:", uploadFailure.reason);
            await rollbackUploads();
            return { success: false, message: uploadFailure.message };
        }

        // 3. Update Database (Transaction-like)
        try {
            // The candidate row goes first: until it succeeds nothing has been destroyed, so a
            // failure here costs only the uploaded files.
            const { error: updateError } = await supabase
                .from("candidates")
                .update({
                    industry: data.industry,
                    first_name: data.basicInfo.firstName,
                    last_name: data.basicInfo.lastName,
                    email: data.basicInfo.email,
                    phone: data.basicInfo.phone,
                    alternative_phone: data.basicInfo.alternativePhone || null,
                    address: data.basicInfo.address,
                    country: data.basicInfo.country || null,
                    current_position: data.basicInfo.currentPosition,
                    years_of_experience: Math.round(data.basicInfo.yearsOfExperience),
                    experience_level: data.basicInfo.experienceLevel,
                    expected_monthly_salary: data.basicInfo.expectedMonthlySalary || null,
                    expected_salary_currency: data.basicInfo.expectedSalaryCurrency || "LKR",
                    availability_status: data.basicInfo.availabilityStatus,
                    notice_period: data.basicInfo.noticePeriod || null,
                    employment_type: data.basicInfo.employmentType,
                    expected_positions: data.basicInfo.expectedPositions ?? [],
                    highest_qualification: data.basicInfo.highestQualification || null,
                    professional_summary: data.professionalSummary,
                    profile_completed: true,
                    approval_status: "pending",
                    approval_status_message_seen: false,
                    rejected_at: null,
                    rejection_reason: null,
                    updated_at: new Date().toISOString(),
                    resume_url: uploadedCvUrl,
                    resume_copy_url: uploadedCommonCvUrl,
                    profile_image_url: uploadedProfileImageUrl,
                })
                .eq("id", candidateId);

            if (updateError) {
                throw new Error(`Profile update failed: ${updateError.message}`);
            }

            const now = new Date().toISOString();

            // Every relation table is wiped and rewritten from the wizard's state. They are
            // independent of one another, so this runs as two batched rounds — all the deletes,
            // then all the inserts — instead of ten sequential round trips.
            //
            // `alwaysClear` keeps the existing rule intact: projects and certificates are
            // IT-only steps, and when the wizard sends none the candidate's existing rows are
            // left alone rather than wiped.
            const relations: { table: string; rows: Record<string, unknown>[]; alwaysClear: boolean }[] = [
                {
                    table: "work_experiences",
                    alwaysClear: true,
                    rows: data.workExperiences.map((exp) => ({
                        candidate_id: candidateId,
                        job_title: exp.jobTitle,
                        company: exp.company,
                        employment_type: exp.employmentType || "full_time",
                        location: exp.location || null,
                        location_type: exp.locationType || "onsite",
                        start_date: exp.startDate ? `${exp.startDate}-01` : null,
                        end_date: exp.isCurrent ? null : (exp.endDate ? `${exp.endDate}-01` : null),
                        description: exp.description || null,
                        is_current: exp.isCurrent || false,
                        created_at: now,
                        updated_at: now,
                    })),
                },
                {
                    table: "educations",
                    alwaysClear: true,
                    rows: data.educations.map((edu) => ({
                        candidate_id: candidateId,
                        education_type: edu.educationType || "academic",
                        degree_diploma: edu.degreeDiploma,
                        professional_qualification: edu.educationType === "professional" ? edu.degreeDiploma : null,
                        institution: edu.institution,
                        status: edu.status || "incomplete",
                        created_at: now,
                        updated_at: now,
                    })),
                },
                {
                    table: "awards",
                    alwaysClear: true,
                    rows: data.awards.map((award) => ({
                        candidate_id: candidateId,
                        nature_of_award: award.natureOfAward,
                        offered_by: award.offeredBy || null,
                        description: award.description || null,
                        created_at: now,
                        updated_at: now,
                    })),
                },
                {
                    table: "projects",
                    alwaysClear: false,
                    rows: (data.projects ?? []).map((proj) => ({
                        candidate_id: candidateId,
                        project_name: proj.projectName,
                        description: proj.description || null,
                        demo_url: proj.demoUrl || null,
                        is_current: proj.isCurrent || false,
                        created_at: now,
                        updated_at: now,
                    })),
                },
                {
                    table: "certificates",
                    alwaysClear: false,
                    rows: (data.certificates ?? []).map((cert) => ({
                        candidate_id: candidateId,
                        certificate_name: cert.certificateName,
                        issuing_authority: cert.issuingAuthority || null,
                        issue_date: cert.issueDate || null,
                        expiry_date: cert.expiryDate || null,
                        credential_id: cert.credentialId || null,
                        credential_url: cert.credentialUrl || null,
                        description: cert.description || null,
                        created_at: now,
                        updated_at: now,
                    })),
                },
            ];

            /**
             * Sync the uploaded CV into the "My Resumes" list so it shows up there. Only creates
             * a row if the candidate has none yet — My Resumes is managed independently
             * afterwards, so resubmitting a profile must not duplicate the entry.
             */
            const syncResumeRow = async () => {
                if (!uploadedCvUrl || !uploadedCvPath || !cvFile || cvFile.size === 0) return;

                const { count } = await supabase
                    .from("candidate_resumes")
                    .select("id", { count: "exact", head: true })
                    .eq("candidate_id", candidateId);

                if ((count ?? 0) > 0) return;

                const resumeDisplayName = cvFile.name
                    .replace(/\.[^.]+$/, "")
                    .replace(/[_-]+/g, " ")
                    .replace(/\s+/g, " ")
                    .trim() || "My Resume";

                await supabase.from("candidate_resumes").insert({
                    candidate_id: candidateId,
                    file_name: resumeDisplayName,
                    file_url: uploadedCvUrl,
                    file_path: uploadedCvPath,
                    is_primary: true,
                });
            };

            // Round one: clear the relations, and sync the resume row alongside them.
            const toClear = relations.filter((rel) => rel.alwaysClear || rel.rows.length > 0);
            await Promise.all([
                syncResumeRow(),
                ...toClear.map((rel) => supabase.from(rel.table).delete().eq("candidate_id", candidateId)),
            ]);

            // Round two: write everything back.
            const toInsert = relations.filter((rel) => rel.rows.length > 0);
            const insertResults = await Promise.all(
                toInsert.map((rel) => supabase.from(rel.table).insert(rel.rows))
            );

            const failedIndex = insertResults.findIndex((result) => result.error);
            if (failedIndex !== -1) {
                throw new Error(
                    `${toInsert[failedIndex].table} update failed: ${insertResults[failedIndex].error!.message}`
                );
            }
        } catch (dbError) {
            console.error("Database Transaction Failed. Rolling back storage...", dbError);
            // ponytail: files roll back, rows do not — a failure partway through the relation
            // writes leaves the profile half-written. Move the block above into a single
            // getServerSql() transaction if that ever actually bites.
            await rollbackUploads();

            return {
                success: false,
                message: "Failed to save profile. Please try again.",
            };
        }

        revalidatePath("/candidate/dashboard");
        revalidatePath("/candidate/profile");
        revalidatePath("/candidate/create-profile");

        await logActivity("full_profile_with_cv_completed", user.id, "candidate", "candidate");
        return {
            success: true,
            message: "Profile completed successfully!",
            redirectTo: "/candidate/dashboard",
        };

    } catch (error) {
        console.error("Complete full profile W/ CV error:", error);
        await logError({ source: "profile.ts:completeFullProfileWithCV", errorType: "FullProfileWithCVError", message: error instanceof Error ? error.message : String(error) });
        return {
            success: false,
            message: "An unexpected error occurred. Please try again.",
        };
    }
}
