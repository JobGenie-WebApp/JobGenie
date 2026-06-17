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
                degree_diploma: edu.degreeDiploma,
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

        // Finance Industry: Academic and Professional Education
        if (data.financeAcademicEducation && data.financeAcademicEducation.length > 0) {
            await supabase.from("finance_academic_education").delete().eq("candidate_id", candidateId);
            const now = new Date().toISOString();
            const records = data.financeAcademicEducation.map((edu) => ({
                candidate_id: candidateId,
                degree_diploma: edu.degreeDiploma,
                institution: edu.institution,
                status: edu.status || "incomplete",
                created_at: now,
                updated_at: now,
            }));
            const { error } = await supabase.from("finance_academic_education").insert(records);
            if (error) console.error("Finance academic education insert error:", error);
        }

        if (data.financeProfessionalEducation && data.financeProfessionalEducation.length > 0) {
            await supabase.from("finance_professional_education").delete().eq("candidate_id", candidateId);
            const now = new Date().toISOString();
            const records = data.financeProfessionalEducation.map((edu) => ({
                candidate_id: candidateId,
                professional_qualification: edu.professionalQualification,
                institution: edu.institution,
                status: edu.status || "incomplete",
                created_at: now,
                updated_at: now,
            }));
            const { error } = await supabase.from("finance_professional_education").insert(records);
            if (error) console.error("Finance professional education insert error:", error);
        }

        // Banking Industry: Academic, Professional, and Specialized Training
        if (data.bankingAcademicEducation && data.bankingAcademicEducation.length > 0) {
            await supabase.from("banking_academic_education").delete().eq("candidate_id", candidateId);
            const now = new Date().toISOString();
            const records = data.bankingAcademicEducation.map((edu) => ({
                candidate_id: candidateId,
                degree_diploma: edu.degreeDiploma,
                institution: edu.institution,
                status: edu.status || "incomplete",
                created_at: now,
                updated_at: now,
            }));
            const { error } = await supabase.from("banking_academic_education").insert(records);
            if (error) console.error("Banking academic education insert error:", error);
        }

        if (data.bankingProfessionalEducation && data.bankingProfessionalEducation.length > 0) {
            await supabase.from("banking_professional_education").delete().eq("candidate_id", candidateId);
            const now = new Date().toISOString();
            const records = data.bankingProfessionalEducation.map((edu) => ({
                candidate_id: candidateId,
                professional_qualification: edu.professionalQualification,
                institution: edu.institution,
                status: edu.status || "incomplete",
                created_at: now,
                updated_at: now,
            }));
            const { error } = await supabase.from("banking_professional_education").insert(records);
            if (error) console.error("Banking professional education insert error:", error);
        }

        if (data.bankingSpecializedTraining && data.bankingSpecializedTraining.length > 0) {
            await supabase.from("banking_specialized_training").delete().eq("candidate_id", candidateId);
            const now = new Date().toISOString();
            const records = data.bankingSpecializedTraining.map((training) => ({
                candidate_id: candidateId,
                certificate_name: training.certificateName,
                issuing_authority: training.issuingAuthority,
                certificate_issue_month: training.certificateIssueMonth || null,
                status: training.status || "incomplete",
                created_at: now,
                updated_at: now,
            }));
            const { error } = await supabase.from("banking_specialized_training").insert(records);
            if (error) console.error("Banking specialized training insert error:", error);
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
        } catch (e) {
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

        // 2. Upload Profile Image if provided
        let uploadedProfileImageUrl: string | null = null;

        if (profileImageFile && profileImageFile.size > 0) {
            try {
                // Dynamically import storage service
                const { StorageService } = await import("@/lib/storage");
                const { url } = await StorageService.uploadProfileImage(candidateId, profileImageFile);
                uploadedProfileImageUrl = url;
            } catch (error) {
                console.error("Profile Image Upload failed:", error);
                return {
                    success: false,
                    message: "Failed to upload profile image. Please try again.",
                };
            }
        }

        // 3. Upload CV if provided
        let uploadedCvPath: string | null = null;
        let uploadedCvUrl: string | null = null;

        if (cvFile && cvFile.size > 0) {
            try {
                // Dynamically import storage service to avoid server/client issues if any
                const { StorageService } = await import("@/lib/storage");
                const { url, filePath } = await StorageService.uploadResume(candidateId, cvFile);
                uploadedCvUrl = url;
                uploadedCvPath = filePath;
            } catch (error) {
                console.error("CV Upload failed:", error);

                // Rollback profile image if it was uploaded
                if (uploadedProfileImageUrl) {
                    try {
                        const { StorageService } = await import("@/lib/storage");
                        await StorageService.deleteProfileImage(uploadedProfileImageUrl);
                    } catch (deleteError) {
                        console.error("Failed to rollback profile image:", deleteError);
                    }
                }

                return {
                    success: false,
                    message: "Failed to upload CV. Please try again.",
                };
            }
        }

        // 4. Generate and upload Common CV
        let uploadedCommonCvPath: string | null = null;
        let uploadedCommonCvUrl: string | null = null;

        try {
            // Import PDF generator
            const { generateCommonCV } = await import("@/lib/pdf-generator");

            // Prepare candidate info for CV generation
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

            // Generate common CV PDF
            const commonCvBuffer = await generateCommonCV(data, candidateBasicInfo);

            // Upload common CV with watermark
            const { StorageService } = await import("@/lib/storage");
            const { url, filePath } = await StorageService.uploadCommonCV(
                candidateId,
                commonCvBuffer
            );

            uploadedCommonCvUrl = url;
            uploadedCommonCvPath = filePath;

        } catch (error) {
            console.error("Common CV generation/upload failed:", error);

            // Rollback original CV if it was uploaded
            if (uploadedCvPath) {
                try {
                    const { StorageService } = await import("@/lib/storage");
                    await StorageService.deleteResume(uploadedCvPath);
                    console.log("Rollback: Deleted original CV");
                } catch (deleteError) {
                    console.error("Failed to rollback original CV:", deleteError);
                }
            }

            // Rollback profile image if it was uploaded
            if (uploadedProfileImageUrl) {
                try {
                    const { StorageService } = await import("@/lib/storage");
                    await StorageService.deleteProfileImage(uploadedProfileImageUrl);
                    console.log("Rollback: Deleted profile image");
                } catch (deleteError) {
                    console.error("Failed to rollback profile image:", deleteError);
                }
            }

            return {
                success: false,
                message: "Failed to generate common CV. Please try again.",
            };
        }

        // 5. Update Database (Transaction-like)
        try {
            // Update basic candidate info with resume_url
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

            // Handle other relations (Work Exp, Edu, etc.)
            // Reuse logic or copy-paste? Copied logic for robustness as we are in a different function context
            // Note: ideally refactor to shared function, but for now duplicating the relation updates is safer to avoid breaking existing flow.

            // ... [Relation updates same as completeFullProfile] ...
            // For brevity in this turn, I will assume we should call the internal update logic.
            // But to ensure "all or nothing", if relation updates fail, we should probably throw and catch.

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
                    start_date: exp.startDate ? `${exp.startDate}-01` : null,
                    end_date: exp.isCurrent ? null : (exp.endDate ? `${exp.endDate}-01` : null),
                    description: exp.description || null,
                    is_current: exp.isCurrent || false,
                    created_at: now,
                    updated_at: now,
                }));
                const { error } = await supabase.from("work_experiences").insert(workExpRecords);
                if (error) throw new Error(`Work experience update failed: ${error.message}`);
            }

            // ... (Repeat for other sections: Education, Awards, etc.)
            // Education
            await supabase.from("educations").delete().eq("candidate_id", candidateId);
            if (data.educations.length > 0) {
                const now = new Date().toISOString();
                const eduRecords = data.educations.map((edu) => ({
                    candidate_id: candidateId,
                    education_type: edu.educationType || "academic",
                    degree_diploma: edu.degreeDiploma,
                    institution: edu.institution,
                    status: edu.status || "incomplete",
                    created_at: now,
                    updated_at: now,
                }));
                const { error } = await supabase.from("educations").insert(eduRecords);
                if (error) throw new Error(`Education update failed: ${error.message}`);
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
                const { error } = await supabase.from("awards").insert(awardRecords);
                if (error) throw new Error(`Awards update failed: ${error.message}`);
            }

            // IT Projects
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
                const { error } = await supabase.from("projects").insert(projectRecords);
                if (error) throw new Error(`Projects update failed: ${error.message}`);
            }

            // Certificates
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
                const { error } = await supabase.from("certificates").insert(certRecords);
                if (error) throw new Error(`Certificates update failed: ${error.message}`);
            }

            // Finance - Academic
            if (data.financeAcademicEducation && data.financeAcademicEducation.length > 0) {
                await supabase.from("finance_academic_education").delete().eq("candidate_id", candidateId);
                const now = new Date().toISOString();
                const records = data.financeAcademicEducation.map((edu) => ({
                    candidate_id: candidateId,
                    degree_diploma: edu.degreeDiploma,
                    institution: edu.institution,
                    status: edu.status || "incomplete",
                    created_at: now,
                    updated_at: now,
                }));
                const { error } = await supabase.from("finance_academic_education").insert(records);
                if (error) throw new Error(`Finance academic education update failed: ${error.message}`);
            }

            // Finance - Professional
            if (data.financeProfessionalEducation && data.financeProfessionalEducation.length > 0) {
                await supabase.from("finance_professional_education").delete().eq("candidate_id", candidateId);
                const now = new Date().toISOString();
                const records = data.financeProfessionalEducation.map((edu) => ({
                    candidate_id: candidateId,
                    professional_qualification: edu.professionalQualification,
                    institution: edu.institution,
                    status: edu.status || "incomplete",
                    created_at: now,
                    updated_at: now,
                }));
                const { error } = await supabase.from("finance_professional_education").insert(records);
                if (error) throw new Error(`Finance professional education update failed: ${error.message}`);
            }

            // Banking - Academic
            if (data.bankingAcademicEducation && data.bankingAcademicEducation.length > 0) {
                await supabase.from("banking_academic_education").delete().eq("candidate_id", candidateId);
                const now = new Date().toISOString();
                const records = data.bankingAcademicEducation.map((edu) => ({
                    candidate_id: candidateId,
                    degree_diploma: edu.degreeDiploma,
                    institution: edu.institution,
                    status: edu.status || "incomplete",
                    created_at: now,
                    updated_at: now,
                }));
                const { error } = await supabase.from("banking_academic_education").insert(records);
                if (error) throw new Error(`Banking academic education update failed: ${error.message}`);
            }

            // Banking - Professional
            if (data.bankingProfessionalEducation && data.bankingProfessionalEducation.length > 0) {
                await supabase.from("banking_professional_education").delete().eq("candidate_id", candidateId);
                const now = new Date().toISOString();
                const records = data.bankingProfessionalEducation.map((edu) => ({
                    candidate_id: candidateId,
                    professional_qualification: edu.professionalQualification,
                    institution: edu.institution,
                    status: edu.status || "incomplete",
                    created_at: now,
                    updated_at: now,
                }));
                const { error } = await supabase.from("banking_professional_education").insert(records);
                if (error) throw new Error(`Banking professional education update failed: ${error.message}`);
            }

            // Banking - Specialized
            if (data.bankingSpecializedTraining && data.bankingSpecializedTraining.length > 0) {
                await supabase.from("banking_specialized_training").delete().eq("candidate_id", candidateId);
                const now = new Date().toISOString();
                const records = data.bankingSpecializedTraining.map((training) => ({
                    candidate_id: candidateId,
                    certificate_name: training.certificateName,
                    issuing_authority: training.issuingAuthority,
                    certificate_issue_month: training.certificateIssueMonth || null,
                    status: training.status || "incomplete",
                    created_at: now,
                    updated_at: now,
                }));
                const { error } = await supabase.from("banking_specialized_training").insert(records);
                if (error) throw new Error(`Banking specialized training update failed: ${error.message}`);
            }

        } catch (dbError) {
            console.error("Database Transaction Failed. Rolling back storage...", dbError);

            // ROLLBACK: Delete all uploaded files

            // Rollback original CV
            if (uploadedCvPath) {
                try {
                    const { StorageService } = await import("@/lib/storage");
                    await StorageService.deleteResume(uploadedCvPath);
                    console.log("Storage rollback successful: deleted original CV", uploadedCvPath);
                } catch (deleteError) {
                    console.error("CRITICAL: Failed to rollback original CV:", uploadedCvPath, deleteError);
                }
            }

            // Rollback common CV
            if (uploadedCommonCvPath) {
                try {
                    const { StorageService } = await import("@/lib/storage");
                    await StorageService.deleteCommonCV(uploadedCommonCvPath);
                    console.log("Storage rollback successful: deleted common CV", uploadedCommonCvPath);
                } catch (deleteError) {
                    console.error("CRITICAL: Failed to rollback common CV:", uploadedCommonCvPath, deleteError);
                }
            }

            // Rollback profile image
            if (uploadedProfileImageUrl) {
                try {
                    const { StorageService } = await import("@/lib/storage");
                    await StorageService.deleteProfileImage(uploadedProfileImageUrl);
                    console.log("Storage rollback successful: deleted profile image", uploadedProfileImageUrl);
                } catch (deleteError) {
                    console.error("CRITICAL: Failed to rollback profile image:", uploadedProfileImageUrl, deleteError);
                }
            }

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
