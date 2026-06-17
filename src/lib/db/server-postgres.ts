import postgres from "postgres";

export type ServerSql = ReturnType<typeof postgres>;

const globalForSql = globalThis as unknown as { __jobgenieSql?: ServerSql };

/**
 * Singleton Postgres client for server-side queries that must bypass PostgREST.
 * Requires DATABASE_URL (same as Prisma).
 */
export function getServerSql(): ServerSql | null {
    const url = process.env.DATABASE_URL;
    if (!url) return null;
    if (!globalForSql.__jobgenieSql) {
        globalForSql.__jobgenieSql = postgres(url, {
            max: 1,
            idle_timeout: 20,
            connect_timeout: 25,
        });
    }
    return globalForSql.__jobgenieSql;
}
