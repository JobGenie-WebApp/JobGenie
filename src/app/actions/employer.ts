"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmployerApprovalEmail, sendEmployerRejectionEmail } from "@/lib/employer-emails";
import { logAudit, logError } from "@/lib/logger";

export type EmployerActionState = {
    success: boolean;
    message: string;
};

/**
 * Mark the approval status message as seen for the current employer's company
 */
export async function markCompanyApprovalMessageAsSeen(): Promise<EmployerActionState> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                message: "You must be logged in.",
            };
        }

        // Get the employer's company_id
        const { data: employerData } = await supabase
            .from("employers")
            .select("company_id")
            .eq("user_id", user.id)
            .single();

        if (!employerData) {
            return {
                success: false,
                message: "Employer profile not found.",
            };
        }

        const { error } = await supabase
            .from("companies")
            .update({
                approval_status_message_seen: true,
                updated_at: new Date().toISOString(),
            })
            .eq("id", employerData.company_id);

        if (error) {
            console.error("Mark message as seen error:", error);
            return {
                success: false,
                message: "Failed to update message status.",
            };
        }

        revalidatePath("/employer/dashboard");

        return {
            success: true,
            message: "Message marked as seen.",
        };
    } catch (error) {
        console.error("Mark approval message as seen error:", error);
        return {
            success: false,
            message: "An unexpected error occurred.",
        };
    }
}

/**
 * Approve a company profile (MIS Admin only)
 */
export async function approveCompanyProfile(
    companyId: string
): Promise<EmployerActionState> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                message: "You must be logged in.",
            };
        }

        // Verify user is MIS admin
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        if (userError || !userData || userData.role !== "mis") {
            return {
                success: false,
                message: "Unauthorized. Only MIS admins can approve companies.",
            };
        }

        // Update company approval status
        const { error } = await supabase
            .from("companies")
            .update({
                approval_status: "approved",
                approved_at: new Date().toISOString(),
                rejected_at: null,
                reviewed_by: user.id,
                rejection_reason: null,
                approval_status_message_seen: false, // Show message on next login
                updated_at: new Date().toISOString(),
            })
            .eq("id", companyId);

        if (error) {
            console.error("Approve company error:", error);
            return {
                success: false,
                message: "Failed to approve company.",
            };
        }

        // Send approval email to company super admin
        try {
            // Find the super admin for this company
            const { data: employerData } = await supabase
                .from("employers")
                .select("email, first_name")
                .eq("company_id", companyId)
                .eq("is_super_admin", true)
                .single();

            // Also need company name
            const { data: companyData } = await supabase
                .from("companies")
                .select("company_name")
                .eq("id", companyId)
                .single();

            if (employerData && companyData) {
                await sendEmployerApprovalEmail(
                    employerData.email,
                    companyData.company_name,
                    employerData.first_name
                );
            }
        } catch (emailError) {
            console.error("Failed to send approval email:", emailError);
        }

        revalidatePath("/mis/employers");

        await logAudit("company_approved", user.id, "mis", "company", companyId);
        return {
            success: true,
            message: "Company approved successfully!",
        };
    } catch (error) {
        console.error("Approve company profile error:", error);
        await logError({ source: "employer.ts:approveCompanyProfile", errorType: "ApprovalError", message: error instanceof Error ? error.message : String(error) });
        return {
            success: false,
            message: "An unexpected error occurred.",
        };
    }
}

/**
 * Reject a company profile (MIS Admin only)
 */
export async function rejectCompanyProfile(
    companyId: string,
    reason?: string
): Promise<EmployerActionState> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                message: "You must be logged in.",
            };
        }

        // Verify user is MIS admin
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        if (userError || !userData || userData.role !== "mis") {
            return {
                success: false,
                message: "Unauthorized. Only MIS admins can reject companies.",
            };
        }

        const rejectionReasonText = reason || "Profile needs improvement. Please update and resubmit.";

        // Update company approval status
        const { error } = await supabase
            .from("companies")
            .update({
                approval_status: "rejected",
                rejected_at: new Date().toISOString(),
                approved_at: null,
                reviewed_by: user.id,
                rejection_reason: rejectionReasonText,
                approval_status_message_seen: false, // Show message on next login
                updated_at: new Date().toISOString(),
            })
            .eq("id", companyId);

        if (error) {
            console.error("Reject company error:", error);
            return {
                success: false,
                message: "Failed to reject company.",
            };
        }

        // Send rejection email to company super admin
        try {
            // Find the super admin for this company
            const { data: employerData } = await supabase
                .from("employers")
                .select("email, first_name")
                .eq("company_id", companyId)
                .eq("is_super_admin", true)
                .single();

            // Also need company name
            const { data: companyData } = await supabase
                .from("companies")
                .select("company_name")
                .eq("id", companyId)
                .single();

            if (employerData && companyData) {
                await sendEmployerRejectionEmail(
                    employerData.email,
                    companyData.company_name,
                    employerData.first_name,
                    rejectionReasonText
                );
            }
        } catch (emailError) {
            console.error("Failed to send rejection email:", emailError);
        }

        revalidatePath("/mis/employers");

        await logAudit("company_rejected", user.id, "mis", "company", companyId, { reason: rejectionReasonText });
        return {
            success: true,
            message: "Company rejected successfully.",
        };
    } catch (error) {
        console.error("Reject company profile error:", error);
        await logError({ source: "employer.ts:rejectCompanyProfile", errorType: "RejectionError", message: error instanceof Error ? error.message : String(error) });
        return {
            success: false,
            message: "An unexpected error occurred.",
        };
    }
}

/**
 * Revoke a company approval/rejection status (MIS Admin only)
 * Resets the company back to pending status
 */
export async function revokeCompanyApproval(
    companyId: string
): Promise<EmployerActionState> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                message: "You must be logged in.",
            };
        }

        // Verify user is MIS admin
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

        if (userError || !userData || userData.role !== "mis") {
            return {
                success: false,
                message: "Unauthorized. Only MIS admins can revoke approval status.",
            };
        }

        // Reset company to pending status
        const { error } = await supabase
            .from("companies")
            .update({
                approval_status: "pending",
                approved_at: null,
                rejected_at: null,
                reviewed_by: null,
                rejection_reason: null,
                approval_status_message_seen: false,
                updated_at: new Date().toISOString(),
            })
            .eq("id", companyId);

        if (error) {
            console.error("Revoke approval error:", error);
            return {
                success: false,
                message: "Failed to revoke approval status.",
            };
        }

        revalidatePath("/mis/employers");

        await logAudit("company_approval_revoked", user.id, "mis", "company", companyId);
        return {
            success: true,
            message: "Approval status revoked. Company is now pending review.",
        };
    } catch (error) {
        console.error("Revoke company approval error:", error);
        await logError({ source: "employer.ts:revokeCompanyApproval", errorType: "RevokeError", message: error instanceof Error ? error.message : String(error) });
        return {
            success: false,
            message: "An unexpected error occurred.",
        };
    }
}
