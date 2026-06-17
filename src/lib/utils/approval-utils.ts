// Utility functions for checking company approval status

/**
 * Check if a company is approved
 */
export function isCompanyApproved(company: { approval_status: string } | null): boolean {
    return company?.approval_status === "approved";
}

/**
 * Check if a company is rejected
 */
export function isCompanyRejected(company: { approval_status: string } | null): boolean {
    return company?.approval_status === "rejected";
}

/**
 * Check if a company is pending approval
 */
export function isCompanyPending(company: { approval_status: string } | null): boolean {
    return !company || company.approval_status === "pending";
}

/**
 * Check if the current path is restricted for unapproved employers
 * Returns true if the path is restricted
 */
export function isRestrictedPath(pathname: string): boolean {
    // List of restricted paths (starts with)
    const restrictedPaths = [
        "/employer/admins",
        "/employer/jobs", // Assuming these will exist
        "/employer/applications", // Assuming these will exist
    ];

    // Always allow these paths
    const allowedPaths = [
        "/employer/dashboard",
        "/employer/profile",
        "/employer/company",
        "/employer/settings", // Maybe allow settings?
    ];

    // If it's explicitly allowed, return false
    if (allowedPaths.some(path => pathname === path || pathname.startsWith(path + "/"))) {
        return false;
    }

    // Check against restricted list
    return restrictedPaths.some(path => pathname.startsWith(path));
}
