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
- `packages/ui/src/styles/brand.css`
- `packages/ui/src/styles/theme.css`
- `packages/ui/src/styles/glass.css`

These are imported once in `apps/web/src/app/globals.css`.

## Brand contract (project override surface)

`brand.css` is the **one place a consuming project rebrands the platform**
(ADR-0010). The semantic layer reads `--brand-primary` / `--brand-ring` /
`--brand-gradient-*` (cyan by default) instead of pointing at primitives, so a
new project changes identity by overriding `--brand-*` — at `:root` or a
project-scoped selector imported after the `@pumni/ui` styles — without editing
core. This is the entry surface of the semantic tier, **not a fourth tier**.
Both themes share the cyan-500 brand stop (the APCA gate against white
`--primary-foreground` has ~Lc 93 headroom, so no per-theme lightness split is
needed); a wide-gamut `@media (color-gamut: p3)` block lifts only chroma for a
richer cyan on capable displays while the sRGB values stay the gated authority.
When overriding, keep enough lightness that white foreground clears the
`glass-contrast` gate. The named accents in `personalization.css` stay literal
(a runtime user palette, not the brand).

To derive an accessible foreground for an overridden brand colour (instead of
hand-tuning), use `foregroundFor(bg, targetLc)` / `backgroundFor` from
`@pumni/ui` (`packages/ui/src/lib/apca.ts`). It binary-searches the OKLCH
lightness axis with the same `apcaContrast` the gate uses — Lc 60 for body text,
Lc 25 for UI edges — and reports `reachedTarget: false` when a colour cannot
host the target (e.g. no neutral text reaches Lc 60 over a mid-light ~0.85
surface).

## Anti-slop guardrails (read first)

| Don't (generic slop) | Do (Pumni) | Why |
| --- | --- | --- |
| `bg-neutral-900`, `text-white`, raw `oklch(...)` | Semantic utilities: `bg-card`, `text-muted-foreground` | `pumniNoRawColor` ESLint rule blocks it |
| `bg-black/40` for scrims | `bg-overlay` | One owned scrim token, theme-aware |
| `rounded-[14px]`, `rounded-2xl` everywhere | Named radius utilities off `--radius-base` | One personalizable knob, not magic px |
| `ease-out`, `duration-300` | `ease-fluid` / `ease-snappy`; `duration-(--duration-base)` | Brand curves + owned timing |
| Hand-rolled `whileHover={{ scale: 1.05 }}` | `recipes.hoverLift` / `pressScale` / `staggerItem` from `@pumni/ui` | One motion vocabulary, drift-tested |
| Glass on hero / page backgrounds | Glass only on floating layers; opaque shell + raised solid cards | `backdrop-filter` is GPU-heavy; glassmorphism reads only over a backdrop |
| Eyeballing contrast on glass/accents | Trust gated tokens; verify APCA Lc 60 / Lc 25 | `glass-contrast` test owns the cascade |
| `backdrop-blur-md` | Glass utility / `GlassSurface` | Reduced-transparency and performance fallbacks |
| `bg-card/40`, `border-border/20` | Solid surface tokens: opaque, `border-border` | Surfaces are opaque in the unified system |
| `shadow-md`, `shadow-lg` on content | `shadow-card` / `shadow-raised` | One elevation ladder |
| Hand-rolled `rounded-lg border bg-muted` inset well, inline status pill, icon chip | `CardWell`, `Badge`, `IconBadge` from `@pumni/ui` | Closed card sub-surface set; `pumniNoAdHocSurface` blocks the shorthand well |

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

**Surface identity = glassmorphism for floating layers (ADR-0014, amending
ADR-0012).** A glass surface is a frosted translucent fill (`--glass-tint`) tuned
to the APCA gate edge, with: a **luminous light top edge + dark bottom edge**
(`--glass-highlight` / `--glass-shadow-edge`, inset box-shadows in the `glass-*`
utilities), an **inner diagonal sheen** (`--glass-sheen`, a `background-image`
gradient layered over the gated fill — not gate-read), and **vibrancy** via the
single `--glass-saturate` knob (≈1.4; the `glass-saturate.test.ts` guard locks
the tokenization, not the value). Blur is frosted (`--blur-glass` 8–16px).
Float depth is the directional `--shadow-glass`. The luminous border read comes
from `--glass-highlight` (specular, ungated) — a pure-light `--glass-edge` fails
the Lc 25 gate on light surfaces, so the border token stays a gated definition
line. **Perf discipline:** `will-change` is scoped to overlay transitions only
(`[data-state=open|closed]`); stacked glass is capped at 2 layers (a CSS
soft-guard drops the sheen on nested glass; `glass-performance.test.ts`).
Solid cards are NOT glass — they carry real elevation via `surface-raised`
(`--shadow-card-raised` + `--card-rim-top`); content stays solid, glass is only
for floating layers (it earns its `backdrop-filter` cost there). The OS
`Window`/Dock are presentational chrome (neutral window controls, no macOS
traffic lights).

Use the closed set from the skill: floating glass, solid card, inset well,
control fill, status tint. The card layer is **composition-first** — `Card` is
the block surface (variants `solid`/`inset`/`glass`/`spotlight`), and three
sub-surface primitives keep consumers from hand-rolling surfaces: `CardWell`
(the recessed `border border-border bg-muted` inset well), `Badge` (the
status-tint pill, `tone` + optional `pulse` dot), and `IconBadge` (the rounded
icon chip, `tone` `primary-soft`/`raised`/`muted`). `BentoGridItem` owns layout
only and renders through these same primitives, so a bento tile and a feature
card share one surface vocabulary. APCA contrast is gated at Lc 60 text / Lc 25
UI in
`apps/web/src/test/design-system/glass-contrast.test.ts`; do not add a WCAG 2.x
ratio gate. The rim tokens are specular (inset shadows) and are NOT subject to
the APCA gate — tune `--glass-tint` / `--glass-edge`, never the thresholds.

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

## Tailwind v4 variant syntax (canonical form)

This repo is **Tailwind v4**. Most AI training data is v3, where bare
attribute variants did not exist — so models emit the verbose v3 form by
default. Prefer the v4 canonical shorthand.

Enforced in CI via `tailwind-lint` (the Tailwind language-service `suggestCanonicalClasses`
diagnostic, run headless): `bun run ai:tw` checks (part of `bun run ai:check`)
and `bun run ai:tw:fix` rewrites the whole repo in one pass.

## State-layer tokens

`--state-hover`, `--state-pressed`, and `--state-selected` are transient
interactive overlays. They are allowed on controls and are distinct from banned
persistent surface opacity. See `.agents/skills/ui-styling/SKILL.md` for values
and the `color-mix()` recipe.

## Reference detail

Load `.agents/skills/ui-styling/SKILL.md` for semantic token tables, surface
vocabulary, APCA detail, radius/z-index tables, motion, personalization,
visual-regression notes, or add-token/component recipes.
