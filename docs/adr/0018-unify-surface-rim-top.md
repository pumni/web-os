# 0018. Unify the Lit Top Rim Token (`--surface-rim-top`)

- **Status:** Accepted (solid half amended by [ADR-0020](0020-solid-cards-drop-specular-rim.md))
- **Date:** 2026-06-21
- **Owner:** Design system / `@pumni/ui`

> **Amended by [ADR-0020](0020-solid-cards-drop-specular-rim.md):** the **solid**
> half of the shared seam was dropped — `surface-raised` no longer reads
> `--surface-rim-top`, so solid cards are structural-only (`--border` +
> `--shadow-card-raised`, no specular rim). The **glass** half stands unchanged:
> all 8 `glass-*` utilities still read `--surface-rim-top`. The token stays
> defined (glass-owned now); only its name is retained from this ADR. The body
> below describes the original 0018 decision; read the solid-rim references
> through the ADR-0020 amendment.

## Context

A border audit found that the **same concept** — a 1px specular lit top edge
delivered as `inset 0 1px 0 0 <token>` — was tokenized **twice**, in two
unrelated places, with no rule tying them together:

- `--glass-highlight` (glass surfaces) — light `oklch(1 0 0 / 0.5)`, dark `0.2`.
  Consumed by every `glass-*` utility (`glass-panel`, `glass-window`,
  `glass-bar`, `glass-bar-bordered`, `glass-bar-edge-r/b`, `glass-titlebar`,
  and the `glass-window[data-active=false]` override) in `glass.css`.
- `--card-rim-top` (solid surfaces) — light `oklch(1 0 0 / 0.6)`, dark `0.05`.
  Consumed only by the `surface-raised` utility in `theme.css`, which feeds
  `Card variant="solid|spotlight"` and `IconBadge variant="raised"`.

Both tokens exist for one reason: the "lit top edge of a raised surface." They
are the same inset, the same technique, the same visual intent. They diverged
silently across the 0012 → 0014 → 0016 ADR sequence because no decision ever
defined the relationship between them. The drift is unambiguous in dark mode:
glass `0.2` vs solid `0.05` — a 4× gap with **no recorded rationale** anywhere
in code or ADRs. Light mode stayed close (0.5 vs 0.6) by coincidence, not
design.

This is the "lệch về cấu hình từ 1 nguồn" pattern (one concept, two tokens, no
binding rule → silent drift), and it is the root cause the audit was opened to
find. It also has a visible symptom: because `--glass-highlight` is delivered
as a *horizontal* inset band (`inset 0 1px 0 0`), the rim reinforces only the
top/bottom straight edges, never the curved corners — so on large surfaces the
corners read weaker than the straight edges. Unifying the rim vocabulary is the
prerequisite for any future corner-reinforcement decision to be made in one
place instead of two.

## Decision

Unify the lit-top-rim concept into one surface-agnostic token:
**`--surface-rim-top`**, defined in both `:root` and `.dark` in `theme.css`:

| Theme | Value | Source (was) |
|---|---|---|
| `:root` (light) | `oklch(1 0 0 / 0.5)` | glass value (card was 0.6) |
| `.dark` | `oklch(1 0 0 / 0.2)` | glass value (card was 0.05) |

The unified name is surface-agnostic — it sits next to `--border` and
`--glass-edge` and reads as "the lit top edge of any raised surface," whether
that surface is floating glass or a solid card. Both consumers now read it:

- Every `glass-*` utility reads `var(--surface-rim-top)` (renamed from
  `var(--glass-highlight)` at 8 sites).
- `surface-raised` reads `var(--surface-rim-top)` (renamed from
  `var(--card-rim-top)`).

`--glass-highlight` and `--card-rim-top` are deleted. The drift-guard test
`glass-rim.test.ts` is updated to pin `var(--surface-rim-top)`.

### Scope boundary (deliberately out of scope)

This ADR unifies the **top** rim only. The bottom rim
(`--glass-shadow-edge`, light `0` / dark `0.22`) stays **glass-only** — solid
cards today carry no bottom rim, and whether they should is a separate design
decision requiring its own visual evaluation, not a side effect of this rename.
`--glass-shadow-edge` is untouched. Likewise the shell-chrome vertical rims
(`--glass-edge-rim` / `--glass-edge-rim-bottom`, a third parallel rim mechanism
used only by `glass-bar-edge-r/b`) are a separate audit finding and are not
touched here.

## Consequences

**Positive:**

- One calibrated lit-top-rim value across the whole surface vocabulary (glass
  + solid). A future edit to the rim strength is one knob, not two that can
  drift apart again.
- Dark-mode solid cards gain a visible top rim (`0.05` → `0.2`). Dark surfaces
  amplify bright edges, so the previous near-zero value made the solid-card top
  rim effectively disappear in dark mode; it now reads as a real lit edge,
  matching the glass identity.
- One fewer semantic token (`--card-rim-top` removed; `--glass-highlight`
  renamed, net −1). The drift guard still pins the rim under its shared name.
- Clears the root cause the border audit identified, unblocking any future
  corner-reinforcement work to land in one place.

**Negative / costs:**

- The dark-mode solid card visual changes (rim 0.05 → 0.2). This is the
  intended fix, not a regression, but it is a visible change to every `Card
  variant="solid|spotlight"` and `IconBadge variant="raised"` in dark mode. If
  it reads too strong, `--surface-rim-top` in `.dark` is the single knob.
- Renaming `--glass-highlight` means any out-of-tree override of that token
  (e.g. a rebrand project setting it directly) would stop applying. The
  `@pumni/ui` styles are the supported override surface; direct
  `--glass-highlight` overrides were never a documented contract.
- Light-mode solid cards dim very slightly (`0.6` → `0.5`). Within the same
  perceptual band; not expected to be noticeable, but recorded for honesty.

**Neutral:**

- Public utility names (`glass-*`, `surface-raised`) and component APIs
  (`Card`, `IconBadge`, `GlassSurface`) are unchanged — they route through the
  renamed token transparently.
- Token tier count stays three. APCA gate (`glass-contrast.test.ts`) is
  unaffected: rim tokens are specular/ungated by ADR-0014 design.
- The bottom rim (`--glass-shadow-edge`) and shell-chrome rims
  (`--glass-edge-rim*`) remain as separate, glass-/chrome-scoped concerns.

## Alternatives considered

- **Keep `--glass-highlight` everywhere; delete `--card-rim-top`.** Rejected:
  it is conceptually odd for a solid raised card to read a `--glass-*` token —
  the name implies a glass-only concern and would mislead future readers into
  thinking solid cards borrow from glass rather than sharing a vocabulary. The
  surface-agnostic `--surface-rim-top` makes the shared intent legible.
- **Keep `--card-rim-top` everywhere; delete `--glass-highlight`.** Rejected:
  the inverse oddness (glass utilities reading a `--card-*` token), plus more
  churn (the 8 glass sites + the drift-guard test all reference
  `--glass-highlight`, so this direction touches more files for a worse name).
- **Add a `--surface-rim-bottom` mirror for solid cards too.** Rejected as
  out of scope: solid cards have never carried a bottom rim, and adding one is
  a new visual decision, not a rename. If a future need arises, it goes through
  its own ADR.
- **Leave the split; just re-sync the dark values.** Rejected: re-syncing
  treats the symptom (drift) without removing the cause (two unbound tokens for
  one concept). The drift would recur on the next edit.

## References

- `packages/ui/src/styles/theme.css` — `--surface-rim-top` defined in `:root`
  and `.dark`; `surface-raised` reads it; `--card-rim-top` removed.
- `packages/ui/src/styles/glass.css` — 8 rim sites + header comment renamed to
  `--surface-rim-top`; `--glass-shadow-edge` (bottom rim) unchanged.
- `apps/web/src/test/design-system/glass-rim.test.ts` — drift guard updated to
  pin `var(--surface-rim-top)`.
- `apps/web/src/features/design-trends/glass-playground.tsx` — displayed code
  snippet updated to match the real CSS.
- `docs/adr/0012-engineered-glass-surface-language.md` — amended: the rim
  tokens it names (`--glass-rim-top`/`-bottom`, later `--glass-highlight`) are
  now `--surface-rim-top` (top) + `--glass-shadow-edge` (bottom).
- `docs/adr/0014-glassmorphism-surface-treatment.md` — amended: the top rim
  token is now `--surface-rim-top` (shared with solid via ADR-0018).
- `docs/adr/README.md` — index entry 0014 updated to the current token name.
