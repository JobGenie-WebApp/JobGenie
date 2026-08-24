import { describe, it, expect } from "vitest";
import { computeHiringFee, DEFAULT_HIRING_FEE_PERCENTAGE } from "./hiring-fee";

// The hiring fee is what the employer actually gets charged, so the normalisation
// to a monthly figure and the percentage need to hold for every salary period.
describe("computeHiringFee", () => {
    it("takes the configured percentage of a monthly salary", () => {
        expect(computeHiringFee(250000, "monthly", 50)).toBe(125000);
    });

    it("normalises an annual salary to monthly first", () => {
        expect(computeHiringFee(3000000, "annual", 50)).toBe(125000);
    });

    it("normalises hourly and daily salaries", () => {
        expect(computeHiringFee(1000, "hourly", 50)).toBe(80000); // 160 h/month
        expect(computeHiringFee(5000, "daily", 50)).toBe(55000); // 22 d/month
    });

    it("honours a non-default percentage", () => {
        expect(computeHiringFee(250000, "monthly", 25)).toBe(62500);
        expect(computeHiringFee(250000, "monthly", 0)).toBe(0);
    });

    it("defaults to 50% and to a monthly period", () => {
        expect(DEFAULT_HIRING_FEE_PERCENTAGE).toBe(50);
        expect(computeHiringFee(250000, null)).toBe(125000);
    });

    it("rounds to the 2 decimals the Decimal(12,2) column holds", () => {
        expect(computeHiringFee(1234.567, "monthly", 50)).toBe(617.28);
    });

    // null means "no usable salary" — callers fall back to configured pricing
    // rather than billing zero.
    it("returns null when there is no usable amount", () => {
        expect(computeHiringFee(null, "monthly", 50)).toBeNull();
        expect(computeHiringFee(undefined, "monthly", 50)).toBeNull();
        expect(computeHiringFee(0, "monthly", 50)).toBeNull();
        expect(computeHiringFee(-1000, "monthly", 50)).toBeNull();
        expect(computeHiringFee(Number.NaN, "monthly", 50)).toBeNull();
    });

    it("falls back to the default percentage when given a nonsense one", () => {
        expect(computeHiringFee(250000, "monthly", Number.NaN)).toBe(125000);
        expect(computeHiringFee(250000, "monthly", -10)).toBe(125000);
    });
});
