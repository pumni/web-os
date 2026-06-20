# 0016. Glass Sheen Removal & Dark-Blur Tune

- **Status:** Accepted
- **Date:** 2026-06-21
- **Owner:** Design system / `@pumni/ui`

## Context

ADR-0014 settled the glassmorphism visual treatment as a **6-element model**: tint,
blur+saturate, edge pair, inner diagonal sheen, drop shadow, and opaque fallback.
The sheen (`--glass-sheen`, a `background-image: linear-gradient(135deg, ...)`
layered over the APCA-gated tint) was a decorative highlight simulating light
catching the upper-left of the glass panel.

A mid-2026 review of the glassmorphism treatment against authoritative sources
(MDN/Filter Effects L2 spec, Josh Comeau's "Next-level frosted glass",
UXPilot, Figr, Chrome Developers) found that the sheen is **not part of the
canonical glassmorphism formula**. The "final 10%" recipe all sources agree on is:

1. Semi-transparent fill (tint)
2. `backdrop-filter: blur() saturate()` (frost + vibrancy)
3. A semi-transparent border (edge highlight)
4. An inset top highlight (specular rim)
5. A directional drop shadow (delineation)

Pumni already carries items 1-5 via `--glass-tint`, `--glass-blur`/`--glass-saturate`,
`--glass-edge`, the `--glass-highlight`/`--glass-shadow-edge` rim pair, and
`--shadow-glass`. The sheen is a **sixth, extra element** unique to Pumni.

The cost of keeping the sheen is disproportionately large for a decorative
layer:

- **1 extra CSS custom property** (`--glass-sheen`) in both `:root` and `.dark`.
- **2 `background-image` declarations** in `glass-panel`/`glass-window`.
- **1 nested-glass CSS soft-guard** (`.glass-panel .glass-panel { background-image: none }`)
  that exists solely to prevent the sheen from compounding on stacked glass — a
  rule that's conflated with the real ≤2-layer perf discipline (backdrop-filter
  render-pass cost), making both harder to reason about.
- **2 `background-image: none` resets** in `prefers-contrast: more` and its
  a11y-preview mirror — they only neutralise the sheen; without the sheen they
  are dead code.
- **1 entire drift-guard test file** (`glass-sheen.test.ts`, 4 describe blocks)
  protecting a decorative token from being silently dropped — test surface that
  would be zero if the token didn't exist.
- **~20 documentation references** across ADR-0014, ADR-0015, ADR-0012, ADR
  README, MEMORY.md, design-system.md, the ui-styling skill, the glass-playground,
  and the footer checklist — all tracking the sheen as a named model element.

Separately, the dark-mode glass blur was identical to light mode (both 12px).
Dark backdrops read muddier at low blur because dark surfaces absorb more of the
frosted light; iOS/visionOS dark glass uses a heavier frost for this reason.
The ADR-0014 sweet spot (8–16px) has room for a per-theme step: dark at 16px
(`--blur-glass-lg`) is still inside the perf-safe range and gives a noticeably
richer glassmorphism read on dark.

## Decision

**1. Remove the inner diagonal sheen (6 → 5 element model).** Drop
`--glass-sheen`, its `background-image` gradient from `glass-panel`/`glass-window`,
the nested-glass soft-guard block, the two `background-image: none` resets in
a11y fallbacks, and the `glass-sheen.test.ts` drift-guard file. The model becomes:

1. Tint — translucent fill, APCA-gated.
2. Blur + saturation — frosted vibrancy.
3. Edge pair — luminous border + volumetric rim (highlight/shadow-edge).
4. Drop shadow — directional float delineation.
5. Opaque fallback — solid surface when blur/transparency is unavailable.

**2. Dark-mode blur tune: 12px → 16px.** Add `--glass-blur: var(--blur-glass-lg)`
(16px) in `.dark`, overriding the `:root` default of 12px. Rationale: dark backdrops
absorb frosted light, so the heavier frost restores the glassmorphism read.
Still inside the ADR-0014 8–16px sweet spot; APCA and perf gates verify.

**3. Rename the nested-glass discipline.** The ≤2-layer rule remains (each glass
element forces a separate backdrop render pass), but it is now enforced as a
doc/skill rule with a perf rationale (render-pass cost), not a CSS soft-guard
that dropped the sheen. The wording in the glass-performance test comment,
the ui-styling skill, and the design-trends page is updated accordingly.

**4. No public API change.** `glass-*` utility names, `GlassSurface` variants,
`Card variant="glass"`, and all semantic token names stay the same. Token tier
count stays three. APCA gate thresholds are untouched.

## Consequences

**Positive:**

- The glass model is now the canonical 5-element formula shared by all
  authoritative sources — easier to teach, onboard, and reason about.
- One fewer CSS custom property, two fewer `background-image` declarations, no
  nested-glass soft-guard, two fewer a11y dead-code lines, one fewer test file,
  and ~20 fewer documentation references tracking a decorative element.
- The ≤2-layer perf discipline is clearer: it's about render-pass cost, not about
  a sheen that happened to compound.
- Dark glass reads richer (16px frost) without leaving the perf-safe range.

**Negative / costs:**

- The glass loses one subtle decorative highlight (the diagonal 135° white sheen).
  The edge pair + `saturate(1.4)` vibrancy + directional shadow still deliver a
  convincing glassmorphism read — this is the canonical formula — but the
  "extra polish" of the sheen is gone.
- Any future desire to add a decorative highlight must go through ADR, not a
  silent re-addition.

**Neutral:**

- ADR-0014 is **amended** (not superseded): its structural decisions (rim pair,
  vibrancy, perf discipline, APCA gate authority, fallback paths) all stand.
  Only the visual treatment narrows from 6 to 5 elements.
- Token tier count, public API names, drift-guard count, and fallback path
  structure are all unchanged.

## Implementation record

Landed 2026-06-21. Changes:

| What | Before | After |
|---|---|---|
| Glass model | 6-element (ADR-0014) | 5-element |
| `--glass-sheen` | `oklch(1 0 0 / 0.1)` light, `oklch(1 0 0 / 0.06)` dark | Removed |
| `background-image` in panel/window | Sheen gradient | Removed |
| Nested-glass soft-guard | `.glass-panel .glass-panel { background-image: none }` | Removed |
| `background-image: none` in contrast a11y | 2 declarations neutralising sheen | Removed (dead code) |
| `glass-sheen.test.ts` | 4 describe blocks, drift guard for sheen | Deleted |
| `--glass-blur` (dark) | `var(--blur-glass)` (12px) | `var(--blur-glass-lg)` (16px) |
| Drift guards | 5 (sheen, rim, saturate, performance, contrast) | 4 (rim, saturate, performance, contrast) |
| `glass-performance.test.ts` comment | "CSS soft-guard drops the sheen" | "doc/skill rule, render-pass cost" |

Code gate: `bun run lint` (0 errors), `bun run typecheck` (9/9 pass),
`bun run test` (282/282 pass, all 4 remaining glass drift guards green).

## Alternatives considered

- **Keep the sheen.** Rejected: it's not in the canonical formula, and it
  carries a complexity budget (token + CSS + soft-guard + test + docs) that's
  disproportionate for a decorative layer.
- **Make sheen opt-in (e.g. `glass-panel-sheen`).** Rejected: adds a new public
  API surface + a new variant + drift-guard surface for a decorative effect that
  the canonical formula doesn't include. If a future need arises, ADR can add it.
- **Dark blur at 20px or 24px.** Rejected: ADR-0014 explicitly capped at 16px
  (`--blur-glass-lg`) as the upper sweet-spot bound; 20/24px would contradict the
  perf hardening rationale.
- **Drop the ≤2-layer rule along with the soft-guard.** Rejected: the render-pass
  cost rationale is independent of the sheen; three stacked `backdrop-filter`
  elements still compound per-pixel blur and tank mobile FPS.

## References

- `packages/ui/src/styles/glass.css` — sheen gradient, soft-guard, a11y resets
  removed; header comment updated to 5-element model.
- `packages/ui/src/styles/theme.css` — `--glass-sheen` token removed from both
  `:root` and `.dark`; `--glass-blur` overridden to `--blur-glass-lg` in `.dark`.
- `apps/web/src/test/design-system/glass-sheen.test.ts` — deleted.
- `apps/web/src/test/design-system/glass-performance.test.ts` — comment updated.
- `apps/web/src/features/design-trends/glass-playground.tsx` — sheen toggle
  removed; model heading 6→5; nested caption updated; generated code updated.
- `apps/web/src/features/design-trends/footer-checklist.tsx` — stacked-limit
  wording updated.
- `apps/web/src/app/(app)/design-system/showcase.tsx` — prose updated.
- `docs/adr/0014-glassmorphism-surface-treatment.md` — amended by this ADR.
- `docs/adr/0015-glass-card-backdrop-requirement.md` — supplemented by this ADR.
- [Josh Comeau — "Next-level frosted glass with backdrop-filter"](https://www.joshwcomeau.com/css/backdrop-filter/) — canonical 5-element formula.
- [MDN — backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter) — spec reference.
- [UXPilot — "12 Glassmorphism UI Features, Best Practices"](https://uxpilot.ai/blogs/glassmorphism-ui) — mid-2026 best practices.
