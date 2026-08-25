import { describe, expect, it } from "vitest";
import { currencyOptions, currencySelectOptions, formatSalary } from "./currencies";

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
