import { z } from "zod";

// Company sizes - reusing from employer-profile-schema
export const COMPANY_SIZES = [
    "1-10",
    "11-50",
    "51-200",
    "201-500",
    "501-1000",
    "1000+",
] as const;

/**
 * Schema for updating company information
 * Only includes fields that are editable after registration
 */
export const companyUpdateSchema = z.object({
    bio: z
        .string()
        .min(10, "Company bio must be at least 10 characters")
        .max(255, "Company bio must be less than 255 characters")
        .trim()
        .optional()
        .or(z.literal("")),

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
        .optional()
        .or(z.literal("")),

    headoffice_location: z
        .string()
        .min(5, "Head office location must be at least 5 characters")
        .max(200, "Head office location must be less than 200 characters")
        .trim(),

    logo_url: z
        .string()
        .optional()
        .or(z.literal("")),

    specialities: z
        .array(z.string().min(2, "Each speciality must be at least 2 characters"))
        .max(10, "Maximum 10 specialities allowed")
        .optional()
        .default([]),

    map_link: z
        .string()
        .refine((val) => !val || val === "" || /^https?:\/\/.+/.test(val), {
            message: "Please enter a valid map link URL (include http:// or https://)",
        })
        .optional()
        .or(z.literal("")),
});

// Type export
export type CompanyUpdateData = z.infer<typeof companyUpdateSchema>;
