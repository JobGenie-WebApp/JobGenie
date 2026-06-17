import { z } from "zod";

// Company sizes
export const COMPANY_SIZES = [
    "1-10",
    "11-50",
    "51-200",
    "201-500",
    "501-1000",
    "1000+",
] as const;

// Company profile completion schema
export const companyProfileCompletionSchema = z.object({
    description: z
        .string()
        .min(50, "Company description must be at least 50 characters")
        .max(2000, "Company description must be less than 2000 characters")
        .trim(),

    company_size: z
        .string()
        .refine((val) => (COMPANY_SIZES as readonly string[]).includes(val), {
            message: "Please select a valid company size",
        }),

    website: z
        .string()
        .refine((val) => !val || val === "" || /^https?:\/\/.+/.test(val), {
            message: "Please enter a valid website URL (include http:// or https://)",
        })
        .optional(),

    headoffice_location: z
        .string()
        .min(5, "Head office location must be at least 5 characters")
        .max(200, "Head office location must be less than 200 characters")
        .trim(),

    logo_url: z
        .string()
        .optional(),
});

// Employer profile completion schema
export const employerProfileCompletionSchema = z.object({
    department: z
        .string()
        .min(2, "Department must be at least 2 characters")
        .max(100, "Department must be less than 100 characters")
        .trim()
        .optional()
        .or(z.literal("")),

    address: z
        .string()
        .refine((val) => !val || val === "" || val.length >= 10, {
            message: "Address must be at least 10 characters",
        })
        .optional(),

    phone: z
        .string()
        .max(15, "Phone number cannot exceed 15 characters")
        .optional()
        .transform((val) => {
            if (!val) return "";
            return val.replace(/[\s-]/g, "");
        })
        .pipe(z.string().regex(/^\+94\d{9}$/, "Phone number must be in the format +947XXXXXXXX").or(z.literal(""))),
});

// Combined profile completion schema
export const profileCompletionSchema = z.object({
    company: companyProfileCompletionSchema,
    employer: employerProfileCompletionSchema,
});

// Type exports
export type CompanyProfileCompletion = z.infer<typeof companyProfileCompletionSchema>;
export type EmployerProfileCompletion = z.infer<typeof employerProfileCompletionSchema>;
export type ProfileCompletion = z.infer<typeof profileCompletionSchema>;
