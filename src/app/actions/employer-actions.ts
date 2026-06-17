"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { subAdminSchema } from "@/lib/validations/employer-admin-schema";
import { generateInvitationToken, getInvitationExpiry, sendEmployerInvitationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { logBusiness, logAuth, logError } from "@/lib/logger";

export type ActionState = {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
    redirectTo?: string;
};

/**
 * Create a sub-admin employer for the company
 * Only super admins can create sub-admins
 * Maximum 5 sub-admins per company
 */
export async function createSubAdmin(
    _prevState: ActionState | null,
    formData: FormData
): Promise<ActionState> {
    // Extract form data
    const rawData = {
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        email: formData.get("email") as string,
        designation: (formData.get("designation") as string) || "",
        jobTitle: (formData.get("jobTitle") as string) || "",
        department: (formData.get("department") as string) || "",
        phone: (formData.get("phone") as string) || "",
    };

    // Validate with Zod
    const validationResult = subAdminSchema.safeParse(rawData);

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
        // Verify that the requester is an authenticated employer
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                message: "You must be logged in to add sub-admins.",
            };
        }

        // Get current employer and check if they are super admin
        const { data: currentEmployer, error: employerError } = await supabase
            .from("employers")
            .select("id, company_id, is_super_admin")
            .eq("user_id", user.id)
            .single();

        if (employerError || !currentEmployer) {
            return {
                success: false,
                message: "Employer profile not found.",
            };
        }

        // Only super admin can create sub-admins
        if (!currentEmployer.is_super_admin) {
            return {
                success: false,
                message: "You do not have permission to add sub-admins. Only the company super admin can invite additional administrators.",
            };
        }

        // Use admin client for database operations
        const adminClient = createAdminClient();

        // Check sub-admin count limit (max 5 per company)
        const { count: subAdminCount, error: countError } = await adminClient
            .from("employers")
            .select("*", { count: "exact", head: true })
            .eq("company_id", currentEmployer.company_id)
            .eq("is_super_admin", false);

        if (countError) {
            console.error("Error checking sub-admin count:", countError);
            return {
                success: false,
                message: "Unable to verify sub-admin limit. Please try again.",
            };
        }

        if (subAdminCount && subAdminCount >= 5) {
            return {
                success: false,
                message: "Maximum number of sub-admins (5) has been reached for your company.",
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

        // Generate invitation token and temporary password
        const invitationToken = generateInvitationToken();
        const invitationExpiry = getInvitationExpiry();

        // Generate a secure temporary password (12 characters)
        const tempPassword = crypto.randomBytes(6).toString('hex'); // 12 char hex string
        const hashedTempPassword = await bcrypt.hash(tempPassword, 12);

        const now = new Date().toISOString();

        // CREATE SUPABASE AUTH USER FIRST so we get the correct user ID
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: data.email,
            password: tempPassword, // Use temp password
            email_confirm: false, // Will be confirmed after password setup
            user_metadata: {
                user_type: "employer",
                invited_by: user.id,
            },
        });

        if (authError || !authData.user) {
            console.error("Auth user creation error:", authError);
            return {
                success: false,
                message: "Failed to create authentication account. Please try again.",
            };
        }

        const userId = authData.user.id; // Use the auth user ID

        // Create user record in database with same ID
        const { error: dbUserError } = await adminClient.from("users").insert({
            id: userId,
            email: data.email,
            password: hashedTempPassword,
            role: "employer",
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
            // Cleanup auth user
            await adminClient.auth.admin.deleteUser(userId);
            return {
                success: false,
                message: "Failed to create user invitation. Please try again.",
            };
        }

        // Create employer profile
        const { error: employerInsertError } = await adminClient.from("employers").insert({
            user_id: userId,
            company_id: currentEmployer.company_id,
            first_name: data.firstName,
            last_name: data.lastName,
            email: data.email,
            address: "", // Required field - will be updated when sub-admin completes profile
            designation: data.designation || null,
            job_title: data.jobTitle || null,
            department: data.department || null,
            phone: data.phone || null,
            is_super_admin: false, // Sub-admins are never super admins
            profile_completed: false,
            created_at: now,
            updated_at: now,
        });

        if (employerInsertError) {
            console.error("Employer creation error:", employerInsertError);
            // Cleanup user record and auth user
            await adminClient.from("users").delete().eq("id", userId);
            await adminClient.auth.admin.deleteUser(userId);
            return {
                success: false,
                message: "Failed to create employer profile. Please try again.",
            };
        }

        // Send invitation email with temporary password
        const emailResult = await sendEmployerInvitationEmail(
            data.email,
            data.firstName,
            invitationToken,
            tempPassword
        );

        if (!emailResult.success) {
            // Email failed but user created - admin should retry
            console.error("Email sending failed:", emailResult.error);
            return {
                success: false,
                message: "Sub-admin created but failed to send invitation email. Please contact support.",
            };
        }

        await logBusiness("sub_admin_invited", user.id, "employer", "employer", userId, { invitedEmail: data.email });
        return {
            success: true,
            message: `Invitation sent to ${data.email}. They will receive setup instructions via email.`,
            redirectTo: "/employer/admins",
        };
    } catch (error) {
        console.error("Create sub-admin error:", error);
        await logError({ source: "employer-actions.ts:createSubAdmin", errorType: "CreateSubAdminError", message: error instanceof Error ? error.message : String(error) });
        return {
            success: false,
            message: "An unexpected error occurred. Please try again.",
        };
    }
}

/**
 * Setup password for invited employer
 * Validates invitation token and temporary password
 */
export async function setupEmployerPassword(
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

        // Verify this is for employer role
        if (user.role !== "employer") {
            return {
                success: false,
                message: "Invalid invitation type.",
            };
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(data.password, 12);

        const now = new Date().toISOString();

        // Update Supabase Auth user password
        const { error: authError } = await adminClient.auth.admin.updateUserById(user.id, {
            password: data.password,
            email_confirm: true,
        });

        if (authError) {
            console.error("Auth password update error:", authError);
            return {
                success: false,
                message: "Failed to update password. Please try again.",
            };
        }

        // Update user record in database - activate, set password, and clear invitation token
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

        await logAuth("employer_password_setup_success", user.id, "employer", { email: user.email });
        return {
            success: true,
            message: "Password created successfully! You can now log in with your credentials.",
            redirectTo: "/employer/login",
        };
    } catch (error) {
        console.error("Setup password error:", error);
        await logError({ source: "employer-actions.ts:setupEmployerPassword", errorType: "SetupPasswordError", message: error instanceof Error ? error.message : String(error) });
        return {
            success: false,
            message: "An unexpected error occurred. Please try again.",
        };
    }
}
