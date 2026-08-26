import { describe, it, expect } from "vitest";
import { countExpiringSoon, countHires, isLive } from "./employer-dashboard-stats";

const now = Date.parse("2026-08-26T00:00:00Z");
const at = (days: number) => new Date(now + days * 864e5).toISOString();

describe("countExpiringSoon", () => {
    it("counts only published postings inside the window", () => {
        const jobs = [
            { status: "published", expires_at: at(3) },   // counts
            { status: "published", expires_at: at(-2) },  // already lapsed
            { status: "published", expires_at: at(30) },  // too far out
            { status: "draft", expires_at: at(3) },       // not published
            { status: "published", expires_at: null },    // no deadline
        ];
        expect(countExpiringSoon(jobs, now)).toBe(1);
    });
});

describe("countHires", () => {
    it("counts an application-sourced hire once", () => {
        const invitations = [{ pipeline_status: "hired", application_id: "app-1" }];
        const applications = [{ id: "app-1", status: "hired" }];
        expect(countHires(invitations, applications)).toBe(1);
    });

    it("adds hires that never went through an invitation", () => {
        const invitations = [{ pipeline_status: "hired", application_id: "app-1" }];
        const applications = [
            { id: "app-1", status: "hired" },
            { id: "app-2", status: "hired" },
            { id: "app-3", status: "shortlisted" },
        ];
        expect(countHires(invitations, applications)).toBe(2);
    });

    it("counts a sourced (application-less) invitation hire", () => {
        expect(countHires([{ pipeline_status: "hired", application_id: null }], [])).toBe(1);
    });

    it("ignores invitations still in the pipeline", () => {
        expect(countHires([{ pipeline_status: "active", application_id: "app-1" }], [])).toBe(0);
    });
});

describe("isLive", () => {
    it("counts a published posting with time left", () => {
        expect(isLive({ status: "published", expires_at: at(5) }, now)).toBe(true);
    });

    it("counts a published posting with no deadline", () => {
        expect(isLive({ status: "published", expires_at: null }, now)).toBe(true);
    });

    it("drops a published posting past its deadline (candidates cannot see it)", () => {
        expect(isLive({ status: "published", expires_at: at(-1) }, now)).toBe(false);
    });

    it("drops drafts, paused and closed postings", () => {
        for (const status of ["draft", "paused", "closed", "archived"]) {
            expect(isLive({ status, expires_at: at(5) }, now)).toBe(false);
        }
    });
});
