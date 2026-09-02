import { describe, expect, it } from "vitest";
import { currencyOptions, currencySelectOptions, formatSalary, formatSalaryRange } from "./currencies";

describe("currencies", () => {
    it("lists every ISO 4217 currency the runtime knows, with a symbol and a name", () => {
        const all = currencyOptions();
        expect(all.length).toBeGreaterThan(100);
        const lkr = all.find((c) => c.code === "LKR");
        expect(lkr).toEqual({ code: "LKR", symbol: expect.any(String), name: "Sri Lankan Rupee", flag: "\u{1F1F1}\u{1F1F0}" });
        expect(all.find((c) => c.code === "USD")?.symbol).toBe("$");
        // Supranational codes have no country behind them.
        expect(all.find((c) => c.code === "XOF")?.flag).toBe("");
    });

    it("labels with a flag, and skips the symbol when it is just the code again", () => {
        const byCode = Object.fromEntries(currencySelectOptions().map((o) => [o.value, o.label]));
        expect(byCode.USD).toBe("\u{1F1FA}\u{1F1F8} USD $");
        expect(byCode.AED).toBe("\u{1F1E6}\u{1F1EA} AED");
        expect(byCode.XOF).toBe("XOF F\u202fCFA"); // no country, so no flag
    });

    it("falls back to LKR so pre-currency rows keep reading the way they were entered", () => {
        expect(formatSalary(150000, "USD")).toBe("USD 150,000");
        expect(formatSalary(150000, null)).toBe("LKR 150,000");
        expect(formatSalary("150000")).toBe("LKR 150,000");
    });
});

describe("formatSalaryRange", () => {
    it("groups both bounds", () => {
        expect(formatSalaryRange(100000, 200000, "LKR")).toBe("LKR 100,000 – 200,000");
    });

    it("handles a single bound", () => {
        expect(formatSalaryRange(100000, null, "USD")).toBe("USD 100,000+");
        expect(formatSalaryRange(null, 1500000, "USD")).toBe("Up to USD 1,500,000");
    });

    it("defaults the currency and appends a suffix", () => {
        expect(formatSalaryRange(50000, null)).toBe("LKR 50,000+");
        expect(formatSalaryRange(50000, 60000, "LKR", " / month")).toBe("LKR 50,000 – 60,000 / month");
    });

    it("is null when neither bound is set", () => {
        expect(formatSalaryRange(null, null, "LKR")).toBeNull();
        expect(formatSalaryRange(0, 0, "LKR")).toBeNull();
    });
});
