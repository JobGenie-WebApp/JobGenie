/**
 * Membership Number Utility
 * 
 * Generates unique membership numbers for candidates in the format: JG-YY-XXXXXX
 * - JG: Fixed prefix
 * - YY: Last 2 digits of current year
 * - XXXXXX: Sequential 6-digit number (resets each year)
 */

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Generates the next membership number for a candidate
 * Format: JG-YY-XXXXXX (e.g., JG-26-000001)
 * 
 * @returns Promise<string> The generated membership number
 * @throws Error if unable to generate membership number
 */
export async function generateMembershipNumber(): Promise<string> {
    try {
        const adminClient = createAdminClient();

        // Get current year (last 2 digits)
        const currentYear = new Date().getFullYear();
        const yearSuffix = currentYear.toString().slice(-2);

        // Create the prefix for this year
        const yearPrefix = `JG-${yearSuffix}-`;

        // Query the last membership number for the current year
        // Pattern: JG-26-% means any membership number starting with "JG-26-"
        const { data: lastCandidate, error } = await adminClient
            .from("candidates")
            .select("membership_no")
            .not("membership_no", "is", null)
            .like("membership_no", `${yearPrefix}%`)
            .order("membership_no", { ascending: false })
            .limit(1)
            .single();

        let nextSequence = 1;

        if (!error && lastCandidate?.membership_no) {
            // Extract the sequence number from the last membership number
            // Format: JG-26-000001 -> extract "000001"
            const lastMembershipNo = lastCandidate.membership_no;
            const sequencePart = lastMembershipNo.split("-")[2];

            if (sequencePart) {
                const lastSequence = parseInt(sequencePart, 10);
                if (!isNaN(lastSequence)) {
                    nextSequence = lastSequence + 1;
                }
            }
        }

        // Pad the sequence number with leading zeros to make it 6 digits
        const paddedSequence = nextSequence.toString().padStart(6, "0");

        // Construct the full membership number
        const membershipNumber = `${yearPrefix}${paddedSequence}`;

        return membershipNumber;
    } catch (error) {
        console.error("Error generating membership number:", error);
        throw new Error("Failed to generate membership number");
    }
}
