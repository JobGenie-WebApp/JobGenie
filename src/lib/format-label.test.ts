import { describe, expect, it } from "vitest";
import { formatLabel } from "./utils";

describe("formatLabel", () => {
    it("never lets a stored value reach the screen with underscores", () => {
        expect(formatLabel("open_to_opportunities")).toBe("Open To Opportunities");
        expect(formatLabel("1_month")).toBe("1 Month");
        expect(formatLabel("second_class_upper")).toBe("Second Class Upper");
        expect(formatLabel("45 days")).toBe("45 Days");
    });

    it("falls back when there is nothing to show", () => {
        expect(formatLabel(null)).toBe("");
        expect(formatLabel(undefined, "N/A")).toBe("N/A");
        expect(formatLabel("")).toBe("");
    });
});
