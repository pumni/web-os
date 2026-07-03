# Design System — Audit Remediation (2026-07-03)

- **Status:** ready to execute
- **Owner:** design system (`packages/ui` + enforcement layer)
- **Origin:** full design-system audit (2026-07-03) of `packages/ui`, the token
  cascade, and every consumer/enforcement surface. Findings verified against
  source at audit time — re-verify each `file:line` anchor before editing.
- **Scope:** close the enforcement gap in the primitive-var guards; make the
  contrast gates honest (docs vs test thresholds) and extend them to ungated
  pairs; fix REFERENCE.md token drift; resolve four self-violations
  (`will-change`, window-control icon, traffic-lights doc conflict, BadgeDot
  duplication); minor component hygiene.
- **Non-goals:** no visual redesign, no new surface roles, no threshold
  *lowering*, no chart-palette expansion (recorded as a deferred decision, §D2),
  no WCAG 2.x ratio gate (banned by `design-system.md`).
- **Execution rules:** one phase = one commit. Surgical deltas only — touch
  nothing outside the listed files. Every phase ends green on its listed gate
  before the next phase starts. If a `file:line` anchor no longer matches,
  re-locate by the quoted code, not by line number.

---

## Phase 1 — Close the primitive-guard enforcement gap (P1)

**Problem.** Both primitive-var guards predate the coral rebrand and miss the
current brand scales. A component writing `var(--coral-500)` passes every gate.

- `packages/config/eslint.mjs:74` — `RAW_COLOR_PATTERNS` entry
  `'--(?:indigo|violet|neutral|red|emerald|amber)-'`
- `scripts/check-ai-context.mjs` → `checkDesignTokenBoundaries()`
  `primitiveVarPattern = /var\(--(?:indigo|violet|neutral|red|emerald|amber)-/g`

**Change.** Extend both alternations to
`(?:indigo|violet|neutral|red|emerald|amber|coral|cyan|rose)`. Do not touch the
Tailwind-builtin-palette pattern (its `cyan|rose` matches are utility classes,
a different concern).

**Watch out.** `personalization.css`, `brand.css`, `theme.css`, `tokens.css`
legitimately reference these vars and are already in `allowedTokenFiles` /
outside ESLint's file scope — no exemption changes needed. Audit-time grep found
zero violations in `.ts/.tsx`, so this should be a no-noise tightening; if the
stricter pattern flags a real file, fix that file to a semantic token instead of
widening exemptions.

**Gate.** `bun run ai:check` green; `bun --filter @pumni/ui lint` and
`bun --filter web lint` green.

---

## Phase 2 — Make the contrast gates honest and complete (P1)

All edits in `packages/ui/src/test/glass-contrast.test.ts` plus doc lines that
quote thresholds. Threshold direction is **up or pin, never down**.

### 2a. Gate `--info` (currently completely ungated)

`STATUS_TOKENS` omits `--info`, yet `Banner tone="info"`
(`packages/ui/src/components/feedback/banner.tsx:41`) renders `text-info` on
`bg-info/10`. Add `--info` to `STATUS_TOKENS` and add a
`STATUS_TINT_THRESHOLDS['--info']` entry. Procedure: compute the actual Lc for
light/dark with the existing helpers, then pin thresholds at
`floor(actual)` (regression floor). If either mode lands below 40, flag it in
the PR description as a follow-up colour-tuning item — do not silently accept
by omitting the token.

### 2b. Raise the dark `--primary` status-tint floor off 0

`STATUS_TINT_THRESHOLDS['--primary'].dark` is `0` — `<Badge tone="primary">`
has no dark-mode protection. Compute the actual dark Lc and pin it as the new
floor (same regression-floor procedure as 2a). The real colour fix (making the
dark primary chip genuinely readable) is an owner decision — see §D3.

### 2c. Stop the docs overclaiming "Lc 60"

The prose claims a uniform APCA Lc 60 text gate; the tests actually enforce:
light glass 50, dark muted 55, accent surface 45, status tints per-token.
Update the two claim sites to state the truth:

- `docs/conventions/design-system.md` (the "APCA contrast is gated at Lc 60
  text / Lc 25 UI" sentence): rephrase to "APCA-gated per surface pair in
  `glass-contrast.test.ts` — Lc 60 body-text target, with documented pinned
  floors below it for glass-over-blob (50 light), dark muted (55), accent
  surfaces (45), and status tints (per-token table in the test)".
- `.agents/skills/ui-styling/SKILL.md` Rules bullet ("Contrast is APCA-gated:
  Lc 60 text / Lc 25 UI"): same correction, one line.

Keep it final-lean: one honest sentence per site, no threshold tables in prose
(the test file is the table).

**Gate.** `bun --filter @pumni/ui test` green (glass-contrast suite);
`bun run ai:check` green (doc-drift guards);
`bun --filter web test` green (`doc-drift.test.ts` / `doc-token-drift.test.ts`
must not reference the removed claim).

---

## Phase 3 — Fix REFERENCE.md token drift (P1)

`/.agents/skills/ui-styling/REFERENCE.md` documents tokens that do not exist:

- Line ~17: `glass-scrim` in the glass token row — the real token is
  `--overlay` (row below already covers it). Delete `glass-scrim` from the row.
- Line ~21: `chart-1 ... chart-5` row — `theme.css` defines a single `--chart`.
  Rewrite the row to: `` `chart` | Single data-visualization series colour
  (indigo); `--primary` is the lead series. Multi-series palettes are out of
  scope (see plans/design-system-audit-remediation §D2). ``

**Watch out.** `doc-token-drift.test.ts` guards a *curated* numeric set — these
rows are outside it, which is exactly why they drifted. After the fix, add the
two corrected rows' token names to the curated guard **only if** a cheap
presence assertion fits the existing pattern (token name appears in
`theme.css`); skip if it would need new parsing machinery.

**Gate.** `bun --filter web test` (design-system doc guards) green.

---

## Phase 4 — Self-violations (P2)

### 4a. Static `will-change` on dock items

`packages/ui/src/styles/desktop.css:28` holds `will-change: transform` on every
`[data-slot='dock-item']` permanently — the exact reservation ADR-0014 bans.

**Change.** Remove the static declaration; scope it to the interaction window:

```css
[data-slot='dock-item']:hover,
[data-slot='dock-item']:hover + [data-slot='dock-item'],
[data-slot='dock-item']:has(+ [data-slot='dock-item']:hover) {
  will-change: transform;
}
```

**Guard extension.** `apps/web/src/test/design-system/glass-performance.test.ts`
only scans `glass.css`, which is why this leaked. Extend the will-change scope
test to also parse `desktop.css`, with the hover-scoped selectors added to its
`allowed` predicate (allowed = `[data-state`-keyed, reduced-transparency reset,
or `:hover`-keyed).

### 4b. `--window-control-icon` dead override + invisible dark icon

`packages/ui/src/styles/tokens.css:435` — the `.dark` block redefines
`--window-control-icon` to the identical light value (`oklch(0 0 0 / 0.65)`);
black icons on the dark `bg-border` chip (neutral-800) are near-invisible.

**Change.** In `.dark`, set a light-polarity value, derived not hand-tuned: run
`foregroundFor` (`packages/ui/src/lib/apca.ts`) against `--neutral-800` at
target Lc 60, neutral chroma — expect a near-white ~`oklch(1 0 0 / 0.7)`-class
result; use the derived lightness with alpha 0.7. Verify visually on an
inactive dark window (icons appear on titlebar-controls hover).

### 4c. Traffic-lights doc conflict — **default: fix the doc**

`docs/conventions/design-system.md` says "neutral window controls, no macOS
traffic lights"; `packages/ui/src/components/os/window.tsx:47-59` deliberately
implements token-based traffic lights (resting neutral, coloured only on the
active window). Per §D1 the default resolution is to update the doc sentence
to: "window controls rest neutral (`bg-border`) and take semantic status
colours (`destructive`/`warning`/`success`) only on the active window — no
literal macOS palette." Do **not** change the component.

**Gate.** `bun --filter @pumni/ui test` + `bun --filter web test` green
(glass-performance + doc guards); `bun run ai:check` green.

---

## Phase 5 — Component hygiene (P2/P3)

### 5a. Badge composes PingDot

`packages/ui/src/components/feedback/badge.tsx:48-55` — `BadgeDot` hand-rolls
the ping indicator with a bare `animate-ping` (no `motion-safe:`; PingDot has
it). Delete `BadgeDot`; render
`<PingDot size="sm" className="…" />` (same `bg-current` tone inheritance;
match the current `size-1.5` visual by passing the appropriate size or a
className override — keep the rendered box identical). No public API change:
`pulse` prop behaviour is unchanged.

### 5b. Off-scale font size in Badge

`badge.tsx:36` — `sm: 'px-2 py-0.5 text-[11px]'` is the only off-scale font
size in the package. Change to `text-xs` (12px). This is a 1px visual change on
`size="sm"` badges; check the two feedback tests
(`banner-kbd-chip.test.tsx`, `chat-bubble-ping-dot.test.tsx`) and the
design-system showcase for snapshot/class assertions on `text-[11px]`.

**Gate.** `bun --filter @pumni/ui test` green; `bun run ai:tw` green.

---

## Final validation

After all phases: `bun run ai:check && bun run ai:eval`, then the full
`bun run lint && bun run typecheck && bun run test`. If any change altered
documented behaviour (Phases 2c, 3, 4c did), the owning doc/skill edit is part
of that phase's commit — verify nothing else quotes the old claims:
`rg -n "Lc 60" docs .agents` and `rg -n "chart-[1-5]|glass-scrim" docs .agents`
must return only intentional post-fix text.

---

## Deferred owner decisions (not executed by this plan)

- **D1 — Window controls.** Default taken in 4c (doc follows code). If the
  owner instead wants truly neutral controls, revert 4c and re-plan window.tsx.
- **D2 — Chart palette.** The system has 2 effective data-vis colours
  (`--primary`, `--chart`); the CVD guard compares only those two at a thin
  ΔL ≥ 0.02. Expanding to a 5-colour CVD-tested series set is real design work
  (new primitives + gates + DTCG entries) — separate plan if a multi-series
  dashboard lands.
- **D3 — Dark `tone="primary"` badge readability.** Phase 2b only pins the
  current value as a regression floor. A real fix means either a dark-mode
  text-stop split for chips (like `brand.css` does for `--primary`) or dropping
  the primary tone from Badge. Needs a visual pass; do not improvise it here.

## Explicitly rejected (audit noted, no action)

- Inline `style={{ zIndex: 'var(--z-*)' }}` in overlay components — intentional
  (wins over Radix inline styles); the `@theme` `--z-index-*` bridges stay for
  utility consumers.
- `sideEffects: false` + CSS exports — safe while CSS is consumed via
  `globals.css` `@import` only.
- Reduced-motion global net living in `glass.css` — moving it is churn with no
  behaviour change; skip.
- `--info-foreground` — the tint-only status pattern doesn't need it; adding an
  unused token is drift bait.
