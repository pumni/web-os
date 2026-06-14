---
description: Pumni OS design system — OKLCH 3-tier tokens, surface intensity variants, and how to add tokens/components.
when-to-load: When styling UI, adding design tokens, building components, or working with @pumni/ui.
---

# Pumni OS Design System

Pumni Web OS uses a token-first surface system built from OKLCH primitives, semantic roles, motion tokens, and shared `@pumni/ui` primitives. Accessibility (WCAG 2.2 for structure — focus, DOM order, reduced-motion/transparency; **APCA** for contrast) and `backdrop-filter` performance are treated as infrastructure, not afterthoughts.

Token source of truth lives in `@pumni/ui`:

- `packages/ui/src/styles/tokens.css` — Tier 1 primitives
- `packages/ui/src/styles/theme.css` — Tier 2 semantic + `@theme inline`
- `packages/ui/src/styles/glass.css` — surface utilities and transparency fallbacks

These are imported once in `apps/web/src/app/globals.css`.

## Anti-slop guardrails (read first)

The fastest way to stay on-brand: these are the rules an agent breaks when it
falls back to generic Tailwind. Each is enforced or explained in full below.

| Don't (generic slop) | Do (Pumni) | Why |
| --- | --- | --- |
| `bg-neutral-900`, `text-white`, raw `oklch(...)` | Semantic utilities — `bg-card`, `text-muted-foreground` | `pumniNoRawColor` ESLint rule blocks it |
| `bg-black/40` for scrims | `bg-overlay` | One owned scrim token, theme-aware |
| `rounded-[14px]`, `rounded-2xl` everywhere | Named radius utilities off `--radius-base` | One personalizable knob, not magic px |
| `ease-out`, `duration-300` | `ease-fluid` / `ease-snappy`; `duration-[var(--duration-base)]` | Brand curves + owned timing |
| Hand-rolled `whileHover={{ scale: 1.05 }}` | `recipes.hoverLift` / `pressScale` / `staggerItem` from `@pumni/ui` | One motion vocabulary, drift-tested |
| Glass on hero / page backgrounds | Glass only on floating layers; opaque shell | `backdrop-filter` is GPU-heavy |
| Eyeballing contrast on glass/accents | Trust the gated tokens; verify APCA Lc 60 / Lc 25 | `glass-contrast` test owns the cascade |
| `backdrop-blur-md` | Glass utility / `GlassSurface` | Reduced-transparency and performance fallbacks |
| `bg-card/40`, `border-border/20` | Solid surface tokens (opaque, `border-border`) | Surfaces are opaque in the unified system |
| `shadow-md`, `shadow-lg` (Tailwind built-in) on content | `shadow-card` / `shadow-raised` (owned elevation) | One elevation ladder; floating depth comes from the `glass-*` utilities |

This isn't taste-by-vibe: colour, radius, and contrast are enforced by ESLint +
tests, so "on-brand" is a gate, not a guideline.

## Token tiers (do not exceed three)

1. **Primitive** (`tokens.css`) — raw OKLCH values and scales (`--indigo-500`,
   `--neutral-200`, blur, shadow, z-index, motion). **Never consumed directly**
   by components.
2. **Semantic / alias** (`theme.css`) — UI roles that reference primitives and
   switch per theme in `:root` / `.dark`. This is the **only** layer components
   read. Exposed to Tailwind via `@theme inline`.
3. **Component** — narrow, scoped vars (e.g. `--window-titlebar-bg`) added
   _only_ when a component genuinely needs local theming. Reference semantics.

Apps consume semantic utilities (`bg-primary`, `text-muted-foreground`,
`border-border`, `bg-card`, …) — not primitives.

### Semantic tokens

| Token | Role |
| --- | --- |
| `background` / `foreground` | Page surface + default text |
| `card` / `popover` (+ `-foreground`) | Card defaults to a solid raised surface; `variant="glass"` is opt-in for genuinely floating cards; `variant="inset"` is the recessed nested well. |
| `primary` (+ `-foreground`) | Brand actions (Indigo) |
| `secondary` / `muted` / `accent` (+ `-foreground`) | Subdued + hover surfaces |
| `destructive` / `success` / `warning` (+ `-foreground`) | Status |
| `border` / `input` / `ring` | Hairlines, fields, focus ring |
| `glass-bg` / `glass-border` / `glass-edge` / `glass-highlight` / `glass-scrim` / `glass-blur` | Translucent glass surfaces (`glass-edge` = luminous rim) |
| `overlay` | Modal / sheet / command-palette scrim (`bg-overlay`) — never raw `bg-black/40` |
| `brand-gradient-*` | Brand gradient stops for display text only |
| `desktop-blob-*` | Decorative OS wallpaper ambience |
| `window-control-*` | Window traffic-light controls (`-icon` = dark glyph on the dots) |
| `chart-1` ... `chart-5` | Data-visualization series colors (5 stops across brand hues) |

Primitive color variables (`--indigo-*`, `--violet-*`, `--neutral-*`, status
scales, and raw `oklch(...)`) are restricted to token/theme files. Components
and runtime utilities must consume semantic or component-scoped tokens instead.

## Surface Utilities and Overlay Roles

Translucent glass layers are reserved for **floating layers**: Dialog, Sheet, Popover, DropdownMenu, ContextMenu, Command palette, Toast, Topbar, Dock, Sidebar rail, OS `Window`/titlebar, and small floating pills/overlays (e.g. reaction bar). Large background areas and the flat shell stay opaque.

- Apply the role-based utility that matches the layer: `.glass-bar` (topbars/docks/sidebar rails), `.glass-panel` (dialogs, sheets, popovers, command palettes), `.glass-window` (OS windows), or `.glass-titlebar` (window titlebars). The `GlassSurface` component wraps these roles behind a `variant` prop.
- **Never** put glass on large background areas or stack many glass layers — `backdrop-filter` is GPU-intensive. Keep blur in **8–16px** (`--glass-blur`).
- The translucent fill (`--glass-bg`) is the **contrast scrim**: verify text and icons meet **APCA Lc 60** (text) / **Lc 25** (UI) against both light and dark background states.
- Fallbacks are built in: `prefers-reduced-transparency` → opaque surface, no blur; `prefers-reduced-motion` → animations/transitions neutralized.

### Surface vocabulary (closed set)

Every surface must use one of these roles.

| Role | How to build it | Use for |
| --- | --- | --- |
| **Floating glass** | `GlassSurface variant="panel\|bar\|window\|titlebar"` (or the `glass-*` utility on a Radix overlay) | Only the floating layers listed above. Carries the a11y fallbacks. |
| **Solid card** (raised content) | `<Card>` (new default `variant="solid"`) → `border bg-card shadow-sm rounded-xl` | Primary content surfaces: dashboard/settings cards, side panels, info cards. |
| **Inset well** (recessed nested) | `<Card variant="inset">` → `border border-border bg-muted rounded-xl` (no shadow); for non-Card `<div>` wells use `bg-muted border border-border` | Nested wells inside a card: stat tiles, list rows, scroll wells. Replaces every `bg-card/40 border-border/20`, `bg-muted/20 border`, `bg-background/25`. |
| **Control fill** | `bg-muted` (rest) + `motion-safe:hover:bg-muted/80` (hover only) | Small inline controls: `TabsList`, chips, code pills. Hover may keep ONE opacity step (`/80`); rest state is opaque. |
| **Status tint** | `bg-{destructive\|warning\|success\|primary}/10 border-{…}/20 text-{…}` | Inline status chips/banners. Standardized to **/10 fill + /20 border**, nothing else. |

### Contrast gating (APCA)

All semantic color pairs are gated by automated tests using **APCA** (Accessible
Perceptual Contrast Algorithm — the WCAG 3.0 draft model), **not** the WCAG 2.x
luminance ratio. APCA is perceptually accurate across light *and* dark, where the
WCAG 2.x formula over-scores dark-mode pairs due to its luminance bias.

| Algorithm | Threshold (text) | Threshold (UI / non-text) |
|---|---|---|
| APCA (Lc) | ≥ Lc 60 | ≥ Lc 25 |

Lc 60 is the body-text floor; a few surfaces carry deliberately tuned thresholds
in the test (dark `muted` text Lc 55, accent surface Lc 45, status tints
per-token). See [glass-contrast.test.ts](file:///D:/Dev/web-os/apps/web/src/test/design-system/glass-contrast.test.ts).
This is the **single** contrast source of truth — do not reintroduce a WCAG 2.x
ratio gate.

**Hard rules:**

1. **No raw `backdrop-blur-*`** in component TSX. Blur must come from the `glass-*` utilities or `GlassSurface`.
2. **No surface-token opacity:** no `bg-card/NN`, `bg-background/NN`, `bg-popover/NN`. Surfaces are opaque (except hover-only `bg-muted/80`).
3. **One border:** `border-border`. Delete every `border-border/NN` except for status indicators.
4. **No raw elevation shadows** (`shadow-lg`, `shadow-xl`, `shadow-2xl`). Content uses `shadow-sm`; floating depth comes from the `glass-*` utilities (`--shadow-glass*`).
5. **Radius via named utilities only** (`rounded-md/lg/xl`, `rounded-full`). No `rounded-[Npx]`.
6. **No new color tokens.** Reuse existing semantic tokens.

## Typography & motion utilities

Type scale and motion are **owned tokens**, not borrowed Tailwind defaults.

- **Type scale** — `text-xs` … `text-4xl` carry the design system's paired
  size + line-height (raw values in `tokens.css`, bridged in `theme.css`).
  Weights: `font-normal/medium/semibold/bold`; tracking: `tracking-tight`
  (large display text), `tracking-normal`, `tracking-wide`.
- **Easing** — `ease-fluid` (emphasized decelerate, for entrances) and
  `ease-snappy` (symmetric, for moves/reorders) are the brand curves. Prefer
  them over raw `ease-out`.
- **Duration** — Tailwind has no `--duration-*` namespace, so durations live as
  the `--duration-fast|base|slow` CSS vars (use `duration-[var(--duration-base)]`
  in CSS-driven transitions).
- **JS animations** — the `motion` library reads timing from `lib/motion.ts`
  (`duration`, `easing`, `transition`, or `motionTokens`), a hand-kept mirror of
  the CSS motion primitives. Change a curve in `tokens.css` → change it there too
  (`apps/web/src/test/design-system/motion-tokens.test.ts` fails if the two drift).
  motion's JS animations are **not** silenced by the CSS reduced-motion media
  query, so motion components must call `useReducedMotion()` and degrade
  themselves (see `Window`).
- **Micro-feedback is CSS, not JS.** Simple hover/press on a control is a CSS
  transform gated by `motion-safe:`, not a motion dep. `Button` has a built-in
  press depress; `Card` opts in via the `interactive` prop (hover lift + press).
  Both ride the `--press-scale` token; the JS bridge mirrors it as `pressScale`
  (from `@pumni/ui`), kept in sync by `motion-tokens.test.ts`, so CSS- and
  JS-driven presses depress to the same depth. Reach for JS only when you need
  orchestration (stagger, presence) or the element is already a `motion.*`.
- **Interaction recipes (JS)** — named house gestures composed from the tokens
  above, exported from `@pumni/ui` as `recipes` (and on `motionTokens.recipes`).
  Spread them onto a `motion.*` element instead of hand-rolling `whileHover`
  numbers: `hoverLift` (card/tile rise), `pressScale` (button/icon press),
  `staggerContainer` + `staggerItem` (list/grid entrance), `fadeRise` (content
  enter/exit — wrap in `AnimatePresence`). They describe the full-energy path
  only, so the component still gates with `useReducedMotion()` (same rule as
  above).
- **Presence / enter-exit** — `Window` is a `motion.section` with spring
  enter/exit; wrap a conditionally-rendered `Window` in `AnimatePresence`
  (re-exported from `@pumni/ui`, so apps don't add their own `motion` dep) to get
  the exit animation. **Radix-driven overlays (`Dialog`, `Sheet`,
  `CommandPalette`) keep their CSS enter/exit** — Radix already manages presence,
  and forcing motion there fights its mounting for little visual gain.

### Dark-mode typographic compensation (halation)

Bright text on dark backgrounds causes *halation* (a glowing effect that makes glyphs appear thicker and less legible). The system automatically applies typographic offsets in dark mode:
- **Font weight**: Body text weight is reduced by 50 units (400 to 350 via `--font-weight-body`). Headings are reduced from 600 to 550 via `--font-weight-heading`.
- **Letter spacing**: Body text tracking is increased slightly by `+0.01em` via `--tracking-body`.

### Font loading strategy

Our Geist and Geist_Mono variable fonts are optimized via `next/font/google` in [layout.tsx](file:///D:/Dev/web-os/apps/web/src/app/layout.tsx), using the `latin` and `vietnamese` subsets to support multilingual text efficiently.
- **Future CJK/extended**: If adding multilingual support, use `unicode-range` splitting to lazy-load non-Latin glyphs.

### Scroll-driven animations (progressive enhancement)

CSS scroll-driven animations run off the main thread (no JS scroll listeners) and are gated behind `@supports (animation-timeline: view())` + `prefers-reduced-motion: no-preference`. Available utilities:

| Utility | Effect | Use for |
|---|---|---|
| `scroll-fade-in` | Fade + slide up on viewport entry | Cards, sections |
| `scroll-slide-up` | Slide up + scale on entry | Hero content |
| `scroll-parallax` | Subtle Y-axis parallax | Background blobs, decorative |

### View Transitions

`withViewTransition()` from `@/lib/view-transition` wraps navigation in the View Transitions API when available. Falls back to immediate navigation. Reduced-motion is respected.

## Radius scale

One knob drives the whole UI: `--radius-base` (`0.625rem`, deliberately softer than the legacy 8px for a smoother, modern look). The `@theme inline` scale derives every step from it via `calc()`, so components consume **named utilities only** — never magic `rounded-[Npx]` values.

| Utility | Value (at base 10px) | Typical use |
| --- | --- | --- |
| `rounded-xs` | `calc(--radius - 6px)` = 4px | Checkboxes, tiny indicators, tooltip arrow |
| `rounded-sm` | `calc(--radius - 4px)` = 6px | Menu items, inline chips |
| `rounded-md` | `calc(--radius - 2px)` = 8px | Buttons, inputs, dropdown/menu content |
| `rounded-lg` | `--radius` = 10px | Dialogs |
| `rounded-xl` | `calc(--radius + 4px)` = 14px | Cards, windows, sheets, command palette |
| `rounded-2xl` / `rounded-3xl` | +8px / +16px | Large hero surfaces |

### Nested radius convention

When a rounded child sits inside a rounded parent, their curves must stay concentric to look visually balanced. The mathematical rule is `R_child = R_parent - padding`, but in practice our fixed scale handles most cases:

| Parent radius | Inner padding | Child radius | Why |
|---|---|---|---|
| `rounded-xl` (14px) | 16px (p-4) | `rounded-lg` (10px) | Padding > radius – use next step down |
| `rounded-xl` (14px) | 12px (p-3) | `rounded-md` (8px) | 14 - 12 = 2px, snap up to `rounded-md` |
| `rounded-2xl` (18px) | 16px (p-4) | `rounded-xs` (4px) | 18 - 16 = 2px, snap to `rounded-xs` |
| `rounded-2xl` (18px) | 24px (p-6) | `rounded-lg` (10px) | Padding > radius – next step down |

Use `rounded-[inherit]` when a child must match its parent exactly (e.g. a full-bleed inner section). The scale above covers the common nesting depths. Use the `@utility rounded-nested` class to auto-calculate concentric rounding when nesting inside standard `rounded-xl` panels.

This is the shadcn-on-v4 pattern (not Tailwind's fixed native scale) so the base
stays a single personalizable knob. `rounded-[inherit]` is allowed where a child
must match its parent's radius. The IntelliSense `suggestCanonicalClasses` hint
can't resolve these `calc(var())` tokens — verify against this table, don't follow
it blindly.

## Stacking / z-index (one owned scale)

There is **one** z-index scale and it lives in `tokens.css` (`--z-*`). It is the
single source of truth for *cross-component* layering — both the OS floating
primitives and the app-shell chrome read it. The order, low → high:

| Token / utility | Value | Layer |
| --- | --- | --- |
| `--z-desktop` | `-1` | Fixed OS wallpaper (`.os-desktop`), behind content |
| `--z-base` | `0` | In-flow app content |
| `z-window` / `z-window-active` | `100` / `110` | OS windows (`Window`) |
| `z-sidebar` | `700` | Persistent shell rail |
| `z-dock` | `800` | Floating dock |
| `z-topbar` | `850` | Top app bar |
| `z-overlay` | `900` | Scrim behind modals/sheets/popovers |
| `z-modal` | `1000` | Dialog / sheet panel |
| `z-command` | `1100` | Command palette |
| `z-toast` | `1200` | Toasts (always frontmost) |

**Rules:**

- **Never hand-pick a raw `z-40` / `z-50` for a layer that can overlap another
  component.** The OS scale (100–1200) and Tailwind's default scale (0–50) are
  different axes; a chrome bar left on `z-40` is silently *below* any floating
  `Window` (110) and gets painted over — this is the class of bug this section
  exists to prevent. Chrome consumes the named utilities (`z-topbar`,
  `z-sidebar`, …) exposed from `theme.css`; `@pumni/ui` primitives consume the
  tokens directly via inline `style={{ zIndex: "var(--z-…)" }}`.
- **Don't trap the scale in a needless stacking context.** The shell wrapper
  carries no `z-index`, and the wallpaper sits at `--z-desktop: -1`, so chrome
  and windows share one stacking context and the table above orders them
  globally. Adding a positive `z-index` to a wrapper re-imprisons everything
  inside it and the global order stops holding.
- **Component-internal z is fine** (e.g. an avatar status dot, a tooltip arrow,
  a decorative blob behind a card). Those don't escape their component, so they
  use plain Tailwind `z-10` / `-z-10` locally. The token scale is only for
  layers that compete *across* components.

## Personalization (accent + glass)

Runtime personalization rides the existing tier-2 layer — no separate theming
engine. `PersonalizationProvider` (from `@pumni/ui`, mount it inside the
next-themes provider) writes `data-accent` / `data-glass` onto the root element,
and `styles/personalization.css` overrides the semantic tokens for those scopes
exactly like `.dark` does.

- **No FOUC** — the provider only reflects the attributes in `useEffect`, so a
  non-default accent/glass would flash at first paint. Render
  `PersonalizationScript` (from `@pumni/ui`) as the first child of `<body>` — an
  inline blocking script that applies the stored attributes before first paint,
  the same way next-themes does for `.dark` (see `apps/web/src/app/layout.tsx`).
- **Accent** — `indigo` (default, no attribute), `violet`, `rose`. Each only
  overrides `--primary` / `--ring`; the accent surface (`--accent`,
  `--accent-foreground`) is derived from the live `--primary` via `color-mix`.
  In dark mode `.dark[data-accent]` leans the on-accent text further toward
  `--foreground` (the dark accent surface is dark, so the light-mode 80%-primary
  mix would fail AA), and rose keeps `red-600` in dark (lighter `red-500` drops
  the white `--primary-foreground` below AA). These pairs are **gated**, not
  eyeballed — `apps/web/src/test/design-system/glass-contrast.test.ts` resolves
  the cascade (incl. `color-mix in oklch`) and asserts ≥ APCA Lc 60 for every accent ×
  light/dark. Read/set via `usePersonalization()`.
- **Glass** — `soft` / `default` / `strong` bias the shared `--glass-blur`.
- Mode-aware accents use compound `.dark[data-accent="…"]` selectors (the
  attribute and `.dark` live on the same root node). `personalization.css` is
  imported **after** `theme.css` so its same-specificity rules win on order.

## Visual regression

The showcase doubles as a visual contract. `apps/web/e2e/design-system-visual.spec.ts` snapshots the `showcase-root` element (light, dark, violet + rose accents, and the strong surface intensity/personalization variant — note that the storage key remains `pumni-glass` for compatibility) via Playwright. To keep it reachable without auth, the showcase is rendered at the public, production-gated route `app/design-system-preview` (outside the `(app)` group); set `ENABLE_DESIGN_PREVIEW=1` to expose it against a production build.

- Run: `cd apps/web && bunx playwright test design-system-visual`.
- Baselines are **platform-specific** (Playwright suffixes the OS). Generate them
  in the CI runner with `--update-snapshots`; do **not** commit Windows baselines
  for a Linux CI. `*-snapshots/` folders are committed; run artifacts are ignored.
- Determinism comes from `reducedMotion: "reduce"` (drives our reduced-motion
  paths so the motion `Window` and CSS transitions settle instantly).

## Adding a token

1. Add the raw value to the relevant scale in `tokens.css` (OKLCH).
2. Add/point a semantic alias in `theme.css` under **both** `:root` and `.dark`.
   A **semantic token must reference a primitive**, never duplicate its raw
   value. For a translucent token (glass fills, tinted rings), express it as
   `color-mix(in oklch, var(--primitive) N%, transparent)` so it tracks the
   ramp — do not paste a raw `oklch(… / α)` literal (that is the "magic literal"
   drift the contrast test now resolves). Pure-black functional scrims
   (`--overlay`, shadow alphas) stay as raw black/alpha — black is the immutable
   anchor, not a tunable primitive.
3. If it should be a Tailwind utility, expose it in the `@theme inline` block
   (`--color-x: var(--x)`, `--shadow-x: var(--shadow-n)`, …). Keep the `inline`
   keyword so light/dark switch at runtime.

## Adding a component

Components live in `packages/ui/src/components/` and are exported from
`packages/ui/src/index.ts`. Follow the established pattern:

- Current shared primitives include `Button`, `Card`, `Input`, `Label`,
  `Checkbox`, `Switch`, `Select`, `Tabs`, `Avatar`, `GlassSurface`, `Dock`,
  `Window`, `Dialog`, `DropdownMenu`, `ContextMenu`, `Popover`, `Tooltip`,
  `ScrollArea`, `Sheet`, `Form`, `CommandPalette`, `Toaster`, `Separator`, and
  `Skeleton`. Import them from `@pumni/ui`, not from `apps/web/src/components/ui`.
- `cva` for variants; `data-slot` / `data-variant` attributes for styling hooks.
- Merge classes with `cn()` (exported from `@pumni/ui`).
- Build interactive primitives on Radix; keep them client-safe (no server-only
  or secret imports — see `docs/conventions/server-client-boundary.md`).
- Consume semantic tokens only. Floating layers get the role-specific glass
  utility for their layer.
- Do not inline raw color values (`oklch(...)`), primitive scale variables, or
  Tailwind's built-in colour palette (`bg-neutral-900`, `text-white`, …) in
  component classes. Add a semantic/component token first, then consume that
  token. **Enforced** by the `pumniNoRawColor` ESLint rule
  (`packages/config/eslint.mjs`, applied to `@pumni/ui` and `apps/web` — tests
  excluded) and by `bun run ai:check`; styles/token files are the only place
  primitives are allowed.
- `@pumni/ui` is a pure UI package. It must not import app aliases (`@/`),
  `server-only`, Supabase, auth, env, validators, feature packages, or test
  utilities.

### Optional: scaffold a standard primitive with the shadcn CLI

`@pumni/ui` is hand-owned — `shadcn add` is **not** the source of truth, only a
seed for *standard* registry primitives (Select, Tooltip, Popover, Tabs…). OS
components (`Window`, `Dock`, `GlassSurface`, …) are always written by hand.

`packages/ui/components.json` configures the CLI to drop files into this package
(new-york, lucide, `@/` → `src/`). Run it **from inside the package** so it
reads the local config and lands deps in `packages/ui/package.json`:

```sh
cd packages/ui && bunx --bun shadcn@latest add <primitive>
```

The generated file is a starting point, not finished. Before exporting it,
**refactor it to house style** — this is mandatory, not optional:

1. **Rewrite the `cn` import to relative** (`@/lib/cn` → `../lib/cn`). The CLI
   emits the `@/` alias, but inside `@pumni/ui` that alias collides with the
   app's `@/` at build time — the package rule above forbids it.
2. Replace any inlined `oklch(...)`/primitive scales with semantic tokens.
3. Keep `data-slot` / `data-variant` hooks; add the role-specific glass utility
   if it is a floating layer.
4. Add the export to `packages/ui/src/index.ts` (the barrel) by hand.

Promote from `apps/web` to `@pumni/ui` only at a real reuse boundary (see
`docs/conventions/feature-module.md`).
