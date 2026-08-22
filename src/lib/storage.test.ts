import { describe, it, expect } from "vitest";
import { privatePiiTarget } from "./storage";

const BASE = "https://x.supabase.co/storage/v1/object/public/";

describe("privatePiiTarget", () => {
    it("targets private PII buckets and extracts bucket + path", () => {
        expect(privatePiiTarget(`${BASE}resume/abc/resume_1.pdf`)).toEqual({ bucket: "resume", path: "abc/resume_1.pdf" });
        expect(privatePiiTarget(`${BASE}resume_copy/abc/cv.pdf`)).toEqual({ bucket: "resume_copy", path: "abc/cv.pdf" });
        expect(privatePiiTarget(`${BASE}br-certificates/presignup/x.pdf`)).toEqual({ bucket: "br-certificates", path: "presignup/x.pdf" });
    });

    it("ignores public image buckets, payment-proof paths, signed URLs, and empties", () => {
        expect(privatePiiTarget(`${BASE}profile-images/a/p.png`)).toBeNull(); // stays public
        expect(privatePiiTarget("companyId/proof_1.pdf")).toBeNull();          // private-bucket path, not a public URL
        expect(privatePiiTarget("https://x.supabase.co/storage/v1/object/sign/resume/a/f.pdf?token=z")).toBeNull();
        expect(privatePiiTarget(null)).toBeNull();
        expect(privatePiiTarget("")).toBeNull();
    });

    it("strips query/hash and decodes the path", () => {
        expect(privatePiiTarget(`${BASE}resume/a/my%20cv.pdf#toolbar=0`)).toEqual({ bucket: "resume", path: "a/my cv.pdf" });
    });
});
