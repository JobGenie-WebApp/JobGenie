import { describe, it, expect } from "vitest";
import { splitPhone } from "./phone-input";

const countries = [
    { code: "LK", name: "Sri Lanka", flag_emoji: "🇱🇰", calling_code: "+94" },
    { code: "US", name: "United States", flag_emoji: "🇺🇸", calling_code: "+1" },
    { code: "CA", name: "Canada", flag_emoji: "🇨🇦", calling_code: "+1" },
    { code: "TT", name: "Trinidad and Tobago", flag_emoji: "🇹🇹", calling_code: "+1868" },
    { code: "AQ", name: "Antarctica", flag_emoji: "🇦🇶", calling_code: null },
];

describe("splitPhone", () => {
    it("falls back to the default country when there is no value", () => {
        expect(splitPhone(countries, "")).toMatchObject({ dial: "+94", local: "" });
    });

    it("derives the country from the stored number", () => {
        const { selected, local } = splitPhone(countries, "+94771234567");
        expect(selected?.code).toBe("LK");
        expect(local).toBe("771234567");
    });

    it("prefers the longest matching calling code", () => {
        expect(splitPhone(countries, "+18685551234").selected?.code).toBe("TT");
    });

    it("keeps the picked country when it shares a calling code", () => {
        expect(splitPhone(countries, "+15551234567", "CA").selected?.code).toBe("CA");
    });

    it("ignores a picked country whose code no longer matches the value", () => {
        expect(splitPhone(countries, "+94771234567", "CA").selected?.code).toBe("LK");
    });

    it("strips separators the user pasted", () => {
        expect(splitPhone(countries, "+94 77 123 4567").local).toBe("771234567");
    });
});
