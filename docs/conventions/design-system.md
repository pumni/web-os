---
description: Design-system map and decisions for tokens, surfaces, contrast, motion, and @pumni/ui. Use when styling UI or adding components/tokens.
---

# Pumni OS Design System

Pumni Web OS is token-first: OKLCH primitives feed semantic roles; components consume semantic utilities only.

Token source of truth lives in `@pumni/ui`:
- `packages/ui/src/styles/tokens.css`
- `packages/ui/src/styles/brand.css`
- `packages/ui/src/styles/theme.css`
- `packages/ui/src/styles/component-tokens.css`
- `packages/ui/src/styles/glass.css`
- `packages/ui/src/styles/effects.css`

These are imported once in `apps/web/src/app/globals.css`.

## Brand contract (project override surface)

`brand.css` is the **one place a consuming project rebrands the platform** (ADR-0010). The semantic layer reads `--brand-primary` / `--brand-ring` / `--brand-gradient-*` instead of pointing at primitives, so a new project changes identity by overriding `--brand-*` without editing core. The coral brand splits its stop per theme (light uses deep `coral-600`, dark the lighter `coral-500`) so white `--primary-foreground` clears the APCA gate in both. sRGB values stay the gated authority. When overriding, keep enough lightness that white foreground clears the `glass-contrast` gate. Accents in `personalization.css` stays selectable user palette, not the brand.
To derive an accessible foreground for an overridden brand colour, use `foregroundFor` / `backgroundFor` from `@pumni/ui` (`packages/ui/src/lib/apca.ts`) which binary-searches the lightness axis to clear the APCA gate (Lc 60 body, Lc 25 UI edges).

## Source ownership

- CSS is the token source of truth: inspect `packages/ui/src/styles/` rather
  than copying a token inventory into docs.
- `packages/ui/src/styles/brand.css` is the consumer rebrand surface. Semantic
  roles consume `--brand-*`; user-selectable accents belong to
  `personalization.css`.
- Component APIs and recipes live under `packages/ui/src/components/` and
  `packages/ui/src/lib/`. The package contract and public subpaths are in
  `packages/ui/package.json`.
- ESLint, `tailwind-lint`, and focused design-system tests own deterministic
  restrictions. Their diagnostics and source are more authoritative than a
  prose list of forbidden classes.

## Token tiers

1. **Primitive** (`tokens.css`) — raw OKLCH values and scales. Never consumed directly by components.
2. **Semantic / alias** (`theme.css`) — UI roles that reference primitives and switch per theme. Only layer components read.
3. **Component** (`component-tokens.css`) — narrow, scoped vars for local theming.

Color tokens default to `light-dark()` function defined at `:root` rather than duplicating declarations in separate `.dark` overrides (reserved for non-color properties).

## Product decisions

### Glass placement (stable product rule)

Glass is for floating layers over colourful/media/blob backdrops: dialogs,
sheets, popovers, command surfaces, toasts, docks, rails, and window chrome.
Dense content, forms, tables, long reading text, and flat backgrounds use solid
surfaces. Media overlays use the `glass-panel-media` utility so the tokenized
scrim preserves APCA contrast.

The glass token ladder is 12–24px blur (24px is the strong cap) with ≈1.3×
saturation in the light theme; the CSS token sources and drift test own the
exact theme values.

The product mapping is informed by Apple HIG Materials and Material 3
elevation. These references explain the product rationale; implementation
tokens and focused tests remain the active sources of truth.

Use semantic color utilities, owned motion/elevation/radius utilities, and
components such as `CardWell`, `Badge`, and `IconBadge`. Do not invent a raw
surface, border, blur, or token in feature code. The exact restrictions and
exceptions are enforced by the package lint rules and tests, including:

- `packages/ui/src/test/glass-contrast.test.ts`
- `packages/ui/src/test/border-consumption.test.ts`
- `apps/web/src/test/design-system/glass-backdrop-root-trap.test.ts`

## Workflow

1. Inspect the relevant token source and existing component recipe.
2. Use semantic utilities or extend the owning component/token layer when the
   design contract genuinely needs a new role.
3. Run `bun --filter @pumni/ui lint`, typecheck, and focused tests; use
   `bun run tw:lint` for Tailwind usage and the catalog for visual preview.

## Tailwind v4 variant syntax (canonical form)

This repo uses Tailwind v4. Prefer its canonical shorthand; `tailwind-lint`
checks the usage through `bun run tw:lint`.

## State-layer tokens

`--state-hover`, `--state-pressed`, and `--state-selected` are transient interactive overlays distinct from persistent opacity.
