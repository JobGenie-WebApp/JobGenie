"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity, logError } from "@/lib/logger";
import {
    experienceSchema,
    projectSchema,
    certificationSchema,
    awardSchema,
    educationSchema,
    basicInfoSchema,
    aboutSectionSchema,
    type ExperienceFormData,
    type ProjectFormData,
    type CertificationFormData,
    type AwardFormData,
    type EducationFormData,
    type BasicInfoFormData,
    type AboutSectionFormData,
} from "@/lib/validations/profile";

type ActionResponse = {
    success: boolean;
    error?: string;
    data?: unknown;
};

// ============= EXPERIENCE ACTIONS =============

export async function addExperience(data: ExperienceFormData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        // Get candidate_id
        const { data: candidate } = await supabase
            .from("candidates")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!candidate) {
            return { success: false, error: "Candidate profile not found" };
        }

        // Validate data
        const validated = experienceSchema.parse(data);

        // Insert new experience
        const { error } = await supabase
            .from("work_experiences")
            .insert({
                candidate_id: candidate.id,
                ...validated,
            });

        if (error) {
            console.error("Error adding experience:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("experience_added", user.id, "candidate", "work_experience");
        return { success: true };
    } catch (error) {
        console.error("Error in addExperience:", error);
        await logError({ source: "profile-mutations.ts:addExperience", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to add experience" };
    }
}

export async function updateExperience(id: string, data: ExperienceFormData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        // Verify ownership
        const { data: experience } = await supabase
            .from("work_experiences")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!experience || (experience.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        // Validate data
        const validated = experienceSchema.parse(data);

        // Update experience
        const { error } = await supabase
            .from("work_experiences")
            .update(validated)
            .eq("id", id);

        if (error) {
            console.error("Error updating experience:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("experience_updated", user.id, "candidate", "work_experience", id);
        return { success: true };
    } catch (error) {
        console.error("Error in updateExperience:", error);
        await logError({ source: "profile-mutations.ts:updateExperience", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to update experience" };
    }
}

export async function deleteExperience(id: string): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        // Verify ownership
        const { data: experience } = await supabase
            .from("work_experiences")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!experience || (experience.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        // Delete experience
        const { error } = await supabase
            .from("work_experiences")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting experience:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("experience_deleted", user.id, "candidate", "work_experience", id);
        return { success: true };
    } catch (error) {
        console.error("Error in deleteExperience:", error);
        await logError({ source: "profile-mutations.ts:deleteExperience", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to delete experience" };
    }
}

// ============= PROJECT ACTIONS =============

export async function addProject(data: ProjectFormData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: candidate } = await supabase
            .from("candidates")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!candidate) {
            return { success: false, error: "Candidate profile not found" };
        }

        const validated = projectSchema.parse(data);

        const { error } = await supabase
            .from("projects")
            .insert({
                candidate_id: candidate.id,
                ...validated,
            });

        if (error) {
            console.error("Error adding project:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("project_added", user.id, "candidate", "project");
        return { success: true };
    } catch (error) {
        console.error("Error in addProject:", error);
        await logError({ source: "profile-mutations.ts:addProject", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to add project" };
    }
}

export async function updateProject(id: string, data: ProjectFormData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: project } = await supabase
            .from("projects")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!project || (project.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const validated = projectSchema.parse(data);

        const { error } = await supabase
            .from("projects")
            .update(validated)
            .eq("id", id);

        if (error) {
            console.error("Error updating project:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("project_updated", user.id, "candidate", "project", id);
        return { success: true };
    } catch (error) {
        console.error("Error in updateProject:", error);
        await logError({ source: "profile-mutations.ts:updateProject", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to update project" };
    }
}

export async function deleteProject(id: string): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: project } = await supabase
            .from("projects")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!project || (project.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const { error } = await supabase
            .from("projects")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting project:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("project_deleted", user.id, "candidate", "project", id);
        return { success: true };
    } catch (error) {
        console.error("Error in deleteProject:", error);
        await logError({ source: "profile-mutations.ts:deleteProject", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to delete project" };
    }
}

// ============= CERTIFICATION ACTIONS =============

export async function addCertification(data: CertificationFormData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: candidate } = await supabase
            .from("candidates")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!candidate) {
            return { success: false, error: "Candidate profile not found" };
        }

        const validated = certificationSchema.parse(data);

        const { error } = await supabase
            .from("certificates")
            .insert({
                candidate_id: candidate.id,
                ...validated,
            });

        if (error) {
            console.error("Error adding certification:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("certification_added", user.id, "candidate", "certificate");
        return { success: true };
    } catch (error) {
        console.error("Error in addCertification:", error);
        await logError({ source: "profile-mutations.ts:addCertification", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to add certification" };
    }
}

export async function updateCertification(id: string, data: CertificationFormData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: cert } = await supabase
            .from("certificates")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!cert || (cert.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const validated = certificationSchema.parse(data);

        const { error } = await supabase
            .from("certificates")
            .update(validated)
            .eq("id", id);

        if (error) {
            console.error("Error updating certification:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("certification_updated", user.id, "candidate", "certificate", id);
        return { success: true };
    } catch (error) {
        console.error("Error in updateCertification:", error);
        await logError({ source: "profile-mutations.ts:updateCertification", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to update certification" };
    }
}

export async function deleteCertification(id: string): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: cert } = await supabase
            .from("certificates")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!cert || (cert.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const { error } = await supabase
            .from("certificates")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting certification:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("certification_deleted", user.id, "candidate", "certificate", id);
        return { success: true };
    } catch (error) {
        console.error("Error in deleteCertification:", error);
        await logError({ source: "profile-mutations.ts:deleteCertification", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to delete certification" };
    }
}

// ============= AWARD ACTIONS =============

export async function addAward(data: AwardFormData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: candidate } = await supabase
            .from("candidates")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!candidate) {
            return { success: false, error: "Candidate profile not found" };
        }

        const validated = awardSchema.parse(data);

        const { error } = await supabase
            .from("awards")
            .insert({
                candidate_id: candidate.id,
                ...validated,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

        if (error) {
            console.error("Error adding award:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("award_added", user.id, "candidate", "award");
        return { success: true };
    } catch (error) {
        console.error("Error in addAward:", error);
        await logError({ source: "profile-mutations.ts:addAward", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to add award" };
    }
}

export async function updateAward(id: string, data: AwardFormData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: award } = await supabase
            .from("awards")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!award || (award.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const validated = awardSchema.parse(data);

        // Convert undefined to null for database update (to clear fields)
        const updateData = {
            nature_of_award: validated.nature_of_award,
            offered_by: validated.offered_by ?? null,
            description: validated.description ?? null,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from("awards")
            .update(updateData)
            .eq("id", id);

        if (error) {
            console.error("Error updating award:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("award_updated", user.id, "candidate", "award", id);
        return { success: true };
    } catch (error) {
        console.error("Error in updateAward:", error);
        await logError({ source: "profile-mutations.ts:updateAward", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to update award" };
    }
}

export async function deleteAward(id: string): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: award } = await supabase
            .from("awards")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!award || (award.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const { error } = await supabase
            .from("awards")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting award:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("award_deleted", user.id, "candidate", "award", id);
        return { success: true };
    } catch (error) {
        console.error("Error in deleteAward:", error);
        await logError({ source: "profile-mutations.ts:deleteAward", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to delete award" };
    }
}

// ==================== EDUCATION MUTATIONS ====================

export async function addEducation(data: EducationFormData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: candidate } = await supabase
            .from("candidates")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!candidate) {
            return { success: false, error: "Candidate profile not found" };
        }

        const validated = educationSchema.parse(data);

        const { error } = await supabase
            .from("educations")
            .insert({
                candidate_id: candidate.id,
                ...validated,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

        if (error) {
            console.error("Error adding education:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("education_added", user.id, "candidate", "education");
        return { success: true };
    } catch (error) {
        console.error("Error in addEducation:", error);
        await logError({ source: "profile-mutations.ts:addEducation", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to add education" };
    }
}

export async function updateEducation(id: string, data: EducationFormData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: education } = await supabase
            .from("educations")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!education || (education.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const validated = educationSchema.parse(data);

        // Convert undefined to null for database update
        const updateData = {
            education_type: validated.education_type,
            degree_diploma: validated.degree_diploma ?? null,
            professional_qualification: validated.professional_qualification ?? null,
            institution: validated.institution,
            status: validated.status,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from("educations")
            .update(updateData)
            .eq("id", id);

        if (error) {
            console.error("Error updating education:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("education_updated", user.id, "candidate", "education", id);
        return { success: true };
    } catch (error) {
        console.error("Error in updateEducation:", error);
        await logError({ source: "profile-mutations.ts:updateEducation", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to update education" };
    }
}

export async function deleteEducation(id: string): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: education } = await supabase
            .from("educations")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!education || (education.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const { error } = await supabase
            .from("educations")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting education:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("education_deleted", user.id, "candidate", "education", id);
        return { success: true };
    } catch (error) {
        console.error("Error in deleteEducation:", error);
        await logError({ source: "profile-mutations.ts:deleteEducation", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to delete education" };
    }
}

// ==================== BASIC INFO MUTATIONS ====================

export async function updateBasicInfo(data: BasicInfoFormData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        // Get candidate_id
        const { data: candidate } = await supabase
            .from("candidates")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!candidate) {
            return { success: false, error: "Candidate profile not found" };
        }

        // Validate data
        const validated = basicInfoSchema.parse(data);

        // Convert undefined to null for database update
        const updateData = {
            first_name: validated.first_name,
            last_name: validated.last_name,
            nicPassport: validated.nicPassport,
            phone: validated.phone,
            alternative_phone: validated.alternative_phone ?? null,
            country: validated.country ?? null,
            current_position: validated.current_position,
            highest_qualification: validated.highest_qualification ?? null,
            profile_image_url: validated.profile_image_url ?? null,
            expected_positions: validated.expected_positions,
            updated_at: new Date().toISOString(),
        };

        // Update candidate
        const { error } = await supabase
            .from("candidates")
            .update(updateData)
            .eq("id", candidate.id);

        if (error) {
            console.error("Error updating basic info:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("basic_info_updated", user.id, "candidate", "candidate", candidate.id);
        return { success: true };
    } catch (error) {
        console.error("Error in updateBasicInfo:", error);
        await logError({ source: "profile-mutations.ts:updateBasicInfo", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to update basic information" };
    }
}

// ==================== ABOUT SECTION MUTATIONS ====================

export async function updateAboutSection(data: AboutSectionFormData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        // Get candidate_id
        const { data: candidate } = await supabase
            .from("candidates")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (!candidate) {
            return { success: false, error: "Candidate profile not found" };
        }

        // Validate data
        const validated = aboutSectionSchema.parse(data);

        // Convert undefined to null for database update
        const updateData = {
            professional_summary: validated.professional_summary ?? null,
            years_of_experience: validated.years_of_experience ?? null,
            experience_level: validated.experience_level ?? null,
            expected_monthly_salary: validated.expected_monthly_salary ?? null,
            notice_period: validated.notice_period ?? null,
            employment_type: validated.employment_type ?? null,
            availability_status: validated.availability_status ?? null,
            updated_at: new Date().toISOString(),
        };

        // Update candidate
        const { error } = await supabase
            .from("candidates")
            .update(updateData)
            .eq("id", candidate.id);

        if (error) {
            console.error("Error updating about section:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("about_section_updated", user.id, "candidate", "candidate", candidate.id);
        return { success: true };
    } catch (error) {
        console.error("Error in updateAboutSection:", error);
        await logError({ source: "profile-mutations.ts:updateAboutSection", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to update about section" };
    }
}
