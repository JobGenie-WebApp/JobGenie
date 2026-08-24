import { describe, expect, it } from "vitest";
import { getMisInterviewStage } from "./mis-interview-status";

describe("getMisInterviewStage", () => {
    it("shows the final hiring stage instead of the earlier interview state", () => {
        expect(getMisInterviewStage({ pipeline_status: "hired", interview_confirmed: true })).toEqual({
            key: "hired",
            label: "Hired",
        });
        expect(getMisInterviewStage({ pipeline_status: "offered", invitation_canceled: true })).toEqual({
            key: "offered",
            label: "Offer Sent",
        });
    });

    it("falls back through rescheduled, cancelled, confirmed, and pending", () => {
        expect(getMisInterviewStage({ mis_rescheduled: true, invitation_canceled: true }).key).toBe("rescheduled");
        expect(getMisInterviewStage({ invitation_canceled: true }).key).toBe("cancelled");
        expect(getMisInterviewStage({ interview_confirmed: true }).key).toBe("confirmed");
        expect(getMisInterviewStage({}).key).toBe("pending");
    });
});
