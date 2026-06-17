import { createClient } from "@supabase/supabase-js";

const POSTGREST_TRANSIENT_ATTEMPTS = 6;
const POSTGREST_TRANSIENT_BASE_MS = 450;

/**
 * PostgREST sometimes returns PGRST002 ("Could not query the database for the schema cache")
 * during cache reloads or brief API/DB hiccups. Retrying the same request usually succeeds.
 * @see https://supabase.com/docs/guides/troubleshooting/refresh-postgrest-schema
 */
async function fetchWithPostgrestTransientRetry(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> {
    let last: Response | undefined;
    for (let attempt = 1; attempt <= POSTGREST_TRANSIENT_ATTEMPTS; attempt++) {
        last = await fetch(input, init);
        if (last.ok) return last;

        let body = "";
        try {
            body = await last.clone().text();
        } catch {
            /* ignore */
        }

        const isTransient =
            last.status === 503 ||
            body.includes("PGRST002") ||
            /\bschema cache\b/i.test(body);

        if (!isTransient || attempt === POSTGREST_TRANSIENT_ATTEMPTS) {
            return new Response(body, {
                status: last.status,
                statusText: last.statusText,
                headers: last.headers,
            });
        }

        await new Promise((r) => setTimeout(r, POSTGREST_TRANSIENT_BASE_MS * attempt));
    }
    return last!;
}

/**
 * Creates a Supabase admin client using the service role key.
 * This client bypasses Row Level Security (RLS) policies.
 *
 * ⚠️ WARNING: Only use this on the server side for admin operations
 * like checking user status during login, registration, etc.
 * Never expose the service role key to the client.
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("Missing Supabase admin credentials");
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
        global: {
            fetch: fetchWithPostgrestTransientRetry,
        },
    });
}
