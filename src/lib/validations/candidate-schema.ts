import { z } from "zod";

// Password strength calculation
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

// Zod validation schema for candidate registration
export const candidateRegistrationSchema = z
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

        nicPassport: z
            .string()
            .regex(/^([0-9]{9}[vV]|[0-9]{12})$/, "NIC must be 9 digits followed by 'V' or 12 digits"),

        gender: z.enum(["male", "female", "other"], {
            message: "Please select a gender",
        }),

        dateOfBirth: z
            .string()
            .min(1, "Date of birth is required")
            .refine((date) => {
                const birthDate = new Date(date);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                const hasHadBirthdayThisYear =
                    today.getMonth() > birthDate.getMonth() ||
                    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
                return age > 18 || (age === 18 && hasHadBirthdayThisYear);
            }, "You must be at least 18 years old"),

        address: z
            .string()
            .min(5, "Address must be at least 5 characters")
            .max(200, "Address must be less than 200 characters"),

        contactNo: z
            .string()
            .max(15, "Phone number cannot exceed 15 characters")
            .transform((val) => val.replace(/[\s-]/g, ""))
            .pipe(z.string().regex(/^\+94\d{9}$/, "Phone number must be in the format +947XXXXXXXX")),

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

export type CandidateRegistrationData = z.infer<typeof candidateRegistrationSchema>;
