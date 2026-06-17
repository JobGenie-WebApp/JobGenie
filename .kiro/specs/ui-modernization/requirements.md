# Requirements Document

## Introduction

This feature modernizes the visual layer of the JobGenie MIS System web application across all three portals — MIS (admin), Candidate, and Employer — without altering the underlying component architecture, routing, or business logic. The redesign introduces glassmorphism cards, gradient buttons, mesh/radial background treatments, animated stat cards and table rows, richer sidebar active states with icon glow effects, polished page transitions via Framer Motion, and a refined OKLCH color token system that keeps emerald/teal as the primary brand color while adding richer accent colors. Both light and dark themes must be equally polished. The stack is Next.js 16, TypeScript, Tailwind v4, shadcn/ui (Radix UI), Framer Motion, Lucide icons, and OKLCH color tokens.

---

## Glossary

- **Design System**: The shared set of OKLCH CSS custom properties, Tailwind v4 `@theme` tokens, and utility classes that govern color, spacing, radius, shadow, and animation across all portals.
- **Portal**: One of the three authenticated application areas — MIS, Candidate, or Employer — each with its own sidebar, header, and dashboard.
- **Glassmorphism Card**: A card component styled with a semi-transparent background, `backdrop-filter: blur`, a subtle border with low-opacity white/primary tint, and a soft drop shadow.
- **Gradient Button**: A `<Button>` variant whose background is a CSS linear-gradient using primary and accent OKLCH tokens, with a hover state that shifts the gradient or increases brightness.
- **Sidebar Active State**: The visual treatment applied to the currently active navigation item in any portal sidebar, including a gradient background, a colored left or right accent border, and an icon glow effect.
- **Stat Card**: A dashboard summary card that displays a metric label, a numeric value, and a trend indicator, animated on mount via Framer Motion.
- **Page Transition**: A Framer Motion `AnimatePresence` + `motion.div` wrapper that fades and/or slides page content in and out when the route changes.
- **Mesh Background**: A CSS background composed of multiple overlapping radial gradients using OKLCH primary and accent tokens to create a soft, multi-color atmospheric effect.
- **Icon Glow**: A CSS `filter: drop-shadow(...)` or `box-shadow` applied to a Lucide icon using the primary OKLCH color at reduced opacity, visible on active or hover states.
- **OKLCH Token**: A CSS custom property whose value is expressed in the `oklch(L C H)` color space, enabling perceptually uniform color manipulation.
- **ThemeProvider**: The `next-themes` provider component that manages light/dark class toggling on the `<html>` element.
- **shadcn/ui**: The component library built on Radix UI primitives used throughout the project; components live in `src/components/ui/`.
- **Framer Motion**: The animation library (`framer-motion` v12) used for page transitions, stat card entrance animations, and table row stagger effects.
- **tw-animate-css**: The Tailwind plugin already installed that provides CSS keyframe animation utilities.

---

## Requirements

### Requirement 1 — OKLCH Design Token System

**User Story:** As a developer, I want a single source-of-truth for all color, radius, shadow, and animation tokens expressed in OKLCH, so that both light and dark themes are consistent and easy to maintain across all three portals.

#### Acceptance Criteria

1. THE Design System SHALL define all color custom properties in `src/app/globals.css` using `oklch(L C H)` syntax, covering at minimum: `--primary`, `--primary-foreground`, `--accent`, `--accent-foreground`, `--secondary`, `--secondary-foreground`, `--background`, `--foreground`, `--card`, `--card-foreground`, `--muted`, `--muted-foreground`, `--border`, `--input`, `--ring`, `--destructive`, `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, and five `--chart-*` tokens.

2. THE Design System SHALL define richer accent color tokens — `--accent-violet`, `--accent-amber`, `--accent-rose`, `--accent-sky` — in both `:root` (light) and `.dark` scopes, each expressed as an OKLCH value.

3. THE Design System SHALL define gradient utility tokens `--gradient-primary` and `--gradient-accent` as CSS custom properties containing `linear-gradient` values built from OKLCH primary and accent tokens.

4. THE Design System SHALL define shadow tokens `--shadow-glass`, `--shadow-glow-primary`, and `--shadow-glow-accent` as CSS custom properties, where `--shadow-glass` includes a `backdrop-blur` compatible box-shadow and `--shadow-glow-*` tokens use the corresponding OKLCH color at 30–40% opacity.

5. WHEN the `.dark` class is applied to the `<html>` element, THE Design System SHALL switch all custom property values to their dark-mode counterparts without any flash of unstyled content, relying on `next-themes` class strategy.

6. THE Design System SHALL expose all color tokens to Tailwind v4 via the `@theme inline` block in `globals.css` so that utility classes such as `bg-primary`, `text-accent`, and `border-sidebar` resolve correctly.

---

### Requirement 2 — Glassmorphism Card Component

**User Story:** As a user of any portal, I want cards to feel modern and layered, so that the interface communicates depth and premium quality.

#### Acceptance Criteria

1. THE Design System SHALL provide a `.glass-card` CSS utility class in `globals.css` that applies: semi-transparent background (`--card` at 70–80% opacity), `backdrop-filter: blur(12px)`, a 1px border using `--border` at 50% opacity with a subtle primary tint, and `--shadow-glass` box-shadow.

2. WHEN a `.glass-card` element is rendered in light mode, THE Design System SHALL display a background that is visually distinct from a fully opaque card while remaining legible for all text content.

3. WHEN a `.glass-card` element is rendered in dark mode, THE Design System SHALL display a background that is visually distinct from the page background while maintaining WCAG AA contrast for all text content within the card.

4. THE shadcn/ui `Card` component in `src/components/ui/card.tsx` SHALL accept a `variant="glass"` prop that applies the `.glass-card` styles in addition to the default card styles.

5. WHERE the `variant="glass"` prop is used on a `Card`, THE Card component SHALL maintain all existing Radix UI accessibility attributes and keyboard navigation behavior.

---

### Requirement 3 — Gradient Button Variant

**User Story:** As a user, I want primary action buttons to have a gradient treatment, so that CTAs are visually prominent and consistent with the modern design direction.

#### Acceptance Criteria

1. THE shadcn/ui `Button` component in `src/components/ui/button.tsx` SHALL include a `variant="gradient"` option in its `cva` variant map that applies a `background: linear-gradient(135deg, var(--primary), var(--accent))` with white foreground text.

2. WHEN a `variant="gradient"` Button is hovered, THE Button component SHALL transition the gradient to a slightly brighter or shifted version using a CSS `background-size` / `background-position` animation or an `opacity` overlay, completing the transition within 200ms.

3. WHEN a `variant="gradient"` Button is in a loading or disabled state, THE Button component SHALL reduce opacity to 60% and suppress the hover gradient animation.

4. THE `variant="gradient"` Button SHALL maintain a minimum touch target of 44×44px and meet WCAG AA contrast ratio of 4.5:1 between the button label and the gradient background at its darkest point.

5. WHEN rendered in dark mode, THE `variant="gradient"` Button SHALL use the dark-mode OKLCH values for `--primary` and `--accent` so the gradient remains visually consistent with the dark theme palette.

---

### Requirement 4 — Mesh / Radial Background Treatments

**User Story:** As a user, I want page backgrounds to have subtle atmospheric depth, so that the application feels premium without being distracting.

#### Acceptance Criteria

1. THE Design System SHALL provide a `.mesh-bg` CSS utility class that composes at least two overlapping `radial-gradient` layers using OKLCH primary and accent tokens at 5–12% opacity, applied as a fixed `background-attachment` so the mesh does not scroll with content.

2. WHEN `.mesh-bg` is applied to the dashboard layout wrapper in any portal, THE Layout component SHALL render the mesh background behind all content without affecting the readability of text or interactive elements.

3. THE Design System SHALL provide a `.mesh-bg-subtle` variant that uses 3–6% opacity gradients, intended for use inside cards or section backgrounds where a lighter treatment is needed.

4. WHEN the `.dark` class is active, THE `.mesh-bg` class SHALL automatically switch to darker OKLCH gradient values (using the dark-mode primary and accent tokens) without requiring a separate class.

5. THE existing `body` background radial gradient defined in `globals.css` SHALL be updated to use the new mesh token values for consistency, replacing the current single-gradient treatment.

---

### Requirement 5 — Sidebar Modernization (All Three Portals)

**User Story:** As a user navigating any portal, I want the sidebar to feel rich and polished, so that navigation is visually engaging and the active section is immediately obvious.

#### Acceptance Criteria

1. THE `MISSidebar`, `CandidateSidebar`, and `EmployerSidebar` components SHALL apply a gradient background to the active navigation item using `linear-gradient(90deg, var(--sidebar-primary) / 15%, var(--accent) / 8%)` or equivalent OKLCH-based gradient, replacing the current flat `bg-sidebar-accent` treatment.

2. WHEN a navigation item is active, THE Sidebar component SHALL render a 3px left accent border (not right border) using the `--sidebar-primary` color, replacing the current `border-r-3 border-green-500` hardcoded class.

3. WHEN a navigation item is active, THE Sidebar component SHALL apply an icon glow effect via `filter: drop-shadow(0 0 6px oklch(var(--sidebar-primary-raw) / 0.5))` or equivalent CSS on the Lucide icon element.

4. WHEN a navigation item is hovered (and not active), THE Sidebar component SHALL transition the background to `--sidebar-accent` at 8% opacity within 150ms.

5. THE Sidebar header section in all three portals SHALL display the logo in a container with a gradient background using primary and accent tokens, replacing the current flat `bg-primary` container.

6. WHEN the sidebar is in collapsed (icon-only) state, THE Sidebar component SHALL preserve the active gradient and icon glow on the active item's icon button.

7. THE `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, and `--sidebar-border` OKLCH tokens SHALL be updated in `globals.css` to produce a richer sidebar background — slightly darker than the page background in light mode and slightly lighter than the page background in dark mode — to create visual separation.

---

### Requirement 6 — Animated Stat Cards

**User Story:** As a dashboard user in any portal, I want stat cards to animate on page load, so that the dashboard feels dynamic and draws attention to key metrics.

#### Acceptance Criteria

1. THE stat card components in the Candidate dashboard (`DashboardStatsCard`), Employer dashboard, and MIS dashboard SHALL use Framer Motion `motion.div` with an entrance animation: `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.4, ease: "easeOut" }}`.

2. WHEN multiple stat cards are rendered in a row, THE dashboard layout SHALL stagger the entrance animations using Framer Motion `variants` with a `staggerChildren` delay of 0.08s so cards animate in sequence from left to right.

3. WHEN a stat card is hovered, THE stat card SHALL apply a subtle lift effect: `whileHover={{ y: -2, boxShadow: "var(--shadow-glow-primary)" }}` via Framer Motion, completing within 150ms.

4. THE numeric value displayed in each stat card SHALL animate from 0 to its final value using a Framer Motion `useMotionValue` + `useTransform` counter animation over 800ms with an `easeOut` curve, triggered once on mount.

5. IF `prefers-reduced-motion` is set in the user's OS settings, THEN THE stat card components SHALL skip all entrance and counter animations and render in their final state immediately.

6. THE stat card icon container SHALL use a gradient background built from the card's semantic color token (e.g., `--accent-violet` for applications, `--accent-sky` for interviews) at 12% opacity, replacing the current flat tint approach.

---

### Requirement 7 — Animated Table Rows

**User Story:** As a user viewing data tables in any portal, I want table rows to animate in on load, so that the data presentation feels polished and modern.

#### Acceptance Criteria

1. THE data table components across all portals (MIS `MISUserTable`, Employer `CandidateTable`, MIS candidates/employers tables) SHALL wrap each `<tr>` or row container in a Framer Motion `motion.tr` with staggered entrance: `initial={{ opacity: 0, x: -8 }}`, `animate={{ opacity: 1, x: 0 }}`, stagger delay of 0.04s per row.

2. WHEN a table row is hovered, THE table row SHALL transition its background to `--muted` at 60% opacity within 150ms using a CSS transition (not Framer Motion) to avoid re-render overhead.

3. THE stagger animation for table rows SHALL be limited to the first 20 rows; rows beyond index 20 SHALL render without animation to avoid performance degradation on large datasets.

4. IF `prefers-reduced-motion` is set, THEN THE table row entrance animations SHALL be disabled and rows SHALL render in their final state immediately.

5. THE existing table component in `src/components/ui/table.tsx` SHALL remain structurally unchanged; the animation wrapper SHALL be applied at the consumer level (in the specific table components), not inside the base `table.tsx` primitive.

---

### Requirement 8 — Page Transitions

**User Story:** As a user navigating between pages within any portal, I want smooth page transitions, so that navigation feels fluid and intentional.

#### Acceptance Criteria

1. THE dashboard layout components (`MISLayout`, `CandidateLayout`, `EmployerLayout`) SHALL wrap the `{children}` slot in a Framer Motion `AnimatePresence` + `motion.div` with `key={pathname}` to trigger re-animation on route change.

2. THE page transition animation SHALL use `initial={{ opacity: 0, y: 8 }}`, `animate={{ opacity: 1, y: 0 }}`, `exit={{ opacity: 0, y: -8 }}`, with `transition={{ duration: 0.25, ease: "easeInOut" }}`.

3. WHEN a page transition is in progress, THE layout SHALL not shift or reflow the sidebar or header; only the main content area SHALL animate.

4. IF `prefers-reduced-motion` is set, THEN THE page transition SHALL use `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`, `exit={{ opacity: 0 }}` with a 100ms duration, eliminating the y-axis movement.

5. THE `src/lib/motion/` directory SHALL contain a shared `variants.ts` file exporting reusable Framer Motion variant objects (`pageVariants`, `cardVariants`, `listItemVariants`, `statCardVariants`) so animation definitions are not duplicated across components.

---

### Requirement 9 — Light and Dark Theme Polish

**User Story:** As a user who switches between light and dark mode, I want both themes to feel equally polished and intentional, so that neither theme feels like an afterthought.

#### Acceptance Criteria

1. THE Design System SHALL ensure that in light mode, the page background uses a near-white OKLCH value with a very subtle warm or cool tint (chroma ≤ 0.008) and the mesh background gradients use primary/accent at 5–8% opacity.

2. THE Design System SHALL ensure that in dark mode, the page background uses a deep neutral OKLCH value (lightness 0.12–0.16) and the mesh background gradients use primary/accent at 8–14% opacity to remain visible against the dark surface.

3. THE `.glass-card` component SHALL use different backdrop-blur intensities per theme: `blur(12px)` in light mode and `blur(16px)` in dark mode, applied via a `.dark .glass-card` override in `globals.css`.

4. THE `--sidebar` token in dark mode SHALL be set to an OKLCH value with lightness 0.12–0.14 (slightly darker than the page background) to create clear visual separation between the sidebar and content area.

5. WHEN the theme is toggled via the `ThemeToggle` component, THE transition between light and dark SHALL be smooth, using a CSS `transition: background-color 200ms ease, color 200ms ease` applied to the `body` element.

6. THE scrollbar styles defined in `globals.css` SHALL have distinct thumb colors for light mode (`oklch(0.82 0.01 265)`) and dark mode (`oklch(0.32 0.015 265)`) to remain visible in both themes.

---

### Requirement 10 — Auth Page Visual Modernization

**User Story:** As a new or returning user on any auth page (login, signup, forgot password, verify email, setup password), I want the page to feel modern and on-brand, so that the first impression of JobGenie is polished.

#### Acceptance Criteria

1. THE auth layout shell (`src/components/layout/AuthShell.tsx`) SHALL apply the `.mesh-bg` background class to the page container, replacing the current plain `--background` treatment.

2. THE login and signup card containers SHALL use the `variant="glass"` Card component, giving them the glassmorphism treatment on top of the mesh background.

3. THE primary submit button on all auth forms (login, signup, forgot password, setup password) SHALL use the `variant="gradient"` Button variant.

4. WHEN an auth form is submitted and enters a loading state, THE submit button SHALL display a Framer Motion animated spinner icon (rotating `Loader2` from Lucide) alongside the loading label text.

5. THE auth card SHALL animate in on page load using Framer Motion: `initial={{ opacity: 0, scale: 0.97 }}`, `animate={{ opacity: 1, scale: 1 }}`, `transition={{ duration: 0.3, ease: "easeOut" }}`.

6. IF an auth form returns a server-side error, THEN THE error alert SHALL animate in using Framer Motion: `initial={{ opacity: 0, height: 0 }}`, `animate={{ opacity: 1, height: "auto" }}` with a 200ms duration.

---

### Requirement 11 — Landing Page Visual Modernization

**User Story:** As a visitor to the JobGenie landing page, I want the page to feel visually impressive and modern, so that it communicates the quality of the platform.

#### Acceptance Criteria

1. THE `Hero` component SHALL apply the `.mesh-bg` background and the existing `.landing-atmosphere` class, ensuring the two treatments compose without visual conflict.

2. THE hero CTA cards SHALL use the `variant="glass"` Card component with a hover state that transitions the border to `--primary` at 60% opacity and applies `--shadow-glow-primary`.

3. THE primary CTA buttons in the hero section ("Get Started Free", "Start Hiring") SHALL use the `variant="gradient"` Button variant.

4. THE `Features` section feature cards SHALL animate in using Framer Motion stagger when they enter the viewport, using an `IntersectionObserver`-based trigger (via Framer Motion's `whileInView` prop): `initial={{ opacity: 0, y: 24 }}`, `whileInView={{ opacity: 1, y: 0 }}`, `viewport={{ once: true, margin: "-80px" }}`.

5. THE feature card icon containers SHALL transition from a tinted background to a solid `--primary` background with a white icon on hover, completing within 200ms, as specified in the existing redesign specification.

6. IF `prefers-reduced-motion` is set, THEN THE landing page scroll-triggered animations SHALL render all elements in their final visible state without motion.

---

### Requirement 12 — Framer Motion Shared Variant Library

**User Story:** As a developer implementing animations, I want a shared library of Framer Motion variants, so that animation behavior is consistent and not duplicated across components.

#### Acceptance Criteria

1. THE file `src/lib/motion/variants.ts` SHALL export the following named variant objects: `pageVariants`, `cardVariants`, `listItemVariants`, `statCardVariants`, `tableRowVariants`, and `authCardVariants`.

2. EACH exported variant object SHALL include at minimum `initial`, `animate`, and `exit` keys with values appropriate to its use case as described in Requirements 6, 7, 8, and 10.

3. THE file `src/lib/motion/variants.ts` SHALL export a `reducedMotionVariants` object that maps each variant name to a no-motion version (opacity-only transitions with 100ms duration) for use when `prefers-reduced-motion` is detected.

4. THE file `src/lib/motion/variants.ts` SHALL export a `useReducedMotion` re-export or a `getVariants(name, prefersReducedMotion)` helper function so consuming components can select the correct variant set with a single call.

5. THE existing `src/lib/motion/landing.ts` file SHALL be updated to import from `variants.ts` where overlap exists, avoiding duplication of animation definitions.

---

### Requirement 13 — Component Architecture Preservation

**User Story:** As a developer, I want the modernization to be purely visual, so that no existing business logic, API calls, routing, or component interfaces are broken.

#### Acceptance Criteria

1. THE UI modernization SHALL NOT modify any file under `src/app/actions/`, `src/app/api/`, `src/lib/db/`, `src/lib/supabase/`, or `src/lib/validations/`.

2. THE UI modernization SHALL NOT change the props interface of any existing component in a breaking way; new optional props (such as `variant="glass"`) SHALL be additive only.

3. THE UI modernization SHALL NOT alter the routing structure under `src/app/`; no `page.tsx` files SHALL be deleted or renamed.

4. WHEN the modernized application is built with `next build`, THE build SHALL complete without TypeScript errors or ESLint errors introduced by the modernization changes.

5. THE shadcn/ui base components in `src/components/ui/` SHALL remain compatible with their Radix UI primitive versions as declared in `package.json`; no Radix UI package versions SHALL be changed.

6. THE Framer Motion animations SHALL use the `"use client"` directive only in components that are already client components; no server components SHALL be converted to client components solely for animation purposes.
