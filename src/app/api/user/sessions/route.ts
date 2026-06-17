import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function parseUserAgent(ua: string | null): {
    browser: string;
    os: string;
    device: "Desktop" | "Mobile" | "Tablet";
} {
    if (!ua) return { browser: "Unknown Browser", os: "Unknown OS", device: "Desktop" };

    // Browser detection (order matters — Edge/OPR must come before Chrome)
    let browser = "Unknown Browser";
    const edgeMatch = ua.match(/Edg\/(\d+)/);
    const oprMatch = ua.match(/OPR\/(\d+)|Opera\/(\d+)/);
    const chromeMatch = ua.match(/Chrome\/(\d+)/);
    const firefoxMatch = ua.match(/Firefox\/(\d+)/);
    const safariMatch = ua.match(/Version\/(\d+).*Safari/);

    if (edgeMatch) browser = `Microsoft Edge ${edgeMatch[1]}`;
    else if (oprMatch) browser = `Opera ${oprMatch[1] ?? oprMatch[2]}`;
    else if (chromeMatch && !/Chromium/.test(ua)) browser = `Google Chrome ${chromeMatch[1]}`;
    else if (firefoxMatch) browser = `Firefox ${firefoxMatch[1]}`;
    else if (safariMatch) browser = `Safari ${safariMatch[1]}`;
    else if (/MSIE|Trident/.test(ua)) browser = "Internet Explorer";
    else if (/Chromium\/(\d+)/.test(ua)) browser = `Chromium ${ua.match(/Chromium\/(\d+)/)?.[1] ?? ""}`;

    // OS detection
    let os = "Unknown OS";
    if (/Windows NT 10/.test(ua)) os = "Windows 10/11";
    else if (/Windows NT 6\.3/.test(ua)) os = "Windows 8.1";
    else if (/Windows NT 6\.1/.test(ua)) os = "Windows 7";
    else if (/Windows/.test(ua)) os = "Windows";
    else if (/iPhone OS (\d+)/.test(ua)) {
        const m = ua.match(/iPhone OS (\d+)/);
        os = m ? `iOS ${m[1]}` : "iOS";
    } else if (/iPad/.test(ua)) {
        const m = ua.match(/OS (\d+)/);
        os = m ? `iPadOS ${m[1]}` : "iPadOS";
    } else if (/Android (\d+)/.test(ua)) {
        const m = ua.match(/Android (\d+)/);
        os = m ? `Android ${m[1]}` : "Android";
    } else if (/Mac OS X ([\d_]+)/.test(ua)) {
        const m = ua.match(/Mac OS X ([\d_]+)/);
        os = m ? `macOS ${m[1].replace(/_/g, ".")}` : "macOS";
    } else if (/Linux/.test(ua)) os = "Linux";
    else if (/CrOS/.test(ua)) os = "ChromeOS";

    // Device type
    let device: "Desktop" | "Mobile" | "Tablet" = "Desktop";
    if (/iPad/.test(ua)) device = "Tablet";
    else if (/Mobile|iPhone|Android.*Mobile/.test(ua)) device = "Mobile";

    return { browser, os, device };
}

function maskIp(ip: string | null): string {
    if (!ip) return "Unknown";
    // Strip PostgreSQL INET CIDR suffix (e.g. "1.2.3.4/32" → "1.2.3.4")
    const clean = ip.replace(/\/\d+$/, "").trim();
    // IPv4: mask last octet
    const ipv4 = clean.match(/^(\d+\.\d+\.\d+)\.\d+$/);
    if (ipv4) return `${ipv4[1]}.xxx`;
    // IPv6: show first 3 groups only
    if (clean.includes(":")) {
        const parts = clean.split(":");
        return parts.slice(0, 3).join(":") + ":…";
    }
    return clean;
}

export async function GET() {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get current session id from JWT payload
        const { data: { session } } = await supabase.auth.getSession();
        let currentSessionId: string | null = null;
        if (session?.access_token) {
            try {
                const [, payload] = session.access_token.split(".");
                const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
                currentSessionId = claims.session_id ?? null;
            } catch { /* ignore decode errors */ }
        }

        // Fetch all sessions via SECURITY DEFINER RPC
        const { data: sessions, error } = await supabase.rpc("get_my_sessions");

        if (error) {
            console.error("get_my_sessions:", error);
            return NextResponse.json({ error: "Failed to load sessions" }, { status: 500 });
        }

        const result = (sessions ?? []).map((s: {
            id: string; user_agent: string | null; ip: string | null;
            created_at: string; updated_at: string; not_after: string | null;
        }) => ({
            id: s.id,
            isCurrent: s.id === currentSessionId,
            ip: maskIp(s.ip),
            created_at: s.created_at,
            last_active: s.updated_at ?? s.created_at,
            not_after: s.not_after,
            ...parseUserAgent(s.user_agent),
        }));

        return NextResponse.json({ success: true, sessions: result });
    } catch (e) {
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Internal server error" },
            { status: 500 }
        );
    }
}
