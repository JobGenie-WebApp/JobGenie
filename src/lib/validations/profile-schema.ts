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
export const BANKING_FINANCE_INDUSTRIES = ["banking", "finance_investment"] as const;

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
    demoUrl: z.string().url().max(500).optional().or(z.literal("")),
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
    credentialUrl: z.string().url().max(500).optional().or(z.literal("")),
    description: z.string().optional(),
});

export type CertificateData = z.infer<typeof certificateSchema>;

// ============================================
// FINANCE INDUSTRY - EDUCATION SCHEMAS
// ============================================
export const financeAcademicEducationSchema = z.object({
    id: z.string().optional(),
    degreeDiploma: z.string().min(1, "Degree/Diploma is required").max(200),
    institution: z.string().min(1, "Institution is required").max(200),
    status: z.string().min(1, "Status is required").default("incomplete"),
});

export type FinanceAcademicEducationData = z.infer<typeof financeAcademicEducationSchema>;

export const financeProfessionalEducationSchema = z.object({
    id: z.string().optional(),
    professionalQualification: z.string().min(1, "Professional qualification is required").max(300),
    institution: z.string().min(1, "Institution is required").max(200),
    status: z.string().min(1, "Status is required").default("incomplete"),
});

export type FinanceProfessionalEducationData = z.infer<typeof financeProfessionalEducationSchema>;

// ============================================
// BANKING INDUSTRY - EDUCATION SCHEMAS
// ============================================
export const bankingAcademicEducationSchema = z.object({
    id: z.string().optional(),
    degreeDiploma: z.string().min(1, "Degree/Diploma is required").max(200),
    institution: z.string().min(1, "Institution is required").max(200),
    status: z.string().min(1, "Status is required").default("incomplete"),
});

export type BankingAcademicEducationData = z.infer<typeof bankingAcademicEducationSchema>;

export const bankingProfessionalEducationSchema = z.object({
    id: z.string().optional(),
    professionalQualification: z.string().min(1, "Professional qualification is required").max(300),
    institution: z.string().min(1, "Institution is required").max(200),
    status: z.string().min(1, "Status is required").default("incomplete"),
});

export type BankingProfessionalEducationData = z.infer<typeof bankingProfessionalEducationSchema>;

export const bankingSpecializedTrainingSchema = z.object({
    id: z.string().optional(),
    certificateName: z.string().min(1, "Certificate/Training name is required").max(300),
    issuingAuthority: z.string().min(1, "Issuing Authority/Institution is required").max(200),
    certificateIssueMonth: z.string().optional(),
    status: z.string().min(1, "Status is required").default("incomplete"),
});

export type BankingSpecializedTrainingData = z.infer<typeof bankingSpecializedTrainingSchema>;

// ============================================
// BASIC INFO SCHEMA
// ============================================
export const basicInfoSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    email: z.string().email("Invalid email address").max(255),
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
    // Finance Industry specific
    financeAcademicEducation: z.array(financeAcademicEducationSchema).optional(),
    financeProfessionalEducation: z.array(financeProfessionalEducationSchema).optional(),
    // Banking Industry specific
    bankingAcademicEducation: z.array(bankingAcademicEducationSchema).optional(),
    bankingProfessionalEducation: z.array(bankingProfessionalEducationSchema).optional(),
    bankingSpecializedTraining: z.array(bankingSpecializedTrainingSchema).optional(),
});

export type CompleteProfileData = z.infer<typeof completeProfileSchema>;

// ============================================
// CV EXTRACTION RESULT SCHEMA
// ============================================
export const cvExtractionResultSchema = z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    currentPosition: z.string().optional(),
    yearsOfExperience: z.number().optional(),
    professionalSummary: z.string().optional(),
    workExperiences: z.array(z.object({
        jobTitle: z.string().optional(),
        company: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.string().optional(),
        isCurrent: z.boolean().optional(),
    })).optional(),
    educations: z.array(z.object({
        educationType: z.string().optional(),
        degreeDiploma: z.string().optional(),
        professionalQualification: z.string().optional(),
        institution: z.string().optional(),
        status: z.string().optional(),
    })).optional(),
    skills: z.array(z.string()).optional(),
    certificates: z.array(z.object({
        certificateName: z.string().optional(),
        issuingAuthority: z.string().optional(),
        issueDate: z.string().optional(),
    })).optional(),
    projects: z.array(z.object({
        projectName: z.string().optional(),
        description: z.string().optional(),
        demoUrl: z.string().optional(),
    })).optional(),
    awards: z.array(z.object({
        awardName: z.string().optional(),
        offeredBy: z.string().optional(),
        description: z.string().optional(),
    })).optional(),
});

export type CVExtractionResult = z.infer<typeof cvExtractionResultSchema>;
