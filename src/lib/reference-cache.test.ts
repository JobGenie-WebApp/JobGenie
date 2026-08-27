import { describe, it, expect, vi } from "vitest";
import { cachedList } from "./reference-cache";

describe("cachedList", () => {
    it("serves a populated result from cache", async () => {
        const load = vi.fn().mockResolvedValue(["Sri Lanka"]);

        expect(await cachedList("t-populated", load)).toEqual(["Sri Lanka"]);
        expect(await cachedList("t-populated", load)).toEqual(["Sri Lanka"]);
        expect(load).toHaveBeenCalledTimes(1);
    });

    it("never caches an empty result", async () => {
        // The guard that matters: every loader degrades to [] when its query fails, and a
        // cached [] would strip job titles and countries out of the CV extraction prompt
        // for the whole TTL. A failed lookup must be retried, not remembered.
        const load = vi.fn().mockResolvedValueOnce([]).mockResolvedValue(["Accountant"]);

        expect(await cachedList("t-empty", load)).toEqual([]);
        expect(await cachedList("t-empty", load)).toEqual(["Accountant"]);
        expect(load).toHaveBeenCalledTimes(2);
    });

    it("keys entries independently", async () => {
        await cachedList("t-a", async () => ["a"]);
        expect(await cachedList("t-b", async () => ["b"])).toEqual(["b"]);
        expect(await cachedList("t-a", async () => ["ignored"])).toEqual(["a"]);
    });
});
