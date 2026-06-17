import { z } from "zod";

// Import password strength utilities from candidate schema
import {
    calculatePasswordStrength,
    getStrengthLabel,
    getStrengthColor,
} from "./candidate-schema";

// Re-export password utilities for MIS forms
export { calculatePasswordStrength, getStrengthLabel, getStrengthColor };

// Zod validation schema for MIS user registration
export const misRegistrationSchema = z
    .object({
        firstName: z
            .string()
            .min(2, "First name must be at least 2 characters")
            .max(50, "First name must be less than 50 characters")
            .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),

        lastName: z
            .string()
            .min(2, "Last name must be at least 2 characters")
            .max(50, "Last name must be less than 50 characters")
            .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),

        email: z
            .string()
            .min(1, "Email is required")
            .email("Please enter a valid email address"),

        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[0-9]/, "Password must contain at least one number"),

        confirmPassword: z
            .string()
            .min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export type MISRegistrationData = z.infer<typeof misRegistrationSchema>;

// Zod validation schema for MIS user login
export const misLoginSchema = z.object({
    email: z
        .string()
        .min(1, "Email is required")
        .email("Please enter a valid email address"),

    password: z
        .string()
        .min(1, "Password is required"),
});

export type MISLoginData = z.infer<typeof misLoginSchema>;
