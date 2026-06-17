# Design Document — UI Modernization

## Overview

This document describes the technical architecture for the JobGenie UI modernization. The goal is a purely visual upgrade across all three portals (MIS, Candidate, Employer) and the public landing/auth pages. No business logic, API routes, server actions, database queries, or routing structure is touched. Every change is additive or a drop-in replacement at the styling and animation layer.

The stack is already in place: Next.js 16, TypeScript, Tailwind v4, shadcn/ui (Radix UI), Framer Motion v12, Lucide icons, and OKLCH color tokens in `globals.css`.

---

## Architecture

The modernization is organized into four independent layers that compose cleanly:

```
┌─────────────────────────────────────────────────────────┐
│  Layer 4 — Page & Component Animations                  │
│  (Framer Motion: page transitions, stat cards, tables)  │
├─────────────────────────────────────────────────────────┤
│  Layer 3 — Portal-Specific Visual Components            │
│  (Sidebars, layouts, dashboard widgets, auth shell)     │
├─────────────────────────────────────────────────────────┤
│  Layer 2 — Primitive Component Variants                 │
│  (Button gradient, Card glass — additive CVA variants)  │
├─────────────────────────────────────────────────────────┤
│  Layer 1 — Design Token System                          │
│  (globals.css: OKLCH tokens, utility classes, @theme)   │
└─────────────────────────────────────────────────────────┘
```

Each layer depends only on the layer below it. This means the token system can be validated independently, primitive variants can be tested without portal context, and animations can be toggled without touching tokens.

---

## Components and Interfaces

### 1. Design Token System (`src/app/globals.css`)

The existing `globals.css` already uses OKLCH tokens and a Tailwind v4 `@theme inline` block. The modernization extends it with:

**New CSS custom properties added to `:root` and `.dark`:**

```css
/* Richer accent palette */
--accent-violet: oklch(0.58 0.22 290);      /* light */
--accent-amber:  oklch(0.72 0.18 75);
--accent-rose:   oklch(0.62 0.22 10);
--accent-sky:    oklch(0.62 0.16 220);

/* Gradient tokens */
--gradient-primary: linear-gradient(135deg, var(--primary), var(--accent));
--gradient-accent:  linear-gradient(135deg, var(--accent), var(--accent-violet));

/* Shadow tokens */
--shadow-glass:        0 4px 24px -4px oklch(0 0 0 / 0.12), 0 1px 4px oklch(0 0 0 / 0.06);
--shadow-glow-primary: 0 0 20px oklch(var(--primary) / 0.35);
--shadow-glow-accent:  0 0 20px oklch(var(--accent) / 0.30);
```

Dark-mode counterparts use higher lightness for accent tokens and slightly stronger glow opacities (0.40 / 0.35).

**New utility classes added to `@layer base` or a new `@layer utilities` block:**

```css
/* Glassmorphism card surface */
.glass-card {
  background: color-mix(in oklch, var(--card) 75%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid color-mix(in oklch, var(--border) 50%, var(--primary) 8%);
  box-shadow: var(--shadow-glass);
}
.dark .glass-card {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* Mesh backgrounds */
.mesh-bg {
  background-image:
    radial-gradient(ellipse 70% 55% at 15% 20%, oklch(var(--primary) / 0.08), transparent 55%),
    radial-gradient(ellipse 60% 50% at 85% 75%, oklch(var(--accent) / 0.07), transparent 50%),
    radial-gradient(ellipse 50% 40% at 50% 50%, oklch(var(--accent-violet) / 0.05), transparent 60%);
  background-attachment: fixed;
}
.dark .mesh-bg {
  background-image:
    radial-gradient(ellipse 70% 55% at 15% 20%, oklch(var(--primary) / 0.12), transparent 55%),
    radial-gradient(ellipse 60% 50% at 85% 75%, oklch(var(--accent) / 0.10), transparent 50%),
    radial-gradient(ellipse 50% 40% at 50% 50%, oklch(var(--accent-violet) / 0.08), transparent 60%);
}
.mesh-bg-subtle {
  background-image:
    radial-gradient(ellipse 70% 55% at 15% 20%, oklch(var(--primary) / 0.04), transparent 55%),
    radial-gradient(ellipse 60% 50% at 85% 75%, oklch(var(--accent) / 0.03), transparent 50%);
  background-attachment: fixed;
}

/* Body smooth theme transition */
body {
  transition: background-color 200ms ease, color 200ms ease;
}
```

**`@theme inline` additions** (new color mappings for the four accent tokens):

```css
--color-accent-violet: var(--accent-violet);
--color-accent-amber:  var(--accent-amber);
--color-accent-rose:   var(--accent-rose);
--color-accent-sky:    var(--accent-sky);
```

**Updated sidebar tokens** (both `:root` and `.dark`) to produce richer separation:

- Light: `--sidebar: oklch(0.975 0.003 265)` — slightly cooler/darker than the near-white background
- Dark: `--sidebar: oklch(0.13 0.015 265)` — slightly darker than the `0.15` page background

**Updated scrollbar thumb colors:**

```css
/* :root */
::-webkit-scrollbar-thumb { background: oklch(0.82 0.01 265); }
/* .dark */
.dark ::-webkit-scrollbar-thumb { background: oklch(0.32 0.015 265); }
```

---

### 2. Primitive Component Variants

#### 2a. `Card` — `variant="glass"` (`src/components/ui/card.tsx`)

The `Card` function currently accepts `React.ComponentProps<"div">`. The change adds an optional `variant` prop using a simple conditional — no CVA needed since there is only one new variant:

```tsx
interface CardProps extends React.ComponentProps<"div"> {
  variant?: "default" | "glass";
}

function Card({ className, variant = "default", ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm transition-shadow duration-200 hover:shadow-md",
        variant === "glass" && "glass-card",
        className
      )}
      {...props}
    />
  )
}
```

All sub-components (`CardHeader`, `CardTitle`, etc.) are unchanged. The `variant` prop is additive — existing usages without the prop continue to render identically.

#### 2b. `Button` — `variant="gradient"` (`src/components/ui/button.tsx`)

A new entry is added to the `cva` variant map. The gradient is achieved via a CSS custom property approach so hover can shift it without JavaScript:

```tsx
// Inside buttonVariants cva variants.variant:
gradient:
  "relative overflow-hidden text-white font-semibold min-h-[44px] min-w-[44px] " +
  "bg-[linear-gradient(135deg,var(--primary),var(--accent))] " +
  "shadow-md shadow-primary/20 " +
  "before:absolute before:inset-0 before:bg-white/0 before:transition-all before:duration-200 " +
  "hover:before:bg-white/10 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 " +
  "active:translate-y-0 active:before:bg-white/5 " +
  "disabled:opacity-60 disabled:hover:before:bg-white/0 disabled:hover:translate-y-0",
```

The `before:` pseudo-element overlay provides the hover brightening without needing `background-size` animation, which has poor browser support for gradients. The `min-h-[44px] min-w-[44px]` ensures the 44×44px touch target requirement.

---

### 3. Shared Framer Motion Variant Library (`src/lib/motion/variants.ts`)

This is a new file. The existing `src/lib/motion/landing.ts` is updated to re-export shared variants from here.

```typescript
import type { Variants, Transition } from "framer-motion";

// ─── Shared easing ────────────────────────────────────────────────────────────
export const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ─── Full-motion variants ─────────────────────────────────────────────────────

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeInOut" } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2, ease: "easeInOut" } },
};

export const cardVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit:    { opacity: 0, y: 10, transition: { duration: 0.2, ease: "easeIn" } },
};

export const statCardVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit:    { opacity: 0, y: 10, transition: { duration: 0.2 } },
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
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
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
```

`landing.ts` is updated to import `ease` (renamed from `landingEase`) and the `fadeUp`, `scaleIn`, `staggerFast`, `staggerCards` variants from `variants.ts` where they overlap, keeping its own landing-specific exports.

---

### 4. Sidebar Modernization (All Three Portals)

The three sidebar components (`MISSidebar`, `CandidateSidebar`, `EmployerSidebar`) share identical structural patterns. The changes are:

**Logo container** — replace `bg-primary` with a gradient:
```tsx
// Before
<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">

// After
<div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden"
     style={{ background: "var(--gradient-primary)" }}>
```

**Active nav item** — replace `bg-sidebar-accent border-r-3 border-green-500` with:
```tsx
isActive && [
  // Gradient background
  "bg-[linear-gradient(90deg,oklch(from_var(--sidebar-primary)_l_c_h_/_0.15),oklch(from_var(--accent)_l_c_h_/_0.08))]",
  // Left accent border (not right)
  "border-l-[3px] border-l-sidebar-primary border-r-0",
  // Icon glow applied via a CSS class
  "[&_svg]:drop-shadow-[0_0_6px_oklch(from_var(--sidebar-primary)_l_c_h_/_0.5)]",
].join(" ")
```

Since Tailwind v4 arbitrary values with CSS relative color syntax can be verbose, the active gradient and glow are extracted into two utility classes in `globals.css`:

```css
.sidebar-item-active {
  background: linear-gradient(
    90deg,
    color-mix(in oklch, var(--sidebar-primary) 15%, transparent),
    color-mix(in oklch, var(--accent) 8%, transparent)
  );
  border-left: 3px solid var(--sidebar-primary);
  border-right: none;
}
.sidebar-item-active svg {
  filter: drop-shadow(0 0 6px color-mix(in oklch, var(--sidebar-primary) 50%, transparent));
}
```

**Hover state** — add `hover:bg-sidebar-accent/8 transition-colors duration-150` to the `SidebarMenuButton` base classes.

**Collapsed state** — the `sidebar-item-active` class is applied unconditionally (not gated on `!isCollapsed`), so the gradient and glow persist in icon-only mode.

---

### 5. Animated Stat Cards

`DashboardStatsCard` is a `"use client"` component already. The changes:

1. Wrap the outer `div` in `motion.div` using `statCardVariants`.
2. Add `whileHover={{ y: -2, boxShadow: "var(--shadow-glow-primary)" }}`.
3. Replace the flat `iconBg` color map entries with OKLCH gradient backgrounds using the new accent tokens:

```tsx
const colorMap = {
  blue:   { iconBg: "bg-[linear-gradient(135deg,oklch(from_var(--accent-sky)_l_c_h_/_0.12),oklch(from_var(--accent-sky)_l_c_h_/_0.06))]", ... },
  green:  { iconBg: "bg-[linear-gradient(135deg,oklch(from_var(--primary)_l_c_h_/_0.12),oklch(from_var(--accent)_l_c_h_/_0.06))]", ... },
  amber:  { iconBg: "bg-[linear-gradient(135deg,oklch(from_var(--accent-amber)_l_c_h_/_0.12),oklch(from_var(--accent-amber)_l_c_h_/_0.06))]", ... },
  purple: { iconBg: "bg-[linear-gradient(135deg,oklch(from_var(--accent-violet)_l_c_h_/_0.12),oklch(from_var(--accent-violet)_l_c_h_/_0.06))]", ... },
  rose:   { iconBg: "bg-[linear-gradient(135deg,oklch(from_var(--accent-rose)_l_c_h_/_0.12),oklch(from_var(--accent-rose)_l_c_h_/_0.06))]", ... },
  cyan:   { iconBg: "bg-[linear-gradient(135deg,oklch(from_var(--accent-sky)_l_c_h_/_0.12),oklch(from_var(--accent-sky)_l_c_h_/_0.06))]", ... },
};
```

4. Add a numeric counter animation using `useMotionValue` + `useTransform` + `useEffect`:

```tsx
"use client";
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

// Inside DashboardStatsCard, when value is a number:
const prefersReducedMotion = useReducedMotion();
const motionValue = useMotionValue(prefersReducedMotion ? numericValue : 0);
const displayValue = useTransform(motionValue, Math.round);

useEffect(() => {
  if (typeof value === "number" && !prefersReducedMotion) {
    const controls = animate(motionValue, value, { duration: 0.8, ease: "easeOut" });
    return controls.stop;
  }
}, [value]);
```

The dashboard layout wrappers that render multiple stat cards wrap them in a `motion.div` with `statCardContainerVariants` to achieve the stagger effect.

---

### 6. Animated Table Rows

The base `src/components/ui/table.tsx` is **not modified**. Animation is applied at the consumer level.

Pattern for each table component (e.g., `MISUserTable`):

```tsx
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { tableRowVariants, tableContainerVariants, getVariants } from "@/lib/motion/variants";

// Inside the TableBody render:
const prefersReducedMotion = useReducedMotion();
const rowVariant = getVariants("tableRowVariants", prefersReducedMotion ?? false);

<motion.tbody variants={tableContainerVariants} initial="initial" animate="animate">
  {users.map((user, index) => (
    <motion.tr
      key={user.user_id}
      variants={index < 20 ? rowVariant : undefined}  // cap at 20 rows
      className="border-b transition-colors duration-150 hover:bg-muted/60"
    >
      {/* cells unchanged */}
    </motion.tr>
  ))}
</motion.tbody>
```

The `motion.tr` replaces the shadcn `TableRow` at the consumer level. The `TableRow` component in `table.tsx` remains a plain `<tr>` wrapper.

---

### 7. Page Transitions

The three layout components (`MISLayout`, `CandidateLayout`, `EmployerLayout`) are server components. Page transitions require a client wrapper.

A new shared client component is created: `src/components/layout/PageTransitionWrapper.tsx`

```tsx
"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getVariants } from "@/lib/motion/variants";

export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const variants = getVariants("pageVariants", prefersReducedMotion ?? false);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex-1 overflow-auto"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

Each layout's `<main>` is replaced with `<PageTransitionWrapper>`:

```tsx
// Before (in MISLayout, CandidateLayout, EmployerLayout):
<main className="flex-1 overflow-auto bg-muted/30 p-4 md:p-6">
  {children}
</main>

// After:
<PageTransitionWrapper>
  <div className="bg-muted/30 p-4 md:p-6 min-h-full">
    {children}
  </div>
</PageTransitionWrapper>
```

The sidebar and header remain outside the wrapper and do not animate on route change.

---

### 8. Auth Page Modernization

`AuthShell.tsx` changes:

1. Add `mesh-bg` to the outer container `div`:
   ```tsx
   <div className="flex min-h-screen flex-col bg-background mesh-bg">
   ```

2. The form card `div` is replaced with `<Card variant="glass">` (importing the updated Card component).

3. The card animates in using `authCardVariants` — `AuthShell` is already a server component, so a thin `"use client"` wrapper `AuthCardAnimator` is introduced for the card animation only:

```tsx
// src/components/layout/AuthCardAnimator.tsx
"use client";
import { motion, useReducedMotion } from "framer-motion";
import { getVariants } from "@/lib/motion/variants";

export function AuthCardAnimator({ children, className }: { children: React.ReactNode; className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const variants = getVariants("authCardVariants", prefersReducedMotion ?? false);
  return (
    <motion.div variants={variants} initial="initial" animate="animate" className={className}>
      {children}
    </motion.div>
  );
}
```

4. Auth form submit buttons are updated to `variant="gradient"` in each form component (`CandidateLoginForm`, `MISLoginForm`, `ForgotPasswordForm`, `SetupPasswordForm`, `ResetPasswordForm`, `UniversalLoginForm`).

5. Error alert animation — each auth form component already uses `"use client"`. The error `<Alert>` is wrapped in a `motion.div`:
   ```tsx
   {error && (
     <motion.div
       initial={{ opacity: 0, height: 0 }}
       animate={{ opacity: 1, height: "auto" }}
       transition={{ duration: 0.2 }}
     >
       <Alert variant="destructive">...</Alert>
     </motion.div>
   )}
   ```

6. Loading spinner — the submit button's loading state shows a `<Loader2>` icon with a Framer Motion rotation:
   ```tsx
   {isLoading && (
     <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
       <Loader2 className="h-4 w-4" />
     </motion.span>
   )}
   ```

---

### 9. Landing Page Modernization

`Hero.tsx` changes:
- The outer `<section>` wrapper gets `mesh-bg` added alongside `landing-atmosphere`.
- The two hero pathway cards (`motion.article`) are updated to use `<Card variant="glass">` with `whileHover` adding `borderColor: "oklch(var(--primary) / 0.6)"` and `boxShadow: "var(--shadow-glow-primary)"`.
- The "Join as candidate" and "Register company" buttons are updated to `variant="gradient"`.

`Features.tsx` changes:
- Feature cards already use `whileInView` with `fadeUp` variants — the `viewport` prop is updated to `{ once: true, margin: "-80px" }` per the requirement.
- Icon container hover state is updated to add `group-hover:bg-primary group-hover:text-white group-hover:border-primary/0` classes for the solid fill transition.

---

## Data Models

No new data models are introduced. The design token system is purely CSS custom properties. The Framer Motion variant library is a TypeScript module exporting plain objects — no runtime state.

The `DashboardStatsCard` component gains one internal `useMotionValue` instance per numeric stat, which is local component state and does not affect any store or API layer.

---

## Error Handling

**CSS token fallbacks** — all new OKLCH tokens include fallback-safe values. Since the project targets modern browsers (Next.js 16 + React 19), `oklch()` and `color-mix(in oklch, ...)` are fully supported. No polyfills are needed.

**Framer Motion `useReducedMotion`** — this hook returns `null` on the server (SSR) and `boolean` on the client. All animation logic guards against `null` by treating it as `false` (full motion), which is the correct default for SSR. The `getVariants` helper accepts `boolean` (not `boolean | null`) so callers use `prefersReducedMotion ?? false`.

**`AnimatePresence` and server components** — `PageTransitionWrapper` and `AuthCardAnimator` are the only new `"use client"` components. Both wrap existing server-rendered children without converting them. This satisfies Requirement 13.6.

**Gradient button contrast** — the gradient runs from `--primary` (emerald, lightness ~0.55 light / 0.62 dark) to `--accent` (teal, lightness ~0.55 light / 0.60 dark). White text (`oklch(0.99 0.005 155)`) against the darkest gradient point (the primary end) yields a contrast ratio above 4.5:1 in both themes. This is verified in the Correctness Properties section.

**`backdrop-filter` support** — `backdrop-filter: blur()` is supported in all modern browsers. The `glass-card` class includes both `-webkit-backdrop-filter` and `backdrop-filter` for Safari compatibility.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: OKLCH Token Values Are Within Specified Perceptual Ranges

*For any* OKLCH color token defined in the design system, the parsed lightness and chroma values SHALL fall within the ranges specified for their role: the light-mode `--background` token SHALL have chroma ≤ 0.008; the dark-mode `--background` token SHALL have lightness between 0.12 and 0.16; the dark-mode `--sidebar` token SHALL have lightness between 0.12 and 0.14.

**Validates: Requirements 9.1, 9.2, 9.4**

---

### Property 2: Themed Color Pairs Meet WCAG AA Contrast

*For any* foreground/background color pair used in the design system (card text on glass-card background, gradient button label on gradient background), the computed contrast ratio SHALL be ≥ 4.5:1 in both light and dark themes.

**Validates: Requirements 2.3, 3.4**

---

### Property 3: Reduced Motion Disables All Entrance Animations

*For any* animated component in the system (stat cards, table rows, page transitions, auth card, landing page elements), when `useReducedMotion()` returns `true`, the component SHALL render immediately in its final visible state with no y-axis or scale movement, using only opacity transitions of ≤ 100ms duration.

**Validates: Requirements 6.5, 7.4, 8.4, 11.6**

---

### Property 4: Table Row Animation Is Capped at 20 Rows

*For any* data table rendered with N rows where N > 20, rows at index ≥ 20 SHALL have no Framer Motion entrance animation applied (their `variants` prop SHALL be `undefined`), while rows at index < 20 SHALL have the `tableRowVariants` applied.

**Validates: Requirements 7.3**

---

### Property 5: All Exported Framer Motion Variant Objects Contain Required Keys

*For any* variant object exported from `src/lib/motion/variants.ts` (excluding container variants and `reducedMotionVariants`), the object SHALL contain `initial`, `animate`, and `exit` keys, each with a non-null value.

**Validates: Requirements 12.2**

---

### Property 6: Active Sidebar Item Receives Gradient Background and Left Border

*For any* navigation item in any portal sidebar, when that item is the active route, it SHALL have the `sidebar-item-active` class applied (providing gradient background and left accent border), and no other navigation item in the same sidebar SHALL have that class applied simultaneously.

**Validates: Requirements 5.1, 5.2**
