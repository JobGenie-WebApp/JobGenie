import { fromZonedTime } from "date-fns-tz";
import { parse, isValid } from "date-fns";
import type { CalendarInvitation, InterviewRound, TimeSlot } from "@/lib/calendar-utils";
import { resolveInvitationSlot, resolveRoundSlot } from "@/lib/calendar-utils";

export type MisReschedulePayload = { date?: string; time?: string } | null;

/** Normalize various stored time strings to HH:mm for wall-clock math in a timezone. */
export function normalizeTimeToHHmm(timeStr: string): string | null {
    const normalized = timeStr.toString().trim();
    const formats = ["H:mm", "HH:mm", "H:mm:ss", "HH:mm:ss", "h:mm a", "hh:mm a"];
    for (const formatStr of formats) {
        const parsed = parse(normalized, formatStr, new Date());
        if (isValid(parsed)) {
            const h = parsed.getHours();
            const m = parsed.getMinutes();
            return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }
    }
    return null;
}

/**
 * Interpret calendar date + wall time in the given IANA zone as an absolute instant (UTC).
 */
export function wallSlotToUtc(dateStr: string, timeRaw: string, timeZone: string): Date | null {
    const date = dateStr.trim();
    const hhmm = normalizeTimeToHHmm(timeRaw);
    if (!date || !hhmm) return null;
    const wall = `${date} ${hhmm}:00`;
    try {
        return fromZonedTime(wall, timeZone);
    } catch {
        return null;
    }
}

function misSlot(
    data: MisReschedulePayload
): TimeSlot | null {
    if (!data?.date || !data?.time) return null;
    const t = normalizeTimeToHHmm(data.time);
    if (!t) return null;
    return { date: data.date.trim(), time: t, order: 1 };
}

/**
 * Effective wall-clock slot for reminders: MIS reschedule overrides, then normal resolution.
 */
export function resolveReminderSlotForInvitation(inv: CalendarInvitation): TimeSlot | null {
    if (inv.mis_rescheduled) {
        const m = misSlot(inv.mis_reschedule_data as MisReschedulePayload);
        if (m) return m;
    }
    return resolveInvitationSlot(inv);
}

export function resolveReminderSlotForRound(
    inv: CalendarInvitation,
    round: InterviewRound
): TimeSlot | null {
    if (round.mis_rescheduled) {
        const m = misSlot(round.mis_reschedule_data as MisReschedulePayload);
        if (m) return m;
    }
    if (inv.mis_rescheduled) {
        const m = misSlot(inv.mis_reschedule_data as MisReschedulePayload);
        if (m) return m;
    }
    return resolveRoundSlot(round);
}

export function isRoundReminderEligible(round: InterviewRound, invitationCanceled: boolean): boolean {
    if (invitationCanceled) return false;
    if (round.round_canceled) return false;
    if (round.status === "canceled") return false;
    return round.interview_confirmed === true || round.status === "confirmed";
}
