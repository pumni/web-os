# Plan: Glass modern-standard hardening + consumer alignment

- **Status:** Draft — awaiting user confirm before implementation
- **Date:** 2026-07-10
- **Owner:** `@pumni/ui` design system + production glass consumers
- **Skills used:** `grill-requirements` (spec) → hybrid execution plan (`refactor-plan` template; **includes intentional optical/a11y behavior changes**)
- **Research basis:** Prior session research vs W3C CSS Color 4/5, APCA Nutshell / APC-RC Bronze, MDN/web.dev `backdrop-filter`, Apple HIG Materials (Liquid Glass clear/regular), Material 3 elevation/scrim; repo inventory 2026-07-10
- **Predecessor (shipped, not re-done):** `docs/plans/glass-modernization-relative-apca-2026-07.md`  
  (relative `--glass-fill`, soft/strong APCA, doc cleanup — **still open P1/P2 + new P0 bug**)

---

## Outcome (one sentence)

Bring Pumni engineered frosted glass to **2026-standard a11y wiring + material vocabulary + consumer honesty**, without adopting Apple Liquid Glass refraction, by fixing broken contrast preferences, tightening stack discipline, optionally adding clear+dim / on-glass text, and aligning every production consumer to the closed surface set.

---

## Spec (grill-requirements)

### In scope

| ID | Item | Type |
| --- | --- | --- |
| **S1** | Fix `prefers-contrast: more` + in-app preview so **chrome + readable** tints densify (not only dead alias `--glass-tint`) | Bugfix |
| **S2** | Characterization + regression tests for a11y fallbacks (contrast / reduced-transparency / `@supports`) | Test |
| **S3** | Document + enforce BF stack budget: `overlay-scrim` + one glass shell = 2; no nested glass | Policy + audit |
| **S4** | Consumer audit & surgical fixes: shell layout, overlays, OS window/dock, auth shell, Card glass variants | Align |
| **S5** | Optional P1: `--glass-media-dim` + clear-chrome recipe **with one real consumer** (or defer explicitly) | Feature |
| **S6** | Optional P2: `--on-glass` / `--on-glass-muted` APCA-gated + apply to short chrome labels where needed | Feature |
| **S7** | Optical-proxy improvement in `glass-contrast` (apply brightness/saturate approx to backdrop before composite) | Gate quality |
| **S8** | Grain doctrine decision (simple-only stays documented **or** shared opt-in) + playground not teaching false doctrine | Cleanup |
| **S9** | Update `docs/conventions/design-system.md`, ui-styling skill, MEMORY if doctrine changes | Docs |

### Out of scope (hard fence)

| Do not | Why |
| --- | --- |
| Apple Liquid Glass refraction / lensing / chromatic aberration | GPU + text clarity; platform rejection |
| WCAG 2.x ratio as primary glass gate | Dark mode + dynamic backdrop; keep optional bridge audit only |
| APCA gate on specular `--glass-edge*` | Light rim, not control boundary |
| Blur ladder outside **12 / 16 / 20 / 24** or raise cap | Identity |
| Glass on forms / tables / multi-line body | Body → solid `DialogBody` / `CardWell` |
| Runtime Color.js / oklch.com in app bundle | Authoring-only |
| Redesign brand coral / accent palette | Unrelated |
| Schema / Supabase / server packages | No data surface |
| New ADR number for this | Amend design-system SSOT; ADR-0012 already burned/removed from tree |
| Broad visual redesign of playground demos beyond false-doctrine removal | Scope control |

### Explicit assumptions (confirm or override)

| # | Assumption | Default |
| --- | --- | --- |
| A1 | **Phase 0–2 ship first** (a11y fix + stack audit + consumer align); P1 media-dim and P2 on-glass only if product needs media chrome / short labels fail optical gate | **Yes — staged** |
| A2 | Soft/strong **alpha matrix stays** unless S7 optical proxy proves soft fails Lc 60 — then raise α by 0.02 steps, never lower Lc floor | **Yes** |
| A3 | Grain remains **simple-only** unless a production consumer needs it (no dead utility) | **Yes — keep simple-only** |
| A4 | One PR per phase preferred; no commit unless user asks | **Yes** |
| A5 | Watch/sky-player media chrome is the only candidate for S5 consumer; if none ready, **defer S5** with explicit note (no orphan token) | **Defer unless watch chrome in same sprint** |
| A6 | `--on-glass` only if S7 or production chrome labels need L-boost; otherwise document “`--foreground` sufficient under current α” | **Spike then ship or defer** |

### Acceptance criteria (falsifiable)

1. Under `prefers-contrast: more` (and `glass-a11y-preview[data-contrast=more]`), **every** glass utility background that uses `--glass-tint-readable` or `--glass-tint-chrome` densifies toward popover (or equivalent solid path); a static CSS/unit test fails if only `--glass-tint` is overridden.
2. `prefers-reduced-transparency` and `@supports not (backdrop-filter…)` still force solid fallback on the full utility list (panel, simple, window, bars, titlebar).
3. Inventory table of production glass consumers exists in this plan (or design-system) and each row is either **compliant** or has a linked fix step — no silent “grey box glass on flat fill” in shell routes.
4. Dialog / Sheet / AlertDialog / Command: at most **two** `backdrop-filter` layers (scrim + shell); no glass child forcing a third BF pass.
5. `glass-contrast` remains green for default + soft + strong, both modes, chrome + readable, blobs + high-chroma synthetics, Lc ≥ 60; if S7 lands, optical-proxy cases green too.
6. Docs/skill state the same doctrine; no reintroduction of Lc 25 edge gate or blur 8–16 SSOT.
7. Gates: `bun run --filter @pumni/ui test glass-contrast glass-performance border-consumption` green; after CSS/consumer edits `bun run --filter @pumni/ui typecheck`; context edits `bun run ai:check`.

### Verification gate (narrowest → wider)

| Scope | Command |
| --- | --- |
| Tokens / a11y CSS / contrast | `bun run --filter @pumni/ui test glass-contrast glass-performance border-consumption` |
| Full UI package | `bun run --filter @pumni/ui test` + `typecheck` |
| Web shell consumers | `bun run --filter @pumni/web test` (design-system glass tests) or targeted paths |
| Docs / skills | `bun run ai:check` |
| Pre-merge (end of program) | `bun run ai:premerge` or scoped premerge per policy |

### Security

No RLS / secrets / server-only. UI tokens and client components only. P0 security mandates unchanged.

---

## Context — current state (evidence)

### Pre-flight baseline (2026-07-10)

```
bun run --filter @pumni/ui test glass-contrast glass-performance border-consumption
→ 143 tests passed (glass-contrast 121, border-consumption 18, glass-performance 4)
```

Record as **known-good baseline** before Phase 0 code changes.

### What already works (do not regress)

| Area | Evidence |
| --- | --- |
| `--glass-fill` + relative chrome/readable | `packages/ui/src/styles/theme.css` ~164–170 |
| soft/strong alpha-only personalization | `personalization.css` `[data-glass=…]` |
| Filter stack blur+sat+bright | `glass.css` utilities |
| APCA Lc 60 soft+strong+default | `glass-contrast.test.ts` |
| Floating-only doctrine | `docs/conventions/design-system.md` |
| Solid body wells | `DialogBody` in `dialog.tsx` |
| Reduced transparency solid path | `glass.css` `@media (prefers-reduced-transparency)` |

### Confirmed gaps

| ID | Gap | Evidence |
| --- | --- | --- |
| **G-a11y** | `prefers-contrast: more` sets only `--glass-tint`; panel/window/simple/bars use `--glass-tint-readable` / `--glass-tint-chrome` | `glass.css:62,131,179,269+` vs `389–398`, `475` |
| **G-proxy** | Contrast composite ignores `brightness`/`saturate` on backdrop | `glass-contrast.test.ts` `composite()` |
| **G-clear** | No media dim + clear recipe (Apple clear-over-rich) | no `--glass-media-dim` |
| **G-vibrant** | No `--on-glass*` text tokens | semantic `--foreground` only |
| **G-grain** | Dual optical language panel vs simple | `glass-performance.test.ts` pins grain to simple |
| **G-inactive** | Inactive window still uses `--glass-tint` alias (works by accident; should track readable explicitly for contrast-more) | `glass.css:247–257` |
| **G-stack** | Scrim+panel is already 2 BF; nested glass risk in composition | Dialog/Sheet/Command patterns |

### Production consumer inventory (audit target)

| Consumer | Path | Utility / API | Expected role | Audit action |
| --- | --- | --- | --- | --- |
| Dialog content | `packages/ui/src/components/overlay/dialog.tsx` | `glass-panel` + `overlay-scrim` | Readable shell | Confirm DialogBody solid; stack=2 |
| AlertDialog | `…/alert-dialog.tsx` | same | Readable shell | same |
| Sheet | `…/sheet.tsx` | same | Readable shell | same |
| Command palette | `…/command-palette.tsx` | same | Readable shell | same |
| Popover / Dropdown / ContextMenu | overlay components | `glass-panel` | Readable short UI | No multi-line bare glass |
| Select content | `…/form/select.tsx` | `glass-panel` | Readable short UI | same |
| Toast (Sonner) | `…/feedback/sonner.tsx` | `glass-panel` | Readable chrome | Ensure short copy only |
| Window shell | `…/os/window.tsx` | `glass-window` | Readable shell | Titlebar: no second full BF if nested |
| Dock | `…/os/dock.tsx` | `glass-bar-bordered` | Chrome | Keep chrome tier |
| App topbar | `apps/web/src/app/(app)/layout.tsx` | `glass-bar-edge-b` | Chrome | Backdrop: desktop/blobs? |
| Auth shell | `apps/web/src/app/(public)/auth-shell.tsx` | `GlassSurface` (panel) | Readable | **Must** have colourful/media backdrop or switch solid |
| Card | `…/layout/card.tsx` | `glass` / `glassSimple` | Feature/hero only | Docs + playground only unless blob wrapper |
| Design system showcase | `apps/web/.../design-system/*` | GlassSurface + Card glass | Demo | Align captions to doctrine |
| Design-trends playground | `apps/web/.../design-trends/*` | custom + GlassSurface | Playground | No false doctrine (navy rim, etc.) |
| Catalog stories | `apps/catalog/.../glass-surface.stories.tsx` | GlassSurface | Story | Backdrop requirement in story |

---

## Target state

1. **A11y path complete:** reduced-transparency, prefers-contrast, forced-colors, `@supports` all recolor **the same CSS variables the utilities read** (`--glass-tint-chrome`, `--glass-tint-readable`, and alias `--glass-tint` kept in sync).
2. **Material map stable:**
   - chrome → bars / titlebar / dock / topbar  
   - readable → panels / windows / menus / dialogs  
   - solid → body content  
   - (optional) clear+dim → media chrome only  
3. **Contrast science:** unit gate remains APCA Lc 60; optional optical proxy applies filter knobs to backdrop RGB before alpha composite (documented as approximation, not full browser BF).
4. **Consumers:** every production glass usage sits on a valid backdrop or is converted to solid; overlays stay ≤2 BF layers.
5. **Docs:** design-system + skill match code; predecessor plan marked “followed by this plan” for P0–P2 leftovers.

---

## Constraints & invariants

- Token tiers: primitive → semantic → component; components never raw OKLCH.
- Color via `light-dark()` at `:root`; `.dark` only non-color (blur/sat/bright/grain/shadow).
- Relative Color 5 grammar per existing token-resolver / ADR-0025 limits.
- Stacked `backdrop-filter` ≤ 2; never animate `backdrop-filter`.
- Lc 60 = chrome/short-text only; body Lc 75+ on solid only.
- Prefer surgical edits; no drive-by refactors outside inventory.
- Branch off `main`; do not implement until user confirms this plan.

---

## Phases & steps

### Phase 0 — Pre-flight & characterization (no product CSS change yet)

#### Step 0.1: Branch

- **File(s):** git only  
- **Action:** `git checkout -b feat/glass-modern-standard-hardening` (or user-chosen name)  
- **Verification:** `git status` on branch, clean or known WIP only  
- **Rollback:** delete branch  
- **Depends on:** user confirm  

#### Step 0.2: Re-run baseline and pin in plan

- **Action:** Re-run glass unit trio; paste pass counts if drift  
- **Verification:** same command as pre-flight, all green  
- **Depends on:** 0.1  

#### Step 0.3: RED characterization tests for prefers-contrast wiring

- **File(s):** `packages/ui/src/test/glass-a11y-fallbacks.test.ts` (new) and/or extend `glass-performance.test.ts`  
- **Action:**  
  1. Parse `glass.css`: assert that within `@media (prefers-contrast: more)` **and** `.glass-a11y-preview[data-contrast='more']` blocks, **both** `--glass-tint-chrome` and `--glass-tint-readable` are assigned denser values (or utilities set `background` to fallback).  
  2. Assert `--glass-tint` remains aliased/synced if kept.  
  3. Assert reduced-transparency still sets solid `background: var(--glass-fallback-bg)` (or equivalent) for full utility list.  
- **Verification:** `bun run --filter @pumni/ui test glass-a11y-fallbacks` — **expect RED** until Phase 1  
- **Rollback:** delete test file  
- **Depends on:** 0.2  

---

### Phase 1 — P0 a11y fix (ship first)

#### Step 1.1: Fix prefers-contrast + preview overrides

- **File(s):** `packages/ui/src/styles/glass.css` (~389–408, ~467–483)  
- **Action:** In both contrast-more contexts:  
  ```css
  --glass-tint-chrome: color-mix(in oklch, var(--popover) 92%, transparent);
  --glass-tint-readable: color-mix(in oklch, var(--popover) 92%, transparent);
  --glass-tint: var(--glass-tint-readable);
  border-color: var(--border);
  /* keep bevel/reflection disabled as today */
  ```  
  Optionally also densify inactive-window mixes by relying on updated vars.  
  Do **not** drop backdrop-filter unless reduced-transparency (contrast-more = denser glass, not necessarily solid — match current intent).  
- **Verification:** Step 0.3 tests **GREEN**  
- **Rollback:** restore glass.css a11y section  
- **Depends on:** 0.3  

#### Step 1.2: Align inactive window to readable SSOT

- **File(s):** `glass.css` inactive window rules (~246–261)  
- **Action:** Prefer `var(--glass-tint-readable)` over `var(--glass-tint)` in color-mix so contrast-more and personalization cannot desync.  
- **Verification:** glass-a11y + glass-contrast + border-consumption green  
- **Depends on:** 1.1  

#### Step 1.3: Comment strip + design-system one-liner

- **File(s):** `glass.css` header comment; `docs/conventions/design-system.md` a11y glass paragraph  
- **Action:** Document that contrast-more rewrites chrome **and** readable fill tokens.  
- **Verification:** `bun run ai:check` if docs touched  
- **Depends on:** 1.1  

---

### Phase 2 — Stack discipline + consumer alignment

#### Step 2.1: Stack budget static audit test

- **File(s):** extend `packages/ui/src/test/glass-performance.test.ts` or new `glass-stack-budget.test.ts`  
- **Action:** For Dialog/Sheet/AlertDialog/Command source strings: count that overlay uses `overlay-scrim` once and content uses one of `glass-panel|glass-window` once; fail if both `glass-panel` and nested `glass-bar`/`glass-titlebar` with BF appear on same component tree **when titlebar is a second full utility** (Window currently avoids titlebar BF — pin that pattern).  
- **Verification:** new test green  
- **Depends on:** Phase 1 complete  

#### Step 2.2: Auth shell backdrop honesty

- **File(s):** `apps/web/src/app/(public)/auth-shell.tsx` (+ any parent layout background)  
- **Action:** If glass sits on flat solid page fill → either add approved blob/media wrapper **or** switch to solid `Card` / opaque surface. Prefer solid for auth forms (dense content rule).  
- **Verification:** visual + web typecheck; document choice in PR notes  
- **Depends on:** 2.1  

#### Step 2.3: App topbar / dock / window spot-check

- **File(s):** `apps/web/src/app/(app)/layout.tsx`, `packages/ui/.../dock.tsx`, `window.tsx`  
- **Action:** Confirm chrome utilities over desktop ambience; fix any ad-hoc `backdrop-blur-*` or raw glass CSS outside utilities.  
- **Verification:** `rg` clean for forbidden patterns in apps/web production routes (exclude playground if documented)  
- **Depends on:** 2.1  

#### Step 2.4: Overlay multi-line body enforcement spot-check

- **File(s):** dialog/sheet usages in `apps/web` that put long copy inside glass without `DialogBody`  
- **Action:** Wrap multi-line body in solid well where found (surgical).  
- **Verification:** targeted component tests or lint manual; no new ad-hoc wells (`CardWell` / `DialogBody`)  
- **Depends on:** 2.1  

#### Step 2.5: Showcase + catalog captions

- **File(s):** design-system surfaces section, glass-surface stories  
- **Action:** Captions state chrome vs readable; require colourful backdrop in stories.  
- **Verification:** typecheck; no false “glass on flat = fine”  
- **Depends on:** 2.1  

---

### Phase 3 — Gate quality (S7 optical proxy)

#### Step 3.1: Helper `compositeGlass(fg, bg, { brightness, saturate })`

- **File(s):** `packages/ui/src/test/glass-contrast.test.ts` and/or `packages/ui/src/lib/` test-only helper  
- **Action:** Approximate: convert bg to sRGB → apply brightness scale → apply saturate toward luma → alpha composite tint → APCA with foreground. Use token `--glass-brightness` / `--glass-saturate` resolved per mode. Document as **approximation**, not browser BF.  
- **Verification:** Existing cases still pass; add at least one synthetic where proxy differs from raw composite (characterization). If soft fails, open Step 3.2.  
- **Depends on:** Phase 1–2  

#### Step 3.2: (Conditional) Raise soft α floors

- **File(s):** `personalization.css`, design-system alpha matrix  
- **Action:** Only if 3.1 fails Lc 60 — bump soft α by 0.02 until green; update docs matrix.  
- **Verification:** glass-contrast green  
- **Depends on:** 3.1 red  

---

### Phase 4 — Optional P1 media clear + dim (only with consumer)

#### Step 4.1: Product decision gate

- **Action:** User confirms watch/media chrome needs clear glass this sprint. If **no** → mark S5 deferred in plan footer; stop Phase 4.  
- **Depends on:** Phase 1–2  

#### Step 4.2: Tokens + composition doc

- **File(s):** `theme.css`, `design-system.md`  
- **Action:** `--glass-media-dim` mode-aware; document stack: media → dim → chrome clear (lower α) → short labels.  
- **Verification:** token-resolver + contrast if tint clear is gated  
- **Depends on:** 4.1 yes  

#### Step 4.3: One consumer exemplar

- **File(s):** agreed media chrome component  
- **Action:** Implement recipe once; no unused utility.  
- **Verification:** component test or visual checklist + typecheck  
- **Depends on:** 4.2  

---

### Phase 5 — Optional P2 on-glass text (spike → ship or defer)

#### Step 5.1: Spike

- **File(s):** glass-contrast experiments only  
- **Action:** Compare `--foreground` vs L-boosted candidates on readable composite (default/soft/strong × modes). Ship only if Lc margin &lt; 5 or product wants vibrancy.  
- **Verification:** spike table in PR / plan appendix  
- **Depends on:** Phase 3 preferred  

#### Step 5.2: (Conditional) Add tokens + apply to chrome labels

- **File(s):** `theme.css`, shell topbar/dock text classes, skill  
- **Action:** `--on-glass` / `--on-glass-muted`; components use semantic utilities only.  
- **Verification:** glass-contrast gates new pairs; typecheck  
- **Depends on:** 5.1 ship decision  

---

### Phase 6 — Grain doctrine + playground false-doctrine pass

#### Step 6.1: Document grain = simple-only (default A3)

- **File(s):** design-system, glass.css comment, glass-performance test comment  
- **Action:** Explicit “production shell uses panel/window; simple = textured card/lab variant”  
- **Verification:** ai:check  
- **Depends on:** Phase 1  

#### Step 6.2: Playground audit

- **File(s):** `apps/web/src/features/design-trends/glass-playground.tsx` (+ primitives if any)  
- **Action:** Remove teaching of navy rim / forbidden blur ladders / edge Lc gates; align with production or label experimental.  
- **Verification:** playground still runs; no contradicted doctrine in UI copy  
- **Depends on:** 6.1  

#### Step 6.3: Predecessor plan pointer

- **File(s):** `glass-modernization-relative-apca-2026-07.md` header  
- **Action:** Add “Successor for remaining P0–P2: this plan”  
- **Verification:** none  
- **Depends on:** none  

---

## Testing strategy

| Layer | When |
| --- | --- |
| Characterization RED→GREEN (a11y) | Phase 0–1 |
| glass-contrast / performance / border | Every CSS phase |
| Stack budget static test | Phase 2 |
| Optical proxy | Phase 3 |
| Web design-system tests | After consumer edits |
| ai:check | Docs/skills |
| Full premerge | Program complete |

---

## Definition of Done

- [ ] User confirmed assumptions A1–A6 (or recorded overrides)
- [ ] Branch exists; baseline recorded green then preserved
- [ ] G-a11y fixed; characterization tests green
- [ ] Consumer inventory resolved (compliant or fixed)
- [ ] Stack budget pinned for overlay quartet
- [ ] S5/S6 either shipped with consumer **or** explicitly deferred in plan footer
- [ ] Optical proxy landed **or** deferred with reason
- [ ] design-system + skill + MEMORY (if needed) agree
- [ ] Gates green for change scope; no unrelated diffs

---

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Contrast-more denser tint still fails real media | Pair with reduced-transparency path; optional later on-glass |
| Optical proxy false failures | Document approximation; tune only soft α; don't invent full BF simulator |
| Auth shell solid switch feels “less premium” | Dense form content wins over glass (HIG + existing doctrine) |
| Scope creep into Liquid Glass demos | Out-of-scope fence; playground only false-doctrine cleanup |
| Agent re-reads archived glass plans | Point MEMORY/design-system to this plan + shipped modernization only |

---

## Rollback

| Phase | Rollback |
| --- | --- |
| 0 | delete tests / branch |
| 1 | restore `glass.css` a11y blocks |
| 2 | revert consumer files surgically |
| 3 | revert test helper; leave production CSS |
| 4–5 | revert tokens + single consumer |

---

## Recommended default path (if user says “ship the defaults”)

1. Phase 0–1 (a11y)  
2. Phase 2 (stack + consumers, esp. auth-shell honesty)  
3. Phase 3 (optical proxy)  
4. Phase 6 (docs/playground)  
5. **Defer** Phase 4–5 unless watch media chrome is in sprint  

---

## Confirm checklist (user)

Reply with overrides if needed; otherwise “confirm defaults” to start Phase 0:

- [ ] A1 staged ship (0–2 first)
- [ ] A3 grain simple-only
- [ ] A5 defer media-dim unless named consumer
- [ ] A6 spike on-glass after proxy
- [ ] Branch name OK: `feat/glass-modern-standard-hardening`
