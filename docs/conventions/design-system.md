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
| `brand-gradient-*` | Brand gradient stops for display text only |
| `desktop-blob-*` | Decorative OS wallpaper ambience |
| `window-control-*` | Window traffic-light controls |

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
  titlebars). `.glass-surface` remains as the compatibility utility for legacy
  floating surfaces.
- **Never** put glass on large background areas or stack many glass layers —
  `backdrop-filter` is GPU-intensive. Keep blur in **8–16px** (`--glass-blur`).
- The translucent fill (`--glass-bg`) is the **contrast scrim**: verify text and
  icons meet **4.5:1** (text) / **3:1** (UI) against both light and dark
  background states.
- Fallbacks are built in: `prefers-reduced-transparency` → opaque surface, no
  blur; `prefers-reduced-motion` → animations/transitions neutralised.

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
  `Avatar`, `GlassSurface`, `Dock`, `Window`, `Dialog`, `DropdownMenu`,
  `Sheet`, `Form`, `CommandPalette`, `Toaster`, `Separator`, and `Skeleton`.
  Import them from `@pumni/ui`, not from `apps/web/src/components/ui`.
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
