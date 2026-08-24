import { describe, expect, it } from "vitest";
import { reopenComplianceFlag } from "./compliance-resolution";

describe("reopenComplianceFlag", () => {
    it("returns a rejected replacement document to an open, retryable state", () => {
        expect(reopenComplianceFlag("Upload a readable bank slip")).toEqual({
            status: "paused",
            employer_doc_url: null,
            employer_doc_path: null,
            employer_doc_name: null,
            employer_doc_type: null,
            employer_note: null,
            resubmitted_at: null,
            resolved_by_mis_user_id: null,
            resolved_at: null,
            resolution_notes: "Upload a readable bank slip",
        });
    });
});
