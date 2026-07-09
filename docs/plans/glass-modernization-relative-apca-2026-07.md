# Plan: Glass modernization — relative OKLCH scale, APCA soft gate, cleanup

- **Status:** Shipped (2026-07-09)
- **Date:** 2026-07-09
- **Owner:** `@pumni/ui` design system
- **Research basis:** W3C CSS Color 4/5, APCA Nutshell, MDN/web.dev `backdrop-filter`, Apple HIG Materials (Liquid Glass), Chrome relative-color guide, Evil Martians OKLCH
- **Supersedes (archive after Phase 0):**  
  `docs/plans/glassmorphism-2026-alignment.md`  
  `docs/plans/glassmorphism-2026-remediation.md`  
  `docs/plans/glass-border-doctrine-and-grain-2026.md`  
  (all three teach **false doctrine** in body: Lc 25 edge gates, navy light rim, blur 8–16, etc. Banner already says superseded — they become **agent trap** if left live.)

---

## Goal

Bring production glass tokens and gates to the **2026 canonical stack** without inventing a new visual language:

1. **Single fill source + relative alpha scale** (CSS Color 5 `oklch(from …)`).
2. **APCA Lc 60** covers **default + soft + strong** personalization (and worst-case blobs).
3. **Clear vocabulary map** to Apple HIG: chrome ≈ clear-ish shell · readable ≈ regular short UI · body never bare glass.
4. **Optional P1/P2 later:** media clear+dim, on-glass text tokens, backdrop stack discipline.
5. **Zero leftover garbage:** dead tokens, superseded plans, stale blur/Lc numbers in docs/skills/MEMORY, playground teaching forbidden values.

Observable product look may shift slightly (alphas derived, soft gated) — that is **intentional behavior tightening**, not pure structure-only refactor. ADR-0012 is amended in place (cosmetic/token rationale); **no new ADR** unless we reverse “no Liquid Glass refraction”.

---

## Non-goals (hard fence)

| Do not | Why |
| --- | --- |
| Apple Liquid Glass refraction / chromatic aberration / lensing | GPU + text clarity; ADR-0012 explicit reject |
| WCAG 2.x ratio gate alongside APCA | Contradicts dark-mode + dynamic backdrop |
| APCA gate on `--glass-edge*` | Edge = specular light rim; false doctrine 2026-07-05 |
| Raise blur above **24px** or reintroduce 8–16 as SSOT | Identity is frosted 12/16/20/24 |
| Glass on content-layer forms/tables/long body | Apple + ADR-0012 |
| Runtime Color.js / oklch.com in app bundle | Authoring-only tools |
| Redesign accent palette / brand coral | Out of scope |
| Schema / Supabase / server packages | No touch |
| Mint ADR-0026 for this | Token + gate + doc; amend 0012 + design-system SSOT |

---

## Constraints & invariants

- Token tiers: primitive → semantic → component; components never raw OKLCH.
- `light-dark()` at `:root` for colors; `.dark` only non-color (blur/saturate/brightness/grain/shadow).
- Resolver (`packages/ui/scripts/lib/token-resolver.ts`) must resolve any new relative glass tokens for `glass-contrast.test.ts` / DTCG export.
- Relative grammar limited per ADR-0025: `l`/`c`/`h`/`alpha`, literals, simple `calc(ident op number)`.
- Stacked `backdrop-filter` ≤ 2 layers; never animate `backdrop-filter`.
- Lc 60 = chrome/short-text only; body Lc 75+ on solid only.
- `prefers-reduced-transparency` / `prefers-contrast: more` remain the a11y path for transparency.
- Branch off main; commit only if user opts in. Prefer PR stack by phase.

---

## Context — current state (evidence)

### What already works

| Area | Evidence |
| --- | --- |
| Two-tier tint | `--glass-tint-chrome` / `--glass-tint-readable` in `theme.css` |
| Blur ladder 12/16/20/24 | `tokens.css` + `glass-performance.test.ts` + `glass-contrast` |
| Filter stack blur+sat+bright | `glass.css` utilities |
| Specular edge ungated; shadow delineator | `glass-contrast` light-rim pins + ADR-0012 |
| Body-on-glass ban | `DialogBody` solid well; docs + skill |
| Personalization soft/strong | `personalization.css` `[data-glass=…]` |
| Relative color pipeline | ADR-0025 + `token-resolver` + brand/accent examples |
| Overlay scrim | `overlay-scrim` = `--overlay` + `--blur-scrim` (4px) on Dialog/Sheet/Command |

### Gaps (from research)

| ID | Gap | Evidence |
| --- | --- | --- |
| G1 | Tint L/C/H **duplicated** 6+ times; `--glass-tint-base` defined but **never consumed** | `theme.css:164–176`; `rg glass-tint-base` → only definition |
| G2 | soft/strong rewrite full `oklch(…)` instead of alpha-only relative | `personalization.css:104–127` |
| G3 | APCA gate only default chrome/readable — **not** soft/strong composites | `glass-contrast.test.ts` |
| G4 | Naming “readable” implies body; APCA Lc 60 is chrome tier | docs + skill |
| G5 | No formal **clear + media dim** recipe (Apple 35% dark dim) | no token/utility |
| G6 | No vibrancy-lite / `--on-glass` text tokens | semantic `--foreground` only |
| G7 | Grain only on `glass-panel-simple` (policy pinned, dual visual language) | `glass-performance.test.ts` |
| G8 | Live superseded plans still in `docs/plans/` root | three glass-*.md files |

### Cleanup inventory (confirmed / to verify in Phase 0)

| Kind | Item | Action |
| --- | --- | --- |
| Dead token (almost) | `--glass-tint-base` unused intermediate | **Reuse** as sole fill SSOT then derive chrome/readable; if rename → `--glass-fill` and delete old name |
| Dead plans | `glassmorphism-2026-alignment.md`, `…-remediation.md`, `glass-border-doctrine-and-grain-2026.md` | Move → `docs/plans/archive/` with one-line pointer to **this** plan |
| Stale numbers in plans/skills | blur 8–16, saturate 1.4, Lc 25 edge | Archive plans; grep docs/skills and fix remaining live SSOT only |
| MEMORY drift | “Lc 25 rescope” wording easy to misread as still gating edge | Tighten MEMORY bullet to “edge ungated; text Lc 60” |
| Playground risk | `apps/web/src/features/design-trends/glass-playground.tsx` historically taught navy rim / forbidden toggles | Audit vs production; fix or quarantine demos that contradict ADR-0012 |
| Comment archaeology | `glass.css` / `theme.css` “Rewritten exclusively from glassmorphism-card-laboratory” | Keep one short provenance OR drop if external lab not in-repo |
| DTCG ghost | historical `inset-bezel-outline` | Confirm absent in export; if present, delete |
| False dual utility | standalone `@utility glass-grain` was planned; production inlines grain on simple only | Do **not** reintroduce unused utility; document grain = simple-only or extract shared token-driven pseudo once |

---

## Target state

### Token model (P0)

```css
/* Semantic — single opaque-ish recipe without alpha, then alpha scale */
--glass-fill: light-dark(
  oklch(0.96 0.01 250),
  oklch(0.18 0.02 240)
);

/* Default intensity */
--glass-tint-chrome:   oklch(from var(--glass-fill) l c h / <α_chrome>);
--glass-tint-readable: oklch(from var(--glass-fill) l c h / <α_readable>);
--glass-tint: var(--glass-tint-readable);

/* soft | strong only override alphas (or re-point the two tints) */
[data-glass='soft'] {
  --glass-blur: var(--blur-glass-sm);
  --glass-tint-chrome:   oklch(from var(--glass-fill) l c h / <α_chrome_soft>);
  --glass-tint-readable: oklch(from var(--glass-fill) l c h / <α_readable_soft>);
}
```

**Alpha matrix (start from current values; adjust only if APCA fails):**

| Mode | Tier | default α | soft α | strong α |
| --- | --- | --- | --- | --- |
| light | chrome | 0.52 | 0.46 | 0.58 |
| light | readable | 0.58 | 0.54 | 0.65 |
| dark | chrome | 0.34 | 0.30 | 0.40 |
| dark | readable | 0.40 | 0.36 | 0.48 |

If soft fails Lc 60 on worst-case synthetic/blob: **raise soft readable α first** (not blur). Document any pin below 60 as explicit exception (prefer none).

### Naming / docs map (P0)

| Token / role | Apple HIG analogue | APCA target | Content policy |
| --- | --- | --- | --- |
| `--glass-tint-chrome` | Clear-ish shell / nav chrome | Lc 60 short labels | Icons, titles, dock labels |
| `--glass-tint-readable` | Regular material for panels | Lc 60 short UI | Menus, dialog **chrome**; multi-line → solid inset |
| Solid card / DialogBody | Content layer materials | Lc 75+ body | Forms, tables, body copy |
| (P1) clear + dim | Clear over media + 35% dark dim | Lc 60 after composite | Media player chrome only |

Keep public token names `chrome` / `readable` for compat; docs say “readable ≠ body”.

### Gate matrix (P0)

For each mode × intensity (`default` | soft via map override | strong) × tier (chrome, readable):

- Composite tint over each `--desktop-blob-*`
- Composite over high-chroma synthetics (existing)
- `|APCA(fg, composite)| ≥ 60`
- Chrome α < readable α invariant

### P1 (optional follow-up PR)

- `--glass-media-dim`: `oklch(0 0 0 / 0.35)` (or mode-aware)
- Utility or composition pattern: dim layer under clear chrome **only** over media/hero
- Stack rule: dialog = `overlay-scrim` **or** panel glass, document double-blur budget (scrim 4px + panel is already 2 filters)

### P2 (optional)

- `--on-glass` / `--on-glass-muted` APCA-gated on readable composite
- Grain: either remove from simple **or** extract shared `--glass-grain-*` applied opt-in — no third orphan path

---

## Pre-flight

1. Branch: `feat/glass-relative-apca-cleanup` (never refactor on `main`).
2. Baseline green (record output):

```powershell
bun run --filter @pumni/ui test
bun run --filter @pumni/ui typecheck
```

If red → stop; fix baseline first.

3. Characterization (no behavior change yet): note current soft alphas and whether any soft composite already fails — run a **temporary** local script or extend test in fail-first style in Phase 1.

4. Inventory grep (archive list):

```powershell
rg -n "Lc 25|8-16px|8–16|saturate 1\.4|glass-tint-base|inset-bezel-outline|glass-scrim|navy.*rim" docs .agents packages/ui --glob "!**/archive/**"
```

---

## Phases & steps

### Phase 0 — Cleanup archive + inventory (no visual change)

#### Step 0.1: Archive superseded glass plans

- **File(s):**  
  `docs/plans/glassmorphism-2026-alignment.md`  
  `docs/plans/glassmorphism-2026-remediation.md`  
  `docs/plans/glass-border-doctrine-and-grain-2026.md`  
  → `docs/plans/archive/`
- **Action:** `git mv` each file. Add one-line header on each archived file if missing:  
  `> Archived 2026-07-09. Successor: docs/plans/glass-modernization-relative-apca-2026-07.md`
- **Verification:** files absent from `docs/plans/` root; present under `archive/`.
- **Rollback:** `git mv` reverse.
- **Depends on:** none

#### Step 0.2: Dead-code / ghost grep report (check-in as appendix in this plan or PR body)

- **File(s):** read-only scan
- **Action:** Confirm presence/absence of:  
  `--glass-tint-base` consumers, `inset-bezel-outline`, standalone `glass-grain` utility, DTCG export ghosts, `glass-scrim` string in live docs.
- **Verification:** report attached to PR; any live ghost deleted in Phase 1/3 as listed.
- **Rollback:** n/a
- **Depends on:** 0.1

#### Step 0.3: Playground quarantine checklist

- **File(s):** `apps/web/src/features/design-trends/glass-playground.tsx`, `glass-2026-primitives.tsx`
- **Action:** Diff teaching surface vs production doctrine. Flag: navy light rim, Lc 25 edge UI copy, blur 8–16 as “production”, default-ON showcase toggles that production forbids.  
  **Do not redesign playground in Phase 0** — open follow-up issues or schedule Phase 3 fixes.
- **Verification:** short checklist in PR.
- **Depends on:** 0.2

---

### Phase 1 — Relative tint SSOT + APCA soft/strong (core)

#### Step 1.1: Fail-first tests for soft/strong + relative derivation

- **File(s):** `packages/ui/src/test/glass-contrast.test.ts`
- **Action:**
  1. Add cases that build token maps for soft/strong (simulate `[data-glass]` by applying the same overrides the CSS would — via temporary map merge helper or by parsing `personalization.css` selectors if already supported; otherwise inject expected overrides into map after `buildTokenMap`).
  2. Assert Lc ≥ 60 for chrome + readable over blobs (and synthetics for readable).
  3. Assert chrome α < readable α for soft/strong.
  4. Assert `--glass-tint-chrome` / `--glass-tint-readable` resolve from a single fill (relative or shared L/C/H) — exact assertion: after resolve, L/C/H of chrome == L/C/H of readable; only alpha differs.
- **Verification:** `bun run --filter @pumni/ui test glass-contrast` — **expect RED** if soft untested path would fail or derivation not relative yet.
- **Rollback:** revert test file.
- **Depends on:** Phase 0

#### Step 1.2: Implement `--glass-fill` + relative tints in theme

- **File(s):** `packages/ui/src/styles/theme.css`
- **Action:**
  - Replace absolute four-channel duplicates with:
    - `--glass-fill: light-dark(oklch(L C H), oklch(…))` (no alpha)
    - chrome/readable via `oklch(from var(--glass-fill) l c h / α)`
  - Remove dead name: either **rename** `--glass-tint-base` → `--glass-fill` (opaque fill) **or** make `--glass-tint-base` the fill and delete if redundant.
  - Keep `--glass-tint` alias.
  - Update comments: Apple map + Lc 60 chrome-only + relative Color 5.
- **Verification:** resolver + contrast tests; `bun run --filter @pumni/ui test token-resolver glass-contrast`
- **Rollback:** `git checkout -- packages/ui/src/styles/theme.css`
- **Depends on:** 1.1

#### Step 1.3: Personalization soft/strong alpha-only relative

- **File(s):** `packages/ui/src/styles/personalization.css`
- **Action:** soft/strong only override chrome/readable via `oklch(from var(--glass-fill) l c h / α)` + blur tokens. **No** restated L/C/H.
- **Verification:** glass-contrast soft/strong green; personalization unit tests if any still pass.
- **Rollback:** checkout personalization.css
- **Depends on:** 1.2

#### Step 1.4: Alpha tune if soft fails

- **File(s):** `theme.css` / `personalization.css` only alphas
- **Action:** Raise soft readable (then chrome) α in 0.02 steps until Lc 60; never raise blur past ladder.
- **Verification:** glass-contrast green both modes.
- **Depends on:** 1.3

#### Step 1.5: a11y / fallback paths still point at semantic tints

- **File(s):** `packages/ui/src/styles/glass.css` reduced-transparency / contrast blocks
- **Action:** Ensure fallbacks still recolor to solid `--border` / `--glass-fallback-bg`; if any rule hard-codes old tint, switch to vars. No new utilities.
- **Verification:** static read + existing glass tests; `border-consumption` + `glass-performance` green.
- **Depends on:** 1.4

---

### Phase 2 — Docs / skill / MEMORY / ADR SSOT (no product CSS)

#### Step 2.1: `design-system.md` vocabulary + relative recipe

- **File(s):** `docs/conventions/design-system.md`
- **Action:** Document `--glass-fill`, relative alpha scale, soft/strong, Apple map table, Lc 60 vs body 75+, cleanup note that old plans are archived. Remove any leftover Lc 25-as-a11y implication for glass edge (should already be correct — re-read).
- **Verification:** `bun run ai:check` (if context-drift covers this path).
- **Depends on:** Phase 1 green

#### Step 2.2: ui-styling skill + REFERENCE

- **File(s):** `.agents/skills/ui-styling/SKILL.md`, `REFERENCE.md` if tables list alphas
- **Action:** Sync blur ladder, two-tier + fill, relative derive, soft gate, grain=simple-only policy, no raw backdrop-blur.
- **Verification:** `bun run ai:check` / skills sync if required.
- **Depends on:** 2.1

#### Step 2.3: ADR-0012 amendment block (2026-07-09+ relative)

- **File(s):** `docs/adr/0012-engineered-glass-surface-language.md`
- **Action:** Short amendment: relative OKLCH alpha scale; soft/strong APCA; `--glass-fill`; false-doctrine plans archived. No supersede.
- **Verification:** manual; optional `bun run ai:adr:sync` if register text changes (status unchanged).
- **Depends on:** 2.1

#### Step 2.4: MEMORY.md pointer cleanup

- **File(s):** `docs/ai/MEMORY.md`
- **Action:** Replace ambiguous “Lc 25 rescope” with “glass edge ungated specular; text-on-glass Lc 60; fill relative Color 5”. Point to this plan only if still active; after ship, point to design-system only and drop plan pointer.
- **Verification:** ai:check if MEMORY is in manifest.
- **Depends on:** 2.3

---

### Phase 3 — Playground + residual dead code (behavior of demos only)

#### Step 3.1: Align `glass-playground` / primitives with production doctrine

- **File(s):** `apps/web/src/features/design-trends/*`
- **Action:** Remove teaching of navy rim, Lc 25 edge as a11y, blur 8–16 as production default. Defaults for showcase toggles OFF. Dead imports gone. Generated CSS must include saturate/brightness when matching production.
- **Verification:** lint/typecheck web; manual visual smoke optional.
- **Depends on:** Phase 2

#### Step 3.2: Comment / provenance cleanup in production CSS

- **File(s):** `glass.css`, `theme.css` headers
- **Action:** One accurate 6-element model comment; drop external lab names if they confuse agents; ensure no comment claims Lc 25 edge gate.
- **Verification:** `glass-performance` still green (comment stripper).
- **Depends on:** 3.1

#### Step 3.3: DTCG / export sanity

- **File(s):** export pipeline / `dtcg-export.test.ts`
- **Action:** Ensure relative glass tokens resolve or are correctly skipped per ADR-0025 rules; no ghost `inset-bezel-outline`.
- **Verification:** `bun run --filter @pumni/ui test dtcg-export token-resolver`
- **Depends on:** 1.2

---

### Phase 4 — Optional P1 media clear + dim (separate PR if scope creeps)

Only after Phases 0–3 merged.

| Step | Action | Verify |
| --- | --- | --- |
| 4.1 | Add `--glass-media-dim` + composition docs | design-system |
| 4.2 | Utility or Card/media chrome recipe; **one** consumer exemplar | lint + contrast if tint clear |
| 4.3 | Stack budget note: overlay-scrim + glass-panel = 2 BF already | glass-performance comment |

Non-goal until product needs media chrome: do not add unused utilities “for later”.

---

### Phase 5 — Optional P2 vibrancy-lite + grain unification

| Step | Action |
| --- | --- |
| 5.1 | Spike `--on-glass` L-boost vs `--foreground` on readable composite; gate Lc 60 |
| 5.2 | Decide grain: delete from simple **or** share opt-in `glass-grain` pseudo without conflicting `::before` bevel — update `glass-performance` policy test in same PR |

---

## Testing strategy

| Layer | Command | When |
| --- | --- | --- |
| Unit APCA + tokens | `bun run --filter @pumni/ui test glass-contrast token-resolver glass-performance border-consumption` | Every Phase 1 step |
| DTCG | `bun run --filter @pumni/ui test dtcg-export` | After relative tokens |
| UI package | `bun run --filter @pumni/ui test` + `typecheck` | End Phase 1 |
| AI context | `bun run ai:check` | End Phase 2 |
| Web app | `bun run --filter @pumni/web typecheck` (if playground) | Phase 3 |
| Pre-merge | `bun run ai:premerge` or scoped premerge | Before merge |

Characterization: existing glass-contrast default cases stay green throughout; soft cases are the new contract.

---

## Definition of Done (full program)

- [ ] Superseded glass plans live only under `docs/plans/archive/`
- [ ] `--glass-fill` (or equivalent) is **single** L/C/H source; chrome/readable/soft/strong differ by **alpha** (and blur) only
- [ ] No unused `--glass-tint-base` dual path; no restated absolute L/C/H in personalization
- [ ] `glass-contrast` gates default **and** soft **and** strong, both modes, chrome + readable, blobs + synthetics, Lc ≥ 60
- [ ] Chrome α < readable α for all intensities
- [ ] design-system + skill + ADR-0012 + MEMORY agree; no live “Lc 25 edge a11y” or “blur 8–16 production”
- [ ] Playground does not teach false doctrine
- [ ] `glass-performance`, `border-consumption`, token-resolver, dtcg green
- [ ] No new ADR unless refraction policy reversed
- [ ] P1/P2 either shipped with consumers **or** explicitly deferred (no dead utilities)

---

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| soft α fails Lc 60 after honest gate | Raise α 0.02; if still fail, soft may require higher floor — document; do not weaken gate |
| Resolver cannot parse nested `light-dark` inside `from` | Keep `--glass-fill` already resolved via light-dark; relative only on `var(--glass-fill)` (pattern proven in token-resolver tests) |
| `buildTokenMap` ignores `[data-glass]` | Test helper injects soft/strong overrides mirroring CSS — single source comment “keep in sync with personalization.css” or parse CSS selectors |
| Relative colors break DTCG scalar export | ADR-0025 already limits export; extend tests; do not invent full Color.js in CI |
| Double backdrop (scrim + dialog glass) perf | Document; optional later: solid scrim without blur when dialog is glass |
| Playground churn blocks Phase 1 | Phase 3 separate; production ships first |
| Agent re-reads archived plans and reintroduces navy rim | Archive path + MEMORY + design-system SSOT; archive banner points to this plan |

---

## Rollback strategy

- Phase 0: reverse `git mv`
- Phase 1: revert theme + personalization + contrast tests together
- Phase 2: docs-only revert
- Prefer **one PR per phase** so production CSS (Phase 1) can ship without playground (Phase 3)

---

## Execution order (summary)

```
0 Archive + inventory
  → 1 Fail-first APCA soft + relative fill implementation + tune
    → 2 Docs/skill/ADR/MEMORY
      → 3 Playground + comment/DTCG deadcode
        → 4 (opt) media dim
          → 5 (opt) on-glass + grain
```

**Commit policy:** default no commits unless user opts in; if opt-in, one commit per step or per phase.

---

## Appendix A — File touch map

| Path | Phase |
| --- | --- |
| `docs/plans/archive/glassmorphism-2026-*.md` (moved) | 0 |
| `docs/plans/archive/glass-border-doctrine-and-grain-2026.md` (moved) | 0 |
| `packages/ui/src/test/glass-contrast.test.ts` | 1 |
| `packages/ui/src/styles/theme.css` | 1 |
| `packages/ui/src/styles/personalization.css` | 1 |
| `packages/ui/src/styles/glass.css` | 1 / 3 |
| `docs/conventions/design-system.md` | 2 |
| `.agents/skills/ui-styling/SKILL.md` (+ REFERENCE) | 2 |
| `docs/adr/0012-engineered-glass-surface-language.md` | 2 |
| `docs/ai/MEMORY.md` | 2 |
| `apps/web/src/features/design-trends/*` | 3 |
| `packages/ui` dtcg tests | 3 |

## Appendix B — Explicit delete list (do when found)

1. Dual absolute L/C/H copies after relative migration.
2. Any remaining `--glass-inset-bezel-outline` in CSS/DTCG.
3. Live plan files teaching Lc 25 edge gate (archived only).
4. Playground dead imports / default-ON forbidden showcase flags.
5. Unused standalone `@utility glass-grain` if reintroduced without consumers — **do not add**.
6. Stale skill checklist lines “blur 8–16” if any survive archive (grep).

## Appendix C — Success metrics

- Token authoring: **1** fill recipe × **2** tiers × **3** intensities = alphas only (≤6 alpha numbers), not 6 full oklch literals × 2 modes.
- Gate: soft no longer an ungated hole.
- Agent surface: zero live docs recommending navy light-mode rim or Lc 25 glass edge.

---

## Next action for implementer

1. Get user approval on this plan (especially Phase 1 alpha matrix and whether Phase 4/5 are in-scope for the same epic).
2. Run Pre-flight baseline.
3. Execute Phase 0 → 1 without mixing playground redesign.

**Out of scope until asked:** implementing P1 media dim or P2 vibrancy in the first PR.
