import { describe, expect, it } from "vitest";
import { toMapEmbedUrl, toMapViewUrl } from "./utils";

// The stored map_link is free-text the employer pasted. The one rule that matters:
// never hand a non-Google URL to an iframe, because it used to render as a website.
describe("toMapEmbedUrl", () => {
    it("never frames a plain website — falls back to the address", () => {
        const url = toMapEmbedUrl("https://kodemargin.com", "Colombo");
        expect(url).toBe("https://maps.google.com/maps?q=Colombo&z=15&output=embed");
    });

    it("passes a real Google embed URL straight through", () => {
        const embed = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3";
        expect(toMapEmbedUrl(embed, "Colombo")).toBe(embed);
    });

    it("pulls coordinates out of a shared maps URL", () => {
        const url = toMapEmbedUrl("https://www.google.com/maps/@6.9271,79.8612,15z", null);
        expect(url).toBe("https://maps.google.com/maps?q=6.9271%2C79.8612&z=15&output=embed");
    });

    it("pulls the place name out of a /maps/place URL", () => {
        const url = toMapEmbedUrl("https://www.google.com/maps/place/Colombo+Fort/@6.9,79.8", null);
        // coordinates win when both are present
        expect(url).toContain("q=6.9%2C79.8");
        expect(toMapEmbedUrl("https://www.google.com/maps/place/Colombo+Fort", null))
            .toBe("https://maps.google.com/maps?q=Colombo%20Fort&z=15&output=embed");
    });

    it("returns null when there is nothing to show", () => {
        expect(toMapEmbedUrl(null, null)).toBeNull();
        expect(toMapEmbedUrl("https://kodemargin.com", "")).toBeNull();
    });
});

describe("toMapViewUrl", () => {
    it("keeps a genuine maps link for the out-link", () => {
        const short = "https://maps.app.goo.gl/abc123";
        expect(toMapViewUrl(short, "Colombo")).toBe(short);
    });

    it("searches the address when the stored link is not a map", () => {
        expect(toMapViewUrl("https://kodemargin.com", "Colombo"))
            .toBe("https://www.google.com/maps/search/?api=1&query=Colombo");
    });
});
