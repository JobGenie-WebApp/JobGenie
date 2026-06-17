"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    candidateRegistrationSchema,
    type CandidateRegistrationData,
} from "@/lib/validations/candidate-schema";
import { employerRegistrationSchema } from "@/lib/validations/employer-schema";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import {
    generateVerificationCode,
    getVerificationExpiry,
    sendVerificationEmail,
} from "@/lib/email";
import crypto from "crypto";
import { insertCandidateRegistrationDirect } from "@/lib/db/candidate-registration-direct";
import { verifyEmailCodeDirect } from "@/lib/db/verify-email-direct";
import { generateMembershipNumber } from "@/lib/utils/membership";
import { logAuth, logError, getRequestInfo } from "@/lib/logger";

export type ActionState = {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
    redirectTo?: string;
};

export async function registerCandidate(
    _prevState: ActionState | null,
    formData: FormData
): Promise<ActionState> {
    // Extract form data
    const rawData = {
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        nicPassport: formData.get("nicPassport") as string,
        gender: formData.get("gender") as string,
        dateOfBirth: formData.get("dateOfBirth") as string,
        address: formData.get("address") as string,
        contactNo: formData.get("contactNo") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        confirmPassword: formData.get("confirmPassword") as string,
    };

    // Validate with Zod
    const validationResult = candidateRegistrationSchema.safeParse(rawData);

    if (!validationResult.success) {
        const errors: Record<string, string[]> = {};
        validationResult.error.issues.forEach((issue) => {
            const path = issue.path.join(".");
            if (!errors[path]) {
                errors[path] = [];
            }
            errors[path].push(issue.message);
        });

        return {
            success: false,
            message: "Validation failed. Please check your inputs.",
            errors,
        };
    }

    const data: CandidateRegistrationData = validationResult.data;

    try {
        const supabase = await createClient();
        const adminClient = createAdminClient();

        const { ipAddress } = await getRequestInfo();

        // Sign up the user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    first_name: data.firstName,
                    last_name: data.lastName,
                    user_type: "candidate",
                },
            },
        });

        if (authError) {
            return {
                success: false,
                message: authError.message,
            };
        }

        if (!authData.user) {
            return {
                success: false,
                message: "Failed to create user account.",
            };
        }

        const now = new Date().toISOString();

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationExpiry = getVerificationExpiry();

        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Prefer direct Postgres (DATABASE_URL): avoids PostgREST PGRST002 / schema-cache failures.
        const direct = await insertCandidateRegistrationDirect({
            userId: authData.user.id,
            email: data.email,
            hashedPassword,
            verificationCode,
            verificationExpiresAt: new Date(verificationExpiry.isoString),
            firstName: data.firstName,
            lastName: data.lastName,
            nicPassport: data.nicPassport,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth,
            address: data.address,
            contactNo: data.contactNo,
        });

        if (direct.ok) {
            // done
        } else if (direct.reason === "no_database_url") {
            const { error: userError } = await adminClient.from("users").insert({
                id: authData.user.id,
                email: data.email,
                password: hashedPassword,
                role: "candidate",
                status: "pending_verification",
                email_verified: false,
                email_verification_token: verificationCode,
                verification_token_expires_at: verificationExpiry.isoString,
                created_at: now,
                updated_at: now,
            });

            if (userError) {
                console.error("User table insert error:", userError);
                return {
                    success: false,
                    message: "Account created but user setup failed. Please contact support.",
                };
            }

            const membershipNumber = await generateMembershipNumber();

            const { error: profileError } = await adminClient.from("candidates").insert({
                user_id: authData.user.id,
                first_name: data.firstName,
                last_name: data.lastName,
                nicPassport: data.nicPassport,
                gender: data.gender,
                dob: data.dateOfBirth,
                address: data.address,
                contact_no: data.contactNo,
                phone: data.contactNo,
                email: data.email,
                current_position: "",
                industry: "",
                membership_no: membershipNumber,
                created_at: now,
                updated_at: now,
            });

            if (profileError) {
                console.error("Profile creation error:", profileError);
                return {
                    success: false,
                    message: "Account created but profile setup failed. Please contact support.",
                };
            }
        } else {
            console.error("Candidate registration (direct DB) failed:", direct.message);
            return {
                success: false,
                message: "Account created but user setup failed. Please contact support.",
            };
        }

        // Send verification email
        const emailResult = await sendVerificationEmail(
            data.email,
            verificationCode,
            data.firstName
        );

        if (!emailResult.success) {
            console.error("Failed to send verification email");
            // Don't fail registration, just log the error
        }

        // Success - return redirect URL for verify-email page
        await logAuth("candidate_signup_success", authData.user.id, "candidate", { email: data.email }, ipAddress || undefined);
        return {
            success: true,
            message: "Account created successfully! Please check your email for the verification code.",
            redirectTo: `/candidate/verify-email?email=${encodeURIComponent(data.email)}`,
        };
    } catch (error) {
        console.error("Registration error:", error);
        await logError({ source: "auth.ts:registerCandidate", errorType: "RegistrationError", message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        return {
            success: false,
            message: "An unexpected error occurred. Please try again.",
        };
    }
}

export async function verifyEmail(
    _prevState: ActionState | null,
    formData: FormData
): Promise<ActionState> {
    const email = formData.get("email") as string;
    const code = formData.get("code") as string;

    if (!email || !code) {
        return {
            success: false,
            message: "Email and verification code are required.",
        };
    }

    if (code.length !== 6 || !/^\d+$/.test(code)) {
        return {
            success: false,
            message: "Please enter a valid 6-digit verification code.",
        };
    }

    const emailNorm = email.trim();

    try {
        // Bypass PostgREST when possible: same PGRST002/schema-cache failures as signup
        // were returning a misleading "User not found" because any findError used that branch.
        const direct = await verifyEmailCodeDirect(emailNorm, code);
        if (direct.ok) {
            const supabase = await createClient();
            await supabase.auth.signOut();
            const { ipAddress } = await getRequestInfo();
            await logAuth(
                "email_verified",
                direct.userId,
                undefined,
                { email: emailNorm },
                ipAddress || undefined
            );
            return {
                success: true,
                message: "Email verified successfully! You can now log in.",
                redirectTo: "/login",
            };
        }

        if (direct.reason !== "no_database_url") {
            if (direct.reason === "not_found") {
                return {
                    success: false,
                    message: "User not found. Please register again.",
                };
            }
            if (direct.reason === "already_verified") {
                return {
                    success: true,
                    message: "Email already verified. You can log in.",
                    redirectTo: "/login",
                };
            }
            if (direct.reason === "invalid_code") {
                return {
                    success: false,
                    message: "Invalid verification code. Please try again.",
                };
            }
            if (direct.reason === "expired") {
                return {
                    success: false,
                    message: "Verification code has expired. Please request a new one.",
                };
            }
            console.error("verifyEmailCodeDirect:", direct.message);
            return {
                success: false,
                message: "Failed to verify email. Please try again.",
            };
        }

        const adminClient = createAdminClient();

        const { data: user, error: findError } = await adminClient
            .from("users")
            .select("id, email_verification_token, verification_token_expires_at, email_verified")
            .eq("email", emailNorm)
            .single();

        if (findError || !user) {
            if (findError?.code === "PGRST116") {
                return {
                    success: false,
                    message: "User not found. Please register again.",
                };
            }
            if (
                findError?.code === "PGRST002" ||
                (typeof findError?.message === "string" &&
                    findError.message.includes("schema cache"))
            ) {
                console.error("verifyEmail lookup (PostgREST / schema cache):", findError);
                return {
                    success: false,
                    message:
                        "Verification is temporarily unavailable. Please try again in a minute.",
                };
            }
            console.error("verifyEmail lookup:", findError);
            return {
                success: false,
                message: "Could not verify right now. Please try again.",
            };
        }

        if (user.email_verified) {
            return {
                success: true,
                message: "Email already verified. You can log in.",
                redirectTo: "/login",
            };
        }

        const storedToken = user.email_verification_token || "";
        const isCodeValid =
            storedToken.length === code.length &&
            crypto.timingSafeEqual(Buffer.from(storedToken), Buffer.from(code));

        if (!isCodeValid) {
            return {
                success: false,
                message: "Invalid verification code. Please try again.",
            };
        }

        const storedExpiry = user.verification_token_expires_at;
        if (!storedExpiry || new Date(storedExpiry).getTime() < Date.now()) {
            return {
                success: false,
                message: "Verification code has expired. Please request a new one.",
            };
        }

        const { error: updateError } = await adminClient
            .from("users")
            .update({
                email_verified: true,
                status: "active",
                email_verification_token: null,
                verification_token_expires_at: null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        if (updateError) {
            console.error("Verification update error:", updateError);
            return {
                success: false,
                message: "Failed to verify email. Please try again.",
            };
        }

        const supabase = await createClient();
        await supabase.auth.signOut();

        const { ipAddress } = await getRequestInfo();
        await logAuth("email_verified", user.id, undefined, { email: emailNorm }, ipAddress || undefined);
        return {
            success: true,
            message: "Email verified successfully! You can now log in.",
            redirectTo: "/login",
        };
    } catch (error) {
        console.error("Verification error:", error);
        await logError({ source: "auth.ts:verifyEmail", errorType: "VerificationError", message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        return {
            success: false,
            message: "An unexpected error occurred. Please try again.",
        };
    }
}

export async function resendVerificationCode(
    email: string
): Promise<ActionState> {
    if (!email) {
        return {
            success: false,
            message: "Email is required.",
        };
    }

    try {
        // Use admin client to bypass RLS for verification operations
        const adminClient = createAdminClient();

        // Find user by email
        const { data: user, error: findError } = await adminClient
            .from("users")
            .select("id, email_verified")
            .eq("email", email)
            .single();

        if (findError || !user) {
            return {
                success: false,
                message: "User not found.",
            };
        }

        if (user.email_verified) {
            return {
                success: true,
                message: "Email already verified.",
            };
        }

        // Generate new code
        const verificationCode = generateVerificationCode();
        const verificationExpiry = getVerificationExpiry();



        // Update user with new code
        const { error: updateError } = await adminClient
            .from("users")
            .update({
                email_verification_token: verificationCode,
                verification_token_expires_at: verificationExpiry.isoString,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        if (updateError) {
            console.error("Resend code update error:", updateError);
            return {
                success: false,
                message: "Failed to generate new code. Please try again.",
            };
        }

        // Get user's first name for email
        const { data: candidate } = await adminClient
            .from("candidates")
            .select("first_name")
            .eq("user_id", user.id)
            .single();

        // Send new verification email
        await sendVerificationEmail(
            email,
            verificationCode,
            candidate?.first_name || "User"
        );

        return {
            success: true,
            message: "New verification code sent! Please check your email.",
        };
    } catch (error) {
        console.error("Resend verification error:", error);
        await logError({ source: "auth.ts:resendVerificationCode", errorType: "ResendVerificationError", message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        return {
            success: false,
            message: "An unexpected error occurred. Please try again.",
        };
    }
}

export async function loginCandidate(
    _prevState: ActionState | null,
    formData: FormData
): Promise<ActionState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Basic validation
    if (!email || !password) {
        return {
            success: false,
            message: "Email and password are required.",
        };
    }

    try {
        // Use admin client to check user status (bypasses RLS)
        // This is needed because RLS policies block queries before authentication
        const adminClient = createAdminClient();
        const supabase = await createClient();

        const { ipAddress } = await getRequestInfo();

        // First check if user exists and is a candidate with verified email
        const { data: userData, error: userError } = await adminClient
            .from("users")
            .select("role, status, email_verified")
            .eq("email", email)
            .single();

        if (userError || !userData) {
            return {
                success: false,
                message: "Invalid email or password.",
            };
        }

        // Check if user is a candidate
        if (userData.role !== "candidate") {
            return {
                success: false,
                message: "Invalid email or password.",
            };
        }

        // Check email verification status
        if (!userData.email_verified) {
            return {
                success: false,
                message: "Please verify your email before logging in.",
                redirectTo: `/candidate/verify-email?email=${encodeURIComponent(email)}`,
            };
        }

        // Check account status
        if (userData.status !== "active") {
            return {
                success: false,
                message: "Your account is not active. Please contact support.",
            };
        }

        // Use Supabase Auth for login - this handles session automatically
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            console.error("Supabase auth error:", authError);
            await logAuth("candidate_login_failed", undefined, "candidate", { email, reason: "invalid_credentials" }, ipAddress || undefined);
            return {
                success: false,
                message: "Invalid email or password.",
            };
        }

        if (!authData.session) {
            return {
                success: false,
                message: "Failed to create session. Please try again.",
            };
        }

        // Debug: Log session details (remove in production)
        /*console.log("=== LOGIN DEBUG ===");
        console.log("Session exists:", !!authData.session);
        console.log("Access token (first 50 chars):", authData.session.access_token?.substring(0, 50));
        console.log("User ID:", authData.user?.id);
        console.log("===================");*/

        // Check if profile is completed
        const { data: candidateData } = await supabase
            .from("candidates")
            .select("profile_completed")
            .eq("user_id", authData.user.id)
            .single();

        // Redirect based on profile completion status
        const redirectTo = candidateData?.profile_completed
            ? "/candidate/dashboard"
            : "/candidate/create-profile";

        await logAuth("candidate_login_success", authData.user.id, "candidate", { email }, ipAddress || undefined);
        return {
            success: true,
            message: "Login successful!",
            redirectTo,
        };
    } catch (error) {
        console.error("Login error:", error);
        await logError({ source: "auth.ts:loginCandidate", errorType: "LoginError", message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        return {
            success: false,
            message: "An unexpected error occurred. Please try again.",
        };
    }
}

// ============================================
// MIS USER REGISTRATION & AUTHENTICATION
// ============================================

export async function registerMISUser(
    _prevState: ActionState | null,
    formData: FormData
): Promise<ActionState> {
    // Extract form data
    const rawData = {
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        confirmPassword: formData.get("confirmPassword") as string,
    };

    // Import validation schema dynamically
    const { misRegistrationSchema } = await import("@/lib/validations/mis-schema");

    // Validate with Zod
    const validationResult = misRegistrationSchema.safeParse(rawData);

    if (!validationResult.success) {
        const errors: Record<string, string[]> = {};
        validationResult.error.issues.forEach((issue) => {
            const path = issue.path.join(".");
            if (!errors[path]) {
                errors[path] = [];
            }
            errors[path].push(issue.message);
        });

        return {
            success: false,
            message: "Validation failed. Please check your inputs.",
            errors,
        };
    }

    const data = validationResult.data;

    try {
        // Create Supabase clients
        const supabase = await createClient();
        const adminClient = createAdminClient();

        // Check if any MIS user already exists (only one can register publicly)
        const { count: misCount, error: countError } = await adminClient
            .from("mis_user")
            .select("*", { count: "exact", head: true });

        if (countError) {
            console.error("Error checking MIS user count:", countError);
            return {
                success: false,
                message: "Unable to verify registration eligibility. Please try again.",
            };
        }

        if (misCount && misCount > 0) {
            return {
                success: false,
                message: "MIS admin already exists in the system. Please contact your system administrator for access.",
            };
        }

        // Sign up the user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    first_name: data.firstName,
                    last_name: data.lastName,
                    user_type: "mis",
                },
            },
        });

        if (authError) {
            return {
                success: false,
                message: authError.message,
            };
        }

        if (!authData.user) {
            return {
                success: false,
                message: "Failed to create user account.",
            };
        }

        const now = new Date().toISOString();

        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Use admin client to bypass RLS for user creation
        // Create entry in the users table with active status (no verification needed)
        const { error: userError } = await adminClient.from("users").insert({
            id: authData.user.id,
            email: data.email,
            password: hashedPassword,
            role: "mis",
            status: "active", // MIS users are active immediately
            email_verified: true, // No email verification required
            created_at: now,
            updated_at: now,
        });

        if (userError) {
            console.error("User table insert error:", userError);
            return {
                success: false,
                message: "Account created but user setup failed. Please contact support.",
            };
        }

        // Store MIS user profile data using admin client
        const { error: misUserError } = await adminClient.from("mis_user").insert({
            user_id: authData.user.id,
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            created_at: now,
            updated_at: now,
        });

        if (misUserError) {
            console.error("MIS user creation error:", misUserError);
            return {
                success: false,
                message: "Account created but profile setup failed. Please contact support.",
            };
        }

        // Auto-login after registration
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });

        if (signInError) {
            console.error("Auto-login error:", signInError);
            return {
                success: true,
                message: "Account created successfully! Please login.",
                redirectTo: "/mis/login",
            };
        }

        // Success - redirect to MIS dashboard
        const { ipAddress } = await getRequestInfo();
        await logAuth("mis_signup_success", authData.user.id, "mis", { email: data.email }, ipAddress || undefined);
        return {
            success: true,
            message: "Account created successfully! Redirecting to dashboard...",
            redirectTo: "/mis/dashboard",
        };
    } catch (error) {
        console.error("MIS registration error:", error);
        await logError({ source: "auth.ts:registerMISUser", errorType: "MISRegistrationError", message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        return {
            success: false,
            message: "An unexpected error occurred. Please try again.",
        };
    }
}

export async function loginMISUser(
    _prevState: ActionState | null,
    formData: FormData
): Promise<ActionState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Basic validation
    if (!email || !password) {
        return {
            success: false,
            message: "Email and password are required.",
        };
    }

    try {
        // Use admin client to check user status (bypasses RLS)
        const adminClient = createAdminClient();
        const supabase = await createClient();

        const { ipAddress } = await getRequestInfo();

        // First check if user exists and is a MIS user
        const { data: userData, error: userError } = await adminClient
            .from("users")
            .select("role, status")
            .eq("email", email)
            .single();

        if (userError || !userData) {
            return {
                success: false,
                message: "Invalid email or password.",
            };
        }

        // Check if user is a MIS user
        if (userData.role !== "mis") {
            return {
                success: false,
                message: "Invalid email or password.",
            };
        }

        // Check account status
        if (userData.status !== "active") {
            return {
                success: false,
                message: "Your account is not active. Please contact support.",
            };
        }

        // Use Supabase Auth for login - this handles session automatically
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            console.error("Supabase auth error:", authError);
            return {
                success: false,
                message: "Invalid email or password.",
            };
        }

        if (!authData.session) {
            return {
                success: false,
                message: "Failed to create session. Please try again.",
            };
        }

        // Success - redirect to MIS dashboard
        await logAuth("mis_login_success", authData.user.id, "mis", { email }, ipAddress || undefined);
        return {
            success: true,
            message: "Login successful!",
            redirectTo: "/mis/dashboard",
        };
    } catch (error) {
        console.error("MIS login error:", error);
        await logError({ source: "auth.ts:loginMISUser", errorType: "MISLoginError", message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        return {
            success: false,
            message: "An unexpected error occurred. Please try again.",
        };
    }
}

// ============================================
// MIS USER MANAGEMENT (Admin-Only)
// ============================================

export async function addMISUser(
    _prevState: ActionState | null,
    formData: FormData
): Promise<ActionState> {
    // Extract form data (including role_id; empty = none — optional)
    const roleIdRaw = formData.get("roleId");
    const roleId =
        roleIdRaw === null || roleIdRaw === "" ? null : (roleIdRaw as string);
    const rawData = {
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        email: formData.get("email") as string,
        roleId,
    };

    // Validate with Zod (simplified schema without password)
    const z = await import("zod");
    const inviteSchema = z.z.object({
        firstName: z.z.string().min(2, "First name must be at least 2 characters").max(50),
        lastName: z.z.string().min(2, "Last name must be at least 2 characters").max(50),
        email: z.z.string().email("Please enter a valid email address"),
        roleId: z.z.string().uuid("Please select a valid role").nullable().optional(),
    });

    const validationResult = inviteSchema.safeParse(rawData);

    if (!validationResult.success) {
        const errors: Record<string, string[]> = {};
        validationResult.error.issues.forEach((issue) => {
            const path = issue.path.join(".");
            if (!errors[path]) {
                errors[path] = [];
            }
            errors[path].push(issue.message);
        });

        return {
            success: false,
            message: "Validation failed. Please check your inputs.",
            errors,
        };
    }

    const data = validationResult.data;

    try {
        // Verify that the requester is an authenticated MIS admin
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                message: "You must be logged in to add MIS users.",
            };
        }

        // Check if the requesting user is a MIS admin with proper permissions
        const adminClient = createAdminClient();
        const { data: misUserData, error: misUserError } = await adminClient
            .from("mis_user")
            .select("is_super_admin, role_id, role:mis_roles(id, name)")
            .eq("user_id", user.id)
            .single();

        if (misUserError || !misUserData) {
            return {
                success: false,
                message: "You do not have permission to add MIS users.",
            };
        }

        // Only super admins can add MIS users
        if (!misUserData.is_super_admin) {
            return {
                success: false,
                message: "Only super administrators can add MIS users.",
            };
        }

        // Check if email already exists
        const { data: existingUser, error: checkError } = await adminClient
            .from("users")
            .select("id")
            .eq("email", data.email)
            .maybeSingle();

        if (checkError) {
            console.error("Error checking existing user:", checkError);
            return {
                success: false,
                message: "Error checking email. Please try again.",
            };
        }

        if (existingUser) {
            return {
                success: false,
                message: "A user with this email already exists.",
            };
        }

        // If roleId is provided, validate it exists
        if (data.roleId) {
            const { data: roleExists, error: roleError } = await adminClient
                .from("mis_roles")
                .select("id")
                .eq("id", data.roleId)
                .eq("is_active", true)
                .maybeSingle();

            if (roleError || !roleExists) {
                return {
                    success: false,
                    message: "Selected role is invalid or inactive.",
                };
            }
        }

        // Generate invitation token and temporary password
        const { generateInvitationToken, getInvitationExpiry } = await import("@/lib/email");
        const invitationToken = generateInvitationToken();
        const invitationExpiry = getInvitationExpiry();

        // Generate a secure temporary password (12 characters)
        const tempPassword = crypto.randomBytes(6).toString('hex'); // 12 char hex string
        const hashedTempPassword = await bcrypt.hash(tempPassword, 12);

        const now = new Date().toISOString();
        const userId = crypto.randomUUID();

        // Create user record with temporary password
        const { error: dbUserError } = await adminClient.from("users").insert({
            id: userId,
            email: data.email,
            password: hashedTempPassword, // Use temporary password
            role: "mis",
            status: "pending_verification", // Will be changed to active after password setup
            email_verified: false,
            invitation_token: invitationToken,
            invitation_token_expires_at: invitationExpiry.isoString,
            invited_by: user.id,
            created_at: now,
            updated_at: now,
        });

        if (dbUserError) {
            console.error("User creation error:", dbUserError);
            return {
                success: false,
                message: "Failed to create user invitation. Please try again.",
            };
        }

        // Create MIS user profile (without auth user yet)
        const { error: misUserInsertError } = await adminClient.from("mis_user").insert({
            user_id: userId,
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            role_id: data.roleId || null,
            is_super_admin: false, // New users are never super admin by default
            created_at: now,
            updated_at: now,
        });

        if (misUserInsertError) {
            console.error("MIS user creation error:", misUserInsertError);
            // Cleanup user record
            await adminClient.from("users").delete().eq("id", userId);
            return {
                success: false,
                message: "Failed to create MIS user profile. Please try again.",
            };
        }

        // Send invitation email with temporary password
        const { sendMISInvitationEmail } = await import("@/lib/email");
        const emailResult = await sendMISInvitationEmail(
            data.email,
            data.firstName,
            invitationToken,
            tempPassword // Pass temporary password to email
        );

        if (!emailResult.success) {
            // Email failed but user created - admin should retry
            console.error("Email sending failed:", emailResult.error);
            return {
                success: false,
                message: "User created but failed to send invitation email. Please contact support.",
            };
        }

        await logAuth("mis_user_invited", user.id, "mis", { invitedEmail: data.email });
        return {
            success: true,
            message: `Invitation sent to ${data.email}. The user will receive setup instructions via email.`,
            redirectTo: "/mis/users",
        };
    } catch (error) {
        console.error("Add MIS user error:", error);
        await logError({ source: "auth.ts:addMISUser", errorType: "AddMISUserError", message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        return {
            success: false,
            message: "An unexpected error occurred. Please try again.",
        };
    }
}

// ============================================
// MIS PASSWORD SETUP (Invitation Flow)
// ============================================

export async function setupMISPassword(
    _prevState: ActionState | null,
    formData: FormData
): Promise<ActionState> {
    const rawData = {
        token: formData.get("token") as string,
        tempPassword: formData.get("tempPassword") as string,
        password: formData.get("password") as string,
        confirmPassword: formData.get("confirmPassword") as string,
    };

    // Validate inputs
    const z = await import("zod");
    const setupSchema = z.z.object({
        token: z.z.string().min(1, "Invitation token is required"),
        tempPassword: z.z.string().min(1, "Temporary password is required"),
        password: z.z.string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/[0-9]/, "Password must contain at least one number"),
        confirmPassword: z.z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

    const validationResult = setupSchema.safeParse(rawData);

    if (!validationResult.success) {
        const errors: Record<string, string[]> = {};
        validationResult.error.issues.forEach((issue) => {
            const path = issue.path.join(".");
            if (!errors[path]) {
                errors[path] = [];
            }
            errors[path].push(issue.message);
        });

        return {
            success: false,
            message: "Validation failed. Please check your inputs.",
            errors,
        };
    }

    const data = validationResult.data;

    try {
        const adminClient = createAdminClient();

        // Find user by invitation token
        const { data: user, error: userError } = await adminClient
            .from("users")
            .select("id, email, password, invitation_token_expires_at, role")
            .eq("invitation_token", data.token)
            .maybeSingle();

        if (userError || !user) {
            return {
                success: false,
                message: "Invalid or expired invitation link. Please contact your administrator.",
            };
        }



        // Verify temporary password matches
        const tempPasswordMatch = await bcrypt.compare(data.tempPassword, user.password);
        if (!tempPasswordMatch) {
            return {
                success: false,
                message: "Incorrect temporary password. Please check your email and try again.",
                errors: {
                    tempPassword: ["The temporary password is incorrect"],
                },
            };
        }

        // Check token expiration
        if (user.invitation_token_expires_at) {
            const expiryDate = new Date(user.invitation_token_expires_at);
            if (expiryDate.getTime() < Date.now()) {
                return {
                    success: false,
                    message: "This invitation has expired. Please contact your administrator for a new invitation.",
                };
            }
        }

        // Verify this is for MIS role
        if (user.role !== "mis") {
            return {
                success: false,
                message: "Invalid invitation type.",
            };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 12);

        // Create Supabase Auth user using admin client
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: user.email,
            password: data.password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                user_type: "mis",
            },
        });

        if (authError) {
            console.error("Supabase auth user creation error:", authError);
            return {
                success: false,
                message: "Failed to create authentication account. Please try again.",
            };
        }

        if (!authData.user || authData.user.id !== user.id) {
            // If IDs don't match, there might be an issue
            console.warn("Auth user ID mismatch - this is expected for pre-created users");
        }

        const now = new Date().toISOString();

        // Update user record - activate and clear invitation token
        const { error: updateError } = await adminClient
            .from("users")
            .update({
                password: hashedPassword,
                status: "active",
                email_verified: true,
                invitation_token: null,
                invitation_token_expires_at: null,
                updated_at: now,
            })
            .eq("id", user.id);

        if (updateError) {
            console.error("User update error:", updateError);
            return {
                success: false,
                message: "Failed to complete setup. Please try again.",
            };
        }


        await logAuth("mis_password_setup_success", user.id, "mis", { email: user.email });
        return {
            success: true,
            message: "Password created successfully! You can now log in with your credentials.",
            redirectTo: "/mis/login",
        };
    } catch (error) {
        console.error("Setup password error:", error);
        await logError({ source: "auth.ts:setupMISPassword", errorType: "SetupPasswordError", message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        return {
            success: false,
            message: "An unexpected error occurred. Please try again.",
        };
    }
}

// ============================================
// EMPLOYER REGISTRATION & AUTHENTICATION
// ============================================

export async function registerEmployer(
    _prevState: ActionState | null,
    formData: FormData
): Promise<ActionState> {
    try {
        // Extract company data (Step 1)
        const companyData = {
            companyName: formData.get("companyName") as string,
            businessRegistrationNo: formData.get("businessRegistrationNo") as string,
            industry: formData.get("industry") as string,
            businessRegisteredAddress: formData.get("businessRegisteredAddress") as string,
            brCertificateUrl: formData.get("brCertificateUrl") as string,
        };

        // Extract employer data (Step 2)
        const employerData = {
            firstName: formData.get("firstName") as string,
            lastName: formData.get("lastName") as string,
            phone: formData.get("phone") as string,
            email: formData.get("email") as string,
            password: formData.get("password") as string,
            confirmPassword: formData.get("confirmPassword") as string,
            jobTitle: formData.get("jobTitle") as string,
        };

        // Validate with Zod
        const validationResult = employerRegistrationSchema.safeParse({
            company: companyData,
            employer: employerData,
        });

        if (!validationResult.success) {
            const errors: Record<string, string[]> = {};
            validationResult.error.issues.forEach((issue) => {
                const path = issue.path.join(".");
                if (!errors[path]) {
                    errors[path] = [];
                }
                errors[path].push(issue.message);
            });

            return {
                success: false,
                message: "Validation failed. Please check your inputs.",
                errors,
            };
        }

        const validatedData = validationResult.data;

        // Create Supabase clients
        const supabase = await createClient();
        const adminClient = createAdminClient();

        // Check if email already exists
        const { data: existingUser } = await adminClient
            .from("users")
            .select("id")
            .eq("email", validatedData.employer.email)
            .single();

        if (existingUser) {
            return {
                success: false,
                message: "An account with this email already exists.",
            };
        }

        // Check if business registration number already exists
        const { data: existingCompany } = await adminClient
            .from("companies")
            .select("id")
            .eq("business_registration_no", validatedData.company.businessRegistrationNo)
            .single();

        if (existingCompany) {
            return {
                success: false,
                message: "A company with this business registration number is already registered.",
            };
        }

        // Sign up the user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: validatedData.employer.email,
            password: validatedData.employer.password,
            options: {
                data: {
                    first_name: validatedData.employer.firstName,
                    last_name: validatedData.employer.lastName,
                    user_type: "employer",
                },
            },
        });

        if (authError) {
            return {
                success: false,
                message: authError.message,
            };
        }

        if (!authData.user) {
            return {
                success: false,
                message: "Failed to create user account.",
            };
        }

        const now = new Date().toISOString();

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationExpiry = getVerificationExpiry();

        // Hash the password before storing
        const hashedPassword = await bcrypt.hash(validatedData.employer.password, 12);

        // Create user entry
        const { error: userError } = await adminClient.from("users").insert({
            id: authData.user.id,
            email: validatedData.employer.email,
            password: hashedPassword,
            role: "employer",
            status: "pending_verification",
            email_verified: false,
            email_verification_token: verificationCode,
            verification_token_expires_at: verificationExpiry.isoString,
            created_at: now,
            updated_at: now,
        });

        if (userError) {
            console.error("User table insert error:", userError);
            return {
                success: false,
                message: "Account created but user setup failed. Please contact support.",
            };
        }

        // Create company entry
        const { data: companyRecord, error: companyError } = await adminClient
            .from("companies")
            .insert({
                company_name: validatedData.company.companyName,
                business_registration_no: validatedData.company.businessRegistrationNo,
                industry: validatedData.company.industry,
                business_registered_address: validatedData.company.businessRegisteredAddress,
                br_certificate_url: validatedData.company.brCertificateUrl || "",
                phone: validatedData.employer.phone, // Use employer phone for company
                approval_status: "pending",
                created_at: now,
                updated_at: now,
            })
            .select("id")
            .single();

        if (companyError || !companyRecord) {
            console.error("Company creation error:", companyError);
            return {
                success: false,
                message: "Account created but company setup failed. Please contact support.",
            };
        }

        // Create employer profile with super admin flag
        const { error: employerError } = await adminClient.from("employers").insert({
            user_id: authData.user.id,
            company_id: companyRecord.id,
            first_name: validatedData.employer.firstName,
            last_name: validatedData.employer.lastName,
            email: validatedData.employer.email,
            phone: validatedData.employer.phone,
            job_title: validatedData.employer.jobTitle,
            address: validatedData.company.businessRegisteredAddress, // Use company address initially
            is_super_admin: true, // Mark as super admin (company creator)
            created_at: now,
            updated_at: now,
        });

        if (employerError) {
            console.error("Employer profile creation error:", employerError);
            return {
                success: false,
                message: "Account created but profile setup failed. Please contact support.",
            };
        }

        // Send verification email
        const emailResult = await sendVerificationEmail(
            validatedData.employer.email,
            verificationCode,
            validatedData.employer.firstName
        );

        if (!emailResult.success) {
            console.error("Failed to send verification email");
            // Don't fail registration, just log the error
        }

        await logAuth("employer_signup_success", authData.user.id, "employer", { email: validatedData.employer.email, companyName: validatedData.company.companyName });
        return {
            success: true,
            message: "Account created successfully! Please check your email for the verification code.",
            redirectTo: `/employer/verify-email?email=${encodeURIComponent(validatedData.employer.email)}`,
        };
    } catch (error) {
        console.error("Employer registration error:", error);
        await logError({ source: "auth.ts:registerEmployer", errorType: "EmployerRegistrationError", message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        return {
            success: false,
            message: "An unexpected error occurred. Please try again.",
        };
    }
}

export async function loginEmployer(
    _prevState: ActionState | null,
    formData: FormData
): Promise<ActionState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Basic validation
    if (!email || !password) {
        return {
            success: false,
            message: "Email and password are required.",
        };
    }

    try {
        // Use admin client to check user status (bypasses RLS)
        const adminClient = createAdminClient();
        const supabase = await createClient();

        // First check if user exists and is an employer with verified email
        const { data: userData, error: userError } = await adminClient
            .from("users")
            .select("role, status, email_verified")
            .eq("email", email)
            .single();

        if (userError || !userData) {
            return {
                success: false,
                message: "Invalid email or password.",
            };
        }

        // Check if user is an employer
        if (userData.role !== "employer") {
            return {
                success: false,
                message: "Invalid email or password.",
            };
        }

        // Check email verification status
        if (!userData.email_verified) {
            return {
                success: false,
                message: "Please verify your email before logging in.",
                redirectTo: `/employer/verify-email?email=${encodeURIComponent(email)}`,
            };
        }

        // Check account status
        if (userData.status !== "active") {
            return {
                success: false,
                message: "Your account is not active. Please contact support.",
            };
        }

        // Use Supabase Auth for login - this handles session automatically
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            console.error("Supabase auth error:", authError);
            return {
                success: false,
                message: "Invalid email or password.",
            };
        }

        if (!authData.session) {
            return {
                success: false,
                message: "Failed to create session. Please try again.",
            };
        }

        // Check profile completion status - fetch only needed fields
        const { data: employerData, error: employerError } = await adminClient
            .from("employers")
            .select("profile_completed, companies!inner(profile_completed)")
            .eq("user_id", authData.user.id)
            .single();

        if (employerError || !employerData) {
            console.error("Failed to fetch employer data:", employerError);
            // Still allow login, but redirect to complete profile
            return {
                success: true,
                message: "Login successful!",
                redirectTo: "/employer/complete-profile",
            };
        }

        // Check if either profile is incomplete
        const companyData = (employerData as any).companies;
        const isProfileIncomplete =
            !employerData.profile_completed || !companyData?.profile_completed;

        // Success - redirect based on profile completion
        await logAuth("employer_login_success", authData.user.id, "employer", { email });
        return {
            success: true,
            message: "Login successful!",
            redirectTo: isProfileIncomplete ? "/employer/complete-profile" : "/employer/dashboard",
        };
    } catch (error) {
        console.error("Employer login error:", error);
        await logError({ source: "auth.ts:loginEmployer", errorType: "EmployerLoginError", message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        return {
            success: false,
            message: "An unexpected error occurred. Please try again.",
        };
    }
}

// ============================================
// FORGOT PASSWORD / RESET PASSWORD
// ============================================

/**
 * Step 1: User submits their email on /forgot-password
 * - Looks up the user (candidates & employers only)
 * - Generates a secure token, stores its hash in the DB
 * - Sends a password reset email with a link
 * Always returns a generic "success" message to prevent email enumeration.
 */
export async function requestPasswordReset(
    _prevState: ActionState | null,
    formData: FormData
): Promise<ActionState> {
    const email = (formData.get("email") as string)?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, message: "Please enter a valid email address." };
    }

    // Generic success message used in all cases — prevents email enumeration
    const genericSuccess: ActionState = {
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
    };

    try {
        console.log(`[AUTH] ===== PASSWORD RESET STARTED for: ${email} =====`);
        const adminClient = createAdminClient();

        // Look up user (only candidates and employers — MIS resets via admin)
        const { data: userData, error: userError } = await adminClient
            .from("users")
            .select("id, email, role, status")
            .eq("email", email)
            .in("role", ["candidate", "employer"])
            .maybeSingle();
        
        console.log(`[AUTH] User lookup result:`, { found: !!userData, hasError: !!userError });

        if (userError || !userData) {
            // Don't reveal whether email exists
            console.log(`[AUTH] User not found or error, returning generic success`);
            return genericSuccess;
        }

        // Don't allow reset for suspended/deleted accounts
        if (userData.status === "suspended" || userData.status === "deleted") {
            console.log(`[AUTH] User ${userData.status}, returning generic success`);
            return genericSuccess;
        }
        
        console.log(`[AUTH] User valid, generating token...`);

        // Generate a cryptographically secure token (64-char hex = 32 bytes)
        const rawToken = crypto.randomBytes(32).toString("hex");

        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

        const { error: updateError } = await adminClient
            .from("users")
            .update({
                password_reset_token: rawToken,
                password_reset_expires_at: expiresAt,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userData.id);

        if (updateError) {
            console.error("[AUTH] Failed to store reset token:", updateError);
            // Still return generic success — don't leak DB errors
            return genericSuccess;
        }
        
        console.log(`[AUTH] Token stored successfully, looking up user profile...`);

        // Look up user's first name from their profile
        let firstName = "User";
        if (userData.role === "candidate") {
            const { data: profile } = await adminClient
                .from("candidates")
                .select("first_name")
                .eq("user_id", userData.id)
                .maybeSingle();
            if (profile?.first_name) firstName = profile.first_name;
        } else if (userData.role === "employer") {
            const { data: profile } = await adminClient
                .from("employers")
                .select("first_name")
                .eq("user_id", userData.id)
                .maybeSingle();
            if (profile?.first_name) firstName = profile.first_name;
        }

        // Send the reset email
        console.log(`[AUTH] About to send password reset email to: ${userData.email}`);
        console.log(`[AUTH] Token generated: ${rawToken.substring(0, 10)}...`);
        
        const { sendPasswordResetEmail } = await import("@/lib/email");
        console.log(`[AUTH] Email module imported, calling sendPasswordResetEmail...`);
        
        const emailResult = await sendPasswordResetEmail(userData.email, firstName, rawToken);
        console.log(`[AUTH] Email send result:`, emailResult);

        await logAuth("password_reset_requested", userData.id, userData.role, { email });

        return genericSuccess;
    } catch (error) {
        console.error("requestPasswordReset error:", error);
        await logError({
            source: "auth.ts:requestPasswordReset",
            errorType: "PasswordResetRequestError",
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        // Generic success — don't reveal internal errors to attacker
        return genericSuccess;
    }
}

/**
 * Step 2: User submits new password on /reset-password?token=...
 * - Validates the token against DB (checks expiry)
 * - Updates password in BOTH Supabase Auth AND custom bcrypt field
 * - Clears the reset token
 */
export async function resetPassword(
    _prevState: ActionState | null,
    formData: FormData
): Promise<ActionState> {
    const token = (formData.get("token") as string)?.trim();
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validation — must satisfy Supabase's password policy
    if (!token) {
        return { success: false, message: "Invalid or missing reset token. Please request a new link." };
    }
    if (!newPassword || newPassword.length < 8) {
        return { success: false, message: "Password must be at least 8 characters long." };
    }
    if (!/[a-z]/.test(newPassword)) {
        return { success: false, message: "Password must contain at least one lowercase letter." };
    }
    if (!/[A-Z]/.test(newPassword)) {
        return { success: false, message: "Password must contain at least one uppercase letter." };
    }
    if (!/[0-9]/.test(newPassword)) {
        return { success: false, message: "Password must contain at least one number." };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword)) {
        return { success: false, message: "Password must contain at least one special character (e.g. !@#$%)." };
    }
    if (newPassword !== confirmPassword) {
        return { success: false, message: "Passwords do not match." };
    }

    try {
        const adminClient = createAdminClient();

        // Look up user by reset token
        const { data: userData, error: userError } = await adminClient
            .from("users")
            .select("id, email, role, password_reset_token, password_reset_expires_at")
            .eq("password_reset_token", token)
            .maybeSingle();

        if (userError || !userData) {
            return { success: false, message: "Invalid or expired reset link. Please request a new one." };
        }

        // Check token expiry
        if (!userData.password_reset_expires_at) {
            return { success: false, message: "Invalid reset link. Please request a new one." };
        }
        const expiresAt = new Date(userData.password_reset_expires_at).getTime();
        if (Date.now() > expiresAt) {
            return { success: false, message: "This reset link has expired. Please request a new one." };
        }

        // Hash the new password for our custom users table
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // 1. Update password in Supabase Auth (handles sessions/JWT)
        const { error: supabaseAuthError } = await adminClient.auth.admin.updateUserById(
            userData.id,
            { password: newPassword }
        );

        if (supabaseAuthError) {
            console.error("Supabase Auth password update failed:", supabaseAuthError);
            // Specifically handle weak password error from Supabase policy
            if (supabaseAuthError.message?.includes("weak_password") ||
                supabaseAuthError.message?.includes("Password should")) {
                return {
                    success: false,
                    message: "Password is too weak. It must have at least 8 characters, with uppercase, lowercase, a number, and a special character (e.g. !@#$%)."
                };
            }
            return { success: false, message: "Failed to update password. Please try again." };
        }

        // 2. Update bcrypt hash in our users table AND clear the reset token
        const { error: dbError } = await adminClient
            .from("users")
            .update({
                password: hashedPassword,
                password_reset_token: null,
                password_reset_expires_at: null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userData.id);

        if (dbError) {
            console.error("DB password update failed:", dbError);
            return { success: false, message: "Failed to update password. Please try again." };
        }

        await logAuth("password_reset_success", userData.id, userData.role, { email: userData.email });

        return {
            success: true,
            message: "Password updated successfully! You can now sign in with your new password.",
            redirectTo: "/login",
        };
    } catch (error) {
        console.error("resetPassword error:", error);
        await logError({
            source: "auth.ts:resetPassword",
            errorType: "PasswordResetError",
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return { success: false, message: "An unexpected error occurred. Please try again." };
    }
}
