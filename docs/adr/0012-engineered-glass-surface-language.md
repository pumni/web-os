# 0012. Surface Visual Language (consolidated)

- **Status:** Accepted (amended 2026-07-05 per 2026 trend alignment)
- **Date:** 2026-06-20 (consolidated 2026-06-22 · amended 2026-07-05)
- **Owner:** @pumni/ui design system

## Context

The surface identity (glass vs solid) went through nine same-week ADRs
(0012–0020, 2026-06-20/21) as the visual treatment was tuned. Recording each
reversible CSS-token change as its own immutable ADR violated the ADR bar
(`docs/adr/README.md`) and triple-logged every tweak (ADR file + README index
+ MEMORY.md). This ADR consolidates the *durable* decision; the token values
themselves live in `docs/conventions/design-system.md`, which is the single
source of truth and may change without a new ADR.

### 2026 alignment review (2026-07-04)

A pass against seven 2026 glassmorphism references (Orizon's *"Glassmorphism
in 2026: How to Use Frosted Glass Without Killing UX"* Feb 2026; UX Pilot's
*"12 Glassmorphism UI Features, Best Practices, and Examples"* citing Apple
iOS 26 / macOS Tahoe; MDN `backdrop-filter` baseline 2024; CSS-Tricks;
dev.to; Kreativa *"Glassmorphism Web Design: What B2B Brands Should Know"*
Jun 2026; Stack Overflow blur perf thread) found four drift points where
the consolidated ADR's choices fell behind the 2026 consensus:

1. **`--glass-edge` was not mode-adaptive.** Same pure-white hairline in
   both light and dark mode. UX Pilot 2026 explicitly recommends
   *"In light mode, glass needs stronger boundaries … slightly higher
   opacity or a touch more blur"* and *"In dark mode, swap to …
   neutral-gray highlights or a subtle colored rim (navy, violet, teal)
   instead of pure white"* to avoid harsh glow. The ADR-0016 choice
   (uniform white hairline in both modes) collapsed toward invisible on
   near-white light backdrops and glowed harshly on dark.
2. **Glass border was exempt from the APCA gate.** ADR-0014 rescoped the
   Lc 25 border gate to solid surfaces only because a 0.45-alpha white
   edge cannot clear Lc 25 over a light backdrop. The 2026 references
   (Orizon rule #7, UX Pilot, Kreativa) all reassert that a border helps
   the brain *"lock onto boundaries"* — the exempt was a workaround, not
   a decision. Raising the light-mode alpha and switching dark mode to a
   colored rim lets the Lc 25 gate apply to glass too.
3. **Corner-shine / directional rim was banned outright (ADR-0016 sheen
   removal).** Apple Liquid Glass, which UX Pilot cites as the 2026
   reference, carries a *specular edge highlight along the side facing
   the light source* — directional, not uniform. Banning it entirely
   removed a legitimate hero/showcase technique. Production bulk list
   cards still shouldn't carry it (visual noise), but a single
   hero/showcase card per surface should be allowed.
4. **Blur floor sat at 8px.** UX Pilot recommends `blur(4–6px)` as the
   subtle baseline and flags `>20px` as GPU-heavy. The 8–16px range is
   defensible as a "frosted" stylistic choice (Pumni wants frosted, not
   tinted), but the ADR did not document this rationale, leaving readers
   to assume 8px was the universal 2026 floor.

This amendment records the alignment decisions below. Token value changes
land in `theme.css` / `design-system.md` (the SSOT) without a new ADR — this
ADR edit only captures the *why*.

## Decision

- **Glass = floating layers only**, over a colourful backdrop; **solid
  (`surface-raised`) = dense content and flat backgrounds.** Banned: glass for
  forms/long text/tables.
- **APCA contrast gate is authoritative** — every surface must keep a single
  readable fill/border pair regardless of visual layering. **(Amended
  2026-07-04)** The Lc 25 border gate now applies to glass surfaces in
  *both* modes, not just solid. This is enabled by the mode-adaptive
  `--glass-edge` token (see amendment below) which has enough contrast to
  pass; the prior exempt was a workaround for the低-alpha white edge, not a
  design decision.
- **Composition primitives** (`Card`, `CardWell`, `Badge`, `IconBadge`,
  layout-only `BentoGridItem`) are the only sanctioned surface consumers;
  ad-hoc surfaces are blocked by `pumniNoAdHocSurface`.
- **Token values, the 5-element model, the border-consumption flow, blur/perf
  budgets, and drift guards are owned by `docs/conventions/design-system.md`.**
  Changing a token value is a doc edit, NOT a new ADR.

### Amendments (2026-07-04 alignment)

- **`--glass-edge` is mode-inverted.** UX Pilot 2026 says *"In light
  mode, glass needs stronger boundaries"* and *"In dark mode, swap to
  a colored rim, not pure white"*. A pure-white edge composites with
  the white `--glass-tint` in light mode and produces near-zero APCA
  over a bright blob — so the edge is dark-on-light / light-on-dark:
  light carries a dark neutral-blue rim, dark carries a light
  neutral-violet rim. Exact values (`oklch(0.3 0.02 260 / 0.40)`
  light, `oklch(0.9 0.03 270 / 0.50)` dark) live in `theme.css`; the
  design rule is *"rim colour is part of the mode, not a single
  constant, and is dark-on-light / light-on-dark for boundary
  contrast"*.
- **Corner-shine / directional rim is allowed for hero/showcase cards
  only.** ADR-0016's blanket sheen removal stays in force for production
  bulk list cards (uniform hairline + drop shadow), but a new
  `glass-panel[data-variant="specular"]` utility (and matching
  `Card variant="specular"`) is added for hero/showcase surfaces — cap
  one specular card per visible surface, always over a colourful backdrop.
  This aligns with Apple Liquid Glass and UX Pilot's *"rim light along
  the side facing the light source"*.
- **Blur range 8–16px is a deliberate "frosted" choice, not the 2026
  baseline.** UX Pilot 2026 cites `blur(4–6px)` as the subtle baseline.
  Pumni keeps 8–16px because the OS visual identity is "frosted glass,
  not tinted overlay" — the ADR now records that rationale. Production
  sweet spot 12px (light) / 16px (dark) stays. `>16px` remains
  GPU-heavy-banned except for the Liquid Glass refraction mask in
  `glass-2026-primitives.tsx` (showcase-only).

### Amendments (2026-07-05 alignment - Specular Stops & Gradient Tint)

- **Specular highlights are mode-adaptive (`--specular-rim-*`).** Previously, `--specular-rim-start` and `--specular-rim-mid` were hardcoded pure white, producing a harsh, synthetic glow in dark mode. We changed them to use `light-dark()`: light mode uses bright white reflections (`oklch(1 0 0 / 0.60)`), while dark mode uses a soft, light neutral-violet reflection (`oklch(0.9 0.03 270 / 0.35)`) to prevent glare on dark interfaces.
- **Glass utility background accepts gradients (`background: var(--glass-tint)`).** In `glass.css`, changed `background-color: var(--glass-tint)` to `background: var(--glass-tint)` across core glass utilities. This enables alpha-channel gradient tints (simulating physical thickness) to be passed natively.
- **Refraction / Chromatic Aberration Deleted (2026-07-05).** The Liquid Glass refraction and chromatic aberration offsets were completely deleted from both the production style sheets and the simulator playground to avoid overengineering, visual noise (blurry text), and GPU overhead.
- **Asymmetric Edge Bevels (`--glass-edge-top`/`--glass-edge-bottom`).** Implemented top-left lighting bevel using asymmetric border colors to simulate depth without GPU cost.
- **Double-Bezel Sub-Pixel Highlights (`--glass-inset-bezel-*`).** Toggled adaptive double inset highlights for sharp structural outlines (1px for light, 0.5px for dark mode).
- **Chroma-shifted Shadows.** Tuned `--shadow-glass` to carry a very subtle matching hue in dark mode (`oklch(0.05 0.005 270 / alpha)`) representing light transmission.

## Consequences

- One ADR instead of nine; design-token churn no longer mints ADRs.
- `design-system.md` + the CSS drift guards (`glass-rim`, `glass-performance`,
  `border-consumption`) are the enforcement plane.
- **(Amended 2026-07-04)** The glass-contrast test (`glass-contrast.test.ts`)
  now enforces APCA Lc 25 on `--glass-edge` over the worst-case desktop blob
  in both modes — the prior exempt for light-mode glass border is removed.
  If a future tint/edge change would re-fail the gate, fix the token, do
  not re-exempt the gate.
- **(Amended 2026-07-04)** Hero/showcase cards may carry `variant="specular"`.
  The structural hairline border is preserved; `variant="specular"` uses a `::before` conic-gradient ring overlay mask-composited over the border, rather than replacing the border-image.
- **(Amended 2026-07-05)** Specular corner highlights are mode-adaptive and soft-glowing violet in dark mode to prevent visual fatigue.
- **(Amended 2026-07-05)** `--glass-tint` natively supports CSS gradient declarations via the background shorthand.
- **(Amended 2026-07-05)** Asymmetric borders (`--glass-edge-top/bottom`) are standard and gated Lc 25 in both light and dark modes (light mode top 0.40/bottom 0.50 alpha; dark mode equal 0.55 alpha with lightness bevel 0.95/0.90 — probe-verified as the gentlest gate-passing pair). The double-bezel outline layer (`--glass-inset-bezel-outline`) is removed, leaving only the top highlight (`--glass-inset-bezel-top`) to ensure rendering stability. Dynamic refraction/chromatic aberration is banned.

## Alternatives considered

- Keep nine ADRs with status transitions. Rejected: they are reversible
  cosmetic decisions, not architecture; the bookkeeping cost outweighs the
  archaeology value (git retains the originals).
- **(Added 2026-07-04)** Mint a new ADR-0026 for the 2026 alignment
  instead of amending ADR-0012 in place. Rejected: ADR-0012 already says
  token-value changes are doc edits, not new ADRs; the alignment is
  exactly a token-value + design-rationale change. A new ADR would
  double-log the same decision. Amending in place keeps `design-system.md`
  + ADR-0012 as the single glass spec, with the amendment dated inline.

## Superseded micro-ADRs (archaeology)

Folded here (see git history for full text):
0013 card composition primitives · 0014 glassmorphism treatment ·
0015 glass backdrop precondition · 0016 sheen removal + dark blur ·
0017 bento container query · 0018 unify surface-rim-top ·
0019 border consumption flow · 0020 solid cards drop specular rim.

> **Note (2026-07-04 alignment):** ADR-0016's *"sheen removal"* clause
> is amended — the blanket ban on corner-shine is narrowed to *bulk list
> cards only*. Hero/showcase cards may now carry
> `glass-panel[data-variant="specular"]`. ADR-0016's dark-blur raise
> (16px dark vs 12px light) is unaffected and stays in force.
