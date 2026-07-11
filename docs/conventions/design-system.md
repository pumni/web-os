---
description: Pumni OS design system hard rules for tokens, surfaces, contrast, motion, and @pumni/ui. Use when styling UI, adding design tokens, building components, or deciding whether to load `.agents/skills/ui-styling/SKILL.md` for reference tables.
---

# Pumni OS Design System

Pumni Web OS is token-first: OKLCH primitives feed semantic roles; components consume semantic utilities only. Reference tables and recipes live in `.agents/skills/ui-styling/SKILL.md`.

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

## Anti-slop guardrails (read first)

| Don't (generic slop) | Do (Pumni) | Why |
| --- | --- | --- |
| `bg-neutral-900`, `text-white`, raw `oklch(...)` | Semantic utilities: `bg-card`, `text-muted-foreground` | `pumniNoRawColor` ESLint rule blocks it |
| `bg-black/40` for scrims | `bg-overlay` | One owned scrim token, theme-aware |
| `rounded-[14px]`, `rounded-2xl` everywhere | Named radius utilities off `--radius-base` | One personalizable knob, not magic px |
| `ease-out`, `duration-300` | `ease-fluid` / `ease-snappy`; `duration-(--duration-base)` | Brand curves + owned timing (`pumniNoRawTiming` blocks it) |
| Hand-rolled `whileHover={{ scale: 1.05 }}` | `recipes.hoverLift` / `pressScale` / `staggerItem` from `@pumni/ui` | One motion vocabulary, drift-tested |
| Glass on page backgrounds / flat surfaces | Glass only on floating layers with colourful backdrop. Dense content always uses solid | `backdrop-filter` is GPU-heavy; glassmorphism reads only over backdrop |
| Eyeballing contrast on glass/accents | Trust gated tokens; verify APCA Lc 60 (text on fill) | `glass-contrast` test owns the cascade |
| `backdrop-blur-md` | Glass utility / `GlassSurface` | Reduced-transparency and performance fallbacks |
| `bg-card/40`, `border-border/20` | Solid surface tokens: opaque, `border-border` | Surfaces are opaque in the unified system |
| `shadow-md`, `shadow-lg` on content | `shadow-card` / `shadow-raised` | One elevation ladder |
| Hand-rolled well, inline status pill, icon chip | `CardWell`, `Badge`, `IconBadge` from `@pumni/ui` | Closed card sub-surface set; `pumniNoAdHocSurface` blocks ad hoc wells |

## Token tiers (do not exceed three)

1. **Primitive** (`tokens.css`) — raw OKLCH values and scales. Never consumed directly by components.
2. **Semantic / alias** (`theme.css`) — UI roles that reference primitives and switch per theme. Only layer components read.
3. **Component** (`component-tokens.css`) — narrow, scoped vars for local theming.

Color tokens default to `light-dark()` function defined at `:root` rather than duplicating declarations in Separate `.dark` overrides (reserved for non-color properties).

## Surface utilities and overlay roles

### Glass placement (stable product rule)

**Glass = floating layers only** (dialog, sheet, popover, dropdown, context menu, command palette, toast, floating dock/topbar rail, OS window titlebar, small floating pills). Glass must sit over a **colourful / media / blob backdrop** so frost reads. Sticky glass bars (e.g. `AppTopbar` using `glass-bar-edge-b`) must carry the `glass-scroll-edge-b` utility class to separate scrolled content visually from the glass header via a scroll-driven edge line. Media-floating overlays over arbitrary video or media must use the `glass-panel-media` utility class leveraging the `--glass-media-dim` token (`light-dark(oklch(1 0 0 / 0.85), oklch(0 0 0 / 0.40))`) to ensure APCA contrast Lc >= 60 is maintained over both white and black frames. Frosted glass parameters: saturation ≈1.3 (light mode multiplier), blur range 12-24px (where 24px is the maximum strong cap), and default grain opacity 0.05 (light) / 0.07 (dark) overlay.
**Solid = dense content and flat backgrounds:** forms, tables, long reading text, full-page backgrounds, large content cards on flat fills. Do not use glass for primary form surfaces or long body text.

### Token inventory

Token inventory: `packages/ui/src/styles/tokens.css`, `packages/ui/src/styles/theme.css`, `packages/ui/src/styles/glass.css`, and `packages/ui/src/styles/effects.css` (sources of truth — do not copy lists into docs). Freshness alignment with Apple HIG and Material 3 (Verified 2026-07-09, next manual recheck: 2026-08-15).

**Hard rules:**

1. No raw `backdrop-blur-*` in component TSX. Blur comes from `glass-*` utilities or `GlassSurface`.
2. No surface-token opacity: no `bg-card/NN`, `bg-background/NN`, `bg-popover/NN`. Surfaces are opaque except hover-only `bg-muted/80`.
3. One border: `border-border`. Delete `border-border/NN` except status indicators.
4. No raw elevation shadows (`shadow-lg`, `shadow-xl`, `shadow-2xl`). Content uses owned elevation; floating depth comes from `glass-*`.
5. Radius via named utilities only (`rounded-md/lg/xl`, `rounded-full`). No `rounded-[Npx]`.
6. No new color tokens. Reuse existing semantic tokens.
7. **Backdrop-root trap (MDN §backdrop-filter).** Never wrap glass in an ancestor carrying `opacity < 1`, `mix-blend-mode`, or `will-change: opacity|mix-blend-mode`. Guarded by `glass-backdrop-root-trap.test.ts`.
8. **Accent Lc 45 ↔ font-size pairing (APCA Bronze Simple Mode).** Lc 45 is large/heavy text floor (24px/700 or 36px/400). A small accent chip label must carry $\ge$ `text-sm font-semibold` (14px/600) or heavier. See `REFERENCE.md` for detail.

### Decision tree

```text
Floating over content/media/blob?
  NO  → Card solid / page bg. STOP.
  YES → Multi-line body / form / table?
          YES → solid surface, OR glass shell + solid inset. STOP.
          NO  → Shell chrome (topbar, dock, rail, control strip)?
                  YES → chrome tier (GlassSurface bar*). STOP.
                  NO  → Overlay / window shell?
                          YES → readable (component or GlassSurface panel/window). STOP.
                          NO  → Hero short tile only with blob parent?
                                  YES → GlassSurface panel, short copy.
                                  NO  → solid Card.
```

**Golden rules:**

1. Never write `border: 1px solid <colour>` or an inset rim box-shadow in TSX — go through a utility (`glass-*`, `surface-raised`) or component (`Card`, `CardWell`, `Badge`).
2. Status tint `/20` is reached **only** via `Badge` or `Card state`. No hand-rolled `border-{tone}/20`, no `border-2`, no `border-l-4` in features.

Solid-vs-glass hairline separation is pinned by `border-consumption.test.ts`.

## Tailwind v4 variant syntax (canonical form)

This repo is **Tailwind v4**. Prefer v4 canonical shorthand over verbose v3 forms. Checked in CI via `tailwind-lint` (`bun run ai:tw` and `bun run ai:tw -- --fix`).

## State-layer tokens

`--state-hover`, `--state-pressed`, and `--state-selected` are transient interactive overlays distinct from persistent opacity. See `.agents/skills/ui-styling/REFERENCE.md` for details.
