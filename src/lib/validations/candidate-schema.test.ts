import { describe, expect, it } from "vitest";
import { candidateRegistrationSchema } from "./candidate-schema";

const contactNo = candidateRegistrationSchema.shape.contactNo;

describe("contactNo accepts any international number", () => {
    it.each(["+94771234567", "+14155552671", "+442071838750", "+91 98765 43210"])("accepts %s", (n) => {
        expect(contactNo.safeParse(n).success).toBe(true);
    });

    it.each(["771234567", "+0771234567", "+9412", "+9471234567890123"])("rejects %s", (n) => {
        expect(contactNo.safeParse(n).success).toBe(false);
    });
});
