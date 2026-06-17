# Implementation Plan: UI Modernization

## Overview

Purely visual upgrade across all three portals (MIS, Candidate, Employer) and the public landing/auth pages. The work is organized bottom-up through four layers: design tokens → primitive component variants → portal-specific components → Framer Motion animations. No business logic, API routes, or routing structure is touched.

---

## Tasks

- [x] 1. Extend `globals.css` with OKLCH design tokens and utility classes
  - Add `--accent-violet`, `--accent-amber`, `--accent-rose`, `--accent-sky` custom properties to both `:root` and `.dark` scopes using `oklch()` syntax
  - Add `--gradient-primary` and `--gradient-accent` CSS custom properties as `linear-gradient` values
  - Add `--shadow-glass`, `--shadow-glow-primary`, and `--shadow-glow-accent` shadow tokens
  - Update `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border` tokens for richer visual separation (light: `oklch(0.975 0.003 265)`, dark: `oklch(0.13 0.015 265)`)
  - Update dark-mode `--background` to lightness 0.12–0.16 range
  - Add `.glass-card` utility class with `color-mix(in oklch, ...)` background, `backdrop-filter: blur(12px)`, border, and `--shadow-glass`
  - Add `.dark .glass-card` override with `blur(16px)`
  - Add `.mesh-bg`, `.dark .mesh-bg`, and `.mesh-bg-subtle` utility classes with `radial-gradient` layers and `background-attachment: fixed`
  - Add `.sidebar-item-active` and `.sidebar-item-active svg` utility classes for gradient background, left border, and icon glow
  - Add `body { transition: background-color 200ms ease, color 200ms ease; }`
  - Update scrollbar thumb colors for light (`oklch(0.82 0.01 265)`) and dark (`oklch(0.32 0.015 265)`)
  - Extend `@theme inline` block with `--color-accent-violet`, `--color-accent-amber`, `--color-accent-rose`, `--color-accent-sky` mappings
  - Replace existing single-gradient body background with `.mesh-bg` token values
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 4.3, 4.4, 4.5, 5.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 1.1 Write property test for OKLCH token value ranges
    - **Property 1: OKLCH Token Values Are Within Specified Perceptual Ranges**
    - Parse the compiled CSS and assert `--background` chroma ≤ 0.008 in light mode, lightness 0.12–0.16 in dark mode, and `--sidebar` lightness 0.12–0.14 in dark mode
    - **Validates: Requirements 9.1, 9.2, 9.4**

- [x] 2. Add `variant="glass"` to the `Card` component
  - Add `CardProps` interface extending `React.ComponentProps<"div">` with optional `variant?: "default" | "glass"` prop
  - Update the `Card` function signature to destructure `variant = "default"` and apply `cn(..., variant === "glass" && "glass-card", className)`
  - Ensure all sub-components (`CardHeader`, `CardTitle`, `CardContent`, `CardFooter`, `CardDescription`) remain structurally unchanged
  - Verify existing usages without the prop continue to render identically (additive change only)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 13.2_

- [x] 3. Add `variant="gradient"` to the `Button` component
  - Add a `gradient` entry to the `cva` variant map in `button.tsx` with the `bg-[linear-gradient(135deg,var(--primary),var(--accent))]` background, `before:` pseudo-element overlay for hover brightening, `min-h-[44px] min-w-[44px]` touch target, and `disabled:opacity-60` state
  - Ensure the hover transition completes within 200ms and the disabled state suppresses the hover animation
  - Verify white foreground text is applied and the variant works in both light and dark themes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 13.2_

  - [ ]* 3.1 Write property test for gradient button contrast ratio
    - **Property 2: Themed Color Pairs Meet WCAG AA Contrast**
    - Compute contrast ratio of white text against the darkest gradient point (`--primary`) in both light and dark themes and assert ≥ 4.5:1
    - **Validates: Requirements 2.3, 3.4**

- [x] 4. Create the shared Framer Motion variant library
  - Create `src/lib/motion/variants.ts` and export: `ease`, `pageVariants`, `cardVariants`, `statCardVariants`, `listItemVariants`, `tableRowVariants`, `authCardVariants`, `statCardContainerVariants`, `tableContainerVariants`
  - Export `reducedMotionVariants` record mapping each variant name to an opacity-only version with 100ms duration
  - Export `getVariants(name, prefersReducedMotion: boolean): Variants` helper function
  - Update `src/lib/motion/landing.ts` to import shared variants (`ease`, overlapping fade/stagger variants) from `variants.ts` and re-export, removing duplicated definitions
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 4.1 Write property test for variant object completeness
    - **Property 5: All Exported Framer Motion Variant Objects Contain Required Keys**
    - For each named variant exported from `variants.ts` (excluding container variants and `reducedMotionVariants`), assert the object has `initial`, `animate`, and `exit` keys with non-null values
    - **Validates: Requirements 12.2**

  - [ ]* 4.2 Write property test for reduced motion variants
    - **Property 3: Reduced Motion Disables All Entrance Animations**
    - For each variant returned by `getVariants(name, true)`, assert no `y`, `x`, or `scale` properties appear in `initial` or `animate`, and all transition durations are ≤ 100ms
    - **Validates: Requirements 6.5, 7.4, 8.4, 11.6**

- [x] 5. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create `PageTransitionWrapper` client component
  - Create `src/components/layout/PageTransitionWrapper.tsx` as a `"use client"` component
  - Use `usePathname()` as the `key` prop on `motion.div` inside `AnimatePresence mode="wait"`
  - Call `getVariants("pageVariants", prefersReducedMotion ?? false)` and apply `variants`, `initial="initial"`, `animate="animate"`, `exit="exit"` to the `motion.div`
  - Apply `className="flex-1 overflow-auto"` to the wrapper `motion.div`
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 13.6_

- [x] 7. Create `AuthCardAnimator` client component
  - Create `src/components/layout/AuthCardAnimator.tsx` as a `"use client"` component
  - Use `getVariants("authCardVariants", prefersReducedMotion ?? false)` and wrap children in a `motion.div` with `initial="initial"` and `animate="animate"`
  - Accept `children` and optional `className` props
  - _Requirements: 10.5, 13.6_

- [x] 8. Apply page transitions to all three portal layouts
  - In `MISLayout`, replace the `<main>` element with `<PageTransitionWrapper>` wrapping a `<div className="bg-muted/30 p-4 md:p-6 min-h-full">`
  - Apply the same change to `CandidateLayout` and `EmployerLayout`
  - Verify the sidebar and header remain outside the wrapper and do not animate on route change
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 9. Modernize `MISSidebar`
  - Replace the logo container `bg-primary` class with `style={{ background: "var(--gradient-primary)" }}`
  - Replace the active item's `bg-sidebar-accent border-r-3 border-green-500` classes with the `sidebar-item-active` utility class
  - Add `hover:bg-sidebar-accent/8 transition-colors duration-150` to the `SidebarMenuButton` base classes for hover state
  - Ensure `sidebar-item-active` is applied unconditionally (not gated on `!isCollapsed`) so the gradient and glow persist in collapsed/icon-only mode
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 10. Modernize `CandidateSidebar`
  - Apply the same sidebar changes as task 9 (gradient logo container, `sidebar-item-active` class, hover transition, collapsed-state preservation)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 11. Modernize `EmployerSidebar`
  - Apply the same sidebar changes as task 9 (gradient logo container, `sidebar-item-active` class, hover transition, collapsed-state preservation)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 11.1 Write property test for sidebar active state exclusivity
    - **Property 6: Active Sidebar Item Receives Gradient Background and Left Border**
    - For each portal sidebar, assert that exactly one nav item has `sidebar-item-active` applied when a route is active, and no other item in the same sidebar has that class simultaneously
    - **Validates: Requirements 5.1, 5.2**

- [x] 12. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Modernize `DashboardStatsCard` with Framer Motion animations
  - Wrap the outer `div` in `motion.div` using `statCardVariants` (via `getVariants`) with `initial="initial"` and `animate="animate"`
  - Add `whileHover={{ y: -2, boxShadow: "var(--shadow-glow-primary)" }}` to the `motion.div`
  - Replace flat `iconBg` color map entries with OKLCH gradient backgrounds using the new accent tokens (`--accent-sky`, `--primary`, `--accent-amber`, `--accent-violet`, `--accent-rose`)
  - Add numeric counter animation using `useMotionValue`, `useTransform`, `animate`, and `useReducedMotion` — animate from 0 to final value over 800ms `easeOut`, skip if `prefersReducedMotion`
  - Wrap the stat card grid/row in a `motion.div` with `statCardContainerVariants` to achieve stagger effect
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [-] 14. Apply animated table rows to MIS portal tables
  - In `MISUserTable` (and other MIS data tables), replace `<tbody>` with `<motion.tbody variants={tableContainerVariants} initial="initial" animate="animate">`
  - Replace `<TableRow>` (or `<tr>`) with `<motion.tr>` using `getVariants("tableRowVariants", prefersReducedMotion ?? false)` for rows at index < 20, and `variants={undefined}` for rows at index ≥ 20
  - Add `className="border-b transition-colors duration-150 hover:bg-muted/60"` to each `motion.tr` for the CSS hover state
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 14.1 Write property test for table row animation cap
    - **Property 4: Table Row Animation Is Capped at 20 Rows**
    - For a table rendered with N > 20 rows, assert rows at index ≥ 20 have `variants={undefined}` and rows at index < 20 have `tableRowVariants` applied
    - **Validates: Requirements 7.3**

- [x] 15. Apply animated table rows to Candidate and Employer portal tables
  - Apply the same `motion.tbody` / `motion.tr` pattern from task 14 to `CandidateTable` and any Employer portal data tables
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 16. Modernize `AuthShell.tsx` and auth form components
  - Add `mesh-bg` class to the outer container `div` in `AuthShell.tsx`
  - Replace the form card `div` with `<Card variant="glass">` and wrap it in `<AuthCardAnimator>`
  - Update the submit button in `CandidateLoginForm`, `MISLoginForm`, `ForgotPasswordForm`, `SetupPasswordForm`, `ResetPasswordForm`, and `UniversalLoginForm` to `variant="gradient"`
  - In each auth form component, wrap the error `<Alert>` in a `motion.div` with `initial={{ opacity: 0, height: 0 }}`, `animate={{ opacity: 1, height: "auto" }}`, `transition={{ duration: 0.2 }}`
  - In each auth form component's loading state, replace the static spinner with a `<motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>` wrapping `<Loader2>`
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 17. Modernize `Hero.tsx` on the landing page
  - Add `mesh-bg` class to the outer `<section>` wrapper alongside the existing `landing-atmosphere` class
  - Update the two hero pathway cards (`motion.article`) to use `<Card variant="glass">` with `whileHover` adding `borderColor: "oklch(var(--primary) / 0.6)"` and `boxShadow: "var(--shadow-glow-primary)"`
  - Update the "Get Started Free" and "Start Hiring" CTA buttons to `variant="gradient"`
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 18. Modernize `Features.tsx` on the landing page
  - Update the `viewport` prop on feature card `whileInView` animations to `{ once: true, margin: "-80px" }`
  - Update feature card icon containers to add `group-hover:bg-primary group-hover:text-white group-hover:border-primary/0 transition-colors duration-200` for the solid fill hover transition
  - Ensure `prefers-reduced-motion` guard renders all elements in final visible state without motion
  - _Requirements: 11.4, 11.5, 11.6_

- [x] 19. Final checkpoint — Ensure all tests pass
  - Run `next build` and confirm it completes without TypeScript or ESLint errors introduced by the modernization
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at each layer boundary
- Property tests validate universal correctness properties (token ranges, contrast, reduced motion, animation caps)
- Unit tests validate specific examples and edge cases
- The base `src/components/ui/table.tsx` is intentionally not modified — animation is applied at the consumer level per Requirement 7.5
- No files under `src/app/actions/`, `src/app/api/`, `src/lib/db/`, `src/lib/supabase/`, or `src/lib/validations/` are touched per Requirement 13.1
- All new `"use client"` components (`PageTransitionWrapper`, `AuthCardAnimator`) wrap existing server-rendered children without converting them, satisfying Requirement 13.6

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "4.1", "4.2"] },
    { "id": 1, "tasks": ["3.1"] },
    { "id": 2, "tasks": ["11.1", "14.1"] }
  ]
}
```
