"use client";

import { useEffect } from "react";

const STORAGE_KEY = "jg_synced_timezone";

/**
 * Silently POSTs the browser's IANA timezone to /api/user/timezone on mount.
 * Only re-syncs when the detected timezone differs from the last value sent
 * during this browser session. Rendered once per authenticated layout.
 */
export function TimezoneSync() {
    useEffect(() => {
        let cancelled = false;

        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (!tz) return;

            const lastSynced =
                typeof window !== "undefined"
                    ? window.localStorage.getItem(STORAGE_KEY)
                    : null;
            if (lastSynced === tz) return;

            fetch("/api/user/timezone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ timezone: tz }),
            })
                .then((r) => r.json())
                .then((data) => {
                    if (cancelled) return;
                    if (data?.success) {
                        window.localStorage.setItem(STORAGE_KEY, tz);
                    }
                })
                .catch(() => {
                    // Silent — timezone sync is best-effort.
                });
        } catch {
            // Silent.
        }

        return () => {
            cancelled = true;
        };
    }, []);

    return null;
}
