# 0014. Glassmorphism Surface Treatment

- **Status:** Accepted (glass visual treatment amended by [ADR-0016](0016-glass-sheen-removal-and-dark-blur-tune.md))
- **Date:** 2026-06-20
- **Owner:** Design system / `@pumni/ui`

> **Amended by [ADR-0016](0016-glass-sheen-removal-and-dark-blur-tune.md):** the inner
> diagonal sheen (`--glass-sheen`, `background-image` gradient) was removed as it is
> not part of the canonical 5-element glassmorphism formula. The nested-glass CSS
> soft-guard that existed solely to drop the sheen was also removed; the ≤2-layer
> discipline remains as a doc/skill rule (render-pass cost). Dark blur was tuned
> 12px → 16px. The structural decisions in this ADR (rim pair, vibrancy, perf
> discipline, APCA gate, fallback paths) all **stand**.
>
> **Rim token renamed by [ADR-0018](0018-unify-surface-rim-top.md):** the top rim
> token this ADR calls `--glass-highlight` is now `--surface-rim-top`, unified with
> the solid-card rim (`--card-rim-top`, deleted) so glass and solid share one
> calibrated lit-top-edge value. The bottom rim (`--glass-shadow-edge`) is
> unchanged (glass-only). Token names in the body below are the historical 0014
> names; read them through that lens.
>
> **Solid half reversed by [ADR-0020](0020-solid-cards-drop-specular-rim.md):** the
> "glass and solid share one calibrated lit-top-edge value" above no longer holds
> on solid — `surface-raised` dropped the rim so solid cards are structural-only.
> `--surface-rim-top` is glass-owned again (the shared seam lives on in name only).
> The glass visual treatment in this ADR stands unchanged.

## Context

ADR-0012 moved the glass layer **away** from iOS/visionOS frosted vibrancy toward
"engineered dark-glass": low blur (12px), `saturate(1.05)` (no vibrancy pump), a
thin neutral fill, and a bright-top/dark-bottom rim pair. In review the owner
found that the engineered glass read flat and muddy — especially the
`/design-system` "Surface Primitives" demo, where glass was even rendered on a
flat opaque card with no backdrop to refract, so it looked like washed-out grey
boxes.

The owner's decision: the reusable glass layer should follow **modern
glassmorphism** — frosted blur, vibrant backdrop refraction, a luminous light
border, and an inner sheen — and the naming should reflect that (not the
"engineered dark-glass" framing).

Scope was settled explicitly: **only the reusable glass layer** in `@pumni/ui`
(`Card variant="glass"`, `GlassSurface`, `glass-*`). **Content cards stay solid**
— ADR-0012's structural decisions (solid cards carry real elevation, glass only
for floating layers, OS shell presentational/de-Appled, the APCA gate
authoritative, a11y fallbacks intact) are **kept**. This ADR amends only the
*visual treatment* of glass.

Hard constraints that bound the treatment:

- The APCA gate (`glass-contrast.test.ts`) parses `--glass-tint` and
  `--glass-edge` as **single colours** composited over the desktop blobs (text
  ≥ Lc 50 light / 60 dark; UI edge ≥ Lc 25). Neither token may become a gradient.
- A pure-light border fails the Lc 25 UI-edge gate on a light surface (ADR-0012
  already hit this), so the luminous border read must come from an ungated
  specular highlight, not from `--glass-edge`.
- `glass-saturate.test.ts` requires every `saturate()` in `glass.css` to read
  `var(--glass-saturate)` (no numeric literal).

## Decision

Reframe the glass layer as **glassmorphism** and carry the look with frosted blur
+ vibrancy + a luminous highlight + an inner sheen + a volumetric rim pair —
layered so the APCA gate still reads single fill/border colours.

**1. Frosted + vibrant (`tokens.css`).** `--glass-saturate` 1.05 → **1.4**
(the vibrancy that makes the blurred backdrop read richer — the glassmorphism
signature). Blur stays in the 8–16px range (`--blur-glass-sm/lg` 8/16) per
ADR-0012's mobile-safety reasoning — bumping to 20/24 would raise GPU cost on
mid-tier devices with no visual payoff at the `saturate(1.4)` vibrancy level.

**2. Luminous edge pair (`theme.css`).** The rim tokens carry glassmorphism
vocabulary — `--glass-highlight` (bright top, light 0.6 / dark **0.30**) and
`--glass-shadow-edge` (dark bottom, light 0.06 / dark 0.22). The bottom rim
was **0** in ADR-0012 (dropped); it returns here as the second half of a
top-lit / bottom-shaded volumetric cut-edge pair. `--glass-edge` stays the gated
structural definition line.

**3. Inner sheen (`theme.css` + `glass.css`).** A `--glass-sheen` token (a
faint white, light `oklch(1 0 0 / 0.1)` / dark `oklch(1 0 0 / 0.06)`) is
layered as `background-image: linear-gradient(135deg, var(--glass-sheen),
transparent 42%)` over the gated `--glass-tint` in `glass-panel`/`glass-window`.
The gradient is a separate layer the gate does not read, so the gate still
composites the solid `--glass-tint`. Shell chrome (`glass-bar*`,
`glass-titlebar`) does **not** carry the sheen — it must read as a flat flush
surface against the viewport edge.

**4. Performance discipline (ADR-0014 perf).**
- `will-change` is **not** set on static glass (memory cost with no benefit);
  it is scoped to overlay open/close transitions (`[data-state=open|closed]`)
  via a separate rule in `glass.css`. Base glass composites via the cheap
  `translateZ(0)` layer promotion.
- Stacked glass is capped at 2 layers. A CSS soft-guard drops the sheen
  (`background-image: none`) on a glass panel nested inside another glass
  panel/window so a third layer never pays the recursive backdrop-filter cost.
  Guarded by `glass-performance.test.ts`.

**5. Naming (`showcase.tsx` + docs).** Fixed the mislabelled "Glass Card
(Default)" (the Card default is `solid`, not glass) and reframed copy from
"engineered" to "glassmorphism"; the demo glass now sits over a blob backdrop so
it reads as glass. Docs (`design-system.md`, the ui-styling skill) and this ADR
move the framing from "engineered dark-glass" to "glassmorphism".

Public utility/variant names (`glass-panel/bar/window/titlebar`, `GlassSurface`
variants, `Card variant="glass"`) are **kept** — they are used across ~34 files,
already read as "glass", and renaming them would be churn without benefit.

## Consequences

**Positive:**

- The glass layer reads as modern glassmorphism (frosted, vibrant, luminous
  border, inner sheen, volumetric rim pair) over a backdrop, fixing the muddy
  engineered look.
- The luminous border is carried by the ungated `--glass-highlight`, so the
  glassmorphism edge ships without weakening the APCA UI-edge gate.
- Vibrancy remains one knob (`--glass-saturate`), still locked by the drift test.
- `will-change` scoping reduces GPU memory on pages with many static glass
  surfaces (e.g. open sidebar + topbar + pinned window).
- Stacked-glass CSS soft-guard + test prevent the recursive blur bottleneck.

**Negative / costs:**

- `saturate(1.4)` costs more GPU than the engineered 1.05 — acceptable because
  glass is restricted to floating layers (ADR-0012), not large backgrounds.
- Glass now visibly needs a backdrop to read; on a flat opaque surface it looks
  weak. Demos/usages must float it over the desktop blobs (the showcase backdrop
  pattern), not nest it on a solid card.
- `--glass-sheen` and `--glass-shadow-edge` are new tokens a rebrand project
  may want to set; they default sensibly if left alone.

**Neutral:**

- Token tier count stays three; `--glass-sheen`/`--glass-highlight`/
  `--glass-shadow-edge` are semantic (Tier 2), blur/saturate are Tier 1.
- ADR-0012 is **amended, not superseded**: its solid-card elevation, de-Appled OS
  chrome, glass-only-for-floating discipline, and gate authority all stand. Only
  the glass *visual treatment* changes.

## Implementation record

Landed 2026-06-20. Actual values shipped:

| Token | Light | Dark | Note |
|---|---|---|---|
| `--glass-tint` | `neutral-0 54%` | `neutral-900 34%` | Unchanged (APCA-gated) |
| `--glass-edge` | `oklch(1 0 0 / 0.45)` | `oklch(1 0 0 / 0.14)` | Unchanged (ungated) |
| `--glass-highlight` | `oklch(1 0 0 / 0.6)` | `oklch(1 0 0 / 0.3)` | Dark bumped 0.22→0.30 |
| `--glass-shadow-edge` | `oklch(0 0 0 / 0.06)` | `oklch(0 0 0 / 0.22)` | **New** — bottom rim |
| `--glass-sheen` | `oklch(1 0 0 / 0.1)` | `oklch(1 0 0 / 0.06)` | **New** — inner diagonal |
| `--glass-blur` | 12px | 12px | Kept (not 16 as originally proposed) |
| `--glass-saturate` | 1.4 | 1.4 | Bumped 1.05→1.4 |
| `will-change` | scoped to `[data-state]` | scoped to `[data-state]` | **Removed** from static base |

Blur was kept at 8/12/16 (not the originally proposed 10/16/24) because the
`saturate(1.4)` vibrancy already delivers the glassmorphism signature; raising
blur to 24px would contradict the performance-hardening goal for `strong` mode.

Drift guards added: `glass-sheen.test.ts`, `glass-rim.test.ts`,
`glass-performance.test.ts`.

## Alternatives considered

- **Keep engineered dark-glass; only fix the showcase backdrop.** Rejected: the
  owner wants the glass *look* to be glassmorphism, not just a better demo. The
  muddy read came from the treatment (low blur, no vibrancy, thin neutral fill),
  not only the missing backdrop.
- **Make `--glass-tint`/`--glass-edge` gradients for the glassmorphism look.**
  Rejected: the APCA gate parses them as single colours; a gradient breaks the
  gate parser and the fallbacks. The sheen is added as a separate `background-
  image` layer instead.
- **Brighten `--glass-edge` to a pure-light glassmorphism border.** Rejected
  for light mode: a near-white border fails the Lc 25 UI-edge gate on a light
  surface (the ADR-0012 finding). The luminous edge is delivered by the ungated
  `--glass-highlight` specular inset instead.
- **Rename the public `glass-*` / `GlassSurface` / `Card variant` API to a
  "glassmorphism" namespace.** Rejected: ~34-file ripple across overlays and
  features for names that already read as "glass". Only the internal rim tokens
  were renamed.
- **Bump blur to 16/24px.** Rejected: `saturate(1.4)` already gives the frosted
  vibrancy; 24px at `strong` would raise mobile GPU cost for marginal visual
  gain. The 8–16px sweet spot (ADR-0012 comment) is kept.

## References

- `packages/ui/src/styles/tokens.css` — `--blur-glass*`, `--glass-saturate`.
- `packages/ui/src/styles/theme.css` — `--glass-highlight` / `--glass-shadow-edge`
  / `--glass-sheen` (new rim-pair + sheen tokens), `--glass-tint` / `--glass-edge`.
- `packages/ui/src/styles/glass.css` — sheen `background-image` layer, the
  volumetric rim-pair insets, `will-change` scoping, nested-glass soft guard,
  a11y-fallback neutralisation (`background-image: none` under `contrast: more`).
- `apps/web/src/test/design-system/glass-contrast.test.ts` — APCA gate (unchanged
  thresholds; text Lc 50/60 over desktop blobs, edge presence-only).
- `apps/web/src/test/design-system/glass-saturate.test.ts` — drift guard for the
  tokenized `--glass-saturate`.
- `apps/web/src/test/design-system/glass-sheen.test.ts` — drift guard for the
  inner sheen (panel/window carry, shell chrome does not, `contrast: more`
  neutralises it).
- `apps/web/src/test/design-system/glass-rim.test.ts` — drift guard for the
  volumetric rim pair (`--glass-highlight` + `--glass-shadow-edge` on both
  panel/window, dark rim stronger than light).
- `apps/web/src/test/design-system/glass-performance.test.ts` — perf guard:
  no animate `backdrop-filter`, `will-change` scoped to overlays, stacked-glass
  CSS soft guard.
- `apps/web/src/app/(app)/design-system/showcase.tsx` — glass demos over a
  backdrop; fixed labels.
- `docs/adr/0012-engineered-glass-surface-language.md` — the surface decisions
  this ADR amends (visual treatment only).
