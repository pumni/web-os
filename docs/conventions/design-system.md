---
description: Pumni OS design system hard rules for tokens, surfaces, contrast, motion, and @pumni/ui.
when-to-load: When styling UI, adding design tokens, building components, or deciding whether to load `.agents/skills/ui-styling/SKILL.md` for reference tables.
---

# Pumni OS Design System

Pumni Web OS is token-first: OKLCH primitives feed semantic roles; components
consume semantic utilities only. Reference tables and recipes live in
`.agents/skills/ui-styling/SKILL.md`.

Token source of truth lives in `@pumni/ui`:

- `packages/ui/src/styles/tokens.css`
- `packages/ui/src/styles/theme.css`
- `packages/ui/src/styles/glass.css`

These are imported once in `apps/web/src/app/globals.css`.

## Anti-slop guardrails (read first)

| Don't (generic slop) | Do (Pumni) | Why |
| --- | --- | --- |
| `bg-neutral-900`, `text-white`, raw `oklch(...)` | Semantic utilities: `bg-card`, `text-muted-foreground` | `pumniNoRawColor` ESLint rule blocks it |
| `bg-black/40` for scrims | `bg-overlay` | One owned scrim token, theme-aware |
| `rounded-[14px]`, `rounded-2xl` everywhere | Named radius utilities off `--radius-base` | One personalizable knob, not magic px |
| `ease-out`, `duration-300` | `ease-fluid` / `ease-snappy`; `duration-(--duration-base)` | Brand curves + owned timing |
| Hand-rolled `whileHover={{ scale: 1.05 }}` | `recipes.hoverLift` / `pressScale` / `staggerItem` from `@pumni/ui` | One motion vocabulary, drift-tested |
| Glass on hero / page backgrounds | Glass only on floating layers; opaque shell | `backdrop-filter` is GPU-heavy |
| Eyeballing contrast on glass/accents | Trust gated tokens; verify APCA Lc 60 / Lc 25 | `glass-contrast` test owns the cascade |
| `backdrop-blur-md` | Glass utility / `GlassSurface` | Reduced-transparency and performance fallbacks |
| `bg-card/40`, `border-border/20` | Solid surface tokens: opaque, `border-border` | Surfaces are opaque in the unified system |
| `shadow-md`, `shadow-lg` on content | `shadow-card` / `shadow-raised` | One elevation ladder |

## Token tiers (do not exceed three)

1. **Primitive** (`tokens.css`) — raw OKLCH values and scales. Never consumed
   directly by components.
2. **Semantic / alias** (`theme.css`) — UI roles that reference primitives and
   switch per theme. This is the only layer components read.
3. **Component** — narrow, scoped vars for real local theming. Reference
   semantics.

Apps consume semantic utilities, not primitives.

## Surface utilities and overlay roles

Glass is reserved for floating layers: Dialog, Sheet, Popover, DropdownMenu,
ContextMenu, Command palette, Toast, Topbar, Dock, Sidebar rail, OS
`Window`/titlebar, and small floating pills/overlays. Large backgrounds and flat
shell surfaces stay opaque.

Use the closed set from the skill: floating glass, solid card, inset well,
control fill, status tint. APCA contrast is gated at Lc 60 text / Lc 25 UI in
`apps/web/src/test/design-system/glass-contrast.test.ts`; do not add a WCAG 2.x
ratio gate.

**Hard rules:**

1. No raw `backdrop-blur-*` in component TSX. Blur comes from `glass-*` utilities
   or `GlassSurface`.
2. No surface-token opacity: no `bg-card/NN`, `bg-background/NN`,
   `bg-popover/NN`. Surfaces are opaque except hover-only `bg-muted/80`.
3. One border: `border-border`. Delete `border-border/NN` except status
   indicators.
4. No raw elevation shadows (`shadow-lg`, `shadow-xl`, `shadow-2xl`). Content
   uses owned elevation; floating depth comes from `glass-*`.
5. Radius via named utilities only (`rounded-md/lg/xl`, `rounded-full`). No
   `rounded-[Npx]`.
6. No new color tokens. Reuse existing semantic tokens.

## State-layer tokens

`--state-hover`, `--state-pressed`, and `--state-selected` are transient
interactive overlays. They are allowed on controls and are distinct from banned
persistent surface opacity. See `.agents/skills/ui-styling/SKILL.md` for values
and the `color-mix()` recipe.

## Reference detail

Load `.agents/skills/ui-styling/SKILL.md` for semantic token tables, surface
vocabulary, APCA detail, radius/z-index tables, motion, personalization,
visual-regression notes, or add-token/component recipes.
