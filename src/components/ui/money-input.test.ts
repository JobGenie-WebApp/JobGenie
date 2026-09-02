import { describe, it, expect } from "vitest";
import { groupDigits, parseMoneyInput } from "./money-input";

describe("groupDigits", () => {
    it("groups thousands", () => {
        expect(groupDigits("100000")).toBe("100,000");
        expect(groupDigits("1234567")).toBe("1,234,567");
        expect(groupDigits("999")).toBe("999");
        expect(groupDigits("")).toBe("");
    });

    it("only groups the integer part, and keeps a half-typed decimal", () => {
        expect(groupDigits("1234567.89")).toBe("1,234,567.89");
        expect(groupDigits("1000.")).toBe("1,000.");
    });
});

describe("parseMoneyInput", () => {
    it("strips separators and stray characters", () => {
        expect(parseMoneyInput("1,234,567")).toBe("1234567");
        expect(parseMoneyInput("LKR 100,000")).toBe("100000");
    });

    it("keeps only the first decimal point", () => {
        expect(parseMoneyInput("1.5.7")).toBe("1.57");
    });
});
