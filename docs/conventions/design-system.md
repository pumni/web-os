---
description: Pumni OS design system — OKLCH 3-tier tokens, Liquid Glass surfaces, and how to add tokens/components.
when-to-load: When styling UI, adding design tokens, building components, or working with @pumni/ui.
---

# Pumni OS Design System

Visual language for Pumni Web OS: **Liquid Glass** surfaces over a flat, calm
shell, an **Indigo/Violet** brand, and an **OKLCH** token system. Accessibility
(WCAG 2.2) and `backdrop-filter` performance are treated as infrastructure, not
afterthoughts.

Token source of truth lives in `@pumni/ui`:

- `packages/ui/src/styles/tokens.css` — Tier 1 primitives
- `packages/ui/src/styles/theme.css` — Tier 2 semantic + `@theme inline`
- `packages/ui/src/styles/glass.css` — Liquid Glass utilities + a11y fallbacks

These are imported once in `apps/web/src/app/globals.css`.

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
| `card` / `popover` (+ `-foreground`) | Raised surfaces (`Card` defaults to glass; `variant="solid"` for dense content) |
| `primary` (+ `-foreground`) | Brand actions (Indigo) |
| `secondary` / `muted` / `accent` (+ `-foreground`) | Subdued + hover surfaces |
| `destructive` / `success` / `warning` (+ `-foreground`) | Status |
| `border` / `input` / `ring` | Hairlines, fields, focus ring |
| `glass-bg` / `glass-border` / `glass-edge` / `glass-highlight` / `glass-scrim` / `glass-blur` | Liquid Glass surfaces (`glass-edge` = luminous rim) |
| `overlay` | Modal / sheet / command-palette scrim (`bg-overlay`) — never raw `bg-black/40` |
| `brand-gradient-*` | Brand gradient stops for display text only |
| `desktop-blob-*` | Decorative OS wallpaper ambience |
| `window-control-*` | Window traffic-light controls (`-icon` = dark glyph on the dots) |

Primitive color variables (`--indigo-*`, `--violet-*`, `--neutral-*`, status
scales, and raw `oklch(...)`) are restricted to token/theme files. Components
and runtime utilities must consume semantic or component-scoped tokens instead.

## Liquid Glass — use with intent

Glass is for **floating layers and cards**: topbar, dock, window titlebar,
dialog, sheet, popover, command palette, toast, and the default `Card` surface.
Large background areas and the flat shell stay opaque. Use `Card`'s
`variant="solid"` when content is dense or contrast-critical.

- Apply the role-based utility that matches the layer: `.glass-bar`
  (topbars/docks/sidebar rails), `.glass-panel` (dialogs, sheets, popovers,
  command palettes), `.glass-window` (OS windows), or `.glass-titlebar` (window
  titlebars). The `GlassSurface` component wraps these roles behind a `variant`
  prop.
- **Never** put glass on large background areas or stack many glass layers —
  `backdrop-filter` is GPU-intensive. Keep blur in **8–16px** (`--glass-blur`).
- The translucent fill (`--glass-bg`) is the **contrast scrim**: verify text and
  icons meet **4.5:1** (text) / **3:1** (UI) against both light and dark
  background states.
- Fallbacks are built in: `prefers-reduced-transparency` → opaque surface, no
  blur; `prefers-reduced-motion` → animations/transitions neutralised.

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
  the CSS motion primitives. Change a curve in `tokens.css` → change it there too.
  motion's JS animations are **not** silenced by the CSS reduced-motion media
  query, so motion components must call `useReducedMotion()` and degrade
  themselves (see `Window`).
- **Presence / enter-exit** — `Window` is a `motion.section` with spring
  enter/exit; wrap a conditionally-rendered `Window` in `AnimatePresence`
  (re-exported from `@pumni/ui`, so apps don't add their own `motion` dep) to get
  the exit animation. **Radix-driven overlays (`Dialog`, `Sheet`,
  `CommandPalette`) keep their CSS enter/exit** — Radix already manages presence,
  and forcing motion there fights its mounting for little visual gain.

## Radius scale

One knob drives the whole UI: `--radius-base` (`0.625rem`, deliberately softer
than the legacy 8px for the Liquid Glass look). The `@theme inline` scale derives
every step from it via `calc()`, so components consume **named utilities only** —
never magic `rounded-[Npx]` values.

| Utility | Value (at base 10px) | Typical use |
| --- | --- | --- |
| `rounded-xs` | `calc(--radius - 6px)` = 4px | Checkboxes, tiny indicators, tooltip arrow |
| `rounded-sm` | `calc(--radius - 4px)` = 6px | Menu items, inline chips |
| `rounded-md` | `calc(--radius - 2px)` = 8px | Buttons, inputs, dropdown/menu content |
| `rounded-lg` | `--radius` = 10px | Dialogs |
| `rounded-xl` | `calc(--radius + 4px)` = 14px | Cards, windows, sheets, command palette |
| `rounded-2xl` / `rounded-3xl` | +8px / +16px | Large hero surfaces |

This is the shadcn-on-v4 pattern (not Tailwind's fixed native scale) so the base
stays a single personalizable knob. `rounded-[inherit]` is allowed where a child
must match its parent's radius. The IntelliSense `suggestCanonicalClasses` hint
can't resolve these `calc(var())` tokens — verify against this table, don't follow
it blindly.

## Personalization (accent + glass)

Runtime personalization rides the existing tier-2 layer — no separate theming
engine. `PersonalizationProvider` (from `@pumni/ui`, mount it inside the
next-themes provider) writes `data-accent` / `data-glass` onto the root element,
and `styles/personalization.css` overrides the semantic tokens for those scopes
exactly like `.dark` does.

- **Accent** — `indigo` (default, no attribute), `violet`, `rose`. Each only
  overrides `--primary` / `--ring`; the accent surface (`--accent`,
  `--accent-foreground`) is derived from the live `--primary` via `color-mix`.
  Stops sit in the verified lightness band so the white `--primary-foreground`
  keeps contrast. Read/set via `usePersonalization()`.
- **Glass** — `soft` / `default` / `strong` bias the shared `--glass-blur`.
- Mode-aware accents use compound `.dark[data-accent="…"]` selectors (the
  attribute and `.dark` live on the same root node). `personalization.css` is
  imported **after** `theme.css` so its same-specificity rules win on order.

## Visual regression

The showcase doubles as a visual contract. `apps/web/e2e/design-system-visual.spec.ts`
snapshots the `showcase-root` element (light, dark, and a violet accent) via
Playwright. To keep it reachable without auth, the showcase is rendered at the
public, production-gated route `app/design-system-preview` (outside the `(app)`
group); set `ENABLE_DESIGN_PREVIEW=1` to expose it against a production build.

- Run: `cd apps/web && bunx playwright test design-system-visual`.
- Baselines are **platform-specific** (Playwright suffixes the OS). Generate them
  in the CI runner with `--update-snapshots`; do **not** commit Windows baselines
  for a Linux CI. `*-snapshots/` folders are committed; run artifacts are ignored.
- Determinism comes from `reducedMotion: "reduce"` (drives our reduced-motion
  paths so the motion `Window` and CSS transitions settle instantly).

## Adding a token

1. Add the raw value to the relevant scale in `tokens.css` (OKLCH).
2. Add/point a semantic alias in `theme.css` under **both** `:root` and `.dark`.
3. If it should be a Tailwind utility, expose it in the `@theme inline` block
   (`--color-x: var(--x)`). Keep the `inline` keyword so light/dark switch at
   runtime.

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
- Do not inline raw color values (`oklch(...)`) or primitive scale variables in
  component classes. Add a semantic/component token first, then consume that
  token.
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
