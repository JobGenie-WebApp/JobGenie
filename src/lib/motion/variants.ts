import type { Variants } from "framer-motion";

// ─── Shared easing ────────────────────────────────────────────────────────────
export const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ─── Full-motion variants ─────────────────────────────────────────────────────

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.14, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -3, transition: { duration: 0.1, ease: "easeIn" } },
};

export const cardVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit:    { opacity: 0, y: 10, transition: { duration: 0.2, ease: "easeIn" } },
};

export const statCardVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
  exit:    { opacity: 0, y: 8, transition: { duration: 0.15 } },
};

export const listItemVariants: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit:    { opacity: 0, x: 8,  transition: { duration: 0.15 } },
};

export const tableRowVariants: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit:    { opacity: 0, x: 8,  transition: { duration: 0.15 } },
};

export const authCardVariants: Variants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
  exit:    { opacity: 0, scale: 0.97, transition: { duration: 0.2 } },
};

// ─── Container variants (stagger parents) ─────────────────────────────────────

export const statCardContainerVariants: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
  exit:    {},
};

export const tableContainerVariants: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.04 } },
  exit:    {},
};

// ─── Reduced-motion variants (opacity-only, 100ms) ────────────────────────────

export const reducedMotionVariants: Record<string, Variants> = {
  pageVariants:     { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.1 } }, exit: { opacity: 0, transition: { duration: 0.1 } } },
  cardVariants:     { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.1 } }, exit: { opacity: 0, transition: { duration: 0.1 } } },
  statCardVariants: { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.1 } }, exit: { opacity: 0, transition: { duration: 0.1 } } },
  listItemVariants: { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.1 } }, exit: { opacity: 0, transition: { duration: 0.1 } } },
  tableRowVariants: { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.1 } }, exit: { opacity: 0, transition: { duration: 0.1 } } },
  authCardVariants: { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.1 } }, exit: { opacity: 0, transition: { duration: 0.1 } } },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

export function getVariants(
  name: keyof typeof reducedMotionVariants,
  prefersReducedMotion: boolean
): Variants {
  if (prefersReducedMotion) return reducedMotionVariants[name];
  const map: Record<string, Variants> = {
    pageVariants, cardVariants, statCardVariants,
    listItemVariants, tableRowVariants, authCardVariants,
  };
  return map[name];
}
