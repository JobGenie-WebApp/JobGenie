/**
 * Property-based tests for src/lib/motion/variants.ts
 *
 * Task 4.1 — Property 5: All Exported Framer Motion Variant Objects Contain Required Keys
 * Task 4.2 — Property 3: Reduced Motion Disables All Entrance Animations
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { Variants } from "framer-motion";
import {
  pageVariants,
  cardVariants,
  statCardVariants,
  listItemVariants,
  tableRowVariants,
  authCardVariants,
  reducedMotionVariants,
  getVariants,
} from "./variants";

// ─── Named variants that must have initial/animate/exit ───────────────────────
const namedVariants: Record<string, Variants> = {
  pageVariants,
  cardVariants,
  statCardVariants,
  listItemVariants,
  tableRowVariants,
  authCardVariants,
};

const namedVariantNames = Object.keys(namedVariants) as Array<
  keyof typeof namedVariants
>;

// ─── Task 4.1 ─────────────────────────────────────────────────────────────────
// Property 5: All Exported Framer Motion Variant Objects Contain Required Keys
// Validates: Requirements 12.2

describe("Property 5: All exported variant objects contain required keys", () => {
  it("each named variant has initial, animate, and exit keys with non-null values", () => {
    /**
     * **Validates: Requirements 12.2**
     *
     * For each named variant exported from variants.ts (excluding container
     * variants and reducedMotionVariants), the object SHALL contain `initial`,
     * `animate`, and `exit` keys, each with a non-null value.
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...namedVariantNames),
        (name) => {
          const variant = namedVariants[name];

          expect(variant).toBeDefined();
          expect(variant.initial).not.toBeNull();
          expect(variant.initial).not.toBeUndefined();
          expect(variant.animate).not.toBeNull();
          expect(variant.animate).not.toBeUndefined();
          expect(variant.exit).not.toBeNull();
          expect(variant.exit).not.toBeUndefined();
        }
      )
    );
  });

  it("each named variant's initial state is a plain object (not a function)", () => {
    /**
     * **Validates: Requirements 12.2**
     *
     * Variant states used as static definitions should be plain objects,
     * not variant resolver functions.
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...namedVariantNames),
        (name) => {
          const variant = namedVariants[name];
          expect(typeof variant.initial).toBe("object");
          expect(typeof variant.animate).toBe("object");
          expect(typeof variant.exit).toBe("object");
        }
      )
    );
  });
});

// ─── Task 4.2 ─────────────────────────────────────────────────────────────────
// Property 3: Reduced Motion Disables All Entrance Animations
// Validates: Requirements 6.5, 7.4, 8.4, 11.6

describe("Property 3: Reduced motion variants disable spatial animations", () => {
  it("getVariants(name, true) returns no x, y, or scale in initial or animate", () => {
    /**
     * **Validates: Requirements 6.5, 7.4, 8.4, 11.6**
     *
     * For any variant returned by getVariants(name, true), the initial and
     * animate states SHALL NOT contain x, y, or scale properties.
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...namedVariantNames),
        (name) => {
          const variant = getVariants(name, true);

          const initial = variant.initial as Record<string, unknown>;
          const animate = variant.animate as Record<string, unknown>;

          // No spatial movement in reduced motion
          expect(initial).not.toHaveProperty("x");
          expect(initial).not.toHaveProperty("y");
          expect(initial).not.toHaveProperty("scale");

          expect(animate).not.toHaveProperty("x");
          expect(animate).not.toHaveProperty("y");
          expect(animate).not.toHaveProperty("scale");
        }
      )
    );
  });

  it("getVariants(name, true) returns transition durations ≤ 100ms", () => {
    /**
     * **Validates: Requirements 6.5, 7.4, 8.4, 11.6**
     *
     * All transition durations in reduced-motion variants SHALL be ≤ 100ms (0.1s).
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...namedVariantNames),
        (name) => {
          const variant = getVariants(name, true);

          const animate = variant.animate as Record<string, unknown>;
          const exit = variant.exit as Record<string, unknown>;

          const animateTransition = animate?.transition as
            | Record<string, unknown>
            | undefined;
          const exitTransition = exit?.transition as
            | Record<string, unknown>
            | undefined;

          if (animateTransition?.duration !== undefined) {
            expect(animateTransition.duration as number).toBeLessThanOrEqual(0.1);
          }
          if (exitTransition?.duration !== undefined) {
            expect(exitTransition.duration as number).toBeLessThanOrEqual(0.1);
          }
        }
      )
    );
  });

  it("getVariants(name, true) uses only opacity in initial and animate", () => {
    /**
     * **Validates: Requirements 6.5, 7.4, 8.4, 11.6**
     *
     * Reduced-motion variants should only animate opacity — no other
     * visual properties should change.
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...namedVariantNames),
        (name) => {
          const variant = getVariants(name, true);

          const initial = variant.initial as Record<string, unknown>;
          const animate = variant.animate as Record<string, unknown>;

          // initial should only have opacity
          const initialKeys = Object.keys(initial);
          expect(initialKeys).toEqual(["opacity"]);

          // animate should only have opacity and transition
          const animateKeys = Object.keys(animate).filter(
            (k) => k !== "transition"
          );
          expect(animateKeys).toEqual(["opacity"]);
        }
      )
    );
  });

  it("reducedMotionVariants covers all named variants", () => {
    /**
     * **Validates: Requirements 6.5, 7.4, 8.4, 11.6**
     *
     * Every named variant should have a corresponding reduced-motion entry.
     */
    fc.assert(
      fc.property(
        fc.constantFrom(...namedVariantNames),
        (name) => {
          expect(reducedMotionVariants).toHaveProperty(name);
          expect(reducedMotionVariants[name]).toBeDefined();
        }
      )
    );
  });

  it("getVariants(name, false) returns the full-motion variant with spatial properties", () => {
    /**
     * **Validates: Requirements 12.3**
     *
     * When prefersReducedMotion is false, getVariants should return the
     * full-motion variant (which may contain x, y, or scale).
     */
    // Variants that have spatial properties in their initial state
    const spatialVariants = [
      { name: "pageVariants", prop: "y" },
      { name: "cardVariants", prop: "y" },
      { name: "listItemVariants", prop: "x" },
      { name: "tableRowVariants", prop: "x" },
      { name: "authCardVariants", prop: "scale" },
    ] as const;

    fc.assert(
      fc.property(
        fc.constantFrom(...spatialVariants),
        ({ name, prop }) => {
          const variant = getVariants(name, false);
          const initial = variant.initial as Record<string, unknown>;
          expect(initial).toHaveProperty(prop);
        }
      )
    );
  });
});
