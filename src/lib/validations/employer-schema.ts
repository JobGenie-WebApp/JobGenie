import { z } from "zod";

// Password strength utilities (shared with candidate schema)
export function calculatePasswordStrength(password: string): number {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    return strength;
}

export function getStrengthLabel(strength: number): string {
    switch (strength) {
        case 0:
        case 1:
            return "Weak";
        case 2:
            return "Fair";
        case 3:
            return "Good";
        case 4:
        case 5:
            return "Strong";
        default:
            return "";
    }
}

export function getStrengthColor(strength: number): string {
    switch (strength) {
        case 0:
        case 1:
            return "bg-destructive";
        case 2:
            return "bg-yellow-500";
        case 3:
            return "bg-blue-500";
        case 4:
        case 5:
            return "bg-green-500";
        default:
            return "bg-muted";
    }
}

// Industry options (can be expanded)
export const INDUSTRIES = [
    "Technology/IT",
    "Finance/Banking",
    "Healthcare",
    "Education",
    "Manufacturing",
    "Retail/E-commerce",
    "Construction",
    "Hospitality/Tourism",
    "Agriculture",
    "Transportation/Logistics",
    "Real Estate",
    "Media/Entertainment",
    "Professional Services",
    "Other",
] as const;

// Company Registration Schema (Step 1)
export const companyRegistrationSchema = z.object({
    companyName: z
        .string()
        .min(2, "Company name must be at least 2 characters")
        .max(200, "Company name must be less than 200 characters")
        .trim(),

    businessRegistrationNo: z
        .string()
        .min(3, "Business registration number must be at least 3 characters")
        .max(50, "Business registration number must be less than 50 characters")
        .regex(/^[a-zA-Z0-9\s-/]+$/, "Business registration number can only contain letters, numbers, spaces, hyphens, and slashes")
        .trim(),

    industry: z
        .string()
        .min(1, "Please select an industry"),

    businessRegisteredAddress: z
        .string()
        .min(2, "Business address must be at least 2 characters")
        .max(255, "Business address must be less than 255 characters")
        .trim(),

    brCertificateUrl: z
        .string()
        .url("Invalid certificate URL")
        .optional(),
});

export type CompanyRegistrationData = z.infer<typeof companyRegistrationSchema>;

// Employer Profile Schema (Step 2)
export const employerProfileSchema = z
    .object({
        firstName: z
            .string()
            .min(2, "First name must be at least 2 characters")
            .max(100, "First name must be less than 100 characters")
            .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes")
            .trim(),

        lastName: z
            .string()
            .min(2, "Last name must be at least 2 characters")
            .max(100, "Last name must be less than 100 characters")
            .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes")
            .trim(),

        phone: z
            .string()
            .max(15, "Phone number cannot exceed 15 characters")
            .transform((val) => val.replace(/[\s-]/g, ""))
            .pipe(z.string().regex(/^\+94\d{9}$/, "Phone number must be in the format +947XXXXXXXX")),

        email: z
            .string()
            .min(1, "Email is required")
            .email("Please enter a valid email address")
            .toLowerCase()
            .trim(),

        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[0-9]/, "Password must contain at least one number"),

        confirmPassword: z
            .string()
            .min(1, "Please confirm your password"),

        jobTitle: z
            .string()
            .min(2, "Job title must be at least 2 characters")
            .max(200, "Job title must be less than 200 characters")
            .trim(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export type EmployerProfileData = z.infer<typeof employerProfileSchema>;

// Complete Employer Registration Schema (combines both steps)
export const employerRegistrationSchema = z.object({
    company: companyRegistrationSchema,
    employer: employerProfileSchema,
});

export type EmployerRegistrationData = z.infer<typeof employerRegistrationSchema>;

// BR Certificate Verification Result Schema
export const brVerificationResultSchema = z.object({
    companyName: z.string().optional(),
    registrationNumber: z.string().optional(),
    matchesInput: z.boolean(),
    confidence: z.enum(["high", "medium", "low"]),
    extractedText: z.string().optional(),
});

export type BRVerificationResult = z.infer<typeof brVerificationResultSchema>;
