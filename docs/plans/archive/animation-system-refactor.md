---
description: Execution plan to unify the Pumni OS animation system — consolidate entrance vocabulary into tokens, fix the broken css-stagger utility, centralize reduced-motion via MotionConfig, wire View Transition types into navigation, and remove magic numbers from keyframes. Handoff for another AI agent.
status: draft
owner: ai-agent
last-reviewed: 2026-06-22
---

# Animation System Refactor & Modernization Plan

This is an implementation handoff for another AI coding agent. The reviewer
(owner: `ai-agent`) will verify completion against the acceptance criteria at
the end of each phase and the final checklist.

The audit identified issues by priority. **Phases are ordered by
risk-to-reward**: the highest-confidence, lowest-risk fixes come first so the
working tree stays green between phases. Each phase is independently shippable.

## Problem Statement

The project has **five animation consumption surfaces** with good individual
design but poor cross-system coherence:

1. **CSS micro-feedback** — Tailwind `motion-safe:` + tokens (`card.tsx`,
   `switch.tsx`, `checkbox.tsx`).
2. **Overlay enter/exit** — `tw-animate-css` plugin, centralized via
   `_overlay-variants.ts` (dialog/sheet/popover/menu/tooltip/command/select).
3. **JS orchestration** — `motion` library via `lib/motion.ts` recipes/springs
   (window, tabs, segmented-picker, sky-player features).
4. **View Transitions** — Native VT API + Next 16 `viewTransition`
   (`lib/view-transition.ts`, `view-transitions.css`, `next.config.ts`).
5. **Scroll-driven + keyframes** — `animation-timeline: view()` + `@keyframes`
   (`scroll.css`, `motion.css`, `globals.css`).

The token tier (duration/easing) is **well-synchronized** with a drift-test
guard (`motion-tokens.test.ts`). But **entrance geometry (y/scale) is
fragmented across three vocabularies**, one utility ships broken, and several
modern-2026 primitives are wired but unused. This plan unifies them into one
**owned, token-driven vocabulary** so a "fade + rise" reads identically whether
it is CSS-scroll-driven, JS-orchestrated, or a View Transition.

## Non-Negotiable Invariants

These come from `AGENTS.md` (P0–P4) and `docs/conventions/design-system.md`.
They override any instruction in this plan.

- **Token tiers: do not exceed three.** Primitive (`tokens.css`) → semantic
  (`theme.css`) → component. Components consume semantic only. New geometry
  tokens are **semantic-level** and must be defined in `tokens.css` (raw) +
  referenced via existing semantic aliases where applicable. Never reference a
  primitive var or raw OKLCH from a component.
- **No raw timing/magic numbers in component classes.** The
  `pumniNoRawTiming` ESLint rule blocks `duration-300` / `ease-out` / raw
  `cubic-bezier()` in `.tsx`. All durations go through `--duration-*` and all
  easings through `--ease-fluid` / `--ease-snappy` / `--ease-spring`.
- **Reduced-motion is a hard contract.** Three layers must remain intact:
  (1) the global CSS safety net in `glass.css` (`animation-duration: 0.01ms
!important` under `prefers-reduced-motion: reduce`); (2) the `motion-safe:`
  Tailwind utility on every CSS animation/transition; (3) explicit
  `useReducedMotion()` gating on JS-driven motion. This plan **adds** a fourth
  layer (`MotionConfig`) but does not remove any of the existing three.
- **View Transitions are progressive enhancement.** Never block a callback on
  VT support. `withViewTransition` must keep its feature-detect + reduced-motion
  gate + plain-call fallback. Do not make VT a hard dependency for navigation.
- **Performance discipline (glassmorphism).** Never animate `backdrop-filter`.
  `will-change` stays scoped to overlay transitions
  (`[data-state=open|closed]`), not static glass. Stacked glass cap stays at 2
  layers. This plan touches overlay motion strings but must not regress these
  rules.
- **RLS / key handling / server isolation** (P0) are untouched by this plan.
  No Supabase, auth, env, or server-only module is in scope.

## Decisions Already Made (Do Not Re-Litigate)

The audit rejected the following "improvements". **Do not implement them** —
they either make the code worse or introduce risk out of scope:

1. **Do NOT** replace `tw-animate-css` with `@starting-style` for Radix
   overlays. The comment block in `starting-style.css:8-25` is correct:
   tw-animate-css's `@property` + `enter`/`exit` keyframe mechanism is the
   industry-standard way to hook Radix's `data-state` lifecycle, and
   `@starting-style` solves a different problem (`display: none` ↔ `block`
   without JS) that Radix does not have. Keep `tw-animate-css` for overlays.
2. **Do NOT** remove the `motion` library in favor of CSS-only animation. JS
   orchestration (shared-`layoutId` for the Tabs/SegmentedPicker indicator,
   `AnimatePresence` exit animations for `Window`, drag-with-momentum) cannot
   be expressed in CSS. The split (CSS for micro-feedback, JS for
   orchestration) is the correct 2026 pattern.
3. **Do NOT** collapse the `--ease-out` / `--ease-fluid` alias pair into one
   name (same for `--ease-in-out` / `--ease-snappy`). The raw names
   (`--ease-out` etc.) are consumed inside CSS files (`view-transitions.css`,
   `motion.css`, `glass.css`) where the alias would be circular; the semantic
   names (`--ease-fluid` etc.) are the Tailwind-facing surface in `theme.css`.
   **Instead**, add a drift-test (Phase 5) that proves the alias points at the
   same cubic-bezier as the raw token.
4. **Do NOT** introduce a new animation library (GSAP, Auto-Animate, the
   Web Animations API polyfill, etc.). The stack is `motion` + CSS + native VT.
   Adding a fourth runtime multiplies bundle size and drift surface.
5. **Do NOT** change the `Window` enter/exit keyframe values
   (`WINDOW_ENTER/EXIT` in `window.tsx`) to match `recipes.fadeRise` exactly.
   They are _intentionally_ different (scale 0.96 + y 8 vs. fadeRise's y 8 no
   scale) because a window is a large OS surface that benefits from the scale
   settle; a small content panel does not. Phase 1 unifies the **entrance
   geometry tokens** they both read from, not the literal keyframe shape.
6. **Do NOT** remove `disableTransition` default-`true` from `Tabs`. It exists
   because most Tabs drive in-page panel swaps where a VT crossfade would be
   visual noise. Only `watch-lobby` opts in. Document this in Phase 6; do not
   flip the default.
7. **Do NOT** touch `supabase/migrations/*`. This plan is UI/CSS/TS only.

## Required Context Before Coding

Read these in order (do not skip — Next.js 16 is not the Next.js in your
training data):

- `AGENTS.md` (root) and `apps/web/AGENTS.md`
- `docs/ai/index.md` (router — pull the rows for styling + Next.js App Router)
- `docs/conventions/design-system.md` (hard rules; esp. the anti-slop table
  rows on motion: `ease-fluid`/`ease-snappy`, `duration-(--duration-base)`,
  `recipes.hoverLift`/`pressScale`/`staggerItem`)
- `.agents/skills/ui-styling/SKILL.md` and `REFERENCE.md`
- `.agents/skills/codebase-design/SKILL.md` (small interfaces, deep
  implementations — applies to the `motion.ts` recipe surface)
- `.claude/rules/*` for App Router files (auto-loads when you open one)

Inspect these runtime paths (do not edit blindly — read first):

- `packages/ui/src/lib/motion.ts` — JS token bridge + recipes + springs
- `packages/ui/src/lib/view-transition.ts` — VT wrapper
- `packages/ui/src/styles/tokens.css` — primitive tokens (motion block ~line 280)
- `packages/ui/src/styles/theme.css` — semantic aliases (ease-fluid/snappy ~line 340)
- `packages/ui/src/styles/starting-style.css` — **the broken `css-stagger`** (P1)
- `packages/ui/src/styles/view-transitions.css` — VT named groups + type tags
- `packages/ui/src/styles/scroll.css` — scroll-driven utilities (P2 geometry drift)
- `packages/ui/src/styles/motion.css` — breathe/shake keyframes
- `packages/ui/src/styles/glass.css` — global reduced-motion safety net (~line 452)
- `packages/ui/src/components/overlay/_overlay-variants.ts` — shared overlay motion
- `packages/ui/src/components/os/window.tsx` — JS-driven window entrance
- `packages/ui/src/components/layout/tabs.tsx` — shared-layoutId indicator
- `packages/ui/src/components/form/segmented-picker.tsx` — shared-layoutId pill
- `packages/ui/src/components/layout/card.tsx` — `interactive` + `state` variants
- `apps/web/src/app/layout.tsx` — **root provider tree** (Phase 3 insertion point)
- `apps/web/src/app/globals.css` — `reaction-fly-up` / `note-hit-pulse` (P7)
- `apps/web/src/app/(public)/auth-shell.tsx` — `slide-in-from-bottom-3` (P3)
- `apps/web/src/shared/components/app-shell/app-main.tsx` — same magic number (P3)
- `apps/web/src/app/(app)/dashboard/dashboard-dock.tsx` — VT usage (P6)
- `apps/web/src/shared/components/section-nav.tsx` — VT usage (P6)
- `apps/web/src/features/watch/components/watch-lobby.tsx` — `viewTransitionName` (P6)
- `apps/web/src/test/design-system/motion-tokens.test.ts` — existing drift guard
- `apps/web/src/test/design-system/token-test-utils.ts` — token test helpers
- `apps/web/e2e/design-system-visual.spec.ts` — visual regression (reduced-motion)

Before editing, capture a clean baseline:

```bash
git status --short
bun --cwd packages/ui typecheck
bun --cwd packages/ui lint
bun --cwd apps/web typecheck
bun --cwd apps/web test
bun --cwd apps/web lint
```

Do not revert files you did not modify. If the tree is not clean at start,
note it and work only on files in scope. The git status at session start
already shows many modified files (M) from prior unrelated work — confirm
with the user whether to stash or work alongside before proceeding.

---

## Phase 0: Baseline & Branch

1. Confirm the tree state. If dirty from unrelated work, either stash or get
   explicit user permission to branch alongside.
2. Create a working branch (do not commit on `main`):
   ```bash
   git checkout -b refactor/animation-system
   ```
3. Record baseline test + typecheck + lint output (paste into the PR
   description later). Specifically capture:
   - `bun --cwd apps/web test src/test/design-system/motion-tokens.test.ts`
     (this is the test Phase 5 extends).
   - A `rg "css-stagger" apps/web/src` result — it should be empty (proves
     nothing currently consumes the broken utility, so fixing it is safe).

**Acceptance:** A branch exists; the agent can quote baseline `typecheck` +
`test` + `lint` results; the agent confirms no in-app consumer of
`css-stagger` exists outside the utility's own definition.

---

## Phase 1: Unify Entrance Geometry Tokens (P2, P3)

**Goal:** Introduce semantic tokens for entrance geometry (rise distance +
scale) so a "fade + rise" reads the same whether it is JS-orchestrated
(`recipes.fadeRise` / `staggerItem`), CSS scroll-driven (`scroll-fade-in`),
or a hero entrance (`auth-shell` / `app-main`). Eliminate the `12px` /
`20px` / `40px` magic numbers.

### Why this order

Highest impact, touches only tokens + a handful of call sites, and unblocks
Phases 2 & 4 (which both consume these tokens). The existing
`motion-tokens.test.ts` already locks the JS bridge to CSS — adding geometry
tokens extends the same proven pattern.

### Design

Add four semantic tokens in `tokens.css` (inside the `/* --- Motion --- */`
block, after the existing `--hover-lift-*` group, before the
`--vt-slide-distance` group — keep motion-related tokens co-located):

```css
/* Entrance geometry — the single source for "content rises into place".
   Consumed by JS recipes (recipes.fadeRise / staggerItem), the CSS
   scroll-driven utilities (scroll-fade-in / scroll-slide-up), and hero
   section entrances. Tokenised so a fade-rise reads identically across
   CSS-scroll, JS-orchestrated, and View-Transition surfaces. */
--entrance-y: 8px; /* fadeRise / staggerItem / scroll-fade-in */
--entrance-y-lg: 16px; /* scroll-slide-up (larger travel for scale pair) */
--entrance-scale: 0.97; /* scroll-slide-up scale start */
--entrance-zoom: 0.95; /* VT zoom-in factor — aliases --vt-zoom-scale */
```

Then:

1. **`--vt-zoom-scale: 0.95`** stays as-is (it is already consumed by
   `view-transitions.css`). Add a comment that `--entrance-zoom` aliases it,
   so the VT zoom and any future entrance zoom share one value. Do **not**
   delete `--vt-zoom-scale` — it is the legacy name still read by the VT
   keyframes. Phase 5 adds a drift-test that proves
   `--entrance-zoom === --vt-zoom-scale`.

2. **`packages/ui/src/lib/motion.ts`** — replace the magic `8` in
   `recipes.fadeRise` and `recipes.staggerItem`:
   - `hoverLiftY` / `hoverLiftScale` already mirror CSS; add two new mirrors:
     `entranceY` (mirrors `--entrance-y`, in motion px — same value `8`) and
     `entranceYLarge` (mirrors `--entrance-y-lg`, value `16`). Export both.
     Reuse the same comment pattern ("Kept in sync by motion-tokens.test.ts").
   - `recipes.staggerItem.variants.hidden = { opacity: 0, y: entranceY }`
     (was `y: 8`).
   - `recipes.fadeRise.initial = { opacity: 0, y: entranceY }`,
     `recipes.fadeRise.exit = { opacity: 0, y: entranceY }` (was `y: 8`).
   - Add `entranceY`, `entranceYLarge` to the `motionTokens` aggregate export
     and to the package barrel `packages/ui/src/index.ts`.

3. **`packages/ui/src/styles/scroll.css`** — replace the hardcoded geometry
   in the two keyframes:
   - `scroll-fade-in`: `transform: translateY(20px)` →
     `translateY(var(--entrance-y-lg))`; the `to` stays `translateY(0)`.
     (Decision: scroll-driven entrances use the **large** travel because they
     play across a full viewport entry, where 8px is imperceptible. Document
     this in a one-line comment above the keyframe.)
   - `scroll-slide-up`: `translateY(40px) scale(0.97)` →
     `translateY(calc(var(--entrance-y-lg) * 2)) scale(var(--entrance-scale))`.
     (The `* 2` gives the larger travel for the paired scale-and-rise; comment
     why.)
   - `scroll-parallax` keeps its `--scroll-parallax-rate` math (unchanged —
     it is a parallax factor, not an entrance).

4. **`apps/web/src/app/(public)/auth-shell.tsx:30`** and
   **`apps/web/src/shared/components/app-shell/app-main.tsx:31`** —
   replace `slide-in-from-bottom-3` (the 12px magic Tailwind spacing) with a
   token-driven entrance. Two options; pick **Option A** unless the reviewer
   objects:

   - **Option A (preferred, JS-driven, consistent with the rest of the app):**
     Wrap the element in `<motion.div {...(shouldReduce ? {} : recipes.fadeRise)}>`
     and drop the `animate-in fade-in slide-in-from-bottom-3` classes. This
     makes hero entrances read from the **same** vocabulary as the sky-player
     hero sections (which already use `recipes.fadeRise`). Requires adding
     `'use client'` to `app-main.tsx` if not already present — **check first**;
     if making it client breaks RSC streaming, fall back to Option B.
   - **Option B (CSS-only fallback):** replace `slide-in-from-bottom-3` with
     `slide-in-from-bottom-(--entrance-y)` (Tailwind v4 arbitrary value from
     the new token). Keeps the component server-renderable. Use this if
     `app-main.tsx` is currently a Server Component and the `<motion.div>`
     conversion would pull it client-side unnecessarily.

   The decision criterion: **prefer the option that does not flip a Server
   Component to a Client Component.** Read the file header first; if it has
   no `'use client'`, default to Option B.

### Files touched

- `packages/ui/src/styles/tokens.css` (add 4 tokens + comment)
- `packages/ui/src/lib/motion.ts` (add `entranceY` / `entranceYLarge`, update
  `fadeRise` / `staggerItem`, update barrel exports)
- `packages/ui/src/index.ts` (export `entranceY`, `entranceYLarge`)
- `packages/ui/src/styles/scroll.css` (2 keyframes → token-driven)
- `apps/web/src/app/(public)/auth-shell.tsx` (drop magic class)
- `apps/web/src/shared/components/app-shell/app-main.tsx` (drop magic class)

### Tests

Extend `apps/web/src/test/design-system/motion-tokens.test.ts` with a new
`describe` block:

```ts
describe('entrance geometry tokens stay in sync', () => {
  it('entranceY mirrors --entrance-y (px)', () => {
    // CSS token is in px; JS value is in motion px (1:1). No unit conversion.
    expect(entranceY).toBeCloseTo(readUnitless('--entrance-y'), 5);
    expect(entranceYLarge).toBeCloseTo(readUnitless('--entrance-y-lg'), 5);
  });

  it('entrance-zoom aliases --vt-zoom-scale (one VT zoom value)', () => {
    expect(readUnitless('--entrance-zoom')).toBeCloseTo(
      readUnitless('--vt-zoom-scale'),
      5,
    );
  });
});
```

Import `entranceY`, `entranceYLarge` from `@pumni/ui` in the test file.

### Acceptance

- `rg "slide-in-from-bottom-3|slide-in-from-top-3|slide-in-from-left-3|slide-in-from-right-3" apps/web/src packages/ui/src`
  returns **zero** matches (all hero entrances now token-driven).
- `rg "translateY\(20px\)|translateY\(40px\)|scale\(0\.97\)" packages/ui/src/styles/scroll.css`
  returns **zero** matches.
- `bun --cwd apps/web test src/test/design-system/motion-tokens.test.ts`
  passes (including the new entrance-geometry block).
- `recipes.fadeRise` and `recipes.staggerItem` no longer contain a literal
  `8` — they reference `entranceY`.
- Visual spot-check: the `design-system-preview` Motion section still animates
  identically (the `8px` value is unchanged; only its source moved).

---

## Phase 2: Fix or Remove `css-stagger` (P1)

**Goal:** The `css-stagger` utility in `starting-style.css` is **broken**:
it reads `var(--css-stagger-i, 0)` but nothing assigns that variable, and
there is no `:nth-child()` generator. Every child gets
`animation-delay: calc(50ms * 0) = 0`, so all items animate in parallel —
no stagger occurs. Either fix it or remove it.

### Why this order

Phase 1 introduced the entrance tokens this utility should consume. Phase 0
confirmed nothing in `apps/web/src` currently uses `css-stagger` (the grep
returns empty), so removing it is **safe and non-breaking**.

### Design — choose ONE path

**Path A (recommended): Remove `css-stagger` entirely.**

Rationale: the JS `recipes.staggerContainer` / `staggerItem` pair already
expresses staggered entrance correctly, with proper reduced-motion gating and
the drift-tested token bridge. The CSS-only utility was aspirational ("no JS
bundle needed") but never worked, and a correct CSS-only stagger requires
either:

- A `:nth-child(N)` rule per index (verbose, caps at a fixed N), or
- An inline `style={{ '--css-stagger-i': index }}` per child (which requires
  JS anyway, defeating the "no JS" premise).

Both alternatives are worse than the existing JS recipe. **Remove the broken
utility** and point consumers at `recipes.staggerContainer`.

Steps:

1. Delete the entire `@utility css-stagger { ... }` block, the
   `@keyframes css-stagger-fade-rise`, and the `@media (prefers-reduced-motion:
reduce)` block for `.css-stagger-item*` in `starting-style.css`.
2. Rewrite the file's header comment. The current comment
   (`starting-style.css:8-25`) explains why `tw-animate-css` is kept and why
   `@starting-style` is not used for Radix. Keep that explanation (it is
   valuable documentation). Remove the "1. CSS-only stagger utilities" bullet.
3. **Decide on the rest of the file.** After removing `css-stagger`, the file
   contains only the header comment and no rules. Two options:
   - **A1:** Delete the file entirely, remove its `@import` from
     `apps/web/src/app/globals.css:17`, and move the surviving "why we keep
     tw-animate-css" comment into `_overlay-variants.ts` (where the
     tw-animate-css consumption actually lives). **Preferred** — one fewer
     empty CSS file.
   - **A2:** Keep the file as a documentation-only placeholder with a comment
     block pointing at `_overlay-variants.ts`. Use this only if the reviewer
     wants the architectural rationale to live in `packages/ui/src/styles/`.

   Default to **A1** (delete + relocate comment) unless the reviewer objects.

**Path B (only if the reviewer wants a working CSS-only stagger):**

Implement a `:nth-child()` generator capped at a reasonable N (e.g. 20):

```css
@utility css-stagger {
  & > .css-stagger-item {
    animation: css-stagger-fade-rise var(--duration-base) var(--ease-out) both;
  }
  & > .css-stagger-item:nth-child(1) {
    animation-delay: calc(var(--stagger-base) * 0);
  }
  & > .css-stagger-item:nth-child(2) {
    animation-delay: calc(var(--stagger-base) * 1);
  }
  /* ... through :nth-child(20) ... */
  & > .css-stagger-item:nth-child(n + 21) {
    animation-delay: calc(var(--stagger-base) * 20);
  }
}
```

This is correct but verbose. Only take Path B if there is a concrete consumer
waiting (there is not, per Phase 0 grep). **Default: Path A.**

### Files touched

- `packages/ui/src/styles/starting-style.css` (delete utility + keyframes, or
  delete the whole file under Path A1)
- `apps/web/src/app/globals.css` (remove the `@import` line under Path A1)
- `packages/ui/src/components/overlay/_overlay-variants.ts` (relocate the
  "why tw-animate-css" comment under Path A1 — add as a file-level JSDoc
  block)

### Tests

No unit test needed (this is a deletion). Verify with grep:

```bash
rg "css-stagger" packages/ui/src apps/web/src
```

Under Path A/A1: returns **zero** matches.
Under Path B: returns the new `:nth-child` rules only.

### Acceptance

- The `css-stagger` utility no longer claims to do something it does not.
- If Path A1: `apps/web/src/app/globals.css` no longer imports
  `starting-style.css`; the "why tw-animate-css" rationale is preserved as a
  comment in `_overlay-variants.ts`.
- `bun --cwd packages/ui typecheck` + `bun --cwd apps/web typecheck` pass.
- `bun --cwd apps/web lint` passes (no dangling imports of the deleted file).
- Visual: no regression — nothing consumed the utility.

---

## Phase 3: Centralize Reduced-Motion via `MotionConfig` (P5)

**Goal:** Add a single `<MotionConfig reducedMotion="user">` at the app root
so the `motion` library **automatically** respects `prefers-reduced-motion`,
eliminating the repetitive
`const shouldReduce = useReducedMotion(); {...(shouldReduce ? {} : recipes.x)}`
pattern that appears **11 times** across sky-player, design-system, and
preview-window components.

### Why this order

Pure refactor, no visual change. Comes after Phases 1–2 so the recipe surface
is stable before we touch every consumer.

### Critical design constraint — do NOT delete the `useReducedMotion` calls yet

`MotionConfig reducedMotion="user"` makes motion **values** (transforms,
opacity) neutralize under reduced motion, but it does **not** prevent the
animation from _running_ with a zero-duration tween. The existing explicit
pattern (`shouldReduce ? {} : recipes.fadeRise`) drops the `initial`/`animate`
props entirely, so the element renders in its final state with no JS work.

Two correct outcomes — pick one per component:

1. **For enter/exit + stagger recipes** (`fadeRise`, `staggerContainer`,
   `staggerItem`, `hoverLift`, `pressScale`): the explicit
   `{...(shouldReduce ? {} : recipe)}` pattern is **still correct** and should
   be **kept**. Reason: dropping the recipe entirely is cheaper than running
   a zero-duration animation, and it avoids a flash where motion sets
   `opacity: 0` as the initial value before neutralizing.

2. **For `layout` / `layoutId` animations** (Tabs indicator,
   SegmentedPicker pill): `MotionConfig` is the **better** gate, because
   these animations do not have a meaningful "drop the props" form — the
   `layout` prop must stay for the element to position correctly. Here,
   replace `!shouldReduce && { layoutId, layout }` with just
   `{ layoutId, layout }` and let `MotionConfig` neutralize the motion.

So this phase is **not** "delete all the `useReducedMotion` calls". It is:

- Add `<MotionConfig reducedMotion="user">` at the root (so any future motion
  usage is automatically covered — the safety net).
- In `tabs.tsx` and `segmented-picker.tsx` **only**, simplify the
  `layout`/`layoutId` gating to rely on `MotionConfig`. Remove the local
  `useReducedMotion()` call and the `!shouldReduce &&` guard in those two
  files. **Leave** the `shouldReduce` pattern in `window.tsx`,
  `motion-section.tsx`, `sky-player/*`, `preview-window.tsx`, etc. untouched.

If unsure about a given component, **leave the explicit guard in place.**
`MotionConfig` + explicit guard is belt-and-suspenders, not a bug.

### Implementation

1. **`MotionConfig` is exported from `motion/react`.** It is already
   re-exported through `@pumni/ui`? **Check first** — read
   `packages/ui/src/index.ts:21`. Currently only `AnimatePresence`, `motion`,
   `useReducedMotion` are re-exported. **Add `MotionConfig`** to that
   re-export so apps do not add a direct `motion/react` dependency.

2. **`apps/web/src/shared/components/providers/`** — add a thin wrapper
   `motion-config-provider.tsx`:

   ```tsx
   'use client';
   import { MotionConfig } from '@pumni/ui';
   export function MotionConfigProvider({ children }: { children: React.ReactNode }) {
     return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
   }
   ```

   Rationale for a named wrapper vs. inlining: mirrors the existing
   `RootTooltipProvider` / `QueryProvider` / `ThemeProvider` pattern in the
   providers folder; gives a single place to add `transition: { ... }`
   defaults later if needed.

3. **`apps/web/src/app/layout.tsx`** — wrap the provider tree. Insert
   `<MotionConfigProvider>` as the **outermost** provider inside `<body>`
   (before `ThemeProvider`), so theme transitions and personalization paint
   already respect reduced-motion. Order:

   ```
   <PersonalizationScript />
   <MotionConfigProvider>
     <ThemeProvider>
       <PersonalizationProvider>
         <TelemetryProvider>
           <QueryProvider>
             <RootTooltipProvider>
               {children}
               <Toaster />
             </RootTooltipProvider>
           </QueryProvider>
         </TelemetryProvider>
       </PersonalizationProvider>
     </ThemeProvider>
   </MotionConfigProvider>
   ```

4. **`packages/ui/src/components/layout/tabs.tsx`** — in `TabsTrigger`,
   remove `const shouldReduce = useReducedMotion();` and change
   `{...(!shouldReduce && { layoutId, layout: true })}` to
   `{ layoutId, layout: true }`. Update the comment to explain that
   `MotionConfig reducedMotion="user"` (set at the app root) neutralizes the
   layout animation under reduced-motion. Remove the now-unused
   `useReducedMotion` import if it has no other use in the file (it does
   not — verify with a read).

5. **`packages/ui/src/components/form/segmented-picker.tsx`** — same
   treatment for the sliding pill: remove `shouldReduce`, change
   `{...(!shouldReduce && { layoutId, layout: true, transition: transition.snappy })}`
   to `{ layoutId, layout: true, transition: transition.snappy }`.

### Files touched

- `packages/ui/src/index.ts` (add `MotionConfig` to the re-export)
- `apps/web/src/shared/components/providers/motion-config-provider.tsx` (new)
- `apps/web/src/app/layout.tsx` (wrap tree)
- `packages/ui/src/components/layout/tabs.tsx` (simplify layout gating)
- `packages/ui/src/components/form/segmented-picker.tsx` (simplify layout gating)

### Tests

Add a focused component test
`apps/web/src/test/design-system/motion-config.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MotionConfigProvider } from '@/shared/components/providers/motion-config-provider';

describe('MotionConfigProvider', () => {
  it('renders children unchanged', () => {
    const { getByText } = render(
      <MotionConfigProvider>
        <span>child</span>
      </MotionConfigProvider>,
    );
    expect(getByText('child')).not.toBeNull();
  });
});
```

(The reduced-motion behavior itself is a motion-library internal; we assert
only that the provider mounts and does not break rendering. The e2e visual
spec `design-system-visual.spec.ts` already emulates `reducedMotion: 'reduce'`
— that covers the behavioral gate.)

### Acceptance

- `rg "useReducedMotion" packages/ui/src/components/layout/tabs.tsx packages/ui/src/components/form/segmented-picker.tsx`
  returns **zero** matches.
- `rg "useReducedMotion" packages/ui/src apps/web/src` still returns matches
  in `window.tsx`, `motion-section.tsx`, sky-player components, etc. — those
  are intentionally kept (document this in the PR).
- `MotionConfig` is re-exported from `@pumni/ui`.
- `bun --cwd apps/web test src/test/design-system/motion-config.test.tsx`
  passes.
- Manual: with `prefers-reduced-motion: reduce` emulated in DevTools, the Tabs
  underline and SegmentedPicker pill still appear in the correct position
  (instantly, no tween) — `MotionConfig` is doing its job.

---

## Phase 4: Wire View Transition Types into Navigation (P6)

**Goal:** The VT infrastructure defines four named types
(`slide-forward` / `slide-back` / `morph-zoom` / `card-crossfade`) in
`view-transitions.css`, and `withViewTransition(cb, { type })` supports them.
But the actual navigation call sites (`dashboard-dock.tsx`,
`section-nav.tsx`) call `withViewTransition(cb)` **without a type**, so every
navigation falls back to the default root crossfade — no directional sense.
Wire types into the call sites so forward/back navigation gets the iOS-style
directional slide that the CSS already defines.

### Why this order

Phase 1 added the entrance tokens; Phase 4 now makes the VT slide distance
read from the same vocabulary. Comes after Phase 3 so the `MotionConfig`
safety net covers any motion added by VT-adjacent components.

### Design

1. **`view-transition.ts`** — add a doc comment documenting the four types
   and **when to use each** (no code change; the API already supports `type`):

   ```
   slide-forward  — navigate deeper (dashboard → sub-page, dock item click)
   slide-back     — navigate shallower (back button, browser back)
   morph-zoom     — shared-element morph (same element on both pages)
   card-crossfade — same-route content swap (tabs, filters — already used by Tabs)
   ```

2. **`apps/web/src/app/(app)/dashboard/dashboard-dock.tsx:39`** — the dock
   navigates to top-level app sections. This is a **forward** navigation
   (user is going _to_ a section). Change:

   ```ts
   onClick={() => withViewTransition(() => router.push(item.href))}
   ```

   to:

   ```ts
   onClick={() => withViewTransition(() => router.push(item.href), { type: 'slide-forward' })}
   ```

   Import `ViewTransitionType` is not needed — the options object is
   inferred.

3. **`apps/web/src/shared/components/section-nav.tsx:62`** — section-nav
   scrolls within a page, not navigates. The VT here is a **content
   crossfade**, not a directional slide. Change:

   ```ts
   if (viewTransition) {
     withViewTransition(scroll);
   }
   ```

   to:

   ```ts
   if (viewTransition) {
     withViewTransition(scroll, { type: 'card-crossfade' });
   }
   ```

   This makes the intent explicit and matches the `card-crossfade` group in
   the CSS (same-route content transition).

4. **Back navigation.** Audit the app for a back-button component. If one
   exists (search `rg "router.back\(\)" apps/web/src`), wrap it:

   ```ts
   withViewTransition(() => router.back(), { type: 'slide-back' });
   ```

   If no back-button component exists, **skip** — do not invent one. Note
   this in the PR description so the team can decide later.

5. **Next.js `<Link transitionTypes>`.** `next.config.ts:25` enables
   cross-document VT. For `<Link>` components that should opt into a typed
   transition, add `transitionTypes={['slide-forward']}`. **Audit first**:
   `rg "transitionTypes" apps/web/src` — currently only the
   `nextjs-ecosystem` docs page uses it. Apply `transitionTypes` to:
   - The dashboard dock **if** it renders `<Link>` (read the file — if it
     uses `router.push` on a button, step 2 above applies instead; do not
     mix).
   - Any primary navigation `<Link>` to a deeper route.

   Do **not** blanket-apply `transitionTypes` to every `<Link>` — only
   navigations with a clear directional semantics. When unsure, leave it
   untyped (the default crossfade is correct for ambiguous cases).

### Critical: `view-transition-name` uniqueness

`apps/web/src/features/watch/components/watch-lobby.tsx:127` sets
`style={{ viewTransitionName: 'watch-lobby-card' }}`. **Verify this name is
unique on the page at all times.** A `view-transition-name` must be unique
across the document snapshot — two elements with the same name make the VT
abort. This is currently safe (only one watch-lobby renders per page), but:

- Add a code comment at the call site warning that the name must stay
  unique.
- Do **not** introduce a second `view-transition-name` on the same page
  without a uniqueness guarantee.

### Files touched

- `packages/ui/src/lib/view-transition.ts` (doc comment only)
- `apps/web/src/app/(app)/dashboard/dashboard-dock.tsx` (add `type`)
- `apps/web/src/shared/components/section-nav.tsx` (add `type`)
- optional: a back-button component if one exists
- `apps/web/src/features/watch/components/watch-lobby.tsx` (uniqueness comment)

### Tests

No unit test (VT is a browser runtime feature not observable in jsdom). Add a
note to the manual verification section of the PR: with VT supported
(Chrome/Edge), clicking a dock item should produce a forward slide; clicking
back should reverse.

Verify no syntax regression:

```bash
bun --cwd apps/web typecheck
bun --cwd apps/web lint
```

### Acceptance

- `rg "withViewTransition\([^,)]*\)" apps/web/src` (calls with no options)
  returns **zero** matches in navigation call sites (dock, section-nav,
  back-button). The only option-less calls remaining should be the
  `motion-section.tsx` demo button (which intentionally shows the default).
- Each typed call passes a `type` from the four-name closed set.
- `bun --cwd apps/web typecheck` passes.
- Manual (Chrome): dock click → forward slide; section-nav click →
  crossfade; no VT errors in console.

---

## Phase 5: Remove Magic Numbers from Keyframes + Drift-Test the Alias (P7, P8)

**Goal:** Two remaining magic-number sources:

- `apps/web/src/app/globals.css` — `reaction-fly-up` uses `2.5s` +
  `cubic-bezier(0.25, 1, 0.5, 1)`; `note-hit-pulse` uses `0.4s` +
  `cubic-bezier(0.16, 1, 0.3, 1)` (which is literally `--ease-out`).
- The `--ease-fluid` / `--ease-out` alias pair is undocumented and
  untested for drift.

### Design

1. **`globals.css` `reaction-fly-up`** — the `2.5s` duration is intentional
   for a reaction emoji float (long enough to read). Replace with a **new
   token** rather than forcing it into the existing duration ladder (which
   caps at `--duration-slower` = 480ms):

   In `tokens.css`, add to the motion block:

   ```css
   /* Long-form animation duration — reaction floats, ambient loops where
      the motion is the content (not feedback). Distinct from the UI
      feedback ladder (fast/base/slow/slower). */
   --duration-ambient: 2500ms;
   ```

   Then in `globals.css`:

   ```css
   .reaction-fly {
     animation: reaction-fly-up var(--duration-ambient) var(--ease-fluid) forwards;
   }
   ```

   **Decision on the easing:** `cubic-bezier(0.25, 1, 0.5, 1)` is very close
   to `--ease-out` (`0.16, 1, 0.3, 1`) but not identical. Replace with
   `--ease-fluid` (the semantic alias for `--ease-out`) for consistency.
   The tiny curve difference is imperceptible for a 2.5s float.

2. **`globals.css` `note-hit-pulse`** — `0.4s` does not map cleanly to the
   ladder (`--duration-slow` = 320ms, `--duration-slower` = 480ms). Two
   options:
   - **Option A:** snap to `--duration-slow` (320ms) — slightly faster.
   - **Option B:** add `--duration-pulse: 400ms` as a third ambient-tier
     token.

   Default: **Option A** (snap to `--duration-slow`). Reason: 400ms vs 320ms
   is imperceptible for a glow pulse, and avoiding a new token keeps the
   duration ladder tight. If the reviewer wants the exact 400ms, use Option B.
   The easing is already `cubic-bezier(0.16, 1, 0.3, 1)` = `--ease-out` →
   replace with `var(--ease-fluid)`.

3. **`--ease-fluid` / `--ease-snappy` alias drift test.** Add to
   `motion-tokens.test.ts`:

   ```ts
   describe('semantic easing aliases do not drift from raw tokens', () => {
     it('--ease-fluid aliases --ease-out', () => {
       expect(readCubicBezier('--ease-fluid')).toEqual(readCubicBezier('--ease-out'));
     });
     it('--ease-snappy aliases --ease-in-out', () => {
       expect(readCubicBezier('--ease-snappy')).toEqual(readCubicBezier('--ease-in-out'));
     });
   });
   ```

   `readCubicBezier` is already defined in the test file (line 22). Note:
   `tokenCss` (from `token-test-utils.ts`) must include both `tokens.css` and
   `theme.css` for the alias to resolve — **verify** by reading
   `token-test-utils.ts`; if it only loads `tokens.css`, extend it to also
   load `theme.css` (the aliases live in `theme.css:340-341`).

### Files touched

- `packages/ui/src/styles/tokens.css` (add `--duration-ambient`, comment)
- `apps/web/src/app/globals.css` (2 keyframes → token-driven)
- `apps/web/src/test/design-system/motion-tokens.test.ts` (alias drift test)
- `apps/web/src/test/design-system/token-test-utils.ts` (if it does not load
  `theme.css`, extend it — read first)

### Acceptance

- `rg "cubic-bezier\(" apps/web/src packages/ui/src` returns matches **only**
  in `tokens.css` (the raw token definitions) and
  `motion-tokens.test.ts` (the drift-test fixtures). No component CSS or
  `globals.css` keyframe uses a raw cubic-bezier.
- `rg "2\.5s|0\.4s" apps/web/src/app/globals.css` returns **zero** matches.
- The new alias drift tests pass.
- Visual: the sky-player note-hit glow and the watch reaction float play at
  the same perceived speed (the tiny duration/curve deltas are sub-threshold).

---

## Phase 6: Cleanup — Dedupe, Fix Demo Bug, Document VT Architecture (P9–P12)

**Goal:** Small, independent cleanups. Do each only if Phases 1–5 are green.

### 6a. Dedupe `select.tsx` motion string (P11)

`packages/ui/src/components/form/select.tsx:74` inlines the full
`OVERLAY_PANEL_MOTION` vocabulary (slide-sides + animate-in/out) instead of
importing from `_overlay-variants.ts`. This is the exact drift the shared
module was created to prevent.

- Replace the inlined `data-[side=bottom]:slide-in-from-top-2 ... data-[state=open]:zoom-in-95`
  string with the imported `OVERLAY_PANEL_MOTION` constant.
- Verify the resulting class string is **identical** before/after (diff the
  `cn()` output). If they differ, prefer the shared constant and document
  the delta.

### 6b. Fix the motion-section demo table bug (P10)

`apps/web/src/features/design-system/components/motion-section.tsx:363-369`
renders the stagger-cadence table with a copy-paste bug: the `staggerFast`
row displays `staggerBase`'s value. Fix:

```tsx
<div className="flex justify-between text-xs">
  <code className="font-mono text-foreground">staggerFast</code>
  <span className="font-mono text-muted-foreground">{staggerFast}</span> {/* was staggerBase */}
</div>
```

Import `staggerFast` (it is already exported from `@pumni/ui`; check the
import list at the top of the file — add it if missing). Also add a
`staggerSlow` row for completeness.

### 6c. Document the VT + tw-animate-css architecture (P4 documentation)

The `starting-style.css` header comment (or its relocated home in
`_overlay-variants.ts` after Phase 2) explains the tw-animate-css decision.
Extend it with a short "Animation surfaces" map so a new contributor knows
which system to reach for:

```ts
/**
 * Pumni OS animation surfaces (mid-2026):
 *
 * - CSS micro-feedback (hover/press)  → Tailwind `motion-safe:` + tokens.
 *   Reach: card `interactive`, button press, switch thumb.
 * - Overlay enter/exit                 → tw-animate-css (this module).
 *   Reach: dialog/sheet/popover/menu/tooltip/command/select.
 * - JS orchestration                  → `motion` lib + `lib/motion.ts` recipes.
 *   Reach: window mount, shared-layoutId indicators, stagger entrances.
 * - View Transitions                  → native VT API + `view-transitions.css`.
 *   Reach: cross-route navigation (`withViewTransition(cb, { type })`).
 * - Scroll-driven                     → `scroll.css` (`animation-timeline`).
 *   Reach: marketing-page reveal-on-scroll.
 *
 * Reduced-motion contract: global CSS net (glass.css) + `motion-safe:` +
 * `MotionConfig reducedMotion="user"` (root) + explicit `useReducedMotion()`
 * on JS motion whose props must drop entirely (not just neutralize).
 */
```

Place this as the file-level JSDoc in `_overlay-variants.ts` (it is the
natural home — every overlay consumes it).

### 6d. Document the `Window` enter/exit divergence (P9)

`packages/ui/src/components/os/window.tsx` defines local
`WINDOW_ENTER` / `WINDOW_EXIT` constants instead of using `recipes.fadeRise`.
This is intentional (Decision #5) but undocumented at the call site. Add a
comment above the constants explaining they deliberately differ from
`recipes.fadeRise` (scale 0.96 settle for a large OS surface vs. fadeRise's
pure translate) and that both read from the same entrance-geometry tokens
where applicable.

### Files touched

- `packages/ui/src/components/form/select.tsx` (dedupe)
- `apps/web/src/features/design-system/components/motion-section.tsx` (bug fix)
- `packages/ui/src/components/overlay/_overlay-variants.ts` (architecture doc)
- `packages/ui/src/components/os/window.tsx` (divergence comment)

### Acceptance

- `select.tsx` `selectContentVariants` base string contains no inlined
  `data-[side=*]` slide utilities — it uses `OVERLAY_PANEL_MOTION`.
- The motion-section stagger table shows three distinct values
  (`staggerFast`, `staggerBase`, `staggerSlow`).
- The architecture JSDoc is present and grep-findable
  (`rg "Animation surfaces" packages/ui/src`).
- `bun --cwd packages/ui typecheck` + `lint` pass.

---

## Final Validation

Run in order. Each must pass before moving on.

```bash
# 1. Targeted motion-token drift tests (extended in Phases 1 & 5)
bun --cwd apps/web test src/test/design-system/motion-tokens.test.ts

# 2. New MotionConfig provider test (Phase 3)
bun --cwd apps/web test src/test/design-system/motion-config.test.tsx

# 3. Full fast test suite
bun --cwd apps/web test

# 4. UI package typecheck + lint
bun --cwd packages/ui typecheck
bun --cwd packages/ui lint

# 5. App typecheck + lint
bun --cwd apps/web typecheck
bun --cwd apps/web lint

# 6. Build (Next config/bundle changes — Phase 3 adds a provider)
bun --cwd apps/web build

# 7. Enforcement gates (context-layer: docs, skills, rules)
bun run ai:check
bun run ai:eval
```

Expected outcomes:

- `ai:eval` passes with no new security findings.
- `ai:check` passes (known pre-existing context-size warnings are acceptable;
  call them out, do not fix out-of-scope).
- No new lint errors. The `pumniNoRawTiming` rule should now have **fewer**
  violations (Phase 5 removed raw cubic-beziers from `globals.css`).

## Manual Verification (for the PR description)

These cannot be asserted in CI; the implementing agent should perform them in
a browser and record observations:

1. **Entrance parity.** On the design-system Motion page, the `staggerItem`
   demo, a `scroll-fade-in` marketing section, and the `auth-shell` hero
   entrance should all rise by a perceptibly similar distance (8px for the
   first two, 16px for scroll — the large tier). No more 12px / 20px / 40px
   outliers.
2. **css-stagger removed.** Confirm no console warnings about a missing
   `--css-stagger-i` variable (there shouldn't be — the utility is gone).
3. **Reduced-motion still works.** In DevTools, emulate
   `prefers-reduced-motion: reduce`. Confirm:
   - The Tabs underline still appears in the correct position (instantly).
   - The SegmentedPicker pill still appears on the correct option.
   - The `Window` mount demo does not animate (renders in place).
   - No `motion` JS animation runs (DevTools Performance tab shows no
     "Animation" frames).
4. **View Transition types.** In Chrome/Edge (VT supported):
   - Click a dock item → the page slides in from the right (`slide-forward`).
   - Click a section-nav link → the content crossfades (`card-crossfade`).
   - Browser back → the page slides in from the left (`slide-back`, if a
     back button was wired in Phase 4 step 4).
   - No "duplicate view-transition-name" console errors.
5. **Keyframe tokens.** Trigger a watch-room reaction emoji → it floats for
   ~2.5s on `--ease-fluid`. Trigger a sky-player note hit → the glow pulses
   ~320ms. No raw `cubic-bezier` in DevTools "Computed" for these elements.

## Review Checklist (for the verifier)

- [ ] No raw `cubic-bezier()` in component CSS or `globals.css`
      (`rg "cubic-bezier\(" apps/web/src packages/ui/src` → only `tokens.css` + the test fixture).
- [ ] No `slide-in-from-bottom-3` (or `-top/-left/-right-3`) magic in any
      component (`rg "slide-in-from-(bottom|top|left|right)-[0-9]"` → only
      the `-2` overlay-slide constants in `_overlay-variants.ts`, which are
      intentional).
- [ ] No `translateY(20px)` / `translateY(40px)` / `scale(0.97)` in
      `scroll.css`.
- [ ] `css-stagger` utility is gone (or, under Path B, correctly generates
      `:nth-child` delays).
- [ ] `MotionConfig` is re-exported from `@pumni/ui` and mounted at the app
      root.
- [ ] `useReducedMotion` is removed from `tabs.tsx` + `segmented-picker.tsx`
      only; still present in `window.tsx`, `motion-section.tsx`, sky-player.
- [ ] Every `withViewTransition` navigation call passes a `type` (except the
      intentional default demo in `motion-section.tsx`).
- [ ] `select.tsx` uses `OVERLAY_PANEL_MOTION`, not an inlined copy.
- [ ] The motion-section stagger table shows three distinct cadence values.
- [ ] `motion-tokens.test.ts` has the new entrance-geometry + alias drift
      blocks, and they pass.
- [ ] `bun --cwd apps/web build` succeeds (Phase 3 provider mounts in RSC).
- [ ] `bun run ai:check` + `bun run ai:eval` pass.
- [ ] No Supabase / auth / env / server-only module touched
      (`git diff --name-only | rg "supabase|auth|env|server-only"` → empty).

## Out of Scope (Explicitly)

The following were considered and rejected for this plan. Do not do them
even if time permits — they are separate decisions:

- **Migrating overlays off `tw-animate-css` onto `@starting-style`.** Decision
  #1. Not happening.
- **Replacing the `motion` library with Web Animations API / GSAP.** Decision
  #4. Not happening.
- **Adding scroll-driven `animation-timeline` to the dashboard or app shell.**
  Scroll-driven animation is for marketing/reveal surfaces only; app-shell
  scroll position must not drive layout transforms (it harms UX on long
  lists).
- **Personalizing motion (per-user easing/duration).** Out of scope; the
  personalization provider covers accent/glass/density only. Motion stays
  system-wide.
- **Adding a motion preference toggle to settings.** The
  `prefers-reduced-motion` media query is the correct, OS-level source of
  truth; a custom toggle would duplicate it and desynchronize.
- **Touching `supabase/migrations/*` or any server-only module.** Not in
  scope.
