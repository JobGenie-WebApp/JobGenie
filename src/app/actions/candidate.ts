"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/email";
import { logAudit, logError } from "@/lib/logger";

export type CandidateActionState = {
    success: boolean;
    message: string;
};

/**
 * Mark the approval status message as seen for the current user's candidate profile
 */
export async function markApprovalMessageAsSeen(): Promise<CandidateActionState> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return {
                success: false,
                message: "You must be logged in.",
            };
        }

        const { error } = await supabase
            .from("candidates")
            .update({
                approval_status_message_seen: true,
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id);

        if (error) {
            console.error("Mark message as seen error:", error);
            return {
                success: false,
                message: "Failed to update message status.",
            };
        }

        revalidatePath("/candidate/dashboard");

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
 * Approve a candidate profile (MIS Admin only)
 */
export async function approveCandidateProfile(
    candidateId: string
): Promise<CandidateActionState> {
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
                message: "Unauthorized. Only MIS admins can approve candidates.",
            };
        }

        // Update candidate approval status
        const { error } = await supabase
            .from("candidates")
            .update({
                approval_status: "approved",
                approved_at: new Date().toISOString(),
                rejected_at: null,
                reviewed_by: user.id,
                rejection_reason: null,
                approval_status_message_seen: false, // Show message on next login
                updated_at: new Date().toISOString(),
            })
            .eq("id", candidateId);

        if (error) {
            console.error("Approve candidate error:", error);
            return {
                success: false,
                message: "Failed to approve candidate.",
            };
        }

        // Send approval email to candidate
        try {
            const { data: candidateData } = await supabase
                .from("candidates")
                .select("email, first_name")
                .eq("id", candidateId)
                .single();

            if (candidateData) {
                await sendApprovalEmail(candidateData.email, candidateData.first_name);
            }
        } catch (emailError) {
            // Log email error but don't fail the approval
            console.error("Failed to send approval email:", emailError);
        }

        revalidatePath("/mis/candidates");

        await logAudit("candidate_approved", user.id, "mis", "candidate", candidateId);
        return {
            success: true,
            message: "Candidate approved successfully!",
        };
    } catch (error) {
        console.error("Approve candidate profile error:", error);
        await logError({ source: "candidate.ts:approveCandidateProfile", errorType: "ApprovalError", message: error instanceof Error ? error.message : String(error) });
        return {
            success: false,
            message: "An unexpected error occurred.",
        };
    }
}

/**
 * Reject a candidate profile (MIS Admin only)
 */
export async function rejectCandidateProfile(
    candidateId: string,
    reason?: string
): Promise<CandidateActionState> {
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
                message: "Unauthorized. Only MIS admins can reject candidates.",
            };
        }

        // Update candidate approval status
        const rejectionReasonText = reason || "Profile needs improvement. Please update and resubmit.";
        const { error } = await supabase
            .from("candidates")
            .update({
                approval_status: "rejected",
                rejected_at: new Date().toISOString(),
                approved_at: null,
                reviewed_by: user.id,
                rejection_reason: rejectionReasonText,
                approval_status_message_seen: false, // Show message on next login
                updated_at: new Date().toISOString(),
            })
            .eq("id", candidateId);

        if (error) {
            console.error("Reject candidate error:", error);
            return {
                success: false,
                message: "Failed to reject candidate.",
            };
        }

        // Send rejection email to candidate
        try {
            const { data: candidateData } = await supabase
                .from("candidates")
                .select("email, first_name")
                .eq("id", candidateId)
                .single();

            if (candidateData) {
                await sendRejectionEmail(
                    candidateData.email,
                    candidateData.first_name,
                    rejectionReasonText
                );
            }
        } catch (emailError) {
            // Log email error but don't fail the rejection
            console.error("Failed to send rejection email:", emailError);
        }

        revalidatePath("/mis/candidates");

        await logAudit("candidate_rejected", user.id, "mis", "candidate", candidateId, { reason: rejectionReasonText });
        return {
            success: true,
            message: "Candidate rejected successfully.",
        };
    } catch (error) {
        console.error("Reject candidate profile error:", error);
        await logError({ source: "candidate.ts:rejectCandidateProfile", errorType: "RejectionError", message: error instanceof Error ? error.message : String(error) });
        return {
            success: false,
            message: "An unexpected error occurred.",
        };
    }
}

/**
 * Revoke a candidate approval/rejection status (MIS Admin only)
 * Resets the candidate back to pending status
 */
export async function revokeCandidateApproval(
    candidateId: string
): Promise<CandidateActionState> {
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

        // Reset candidate to pending status
        const { error } = await supabase
            .from("candidates")
            .update({
                approval_status: "pending",
                approved_at: null,
                rejected_at: null,
                reviewed_by: null,
                rejection_reason: null,
                approval_status_message_seen: false,
                updated_at: new Date().toISOString(),
            })
            .eq("id", candidateId);

        if (error) {
            console.error("Revoke approval error:", error);
            return {
                success: false,
                message: "Failed to revoke approval status.",
            };
        }

        revalidatePath("/mis/candidates");

        await logAudit("candidate_approval_revoked", user.id, "mis", "candidate", candidateId);
        return {
            success: true,
            message: "Approval status revoked. Candidate is now pending review.",
        };
    } catch (error) {
        console.error("Revoke candidate approval error:", error);
        await logError({ source: "candidate.ts:revokeCandidateApproval", errorType: "RevokeError", message: error instanceof Error ? error.message : String(error) });
        return {
            success: false,
            message: "An unexpected error occurred.",
        };
    }
}
