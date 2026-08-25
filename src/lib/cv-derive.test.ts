import { describe, expect, it } from "vitest";
import {
    cvExtractedDateToMonthValue,
    experienceLevelFromYears,
    latestJobTitle,
    matchFromList,
    normalizeLkPhone,
    pickOption,
    toIsoDate,
    totalYearsOfExperience,
} from "./cv-derive";

const NOW = new Date("2026-08-01T00:00:00Z");

describe("cvExtractedDateToMonthValue", () => {
    it("trims a day component and rejects junk", () => {
        expect(cvExtractedDateToMonthValue("2024-09-15")).toBe("2024-09");
        expect(cvExtractedDateToMonthValue("2024-09")).toBe("2024-09");
        expect(cvExtractedDateToMonthValue("Sep 2024")).toBe("");
        expect(cvExtractedDateToMonthValue(null)).toBe("");
    });
});

describe("latestJobTitle", () => {
    it("prefers the current role over the latest end date", () => {
        expect(latestJobTitle([
            { jobTitle: "Old", endDate: "2020-01" },
            { jobTitle: "Now", endDate: null, isCurrent: true },
        ])).toBe("Now");
    });

    it("falls back to the most recent end date when nothing is marked current", () => {
        expect(latestJobTitle([
            { jobTitle: "Junior", endDate: "2019-06" },
            { jobTitle: "Senior", endDate: "2024-03" },
        ])).toBe("Senior");
    });

    it("returns empty for an empty history", () => {
        expect(latestJobTitle([])).toBe("");
    });
});

describe("totalYearsOfExperience", () => {
    it("sums closed ranges", () => {
        expect(totalYearsOfExperience([
            { startDate: "2018-01", endDate: "2020-01" },
            { startDate: "2020-01", endDate: "2023-01" },
        ], NOW)).toBe(5);
    });

    it("runs a current role up to today", () => {
        expect(totalYearsOfExperience([
            { startDate: "2022-08", isCurrent: true },
        ], NOW)).toBe(4);
    });

    it("ignores rows with no usable start date, and never goes negative", () => {
        expect(totalYearsOfExperience([
            { startDate: null, endDate: "2020-01" },
            { startDate: "Sept 2019", endDate: "2021-01" },
            { startDate: "2023-01", endDate: "2021-01" },
        ], NOW)).toBe(0);
    });
});

describe("toIsoDate", () => {
    it("pads partial dates out to a full ISO date", () => {
        expect(toIsoDate("2024-03-15")).toBe("2024-03-15");
        expect(toIsoDate("2024-03")).toBe("2024-03-01");
        expect(toIsoDate("2024")).toBe("2024-01-01");
    });

    it("rejects anything it cannot pad safely", () => {
        expect(toIsoDate("March 2024")).toBe("");
        expect(toIsoDate("")).toBe("");
        expect(toIsoDate(null)).toBe("");
    });
});

describe("normalizeLkPhone", () => {
    it("maps every local Sri Lankan format onto +94XXXXXXXXX", () => {
        for (const input of ["0771234567", "077 123 4567", "077-123-4567", "94771234567", "+94 77 123 4567", "+94771234567"]) {
            expect(normalizeLkPhone(input)).toBe("+94771234567");
        }
    });

    it("returns empty rather than guessing at anything else", () => {
        expect(normalizeLkPhone("+1 415 555 0123")).toBe("");
        expect(normalizeLkPhone("07712345")).toBe("");
        expect(normalizeLkPhone(null)).toBe("");
    });

    it("produces a value basicInfoSchema accepts", () => {
        expect(/^\+94\d{9}$/.test(normalizeLkPhone("077 123 4567"))).toBe(true);
    });
});

describe("experienceLevelFromYears", () => {
    it("maps years onto the wizard's levels", () => {
        expect(experienceLevelFromYears(0)).toBe("entry");
        expect(experienceLevelFromYears(2)).toBe("junior");
        expect(experienceLevelFromYears(5)).toBe("mid");
        expect(experienceLevelFromYears(8)).toBe("senior");
        // "lead"/"principal" were retired - everything above the senior threshold stays senior.
        expect(experienceLevelFromYears(12)).toBe("senior");
        expect(experienceLevelFromYears(20)).toBe("senior");
    });
});

describe("pickOption / matchFromList", () => {
    it("accepts a valid option regardless of case and punctuation", () => {
        expect(pickOption("Full Time", ["full_time", "contract"] as const, "full_time")).toBe("full_time");
        expect(pickOption("SECOND_CLASS_UPPER", ["second_class_upper", "general"] as const, "general")).toBe("second_class_upper");
    });

    it("falls back when the model invents a value", () => {
        expect(pickOption("permanent", ["full_time", "contract"] as const, "full_time")).toBe("full_time");
        expect(pickOption(null, ["onsite", "remote"] as const, "onsite")).toBe("onsite");
    });

    it("returns empty for an unknown list entry instead of a wrong one", () => {
        expect(matchFromList("sri lanka", ["Sri Lanka", "India"])).toBe("Sri Lanka");
        expect(matchFromList("Atlantis", ["Sri Lanka", "India"])).toBe("");
    });
});
