import { format as formatFns, parse, isValid } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

/**
 * Resolve the effective IANA timezone.
 * - If `tz` is provided and valid, use it.
 * - Otherwise, in the browser use the browser's detected timezone.
 * - Otherwise (server with no tz), fall back to UTC.
 */
export function resolveTimezone(tz?: string | null): string {
    if (tz && tz.trim().length > 0) return tz;
    if (typeof window !== "undefined") {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        } catch {
            return "UTC";
        }
    }
    return "UTC";
}

/** Read the browser's detected IANA timezone (client-only). */
export function getBrowserTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
        return "UTC";
    }
}

function parseTimeString(timeStr: string) {
    const normalized = timeStr.toString().trim();
    const formats = ["H:mm", "HH:mm", "H:mm:ss", "HH:mm:ss", "h:mm a", "hh:mm a"];

    for (const formatStr of formats) {
        const parsed = parse(normalized, formatStr, new Date());
        if (isValid(parsed)) {
            return parsed;
        }
    }

    return null;
}

/**
 * Build a UTC Date from a date-only string ("YYYY-MM-DD") and optional time string ("HH:mm").
 * The inputs are treated as already being in UTC.
 */
function createUTCDateFromParts(datePart: string, timePart?: string): Date | null {
    if (!datePart) return null;

    const [year, month, day] = datePart.split("-").map(Number);
    if ([year, month, day].some((value) => Number.isNaN(value))) return null;

    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    if (timePart) {
        const parsedTime = parseTimeString(timePart);
        if (!parsedTime) return null;

        hours = parsedTime.getHours();
        minutes = parsedTime.getMinutes();
        seconds = parsedTime.getSeconds();
    }

    return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
}

/**
 * Ensure a timestamp string is parsed as UTC by appending "Z" when no timezone indicator is
 * present. Returns a Date or null if parsing fails.
 */
function parseAsUTC(input: string | Date): Date | null {
    if (input instanceof Date) return isValid(input) ? input : null;
    if (!input) return null;
    const ts = input.toString().trim();
    const utcTs = ts.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(ts) ? ts : ts + "Z";
    const date = new Date(utcTs);
    return isValid(date) ? date : null;
}

/**
 * Format a UTC timestamp (ISO string or Date) in the given IANA timezone.
 * Defaults to the browser's timezone on the client, or UTC on the server.
 */
export function formatInTz(
    input: string | Date,
    formatStr: string = "MMM d, yyyy 'at' HH:mm",
    tz?: string | null
): string {
    try {
        const date = parseAsUTC(input);
        if (!date) return typeof input === "string" ? input : "";
        return formatInTimeZone(date, resolveTimezone(tz), formatStr);
    } catch {
        return typeof input === "string" ? input : "";
    }
}

/**
 * Format a time string (HH:mm) - treating the time as already being in local time (no timezone conversion).
 * The date string is only used for context; the time value is displayed as-is without UTC conversion.
 * This is because interview times are stored as local appointment times, not UTC timestamps.
 */
export function formatUTCTime(
    dateStr: string,
    timeStr: string,
    formatStr: string = "HH:mm",
    tz?: string | null
): string {
    try {
        if (!timeStr) return "";

        // Parse the time string and format it without timezone conversion
        // The time is already in local time, so we just format it for display
        const parsedTime = parseTimeString(timeStr);
        if (!parsedTime) return timeStr;

        // Create a simple date object for formatting purposes only
        // Don't use formatInTimeZone because the time is already local
        return formatFns(parsedTime, formatStr);
    } catch (error) {
        console.error("Error formatting time:", error);
        return timeStr;
    }
}

/**
 * Format a date. Accepts "YYYY-MM-DD" (date-only, treated as calendar date, no TZ shift),
 * ISO timestamps (treated as UTC), or Date objects. Uses the user's timezone when a
 * timestamp has a time component.
 */
export function formatUTCDate(
    dateStr: string | Date,
    formatStr: string = "MMM d, yyyy",
    tz?: string | null
): string {
    try {
        if (!dateStr) return "";

        if (typeof dateStr === "string") {
            const cleanDate = dateStr.trim();

            if (cleanDate.includes("T")) {
                const date = parseAsUTC(cleanDate);
                if (date) {
                    return formatInTimeZone(date, resolveTimezone(tz), formatStr);
                }
            }

            const datePart = cleanDate.includes("T") ? cleanDate.split("T")[0] : cleanDate;
            const date = createUTCDateFromParts(datePart);
            if (date && isValid(date)) {
                return formatInTimeZone(date, "UTC", formatStr);
            }

            return "";
        }

        return formatInTimeZone(dateStr, resolveTimezone(tz), formatStr);
    } catch (error) {
        console.error("Error formatting date:", error);
        return "";
    }
}

/** Backward-compatible date formatter that routes through formatUTCDate. */
export function formatDate(
    dateStr: string | Date,
    formatStr: string = "MMM d, yyyy",
    tz?: string | null
): string {
    return formatUTCDate(dateStr, formatStr, tz);
}

/**
 * Format a UTC timestamp string (ISO, with or without "Z") in the user's timezone.
 */
export function formatTimestamp(
    timestamp: string | Date,
    formatStr: string = "MMM d, yyyy 'at' HH:mm",
    tz?: string | null
): string {
    return formatInTz(timestamp, formatStr, tz);
}

/**
 * Convert a "local" wall-clock date+time (as entered by a user in their tz) into a UTC ISO
 * string suitable for storage.
 */
export function localWallTimeToUTC(
    dateStr: string,
    timeStr: string,
    tz?: string | null
): string | null {
    try {
        if (!dateStr || !timeStr) return null;
        const parsedTime = parseTimeString(timeStr);
        if (!parsedTime) return null;

        const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
        const [year, month, day] = datePart.split("-").map(Number);
        if ([year, month, day].some((v) => Number.isNaN(v))) return null;

        const hh = String(parsedTime.getHours()).padStart(2, "0");
        const mm = String(parsedTime.getMinutes()).padStart(2, "0");
        const ss = String(parsedTime.getSeconds()).padStart(2, "0");

        const wallClock = `${datePart}T${hh}:${mm}:${ss}`;
        const utc = fromZonedTime(wallClock, resolveTimezone(tz));
        return isValid(utc) ? utc.toISOString() : null;
    } catch (e) {
        console.error("Error converting local wall time to UTC:", e);
        return null;
    }
}

/**
 * Given a UTC Date/ISO, return the equivalent wall-clock "HH:mm" in the given tz.
 */
export function utcToLocalHHmm(input: string | Date, tz?: string | null): string {
    const date = parseAsUTC(input);
    if (!date) return "";
    return formatInTimeZone(date, resolveTimezone(tz), "HH:mm");
}

/**
 * Given a UTC Date/ISO, return the equivalent wall-clock "YYYY-MM-DD" in the given tz.
 */
export function utcToLocalDate(input: string | Date, tz?: string | null): string {
    const date = parseAsUTC(input);
    if (!date) return "";
    return formatInTimeZone(date, resolveTimezone(tz), "yyyy-MM-dd");
}

/**
 * Compute UTC start/end of a calendar month interpreted in the given tz.
 * Useful for monthly stats aggregation that should respect the viewer's tz.
 */
export function monthBoundsUTC(
    year: number,
    monthIndexZero: number,
    tz?: string | null
): { start: Date; end: Date } {
    const zone = resolveTimezone(tz);
    const startWall = `${year}-${String(monthIndexZero + 1).padStart(2, "0")}-01T00:00:00`;
    const nextMonth = monthIndexZero === 11 ? 0 : monthIndexZero + 1;
    const nextYear = monthIndexZero === 11 ? year + 1 : year;
    const endWall = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-01T00:00:00`;
    return {
        start: fromZonedTime(startWall, zone),
        end: fromZonedTime(endWall, zone),
    };
}

// Re-export date-fns format for callers that do their own parsing.
export { formatFns as format, toZonedTime, fromZonedTime };
