import { z } from "zod";

// ============================================
// INDUSTRY TYPES
// ============================================
export const INDUSTRY_OPTIONS = [
    { value: "it_software", label: "Information Technology" },
    { value: "banking", label: "Banking" },
    { value: "finance_investment", label: "Finance & Investment" },
    // { value: "insurance", label: "Insurance" },
    // { value: "fintech", label: "FinTech" },
    // { value: "accounting", label: "Accounting" },
] as const;

export const IT_INDUSTRIES = ["it_software"] as const;

// ============================================
// BASE SCHEMAS
// ============================================
export const genderSchema = z.enum(["male", "female", "other"], {
    message: "Gender is required",
});

export const experienceLevelSchema = z.enum(["entry", "junior", "mid", "senior", "lead", "principal"]);

export const employmentTypeSchema = z.enum(["full_time", "part_time", "contract", "internship", "freelance", "volunteer"]);

export const locationTypeSchema = z.enum(["remote", "hybrid", "onsite"]);

export const educationTypeSchema = z.enum(["academic", "professional"]);

export const educationStatusSchema = z.enum(["incomplete", "first_class", "second_class_upper", "second_class_lower", "general"]);

export const availabilityStatusSchema = z.enum(["available", "open_to_opportunities", "not_looking"]);

export const industryTypeSchema = z.enum(["it_software", "banking", "finance_investment", "other"]);

export const professionalQualificationSchema = z.enum([
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

export const ACADEMIC_EDUCATION_STATUSES = [
    { value: "incomplete", label: "In Progress / Incomplete" },
    { value: "first_class", label: "First Class" },
    { value: "second_class_upper", label: "Second Class Upper" },
    { value: "second_class_lower", label: "Second Class Lower" },
    { value: "general", label: "General" },
];

export const PROFESSIONAL_EDUCATION_STATUSES = [
    { value: "partially_completed", label: "Partially Completed" },
    { value: "completed", label: "Completed" },
];

// ============================================
// WORK EXPERIENCE SCHEMA
// ============================================
export const workExperienceSchema = z.object({
    id: z.string().optional(),
    jobTitle: z.string().min(1, "Job title is required").max(200),
    company: z.string().min(1, "Company is required").max(200),
    employmentType: employmentTypeSchema.optional().default("full_time"),
    location: z.string().max(200).optional(),
    locationType: locationTypeSchema.optional().default("onsite"),
    startDate: z.string().optional(),
    endDate: z.string().optional().nullable(),
    description: z.string().optional(),
    isCurrent: z.boolean().default(false),
});

export type WorkExperienceData = z.infer<typeof workExperienceSchema>;

// ============================================
// EDUCATION SCHEMA
// ============================================
export const educationSchema = z.object({
    id: z.string().optional(),
    educationType: educationTypeSchema.default("academic"),
    degreeDiploma: z.string().min(1, "Degree/Diploma is required").max(200),
    institution: z.string().min(1, "Institution is required").max(200),
    status: z.string().min(1, "Status is required").default("incomplete"),
});

export type EducationData = z.infer<typeof educationSchema>;

// ============================================
// AWARD SCHEMA
// ============================================
export const awardSchema = z.object({
    id: z.string().optional(),
    natureOfAward: z.string().min(1, "Award name is required").max(300),
    offeredBy: z.string().max(200).optional(),
    description: z.string().optional(),
});

export type AwardData = z.infer<typeof awardSchema>;

// ============================================
// IT INDUSTRY - PROJECT SCHEMA
// ============================================
export const projectSchema = z.object({
    id: z.string().optional(),
    projectName: z.string().min(1, "Project name is required").max(200),
    description: z.string().optional(),
    demoUrl: z.url().max(500).optional().or(z.literal("")),
    isCurrent: z.boolean().default(false),
});

export type ProjectData = z.infer<typeof projectSchema>;

// ============================================
// IT INDUSTRY - CERTIFICATE SCHEMA
// ============================================
export const certificateSchema = z.object({
    id: z.string().optional(),
    certificateName: z.string().min(1, "Certificate name is required").max(200),
    issuingAuthority: z.string().max(200).optional(),
    issueDate: z.string().optional(),
    expiryDate: z.string().optional().nullable(),
    credentialId: z.string().max(100).optional(),
    credentialUrl: z.string().max(500).optional().or(z.literal("")),
    description: z.string().optional(),
});

export type CertificateData = z.infer<typeof certificateSchema>;

// ============================================
// BASIC INFO SCHEMA
// ============================================
export const basicInfoSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    email: z.email("Invalid email address").max(255),
    phone: z
        .string()
        .max(15, "Phone number cannot exceed 15 characters")
        .transform((val) => val.replace(/[\s-]/g, ""))
        .pipe(z.string().regex(/^\+94\d{9}$/, "Phone number must be in the format +947XXXXXXXX")),
    alternativePhone: z
        .string()
        .max(15, "Phone number cannot exceed 15 characters")
        .optional()
        .transform((val) => {
            if (!val) return "";
            return val.replace(/[\s-]/g, "");
        })
        .pipe(z.string().regex(/^\+94\d{9}$/, "Phone number must be in the format +947XXXXXXXX").or(z.literal(""))),
    address: z.string().min(1, "Address is required"),
    country: z.string().max(100).optional(),
    currentPosition: z.string().min(1, "Current position is required").max(200),
    yearsOfExperience: z.number().min(0).max(50).default(0),
    experienceLevel: experienceLevelSchema.default("entry"),
    expectedMonthlySalary: z.number().min(0).optional(),
    availabilityStatus: availabilityStatusSchema.default("available"),
    noticePeriod: z.string().max(50).optional(),
    employmentType: employmentTypeSchema.default("full_time"),
    highestQualification: professionalQualificationSchema.optional(),
    profileImageUrl: z.string().optional(),
    expectedPositions: z
        .array(z.string().min(1).max(200))
        .min(1, "At least one expected position is required")
        .max(3, "You can add a maximum of 3 expected positions"),
});

export type BasicInfoData = z.infer<typeof basicInfoSchema>;

// ============================================
// COMPLETE PROFILE SCHEMA
// ============================================
export const completeProfileSchema = z.object({
    industry: industryTypeSchema,
    basicInfo: basicInfoSchema,
    professionalSummary: z.string().min(50, "Professional summary must be at least 50 characters").max(1000),
    workExperiences: z.array(workExperienceSchema),
    educations: z.array(educationSchema),
    awards: z.array(awardSchema),
    // IT Industry specific
    projects: z.array(projectSchema).optional(),
    certificates: z.array(certificateSchema).optional(),
});

export type CompleteProfileData = z.infer<typeof completeProfileSchema>;

// ============================================
// CV EXTRACTION RESULT SCHEMA
// ============================================
// Gemini returns `null` for fields it cannot extract (per the prompt).
// Zod's `.optional()` accepts `undefined` but NOT `null`, so all fields
// that Gemini may null-out must use `.nullish()` (= optional + nullable).
export const cvExtractionResultSchema = z.object({
    firstName: z.string().nullish(),
    lastName: z.string().nullish(),
    email: z.string().nullish(),
    phone: z.string().nullish(),
    alternativePhone: z.string().nullish(),
    address: z.string().nullish(),
    country: z.string().nullish(),
    currentPosition: z.string().nullish(),
    expectedPositions: z.array(z.string().nullish()).nullish(),
    yearsOfExperience: z.number().nullish(),
    highestQualification: z.string().nullish(),
    noticePeriod: z.string().nullish(),
    expectedMonthlySalary: z.number().nullish(),
    professionalSummary: z.string().nullish(),
    workExperiences: z.array(z.object({
        jobTitle: z.string().nullish(),
        company: z.string().nullish(),
        location: z.string().nullish(),
        employmentType: z.string().nullish(),
        locationType: z.string().nullish(),
        startDate: z.string().nullish(),
        endDate: z.string().nullish(),
        description: z.string().nullish(),
        isCurrent: z.boolean().nullish(),
    })).nullish(),
    educations: z.array(z.object({
        educationType: z.string().nullish(),
        degreeDiploma: z.string().nullish(),
        professionalQualification: z.string().nullish(),
        institution: z.string().nullish(),
        status: z.string().nullish(),
    })).nullish(),
    skills: z.array(z.string().nullish()).nullish(),
    certificates: z.array(z.object({
        certificateName: z.string().nullish(),
        issuingAuthority: z.string().nullish(),
        issueDate: z.string().nullish(),
        expiryDate: z.string().nullish(),
        credentialId: z.string().nullish(),
        credentialUrl: z.string().nullish(),
        description: z.string().nullish(),
    })).nullish(),
    projects: z.array(z.object({
        projectName: z.string().nullish(),
        description: z.string().nullish(),
        demoUrl: z.string().nullish(),
        isCurrent: z.boolean().nullish(),
    })).nullish(),
    awards: z.array(z.object({
        awardName: z.string().nullish(),
        offeredBy: z.string().nullish(),
        description: z.string().nullish(),
    })).nullish(),
});

export type CVExtractionResult = z.infer<typeof cvExtractionResultSchema>;
