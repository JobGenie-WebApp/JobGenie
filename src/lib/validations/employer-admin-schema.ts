import { z } from "zod";

/**
 * Validation schema for creating a sub-admin employer
 * Used when super admin invites additional employers to the company
 */
export const subAdminSchema = z.object({
    firstName: z
        .string()
        .min(2, "First name must be at least 2 characters")
        .max(100, "First name must be less than 100 characters")
        .trim(),

    lastName: z
        .string()
        .min(2, "Last name must be at least 2 characters")
        .max(100, "Last name must be less than 100 characters")
        .trim(),

    email: z
        .string()
        .email("Please enter a valid email address")
        .max(255, "Email must be less than 255 characters")
        .toLowerCase()
        .trim(),

    designation: z
        .string()
        .trim()
        .optional()
        .refine((val) => !val || val.length <= 200, {
            message: "Designation must be less than 200 characters"
        }),

    jobTitle: z
        .string()
        .trim()
        .optional()
        .refine((val) => !val || val.length <= 200, {
            message: "Job title must be less than 200 characters"
        }),

    department: z
        .string()
        .trim()
        .optional()
        .refine((val) => !val || val.length <= 100, {
            message: "Department must be less than 100 characters"
        }),

    phone: z
        .string()
        .trim()
        .optional()
        .refine((val) => !val || val === "" || /^[\d\s\-\+\(\)]+$/.test(val), {
            message: "Please enter a valid phone number"
        })
        .refine((val) => !val || val.length <= 20, {
            message: "Phone number must be less than 20 characters"
        }),
});

export type SubAdminFormData = z.infer<typeof subAdminSchema>;
