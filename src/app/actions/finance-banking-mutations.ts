"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity, logError } from "@/lib/logger";
import {
    financeAcademicEducationSchema,
    financeProfessionalEducationSchema,
    bankingAcademicEducationSchema,
    bankingProfessionalEducationSchema,
    bankingSpecializedTrainingSchema,
    type FinanceAcademicEducationData,
    type FinanceProfessionalEducationData,
    type BankingAcademicEducationData,
    type BankingProfessionalEducationData,
    type BankingSpecializedTrainingData,
} from "@/lib/validations/profile-schema";

type ActionResponse = {
    success: boolean;
    error?: string;
    data?: unknown;
};

// ============= FINANCE ACADEMIC EDUCATION ACTIONS =============

export async function addFinanceAcademicEducation(data: FinanceAcademicEducationData): Promise<ActionResponse> {
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

        const validated = financeAcademicEducationSchema.parse(data);

        // Convert camelCase to snake_case for database
        const { error } = await supabase
            .from("finance_academic_education")
            .insert({
                candidate_id: candidate.id,
                degree_diploma: validated.degreeDiploma,
                institution: validated.institution,
                status: validated.status,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

        if (error) {
            console.error("Error adding finance academic education:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("finance_academic_edu_added", user.id, "candidate", "finance_academic_education");
        return { success: true };
    } catch (error) {
        console.error("Error in addFinanceAcademicEducation:", error);
        await logError({ source: "finance-banking-mutations.ts:addFinanceAcademicEducation", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to add finance academic education" };
    }
}

export async function updateFinanceAcademicEducation(id: string, data: FinanceAcademicEducationData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: education } = await supabase
            .from("finance_academic_education")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!education || (education.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const validated = financeAcademicEducationSchema.parse(data);

        const { error } = await supabase
            .from("finance_academic_education")
            .update({
                degree_diploma: validated.degreeDiploma,
                institution: validated.institution,
                status: validated.status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
            console.error("Error updating finance academic education:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("finance_academic_edu_updated", user.id, "candidate", "finance_academic_education", id);
        return { success: true };
    } catch (error) {
        console.error("Error in updateFinanceAcademicEducation:", error);
        await logError({ source: "finance-banking-mutations.ts:updateFinanceAcademicEducation", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to update finance academic education" };
    }
}

export async function deleteFinanceAcademicEducation(id: string): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: education } = await supabase
            .from("finance_academic_education")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!education || (education.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const { error } = await supabase
            .from("finance_academic_education")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting finance academic education:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("finance_academic_edu_deleted", user.id, "candidate", "finance_academic_education", id);
        return { success: true };
    } catch (error) {
        console.error("Error in deleteFinanceAcademicEducation:", error);
        await logError({ source: "finance-banking-mutations.ts:deleteFinanceAcademicEducation", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to delete finance academic education" };
    }
}

// ============= FINANCE PROFESSIONAL EDUCATION ACTIONS =============

export async function addFinanceProfessionalEducation(data: FinanceProfessionalEducationData): Promise<ActionResponse> {
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

        const validated = financeProfessionalEducationSchema.parse(data);

        const { error } = await supabase
            .from("finance_professional_education")
            .insert({
                candidate_id: candidate.id,
                professional_qualification: validated.professionalQualification,
                institution: validated.institution,
                status: validated.status,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

        if (error) {
            console.error("Error adding finance professional education:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("finance_prof_edu_added", user.id, "candidate", "finance_professional_education");
        return { success: true };
    } catch (error) {
        console.error("Error in addFinanceProfessionalEducation:", error);
        await logError({ source: "finance-banking-mutations.ts:addFinanceProfessionalEducation", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to add finance professional education" };
    }
}

export async function updateFinanceProfessionalEducation(id: string, data: FinanceProfessionalEducationData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: education } = await supabase
            .from("finance_professional_education")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!education || (education.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const validated = financeProfessionalEducationSchema.parse(data);

        const { error } = await supabase
            .from("finance_professional_education")
            .update({
                professional_qualification: validated.professionalQualification,
                institution: validated.institution,
                status: validated.status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
            console.error("Error updating finance professional education:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("finance_prof_edu_updated", user.id, "candidate", "finance_professional_education", id);
        return { success: true };
    } catch (error) {
        console.error("Error in updateFinanceProfessionalEducation:", error);
        await logError({ source: "finance-banking-mutations.ts:updateFinanceProfessionalEducation", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to update finance professional education" };
    }
}

export async function deleteFinanceProfessionalEducation(id: string): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: education } = await supabase
            .from("finance_professional_education")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!education || (education.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const { error } = await supabase
            .from("finance_professional_education")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting finance professional education:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("finance_prof_edu_deleted", user.id, "candidate", "finance_professional_education", id);
        return { success: true };
    } catch (error) {
        console.error("Error in deleteFinanceProfessionalEducation:", error);
        await logError({ source: "finance-banking-mutations.ts:deleteFinanceProfessionalEducation", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to delete finance professional education" };
    }
}

// ============= BANKING ACADEMIC EDUCATION ACTIONS =============

export async function addBankingAcademicEducation(data: BankingAcademicEducationData): Promise<ActionResponse> {
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

        const validated = bankingAcademicEducationSchema.parse(data);

        const { error } = await supabase
            .from("banking_academic_education")
            .insert({
                candidate_id: candidate.id,
                degree_diploma: validated.degreeDiploma,
                institution: validated.institution,
                status: validated.status,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

        if (error) {
            console.error("Error adding banking academic education:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("banking_academic_edu_added", user.id, "candidate", "banking_academic_education");
        return { success: true };
    } catch (error) {
        console.error("Error in addBankingAcademicEducation:", error);
        await logError({ source: "finance-banking-mutations.ts:addBankingAcademicEducation", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to add banking academic education" };
    }
}

export async function updateBankingAcademicEducation(id: string, data: BankingAcademicEducationData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: education } = await supabase
            .from("banking_academic_education")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!education || (education.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const validated = bankingAcademicEducationSchema.parse(data);

        const { error } = await supabase
            .from("banking_academic_education")
            .update({
                degree_diploma: validated.degreeDiploma,
                institution: validated.institution,
                status: validated.status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
            console.error("Error updating banking academic education:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("banking_academic_edu_updated", user.id, "candidate", "banking_academic_education", id);
        return { success: true };
    } catch (error) {
        console.error("Error in updateBankingAcademicEducation:", error);
        await logError({ source: "finance-banking-mutations.ts:updateBankingAcademicEducation", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to update banking academic education" };
    }
}

export async function deleteBankingAcademicEducation(id: string): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: education } = await supabase
            .from("banking_academic_education")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!education || (education.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const { error } = await supabase
            .from("banking_academic_education")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting banking academic education:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("banking_academic_edu_deleted", user.id, "candidate", "banking_academic_education", id);
        return { success: true };
    } catch (error) {
        console.error("Error in deleteBankingAcademicEducation:", error);
        await logError({ source: "finance-banking-mutations.ts:deleteBankingAcademicEducation", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to delete banking academic education" };
    }
}

// ============= BANKING PROFESSIONAL EDUCATION ACTIONS =============

export async function addBankingProfessionalEducation(data: BankingProfessionalEducationData): Promise<ActionResponse> {
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

        const validated = bankingProfessionalEducationSchema.parse(data);

        const { error } = await supabase
            .from("banking_professional_education")
            .insert({
                candidate_id: candidate.id,
                professional_qualification: validated.professionalQualification,
                institution: validated.institution,
                status: validated.status,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

        if (error) {
            console.error("Error adding banking professional education:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("banking_prof_edu_added", user.id, "candidate", "banking_professional_education");
        return { success: true };
    } catch (error) {
        console.error("Error in addBankingProfessionalEducation:", error);
        await logError({ source: "finance-banking-mutations.ts:addBankingProfessionalEducation", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to add banking professional education" };
    }
}

export async function updateBankingProfessionalEducation(id: string, data: BankingProfessionalEducationData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: education } = await supabase
            .from("banking_professional_education")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!education || (education.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const validated = bankingProfessionalEducationSchema.parse(data);

        const { error } = await supabase
            .from("banking_professional_education")
            .update({
                professional_qualification: validated.professionalQualification,
                institution: validated.institution,
                status: validated.status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
            console.error("Error updating banking professional education:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("banking_prof_edu_updated", user.id, "candidate", "banking_professional_education", id);
        return { success: true };
    } catch (error) {
        console.error("Error in updateBankingProfessionalEducation:", error);
        await logError({ source: "finance-banking-mutations.ts:updateBankingProfessionalEducation", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to update banking professional education" };
    }
}

export async function deleteBankingProfessionalEducation(id: string): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: education } = await supabase
            .from("banking_professional_education")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!education || (education.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const { error } = await supabase
            .from("banking_professional_education")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting banking professional education:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("banking_prof_edu_deleted", user.id, "candidate", "banking_professional_education", id);
        return { success: true };
    } catch (error) {
        console.error("Error in deleteBankingProfessionalEducation:", error);
        await logError({ source: "finance-banking-mutations.ts:deleteBankingProfessionalEducation", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to delete banking professional education" };
    }
}

// ============= BANKING SPECIALIZED TRAINING ACTIONS =============

export async function addBankingSpecializedTraining(data: BankingSpecializedTrainingData): Promise<ActionResponse> {
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

        const validated = bankingSpecializedTrainingSchema.parse(data);

        const { error } = await supabase
            .from("banking_specialized_training")
            .insert({
                candidate_id: candidate.id,
                certificate_name: validated.certificateName,
                issuing_authority: validated.issuingAuthority,
                certificate_issue_month: validated.certificateIssueMonth || null,
                status: validated.status,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

        if (error) {
            console.error("Error adding banking specialized training:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("banking_specialized_training_added", user.id, "candidate", "banking_specialized_training");
        return { success: true };
    } catch (error) {
        console.error("Error in addBankingSpecializedTraining:", error);
        await logError({ source: "finance-banking-mutations.ts:addBankingSpecializedTraining", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to add banking specialized training" };
    }
}

export async function updateBankingSpecializedTraining(id: string, data: BankingSpecializedTrainingData): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: training } = await supabase
            .from("banking_specialized_training")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!training || (training.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const validated = bankingSpecializedTrainingSchema.parse(data);

        const { error } = await supabase
            .from("banking_specialized_training")
            .update({
                certificate_name: validated.certificateName,
                issuing_authority: validated.issuingAuthority,
                certificate_issue_month: validated.certificateIssueMonth || null,
                status: validated.status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
            console.error("Error updating banking specialized training:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("banking_specialized_training_updated", user.id, "candidate", "banking_specialized_training", id);
        return { success: true };
    } catch (error) {
        console.error("Error in updateBankingSpecializedTraining:", error);
        await logError({ source: "finance-banking-mutations.ts:updateBankingSpecializedTraining", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to update banking specialized training" };
    }
}

export async function deleteBankingSpecializedTraining(id: string): Promise<ActionResponse> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const { data: training } = await supabase
            .from("banking_specialized_training")
            .select("candidate_id, candidates!inner(user_id)")
            .eq("id", id)
            .single();

        if (!training || (training.candidates as unknown as { user_id: string }[])[0].user_id !== user.id) {
            return { success: false, error: "Unauthorized" };
        }

        const { error } = await supabase
            .from("banking_specialized_training")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting banking specialized training:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/candidate/profile");
        await logActivity("banking_specialized_training_deleted", user.id, "candidate", "banking_specialized_training", id);
        return { success: true };
    } catch (error) {
        console.error("Error in deleteBankingSpecializedTraining:", error);
        await logError({ source: "finance-banking-mutations.ts:deleteBankingSpecializedTraining", errorType: "MutationError", message: error instanceof Error ? error.message : String(error) });
        return { success: false, error: "Failed to delete banking specialized training" };
    }
}
