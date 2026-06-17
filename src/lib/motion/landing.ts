import type { Transition, Variants } from 'framer-motion';
import { ease } from './variants';

// Re-export shared ease under the landing-specific alias for backward compatibility
export { ease };
/** @deprecated Use `ease` from `@/lib/motion/variants` instead */
export const landingEase: [number, number, number, number] = ease;

export const landingSpring: Transition = {
    type: 'spring',
    stiffness: 380,
    damping: 32,
    mass: 0.9,
};

export const fadeUp: Variants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.36, ease },
    },
};

export const fadeIn: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.45, ease },
    },
};

export const staggerFast: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.045,
            delayChildren: 0.04,
        },
    },
};

export const staggerCards: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.03,
        },
    },
};

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.98, y: 10 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.38, ease },
    },
};

/** Scroll-triggered sections */
export const inViewProps = {
    viewport: { once: true, margin: '-80px' as const },
    initial: 'hidden' as const,
    whileInView: 'visible' as const,
};
