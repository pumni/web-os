# 0017. Bento Container-Query Responsive & Subgrid Deferral

- **Status:** Accepted
- **Date:** 2026-06-21
- **Owner:** Design system / `@pumni/ui`

## Context

`BentoGrid` (ADR-0013 made `BentoGridItem` layout-only) sized its column
collapse with **viewport breakpoints** (`grid-cols-1 sm:grid-cols-6
lg:grid-cols-12`), and the tier spans (`hero`/`feature`/…) used matching
`sm:`/`lg:` variants. That works for a bento laid out at the full page width,
but the Pumni OS shell places grids inside containers that are narrower than the
viewport: sidebars, dialogs, sheets, and resizeable OS `Window` surfaces. There
a viewport breakpoint lies — a 12-column grid keeps rendering 12 columns inside
a 320px-wide window and the tiles crush.

This is the failure mode every mid-2026 bento source flags: a bento must respond
to its **own** width, not the window's. CSS container queries (`@container`)
and CSS subgrid both reached Baseline "Widely available" by 2024 (Chrome 117+,
Safari 16, Firefox 71 — ~95% global), so no fallback strategy is needed for the
modern target.

Two techniques were on the table for this round:

1. **Container queries** — make `BentoGrid` a named container and collapse
   1 → 6 → 12 by its own width. Solves the sidebar/dialog/Window crushing
   directly.
2. **Subgrid** — let `BentoGridItem` inherit the grid's column tracks so the
   inner header (icon / title / description) and body of every tile in a row
   align to the same baselines.

## Decision

**1. Adopt container queries for `BentoGrid`.** A **named** container
(`@container/bento`) wraps the grid, and the grid (its descendant) collapses on
that wrapper's width. The container must be the wrapper, not the grid element
itself: CSS never lets an element respond to its own container query — a
container only restyles its descendants by size — so a self-querying grid would
silently stay at its base 1-column layout while the tile spans (which _are_
descendants) kept spanning 6/12, crushing every tile into one column. The grid
collapses:

- `< 40rem`: 1 column
- `≥ 40rem`: 6 columns
- `≥ 64rem`: 12 columns (or 6 when `columns={6}`)

The thresholds deliberately match the legacy `sm`/`lg` viewport breakpoints
(640px / 1024px), so every full-width consumer renders identically to before;
only nested/narrow placements improve. `BentoGridItem` is itself a `@container`,
so tile spans use the **named** `@[…]/bento:` prefix to pin every span to
`BentoGrid`'s width — an unnamed `@[]` would query the nearest container (the
item) and desync from the grid's active column count.

**2. Defer subgrid.** Do not adopt subgrid for tile-internal alignment yet. The
benefit (baseline-aligned titles across a row) is small next to the cost:
`Card` would have to expose a `display: grid` with `grid-template-columns:
subgrid`, `BentoGridItem` would need its header/body slots to be grid items, and
the change ripples through every `Card` consumer (dialogs, forms, the showcase
visual contract, the dashboard) — all for a cosmetic alignment that the current
flex layout already handles acceptably. Re-open when a real alignment
requirement (e.g. a dense metric wall where ragged titles are a visible defect)
makes the refactor pay for itself.

## Consequences

**Positive:**

- A bento inside any narrow container (sidebar, dialog, OS `Window`) now
  collapses correctly instead of crushing its tiles — the real mid-2026
  responsive promise, exercised by the same code path production takes.
- The `BentoSimulator` no longer needs to fake responsive behaviour by clamping
  a viewport width; clamping its container width directly drives the
  container-query collapse, so the simulator demonstrates the real mechanism.
- Named-container spans (`@[…]/bento:`) keep tile spans in lock-step with the
  grid's column count regardless of nesting — the desync bug class is closed by
  construction.

**Negative / costs:**

- One more concept to teach: container-query variants (`@[…]/bento:`) replace
  the familiar `sm:`/`lg:` in `BentoGrid` and its tier variants. The
  `BentoSimulator` badges and notes carry the new labels.
- Container queries are evaluated against the container's content box, so a
  grid whose container has heavy padding could cross a threshold slightly
  differently than the equivalent viewport breakpoint would have. The threshold
  match (40rem/64rem) keeps this imperceptible for full-width consumers.

**Neutral:**

- No public API name changes (`BentoGrid`, `BentoGridItem`, `tier`, `columns`,
  `rowHeight`, `dense` all stand). The responsive mechanism is internal.
- `BentoGridItem`'s own `@container` (item-internal, currently unused by an
  `@[]` consumer) is left in place — it is a defensive hook, not a conflict,
  and the named-container prefix routes around it regardless.

## Alternatives considered

- **Keep viewport breakpoints.** Rejected: the sidebar/dialog/Window crushing is
  a real defect, and container queries are the mid-2026-standard fix (Baseline
  widely available, Tailwind v4 built-in). Keeping `sm:`/`lg:` leaves the bug.
- **Unnamed container queries (`@[40rem]` without `/bento`).** Rejected: because
  `BentoGridItem` is also a `@container`, an unnamed query inside a tile would
  resolve to the *item*, not the grid — tiles would span against their own width
  and desync from the column count. The named prefix is required for
  correctness, not style.
- **Adopt subgrid now.** Rejected: the refactor touches `Card` (every consumer),
  breaks the showcase visual contract, and buys baseline-aligned titles — a
  cosmetic win the current flex layout already covers acceptably. Defer until a
  concrete dense-layout requirement makes it pay.
- **Per-container breakpoint props.** Rejected: would push responsive policy
  onto every consumer. Fixed thresholds matching `sm`/`lg` keep full-width
  consumers identical and let nested placements "just work".

## References

- `packages/ui/src/components/os/bento-grid.tsx` — `@container/bento` grid +
  named `@[…]/bento:` tier spans.
- `apps/web/src/features/design-trends/bento-simulator.tsx` — badges/notes
  updated to container-query labels.
- `docs/adr/0013-card-composition-primitives.md` — `BentoGridItem` layout-only.
- [Can I Use — CSS subgrid](https://caniuse.com/css-subgrid) — Baseline widely
  available (~95%, Chrome 117+ / Safari 16 / Firefox 71).
- [Baseline — web.dev](https://web.dev/baseline) — container queries + subgrid
  status.
- [Bento grid layout with CSS Grid and Container Queries — iamsteve.me](https://iamsteve.me/blog/bento-layout-css-grid)
  — container-query bento rationale.
