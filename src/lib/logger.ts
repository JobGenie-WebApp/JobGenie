"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================
// TYPES
// ============================================

type LogCategory = "auth" | "activity" | "business" | "system";

interface EventLogParams {
    userId?: string;
    userRole?: string;
    category: LogCategory;
    action: string;
    label?: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

interface ApiRequestLogParams {
    userId?: string;
    method: string;
    path: string;
    status: number;
    duration: number;
    queryParams?: string;
    ipAddress?: string;
    userAgent?: string;
    error?: string;
}

interface ErrorLogParams {
    userId?: string;
    source: string;
    errorType: string;
    message: string;
    stack?: string;
    metadata?: Record<string, unknown>;
}

// ============================================
// HELPERS
// ============================================

/**
 * Extract IP address and User-Agent from incoming request headers.
 * Safe to call in server actions / RSC — silently returns nulls if unavailable.
 */
/**
 * Extract IP address and User-Agent from incoming request headers.
 * Safe to call in server actions / RSC — silently returns nulls if unavailable.
 */
export async function getRequestInfo(): Promise<{ ipAddress: string | null; userAgent: string | null }> {
    try {
        const headersList = await headers();
        const ipAddress =
            headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            headersList.get("x-real-ip") ??
            null;
        const userAgent = headersList.get("user-agent") ?? null;
        return { ipAddress, userAgent };
    } catch {
        return { ipAddress: null, userAgent: null };
    }
}

// ============================================
// CORE LOGGING FUNCTIONS
// ============================================

/**
 * Log an event (auth, activity, business, system).
 * Automatically captures IP address and User-Agent from request headers.
 * Fire-and-forget — does not throw on failure.
 */
export async function logEvent(params: EventLogParams): Promise<void> {
    try {
        // Auto-extract request info if not explicitly provided
        const requestInfo = (!params.ipAddress || !params.userAgent)
            ? await getRequestInfo()
            : null;

        const supabase = createAdminClient();
        await supabase.from("event_logs").insert({
            user_id: params.userId || null,
            user_role: params.userRole || null,
            category: params.category,
            action: params.action,
            label: params.label || null,
            resource_type: params.resourceType || null,
            resource_id: params.resourceId || null,
            metadata: params.metadata || null,
            ip_address: params.ipAddress || requestInfo?.ipAddress || null,
            user_agent: params.userAgent || requestInfo?.userAgent || null,
        });
    } catch (error) {
        console.error("[Logger] Failed to log event:", error);
    }
}

/**
 * Log an API request with timing information.
 * Automatically captures IP address and User-Agent from request headers.
 * Fire-and-forget — does not throw on failure.
 */
export async function logApiRequest(params: ApiRequestLogParams): Promise<void> {
    try {
        // Auto-extract request info if not explicitly provided
        const requestInfo = (!params.ipAddress || !params.userAgent)
            ? await getRequestInfo()
            : null;

        const supabase = createAdminClient();
        await supabase.from("api_request_logs").insert({
            user_id: params.userId || null,
            method: params.method,
            path: params.path,
            status: params.status,
            duration: params.duration,
            query_params: params.queryParams || null,
            ip_address: params.ipAddress || requestInfo?.ipAddress || null,
            user_agent: params.userAgent || requestInfo?.userAgent || null,
            error: params.error || null,
        });
    } catch (error) {
        console.error("[Logger] Failed to log API request:", error);
    }
}

/**
 * Log a structured error.
 * Fire-and-forget — does not throw on failure.
 */
export async function logError(params: ErrorLogParams): Promise<void> {
    try {
        const supabase = createAdminClient();
        await supabase.from("error_logs").insert({
            user_id: params.userId || null,
            source: params.source,
            error_type: params.errorType,
            message: params.message,
            stack: params.stack || null,
            metadata: params.metadata || null,
        });
    } catch (error) {
        console.error("[Logger] Failed to log error:", error);
    }
}

// ============================================
// CONVENIENCE WRAPPERS
// ============================================

/**
 * Log an authentication event (login, signup, verification, etc.)
 */
export async function logAuth(
    action: string,
    userId?: string,
    userRole?: string,
    metadata?: Record<string, unknown>,
    ipAddress?: string
): Promise<void> {
    return logEvent({
        userId,
        userRole,
        category: "auth",
        action,
        metadata,
        ipAddress,
    });
}

/**
 * Log a user activity event (profile update, upload, settings change, etc.)
 */
export async function logActivity(
    action: string,
    userId?: string,
    userRole?: string,
    resourceType?: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    return logEvent({
        userId,
        userRole,
        category: "activity",
        action,
        resourceType,
        resourceId,
        metadata,
    });
}

/**
 * Log a business event (job published, invitation sent, interview scheduled, etc.)
 */
export async function logBusiness(
    action: string,
    userId?: string,
    userRole?: string,
    resourceType?: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    return logEvent({
        userId,
        userRole,
        category: "business",
        action,
        resourceType,
        resourceId,
        metadata,
    });
}

/**
 * Log a system/audit event (admin approval, data mutations, etc.)
 */
export async function logAudit(
    action: string,
    userId?: string,
    userRole?: string,
    resourceType?: string,
    resourceId?: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    return logEvent({
        userId,
        userRole,
        category: "system",
        action,
        resourceType,
        resourceId,
        metadata,
    });
}
