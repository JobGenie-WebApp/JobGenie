import { getServerSql } from "@/lib/db/server-postgres";

/**
 * Look up a user's IANA timezone (e.g., "Asia/Colombo"). Falls back to "UTC"
 * when the column is missing, empty, or the user cannot be found. Safe to
 * call from server code (emails, SSR, API routes).
 */
export async function getUserTimezone(userId: string | null | undefined): Promise<string> {
    if (!userId) return "UTC";
    try {
        const sql = getServerSql();
        if (!sql) return "UTC";
        const rows = await sql`
            SELECT "timezone"
            FROM "users"
            WHERE "id" = ${userId}::uuid
            LIMIT 1
        `;
        const row = rows[0] as { timezone?: string | null } | undefined;
        const tz = row?.timezone?.trim();
        return tz && tz.length > 0 ? tz : "UTC";
    } catch {
        return "UTC";
    }
}

/**
 * Batch lookup timezones for multiple user IDs in a single query.
 * Returns a map of userId -> timezone (defaults to "UTC" for missing users).
 * Performance: ~1 query instead of N queries.
 */
export async function getUserTimezoneBatch(userIds: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    
    // Initialize all with UTC default
    userIds.forEach(id => {
        if (id) result.set(id, "UTC");
    });
    
    if (userIds.length === 0) return result;
    
    try {
        const sql = getServerSql();
        if (!sql) return result;
        
        const uniqueIds = Array.from(new Set(userIds.filter(id => id)));
        if (uniqueIds.length === 0) return result;
        
        const rows = await sql`
            SELECT "id", "timezone"
            FROM "users"
            WHERE "id" = ANY(${uniqueIds}::uuid[])
        `;
        
        (rows as unknown as Array<{ id: string; timezone?: string | null }>).forEach(row => {
            const tz = row.timezone?.trim();
            result.set(row.id, tz && tz.length > 0 ? tz : "UTC");
        });
        
        return result;
    } catch {
        return result;
    }
}

/** Look up timezone by user email (useful for recipient formatting). */
export async function getUserTimezoneByEmail(
    email: string | null | undefined
): Promise<string> {
    if (!email) return "UTC";
    try {
        const sql = getServerSql();
        if (!sql) return "UTC";
        const rows = await sql`
            SELECT "timezone"
            FROM "users"
            WHERE LOWER(TRIM("email")) = LOWER(${email.trim()})
            LIMIT 1
        `;
        const row = rows[0] as { timezone?: string | null } | undefined;
        const tz = row?.timezone?.trim();
        return tz && tz.length > 0 ? tz : "UTC";
    } catch {
        return "UTC";
    }
}
