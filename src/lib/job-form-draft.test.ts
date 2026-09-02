import { describe, it, expect } from "vitest";
import { sameForm, parseDraft, resolveDraft } from "./job-form-draft";

const server = { job_title: "CEO", location: "Colombo", salary_min: "1000000" };

describe("resolveDraft", () => {
    it("uses the server copy when there is no draft", () => {
        expect(resolveDraft(server, null)).toEqual({ form: server, isDraft: false });
    });

    it("ignores the autosaved copy of the server data", () => {
        // The regression: this copy is written on every load, so treating it as a
        // draft pinned the form to stale local data and hid later server changes.
        const { form, isDraft } = resolveDraft(server, JSON.stringify(server));
        expect(isDraft).toBe(false);
        expect(form).toEqual(server);
    });

    it("restores a real unsaved edit", () => {
        const edited = { ...server, job_title: "CFO" };
        expect(resolveDraft(server, JSON.stringify(edited))).toEqual({ form: edited, isDraft: true });
    });

    it("falls back to the server copy on a corrupt or partial draft", () => {
        expect(resolveDraft(server, "{not json").form).toEqual(server);
        expect(resolveDraft(server, JSON.stringify({ job_title: "CFO" })).form).toEqual(server);
        expect(resolveDraft(server, JSON.stringify(["a"])).form).toEqual(server);
    });

    it("treats a cleared field as a real draft", () => {
        const cleared = { ...server, location: "" };
        expect(resolveDraft(server, JSON.stringify(cleared)).isDraft).toBe(true);
    });
});

describe("sameForm / parseDraft", () => {
    it("compares field by field", () => {
        expect(sameForm(server, { ...server })).toBe(true);
        expect(sameForm(server, { ...server, location: "Kandy" })).toBe(false);
    });

    it("returns null for unusable input", () => {
        expect(parseDraft(null)).toBeNull();
        expect(parseDraft("nope")).toBeNull();
    });
});
