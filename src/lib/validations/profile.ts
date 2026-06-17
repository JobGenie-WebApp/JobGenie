import { z } from "zod";

// Experience Schema
export const experienceSchema = z.object({
    id: z.string().optional(),
    job_title: z.string().min(1, "Job title is required"),
    company: z.string().min(1, "Company is required"),
    employment_type: z.enum(["full_time", "part_time", "contract", "freelance", "internship"]),
    location: z.string().optional(),
    location_type: z.enum(["on_site", "remote", "hybrid"]).optional(),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().optional(),
    is_current: z.boolean().optional().default(false),
    description: z.string().optional(),
});

// Education Schema
export const educationSchema = z.object({
    id: z.string().optional(),
    education_type: z.enum(["academic", "professional"]),
    degree_diploma: z.string().optional(),
    professional_qualification: z.string().optional(),
    institution: z.string().min(1, "Institution is required"),
    status: z.enum(["incomplete", "first_class", "second_class_upper", "second_class_lower", "general"]),
});

// Finance Academic Education Schema
export const financeAcademicSchema = z.object({
    id: z.string().optional(),
    degree_diploma: z.string().min(1, "Degree/Diploma is required"),
    institution: z.string().min(1, "Institution is required"),
    status: z.enum(["incomplete", "first_class", "second_class_upper", "second_class_lower", "general"]),
});

// Finance Professional Education Schema
export const financeProfessionalSchema = z.object({
    id: z.string().optional(),
    professional_qualification: z.string().min(1, "Professional qualification is required"),
    institution: z.string().min(1, "Institution is required"),
    status: z.enum(["incomplete", "first_class", "second_class_upper", "second_class_lower", "general"]),
});

// Banking Academic Education Schema
export const bankingAcademicSchema = z.object({
    id: z.string().optional(),
    degree_diploma: z.string().min(1, "Degree/Diploma is required"),
    institution: z.string().min(1, "Institution is required"),
    status: z.enum(["incomplete", "first_class", "second_class_upper", "second_class_lower", "general"]),
});

// Banking Professional Education Schema
export const bankingProfessionalSchema = z.object({
    id: z.string().optional(),
    professional_qualification: z.string().min(1, "Professional qualification is required"),
    institution: z.string().min(1, "Institution is required"),
    status: z.enum(["incomplete", "first_class", "second_class_upper", "second_class_lower", "general"]),
});

// Banking Specialized Training Schema
export const bankingTrainingSchema = z.object({
    id: z.string().optional(),
    certificate_name: z.string().min(1, "Certificate name is required"),
    issuing_authority: z.string().min(1, "Issuing authority is required"),
    certificate_issue_month: z.string().min(1, "Issue month is required"),
    status: z.enum(["incomplete", "first_class", "second_class_upper", "second_class_lower", "general"]),
});

// Project Schema
export const projectSchema = z.object({
    id: z.string().optional(),
    project_name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
    demo_url: z.string().url("Invalid URL").optional().or(z.literal("")),
    is_current: z.boolean().default(false),
});

// Certification Schema
export const certificationSchema = z.object({
    id: z.string().optional(),
    certificate_name: z.string().min(1, "Certificate name is required"),
    issuing_authority: z.string().min(1, "Issuing authority is required"),
    issue_date: z.string().optional(),
    expiry_date: z.string().optional(),
    credential_id: z.string().optional(),
    credential_url: z.string().url("Invalid URL").optional().or(z.literal("")),
    description: z.string().optional(),
});

// Award Schema
export const awardSchema = z.object({
    id: z.string().optional(),
    nature_of_award: z.string().min(1, "Award name is required"),
    offered_by: z.string().optional(),
    description: z.string().optional(),
});

// Basic Info Schema
export const professionalQualificationEnum = z.enum([
    "bachelors_degree",
    "masters_degree",
    "doctorate_phd",
    "undergraduate",
    "post_graduate",
    "diploma",
    "certificate",
    "professional_certification",
    "vocational_training",
    "no_formal_education"
]);

export const basicInfoSchema = z.object({
    first_name: z.string().min(1, "First name is required").max(100),
    last_name: z.string().min(1, "Last name is required").max(100),
    nicPassport: z.string().min(1, "NIC/Passport is required").max(20),
    phone: z.string().min(1, "Phone is required").max(20),
    alternative_phone: z.string().max(20).optional(),
    country: z.string().max(100).optional(),
    current_position: z.string().min(1, "Current position is required").max(200),
    highest_qualification: professionalQualificationEnum.optional(),
    profile_image_url: z.string().optional(),
    expected_positions: z
        .array(z.string().min(1).max(200))
        .min(1, "At least one expected position is required")
        .max(3, "Maximum 3 positions allowed"),
});

// About Section Schema
export const aboutSectionSchema = z.object({
    professional_summary: z.string().max(1000).optional(),
    years_of_experience: z.number().int().min(0).max(100).nullable().optional(),
    experience_level: z.enum(["entry", "junior", "mid", "senior"]).optional(),
    expected_monthly_salary: z.number().min(0).nullable().optional(),
    notice_period: z.string().max(50).optional(),
    employment_type: z.enum(["full_time", "part_time", "contract", "internship", "freelance", "volunteer"]).optional(),
    availability_status: z.enum(["available", "open_to_opportunities", "not_looking"]).optional(),
});

// Type exports
export type ExperienceFormData = z.infer<typeof experienceSchema>;
export type EducationFormData = z.infer<typeof educationSchema>;
export type FinanceAcademicFormData = z.infer<typeof financeAcademicSchema>;
export type FinanceProfessionalFormData = z.infer<typeof financeProfessionalSchema>;
export type BankingAcademicFormData = z.infer<typeof bankingAcademicSchema>;
export type BankingProfessionalFormData = z.infer<typeof bankingProfessionalSchema>;
export type BankingTrainingFormData = z.infer<typeof bankingTrainingSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type CertificationFormData = z.infer<typeof certificationSchema>;
export type AwardFormData = z.infer<typeof awardSchema>;
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type AboutSectionFormData = z.infer<typeof aboutSectionSchema>;
