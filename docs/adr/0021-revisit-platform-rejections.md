# 0021. Revisit ADR-0010 Rejections — Component Catalog + DTCG Token Export

- **Status:** Accepted
- **Date:** 2026-06-30
- **Owner:** Design system / `@pumni/ui`

> Numbering note: ADR numbers 0014–0020 were the same-week glass micro-ADRs
> consolidated into ADR-0012 (removed from tree 2026-07 — see git) and are **burned** (never reused, per
> `docs/adr/README.md`). This revision takes the next free number, 0021.

## Context

ADR-0010 turned `@pumni/ui` into a reusable OS skeleton and **deliberately
rejected** three blueprint items as "enterprise tax for our context", each gated
on a future trigger:

- **Storybook** — "re-open when a second human consumer of the component library
  exists."
- **Style Dictionary / DTCG / Figma pipeline** — "pays off only with a designer
  authoring Figma Variables and multiple brands."
- **WCAG 2.x** — APCA was chosen as the sole contrast standard.

The multi-project goal ADR-0010 was written for is now being acted on: we want a
visual surface to review `@pumni/ui` in isolation, and a machine-readable token
artifact a second project (or a design tool) can consume — **ahead of** waiting
for the trigger, as a deliberate investment. Per `docs/adr/README.md`, a rejected
decision is revised by a *new* ADR that references the old one, not by editing
ADR-0010 in place.

**WCAG is explicitly NOT revisited.** Pumni OS stays APCA-only; the
`glass-contrast` gate and the "do not add a WCAG 2.x ratio gate" rule in
`docs/conventions/design-system.md` remain authoritative and unchanged. This ADR
reopens only the Storybook and DTCG rejections.

## Decision

**1. Add a component catalog (reopens ADR-0010's Storybook rejection).**
Ship a catalog app under `apps/` that renders `@pumni/ui` components in isolation
with the real token cascade, theme toggle, and `PersonalizationProvider`
(accent / glass / density). Tooling is chosen by a short spike — **Storybook 10**
(Vite-native, integrated with Tailwind v4) was chosen after the implementation
spike for its robust ecosystem and mature React 19 support. Stories are **representative,
not exhaustive** (a seed set covering each surface family), and the catalog adds
**no CI gate** — it must not become a second app the team is obligated to keep
green.

**2. Generate DTCG token JSON *from* the CSS (reopens the Style Dictionary
rejection, narrowly).**
Hand-authored OKLCH CSS in `packages/ui/src/styles/*` **stays the single source
of truth.** A script (`packages/ui/scripts/export-dtcg.ts`) parses those files
and emits a DTCG-format `tokens.dtcg.json`; a drift test regenerates and compares
so the JSON can never silently diverge from the CSS. We do **not** invert
authorship to JSON or adopt the full Style Dictionary build/transform pipeline —
only the additive, downstream export it enables.

## Consequences

**Positive:**
- A second project / design tool can consume tokens as standard DTCG JSON without
  reading our CSS.
- The component library has a visual contract surface, not only test gates.
- Both moves are additive and non-gating; nothing in the existing APCA cascade,
  drift guards, or build is weakened.

**Negative / costs:**
- The catalog is a second app to keep building (but intentionally not tested),
  and its stories must be maintained as components evolve.
- `tokens.dtcg.json` is a generated artifact that must be regenerated on token
  edits; the drift test enforces this but adds one step to a token change.

**Neutral:**
- Token tiers stay at three; CSS remains SSOT. No Figma pipeline, no JSON
  authoring, no WCAG gate.

## Alternatives considered

- **Keep the rejections until the trigger fires.** Rejected: the multi-project
  investment is being made now; deferring leaves the skeleton without the two
  artifacts a second consumer needs.
- **Author tokens in DTCG JSON and generate CSS (full Style Dictionary).**
  Rejected: inverts the SSOT and imports the pipeline's build/maintenance cost
  ADR-0010 declined; the CSS-authored OKLCH values stay the human-edited source.
- **Storybook 10 over Ladle.** Following the implementation spike, Storybook
  was selected for its mature ecosystem and better integration with React 19.
- **Re-add WCAG 2.x alongside APCA.** Rejected: APCA is the standing single
  contrast standard (ADR-0010 + `design-system.md`); this ADR does not change it.

## References

- `docs/adr/0010-frontend-platform-foundation.md` — the ADR whose Storybook and
  DTCG rejections this revises (WCAG rejection left intact).
- `docs/conventions/design-system.md` — APCA-only contrast policy (unchanged).
- `packages/ui/scripts/lib/token-css.ts` — shared CSS-token parser the DTCG
  export builds on.
