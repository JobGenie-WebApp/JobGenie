/**
 * Client-side utility functions
 * These functions can be used in client components
 */

/**
 * Mask email for display (e.g., j***@example.com)
 */
export function maskEmail(email: string): string {
    const [localPart, domain] = email.split("@");
    if (!domain) return email;
    if (localPart.length <= 2) {
        return `${localPart[0]}***@${domain}`;
    }
    return `${localPart[0]}${localPart[1]}***@${domain}`;
}
