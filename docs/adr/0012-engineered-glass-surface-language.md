# 0012. Surface Visual Language (consolidated)

- **Status:** Accepted
- **Date:** 2026-06-20 (consolidated 2026-06-22)
- **Owner:** @pumni/ui design system

## Context

The surface identity (glass vs solid) went through nine same-week ADRs
(0012–0020, 2026-06-20/21) as the visual treatment was tuned. Recording each
reversible CSS-token change as its own immutable ADR violated the ADR bar
(`docs/adr/README.md`) and triple-logged every tweak (ADR file + README index
+ MEMORY.md). This ADR consolidates the *durable* decision; the token values
themselves live in `docs/conventions/design-system.md`, which is the single
source of truth and may change without a new ADR.

## Decision

- **Glass = floating layers only**, over a colourful backdrop; **solid
  (`surface-raised`) = dense content and flat backgrounds.** Banned: glass for
  forms/long text/tables.
- **APCA contrast gate is authoritative** — every surface must keep a single
  readable fill/border pair regardless of visual layering.
- **Composition primitives** (`Card`, `CardWell`, `Badge`, `IconBadge`,
  layout-only `BentoGridItem`) are the only sanctioned surface consumers;
  ad-hoc surfaces are blocked by `pumniNoAdHocSurface`.
- **Token values, the 5-element model, the border-consumption flow, blur/perf
  budgets, and drift guards are owned by `docs/conventions/design-system.md`.**
  Changing a token value is a doc edit, NOT a new ADR.

## Consequences

- One ADR instead of nine; design-token churn no longer mints ADRs.
- `design-system.md` + the CSS drift guards (`glass-rim`, `glass-performance`,
  `border-consumption`) are the enforcement plane.

## Alternatives considered

- Keep nine ADRs with status transitions. Rejected: they are reversible
  cosmetic decisions, not architecture; the bookkeeping cost outweighs the
  archaeology value (git retains the originals).

## Superseded micro-ADRs (archaeology)

Folded here (see git history for full text):
0013 card composition primitives · 0014 glassmorphism treatment ·
0015 glass backdrop precondition · 0016 sheen removal + dark blur ·
0017 bento container query · 0018 unify surface-rim-top ·
0019 border consumption flow · 0020 solid cards drop specular rim.
