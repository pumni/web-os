# 0019. Border Consumption Flow

- **Status:** Accepted
- **Date:** 2026-06-21
- **Owner:** Design system / `@pumni/ui`

## Context

A border-flow audit found that the word "border" is doing work for **three
distinct technical concepts** across `@pumni/ui`, and nothing in the codebase
names the boundary between them. The result is the exact "lệch về cấu hình từ 1
nguồn" (one concept, multiple tokens, no binding rule → silent drift) pattern
that [ADR-0018](0018-unify-surface-rim-top.md) was opened to find:

| # | Concept | Mechanism | Intent |
|---|---|---|---|
| **A** | Structural hairline | `border: 1px solid var(--token)` | A real 1px contrast boundary |
| **B** | Specular rim | `inset 0 1px 0 0 var(--token)` (box-shadow) | A light/volumetric effect — **not a real border** |
| **C** | Status tint | `border-{tone}/20` (Tailwind opacity) | State signalling (error / success / brand) |

90% of the confusion comes from readers seeing the bright top edge of a card and
calling it "the border," when it is an inset box-shadow (concept B) — the real
1px structural hairline (concept A) is a *separate* property on the same element.
ADR-0018 unified concept B's **top** rim into `--surface-rim-top` across glass
and solid; it did not touch concept A, and it left the **relationship between A
and B undocumented**. This ADR closes that gap.

There are exactly **three structural hairline tokens** in the system, and they
carry **opposing colour semantics**:

- `--border` — dark, builds contrast against the fill. Card solid/inset,
  `CardWell`. The real delineator for solid surfaces.
- `--input` — dark, one shade deeper than `--border`. Form controls (Button,
  Input, Select, Checkbox). Controls are flat, no specular rim.
- `--glass-edge` — **white** (`oklch(1 0 0 / 0.45)` light / `0.14` dark). Glass
  surfaces only. A pure-light border fails the APCA Lc 25 UI-edge gate on a light
  surface (the ADR-0012 finding), so on glass the *structural* hairline is a
  specular line and the **drop shadow** (`--shadow-glass`) is the real
  delineator. This inversion is the source of most "why does glass border look
  different" questions.

ADR-0018 already established that the **top rim** (concept B) is the one shared
seam between glass and solid. Everything else stays cleanly separated:

| | Solid card (`surface-raised`) | Glass card (`glass-panel`) |
|---|---|---|
| Structural hairline (A) | `--border` (dark, contrast) | `--glass-edge` (white, specular) |
| Top rim (B) | `--surface-rim-top` ✅ | `--surface-rim-top` ✅ — **same token** |
| Bottom rim (B) | none (deliberate) | `--glass-shadow-edge` |
| Real delineator | the hairline itself | `--shadow-glass` (drop shadow) |
| Elevation | `--shadow-card-raised` | `--shadow-glass` / `--shadow-glass-glow` |

Two drift classes the audit surfaced:

1. **Feature-layer re-invention of concept C.** The `/20` status-tint border was
   hand-rolled ~8 times across `apps/web` (`border-warning/20`, `border-primary/20`
   in `watch/`, `sky-player/`, `dashboard/`) instead of going through `Badge` or
   `Card state`. This is the same shape as the pre-ADR-0013 "10 hand-rolled
   wells" finding — a closed-set primitive exists, but consumers re-invent it.
2. **Structural-hairline opacity abuse.** `border-border/60`, `border-2`,
   `border-l-4 border-primary/60` appear in feature code, violating the
   "no `border-border/NN`" and "one `border-border`" hard rules in
   `design-system.md`. These bypass the closed token set.

## Decision

Canonize a single **border-consumption decision tree** as a hard rule. The full
tree lives in `docs/conventions/design-system.md` (P2); this ADR records the
decision and the drift guard that enforces it.

```
Need a "border" on an element?
│
├─ GLASS surface (floats over a blob/media backdrop)?
│  └─ DO NOT add a border by hand. Use a glass-* utility.
│     → structural hairline  = --glass-edge      (white, specular)
│     → top rim              = --surface-rim-top
│     → bottom rim           = --glass-shadow-edge
│     → real delineator      = --shadow-glass
│     [glass.css owns this; never write it in TSX]
│
├─ SOLID surface (content card, well)?
│  └─ Use Card variant="solid" / CardWell.
│     → structural hairline  = --border          (dark, contrast)
│     → top rim              = --surface-rim-top (via surface-raised)
│     → bottom rim           = NONE (deliberate)
│     → elevation            = --shadow-card-raised (via surface-raised)
│     [Do not add inset rim box-shadows]
│
├─ FORM CONTROL (input, button, select)?
│  └─ Use --input (NOT --border).
│     → No specular rim (flat control).
│     → aria-invalid → border-destructive.
│
├─ STATUS INDICATOR (badge, error/success card)?
│  └─ border-{tone}/20 — the valid exception to "one border-border".
│     [Only through Badge or Card state; never hand-roll /20 in features]
│
└─ SHELL CHROME (sidebar rail, topbar, dock)?
   └─ glass-bar / glass-bar-edge-r / glass-bar-edge-b.
      → vertical rim = --glass-edge-rim / --glass-edge-rim-bottom
      [no 4-sided border — must stay flush with the viewport]
```

**Golden rules (binding):**

1. Never write `border: 1px solid <colour>` or an inset rim box-shadow in TSX.
   Every border/rim reaches the element through a utility (`glass-*`,
   `surface-raised`) or a component (`Card`, `CardWell`, `Badge`).
2. Solid and glass structural hairlines carry **opposing colour semantics**
   (`--border` dark vs `--glass-edge` white) but **share `--surface-rim-top`**
   for the top rim. That shared seam is the one ADR-0018 calibrated.
3. There are exactly **three structural hairline tokens** — `--border`,
   `--input`, `--glass-edge`. Do not add a fourth.
4. Status tint `/20` is reached **only** via `Badge` or the `Card state` prop.
   Hand-rolled `border-{tone}/20` in feature code is a violation.

**Drift guard.** A new test, `border-consumption.test.ts`, pins the structural
separation so the two hairline flows cannot cross silently — mirroring the
`glass-rim.test.ts` pattern (read-the-CSS, assert the literal). It asserts:

- `@utility surface-raised` in `theme.css` reads `var(--surface-rim-top)` for its
  top rim and does **not** reference `--glass-shadow-edge` (bottom rim is
  glass-only).
- `@utility glass-panel` and `@utility glass-window` in `glass.css` read
  `var(--glass-edge)` for their structural hairline (never `--border`), and read
  `var(--surface-rim-top)` + `var(--glass-shadow-edge)` for the rim pair.
- `--border`, `--input`, `--glass-edge` are each defined exactly once per theme
  (`:root` and `.dark`) — no duplicate definitions that could drift.

This makes the solid-vs-glass separation a CI-checked contract, not a doc note.

## Consequences

**Positive:**

- One named decision tree answers "which border does this surface use?" without
  reading four ADRs. The three-concept split (structural / specular / status)
  makes the earlier confusion self-diagnosing.
- The drift guard prevents the two failure modes the audit found: a solid card
  accidentally reading `--glass-edge`, or a glass panel reading `--border`.
  Either would invert the colour semantics silently.
- The "closed three-token hairline set" + "status tint only via Badge/Card state"
  rules give the existing `pumniNoAdHocSurface` lint rule and future
  feature-layer cleanup a documented target.
- Builds on ADR-0018's seam (`--surface-rim-top`) rather than reopening it; this
  ADR adds the *relationship* rule ADR-0018 left implicit.

**Negative / costs:**

- The decision tree adds one more rule designers/engineers must hold in head. The
  tree lives in `design-system.md` so it loads with the existing hard rules, but
  it is net-new surface area.
- Feature-layer cleanup (the ~8 hand-rolled `/20` sites + the `border-border/60`/
  `border-2`/`border-l-4` violations) is **not done by this ADR**. The ADR sets
  the target; the cleanup is tracked separately. Calling this out so the cleanup
  is not mistaken for part of the decision.
- The drift guard reads CSS by regex (same approach as `glass-rim.test.ts`). It
  is robust to whitespace and comment stripping but, like all such guards, a
  drastic CSS restructure would need the test updated in lockstep.

**Neutral:**

- No token, value, or public API change. `--border` / `--input` / `--glass-edge`
  / `--surface-rim-top` / `--glass-shadow-edge` all keep their current values.
- Token tier count stays three. The three hairline tokens are all Tier 2
  (semantic); the rims are Tier 2 (specular, ungated by APCA per ADR-0014).
- ADR-0018 is **referenced, not amended** — this ADR documents the relationship
  around its seam, it does not change the seam.

## Alternatives considered

- **Collapse the three structural tokens into one `--border` consumed everywhere
  (delete `--input`, `--glass-edge`).** Rejected: `--input` being one shade
  deeper than `--border` is a deliberate control-vs-card distinction, and
  `--glass-edge`'s white specular semantics cannot be served by a dark
  `--border`. A single token would either flatten the control/card distinction
  or break glass's specular edge.
- **Promote the rim pair (concept B) to be "the border" everywhere, delete
  concept A.** Rejected: solid cards rely on a real dark hairline for contrast;
  a pure-rim (specular-only) card would have no structural edge on a flat
  background. The two concepts coexist by design.
- **Let `pumniNoAdHocSurface` enforce this instead of a CSS drift guard.** The
  lint rule catches hand-rolled surfaces in TSX (feature layer); it does not
  guard the CSS token wiring itself. Both layers need a guard — they catch
  different drift classes. This ADR adds the CSS-side guard; the lint rule
  continues to own the TSX side.
- **Do not write an ADR; just edit `design-system.md`.** Rejected: the three
  structural tokens + opposing colour semantics + the shared `--surface-rim-top`
  seam is a non-obvious, multi-ADR-spanning decision that future readers will
  re-question. The ADR records the *why* the conventions doc cannot carry.

## References

- `docs/conventions/design-system.md` — the hard-rules doc this ADR extends with
  the decision tree + golden rules (P2, loads on every styling task).
- `packages/ui/src/styles/theme.css` — `--border`, `--input`, `--glass-edge`,
  `--surface-rim-top`, `--glass-shadow-edge` definitions; `surface-raised` utility.
- `packages/ui/src/styles/glass.css` — `glass-panel` / `glass-window` structural
  hairline (`--glass-edge`) + rim pair.
- `packages/ui/src/components/layout/card.tsx` — `Card` variants route through
  `surface-raised` (solid) / `glass-panel` (glass); `state` prop owns status tint.
- `packages/ui/src/components/layout/card-well.tsx`, `feedback/badge.tsx` — the
  closed-set sub-surface primitives that own concept C.
- `apps/web/src/test/design-system/border-consumption.test.ts` — the new drift
  guard (structural-separation contract).
- [ADR-0012](0012-engineered-glass-surface-language.md),
  [ADR-0014](0014-glassmorphism-surface-treatment.md),
  [ADR-0018](0018-unify-surface-rim-top.md) — the ADR sequence this one codifies
  the relationship between.
