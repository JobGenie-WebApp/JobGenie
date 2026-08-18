import { describe, expect, it } from "vitest";
import { resolveInvitationSlot, resolveRoundSlot, type CalendarInvitation, type InterviewRound } from "./calendar-utils";

// Row shapes copied from real job_invitations / interview_rounds rows. The candidate
// dashboard widget showed nothing because the query errored; these guard the mapping
// that replaced it — notably that rounds carry the real dates, not the invitation.

const inv = {
    id: "inv-1",
    selected_time_slot: { date: "2026-08-03", time: "10:00", order: 2 },
    given_time_slots: [
        { date: "2026-08-01", time: "12:30", order: 1 },
        { date: "2026-08-03", time: "10:00", order: 2 },
    ],
    confirmed_time: null,
    mis_rescheduled: false,
    mis_reschedule_data: null,
} as unknown as CalendarInvitation;

const round = (over: Partial<InterviewRound>) => ({
    id: "r",
    round_number: 1,
    selected_time_slot: null,
    given_time_slots: [],
    confirmed_time: null,
    mis_rescheduled: false,
    mis_reschedule_data: null,
    ...over,
}) as unknown as InterviewRound;

describe("resolveInvitationSlot", () => {
    it("prefers the candidate-selected slot", () => {
        expect(resolveInvitationSlot(inv)?.date).toBe("2026-08-03");
    });

    it("falls back to the first proposed slot", () => {
        expect(resolveInvitationSlot({ ...inv, selected_time_slot: null })?.date).toBe("2026-08-01");
    });

    it("prefers an MIS reschedule over everything", () => {
        const rescheduled = { ...inv, mis_rescheduled: true, mis_reschedule_data: { date: "2026-09-09", time: "08:00" } };
        expect(resolveInvitationSlot(rescheduled)?.date).toBe("2026-09-09");
    });

    it("returns null when there is no date at all", () => {
        expect(resolveInvitationSlot({ ...inv, selected_time_slot: null, given_time_slots: [] })).toBeNull();
    });
});

describe("resolveRoundSlot", () => {
    it("keeps the selected date when confirmed_time is a bare time string", () => {
        const slot = resolveRoundSlot(round({
            confirmed_time: "10:00",
            selected_time_slot: { date: "2026-08-03", time: "10:00", order: 2 },
        }));
        expect(slot).toEqual({ date: "2026-08-03", time: "10:00", order: 2 });
    });

    it("uses a later round's own slot rather than the invitation's", () => {
        const slot = resolveRoundSlot(round({
            round_number: 2,
            selected_time_slot: { date: "2026-07-15", time: "14:00", order: 2 },
        }));
        expect(slot?.date).toBe("2026-07-15");
    });

    it("skips rounds that were never scheduled", () => {
        expect(resolveRoundSlot(round({ round_number: 3 }))).toBeNull();
    });
});
