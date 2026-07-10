# Plan: ADR Maintain — Keep Load-Bearing Decisions, Purge Glass ADRs (WIP surface)

- **Status:** Shipped 2026-07-10
- **Date:** 2026-07-10
- **Owner:** Architecture / design system + AI context layer
- **Skill basis:** `.agents/skills/refactor-plan/SKILL.md`
- **Driver (owner):**
  1. Maintain ADRs so only **important, durable** decisions remain agent-visible.
  2. **Glass is under active development** — glass ADRs currently confuse agents (false doctrine, amendment archaeology, token values mistaken for frozen law).
  3. **Delete glass ADRs completely** from `docs/adr/` (not mere Deprecated).
  4. **Keep one durable product rule:** glass = **floating layers / floating cards only** (thẻ nổi), dense content = solid — owned by **`docs/conventions/design-system.md`**, not by an ADR while WIP.
  5. Align ADR usage with best practice (why hard-to-reverse; not token diary; not WIP visual changelog).
- **Related:** `docs/plans/context-layer-correctness-waves-2026-07.md` (path drift — independent); `docs/plans/glass-modernization-relative-apca-2026-07.md` (implementation — **redirect SSOT away from ADR-0012** after this plan).
- **ADR policy tension (explicit):** `docs/adr/README.md` currently says load-bearing ADRs are **never deleted**. This plan **authorizes a controlled exception** for **WIP visual-language ADRs** that have become agent distractors: delete from tree, preserve in **git history**, re-introduce a **thin** surface-identity ADR only when glass ships and doctrine stabilizes (optional Phase Z). Update README in this plan so policy and reality match.

---

## Goal

| Outcome | Definition |
| --- | --- |
| **G1** | No glass surface-language ADR file under `docs/adr/` (especially **0012**). |
| **G2** | Floating-only rule is **clear, single SSOT** in `docs/conventions/design-system.md` (+ skill pointer), without citing deleted ADR numbers. |
| **G3** | Live agent surfaces (MEMORY, skills, conventions, tests, scripts) **do not** require or cite `ADR-0012` / glass micro-ADR numbers as doctrine. |
| **G4** | `docs/adr/` retains only **important** ADRs (Accepted product/platform/tooling); Deprecated context-layer process ADRs **removed from tree** or quarantined so agents do not treat them as current law. |
| **G5** | `docs/adr/README.md` reflects best-practice bar + purge policy + register regenerated clean. |
| **G6** | Gates green: `bun run ai:check`, design-system doc-drift tests, related glass unit tests that only **comment**-cited ADR updated. |

---

## Non-goals (hard fence)

| Không làm | Vì sao |
| --- | --- |
| Redesign glass CSS / tokens / components in this plan | Purge is **docs + reference hygiene**; visual WIP stays on glass implementation plans |
| Delete `docs/conventions/design-system.md` glass sections | That becomes the **only** living doctrine for placement rules |
| Remove ESLint / APCA / glass unit tests wholesale | Enforcement stays; only **ADR file dependency** and false-doctrine pointers go |
| Delete ADR-0010 platform foundation or ADR-0011 watch-sync | Load-bearing product architecture |
| Delete ADR-0025 solely because tests mention glass-contrast | 0025 = **CSS color pipeline / token-resolver** platform decision — keep, retarget wording if needed |
| Mint a new glass ADR “to replace 0012” in the same PR | Contradicts WIP; optional **Phase Z** after glass stabilizes |
| Rewrite entire design-system.md optical cookbook | Only SSOT clarity for **placement rule** + strip ADR-0012 citations |
| Change P0 security / RLS | Out of scope |
| Raise AI context size budgets | Trim references, don’t bloat |
| Re-open context-layer ADR series as Accepted | History in git; freeze remains |

---

## Constraints & invariants

1. **P0–P4** still win. ADR remain **P3** — explain why, never override gates.
2. **Floating-only invariant (must survive purge):**

   > Glass is reserved for **floating layers / floating cards** (dialogs, sheets, popovers, menus, command palette, toast, chrome floats, OS window chrome, small overlays). **Dense content** (forms, tables, long body text, flat page backgrounds, large shell fills) uses **solid / surface-raised**. Glass needs a **colourful backdrop**; do not put glass on empty flat fills as the only surface.

   This text (or equivalent) **must** live in `docs/conventions/design-system.md` without depending on any ADR file.

3. **Git keeps history:** `git log -- docs/adr/0012-engineered-glass-surface-language.md` remains recovery path. Do **not** rewrite git history.
4. **`docs/plans/archive/**` and old plans** may still mention ADR-0012 — link-rot gate already treats many plan/adr paths specially; **do not** mass-edit archive unless a live test fails. Prefer leave archive as archaeology.
5. **Commit policy:** no commit unless user opts in.
6. **Branch:** `docs/adr-maintain-glass-purge-2026-07` (or owner name) before file deletes.
7. **Number burn:** number **0012** (and already-burned 0014–0020) stay **retired** — do not reuse for unrelated ADRs.

---

## Context (evidence)

### Current `docs/adr/` inventory

| ID | Title | Status | Keep? | Rationale |
| --- | --- | --- | --- | --- |
| 0001 | Structured prompting / model routing | Deprecated | **Remove from tree** | Decision live in harness; process history |
| 0002 | Next.js cache static rules | Accepted | **Keep** | Hard reverse / enforcement scope |
| 0003 | Cursor mdc / Claude permissions defer | Accepted (defer) | **Keep** | Explicit reject/defer prevents re-litigation |
| 0004 | Memory layer hybrid | Deprecated | **Remove** | Live in MEMORY.md model |
| 0008 | Refined command policy | Deprecated | **Remove** | Live in agent-command-policy |
| 0009 | Context layer lean | Deprecated | **Remove** | Live in repo structure + freeze README |
| 0010 | Frontend platform `@pumni/ui` | Accepted | **Keep** | Platform foundation; soft-edit glass pointers |
| 0011 | Watch sync state machine | Accepted | **Keep** | Core product architecture |
| **0012** | **Surface visual language (glass)** | Accepted | **DELETE** | Glass WIP + agent confusion; doctrine → convention |
| 0013 | Context cleanup | Deprecated | **Remove** | Implemented |
| 0021 | Revisit 0010 rejections (catalog/DTCG) | Accepted | **Keep** | Reversal of prior reject; load-bearing |
| 0022 | Keep llms.txt | Accepted | **Keep** | Handshake policy; small |
| 0023 | Context team-scale maturity | Deprecated | **Remove** | Fleet/vector reject already in README note |
| 0024 | Context 2026-07 standards refresh | Deprecated | **Remove** | Live in hooks/agents/skills |
| **0025** | CSS-native color pipeline | Accepted | **Keep** | Token/build pipeline — not glass “look” ADR |
| README | Policy + register | — | **Rewrite** | Best practice + purge exception + register |

### Why 0012 harms agents during glass WIP

- ~17KB consolidated + multi-date amendments (Lc 25 edge true/false, navy rim, blur floors, specular variants).
- Agents treat amendment archaeology as **current law**.
- Token values and optical recipes belong in `theme.css` + `design-system.md` (0012 itself said so) but file still acts as second brain.
- Tests (`glass-hig-primary-source.test.ts`) **require** 0012 file content (B6 dates, HIG pointers) — couples WIP docs to ADR forever.

### Live coupling to remove or retarget

| Location | Coupling |
| --- | --- |
| `scripts/check-ai-context.mjs` `CANONICAL_INVARIANTS` | Canonical path = `docs/adr/0012-...` for glass phrases |
| `scripts/ai-metrics.mjs` | Same invariant paths |
| `docs/conventions/design-system.md` | Many `ADR-0012` citations |
| `.agents/skills/ui-styling/*` | ADR-0012 checklist / reference |
| `docs/ai/MEMORY.md` | Glass bullets → ADR-0012 |
| `apps/web/src/test/design-system/doc-drift.test.ts` | ADR-00NN in design docs must resolve to file |
| `apps/web/src/test/design-system/glass-hig-primary-source.test.ts` | **Reads 0012 file** |
| `packages/ui/src/test/glass-*.test.ts` | Comments cite ADR-0012 |
| `apps/web` design-trends / catalog stories | ADR comments |
| `docs/adr/README.md` | Lifecycle examples point at 0012 consolidation |

---

## Target state

### `docs/adr/` after purge (agent-visible)

```text
docs/adr/
  README.md                          # policy rewritten
  0002-nextjs-cache-static-rules.md
  0003-cursor-claude-settings-permissions.md
  0010-frontend-platform-foundation.md   # glass → design-system pointers
  0011-watch-sync-state-machine-and-observability-seam.md
  0021-revisit-platform-rejections.md    # drop “0012 consolidation” noise if needed
  0022-keep-llms-txt-agentic-handshake.md
  0025-css-native-color-pipeline-modernization.md
```

Optional: `docs/adr/archive/README.md` one-pager: “Deprecated/context ADRs and glass 0012 live only in git; do not restore without owner.”

**Not** present: 0001, 0004, 0008, 0009, 0012, 0013, 0023, 0024, any 0014–0020 files (already absent).

### Surface rule SSOT

`docs/conventions/design-system.md`:

- Anti-slop row + Surface utilities section state floating-only **without** `(ADR-0012)`.
- Optical WIP details may stay but tagged **implementation may change**; agents must not invent Liquid Glass refraction unless convention says so.
- Skill `ui-styling` points at **design-system.md** only for placement.

### When glass stabilizes (Phase Z — out of this execution unless owner opens)

Thin ADR (new number, **not** reusing 0012): “Surface identity: glass for floating layers only; solid for dense content; optical details in design-system.” Alternatives rejected (full Liquid Glass, glass-on-forms). **No token values in ADR.**

---

## Principles

1. **Convention = how (current).** ADR = why (stable). WIP look ≠ ADR.
2. **Delete distractors > Deprecated-in-tree.** Deprecated files still get retrieved by agents.
3. **One floating-only SSOT.** Duplication allowed only as short skill checklist pointing to convention.
4. **Tests enforce product rules, not ADR file existence** (except optional future thin ADR).
5. **Edit references before delete** so `ai:check` / vitest never point at missing paths mid-flight.
6. **Preserve reject rationales** that still matter (agent fleet, vector memory) in `docs/adr/README.md` historical note — already there; keep after removing 0023 file.

---

## Pre-flight

```powershell
# Branch
git checkout -b docs/adr-maintain-glass-purge-2026-07

# Baseline
bun run ai:check 2>&1 | Select-Object -Last 30
bun run ai:eval 2>&1 | Select-Object -Last 20

# Inventory
Get-ChildItem docs/adr -Filter "*.md" | Select-Object Name, Length

# Reference hit list (live)
rg -n "ADR-0012|0012-engineered-glass|docs/adr/0012" --glob "!docs/plans/archive/**" --glob "!node_modules/**"
rg -n "ADR-0009|ADR-0023|ADR-0024|ADR-0001|ADR-0004|ADR-0008|ADR-0013" docs/ai docs/conventions .agents AGENTS.md scripts --glob "!**/archive/**"
```

- [ ] Record whether `ai:check` is green (design-token test errors may still exist from other work — fix only if this plan’s deletes are blocked; do not expand scope to full glass CSS).
- [ ] Confirm owner intent: **delete 0012 from tree** (this plan assumes yes).
- [ ] Confirm 0025 **keep**.

**Exit:** branch + reference inventory saved in agent notes.

---

## Phase 0 — Policy first (README)

### Step 0.1: Rewrite `docs/adr/README.md` for best practice + purge

- **File(s):** `docs/adr/README.md`
- **Action:**
  1. Keep: what ADR is, P3 ranking, when to write / not write, MADR-lite, naming, register sync command.
  2. **When to write** — emphasize: hard-to-reverse, rejected alternative that will return, multi-package convention. **Not:** token tweaks, WIP visual exploration, context-doc reshuffles.
  3. **Lifecycle** — default still status transitions; add **Exception — WIP / agent-confusion purge:**
     - Visual or experimental decisions that polluted agent context may be **removed from `docs/adr/`**.
     - Recovery = git history.
     - Durable *product placement* rules must be promoted to `docs/conventions/*` **before** delete.
     - Numbers remain burned.
  4. Remove “see ADR-0012 consolidation” as the primary example of amend; use generic wording or 0010/0021 supersede example only.
  5. Keep context-layer freeze + `ai:metrics` evidence rule.
  6. Keep / refresh historical note: agent fleet reject + vector memory reject (from 0023) without requiring 0023 file.
  7. Register table will be regenerated in later step — can leave placeholder comment or run sync after deletes.
- **Verification:** human read; no broken policy contradictions.
- **Rollback:** `git checkout -- docs/adr/README.md`
- **Depends on:** none

---

## Phase 1 — Promote floating-only SSOT (before any delete)

### Step 1.1: Harden `docs/conventions/design-system.md` placement rule

- **File(s):** `docs/conventions/design-system.md`
- **Action:**
  1. Anti-slop table row for glass: remove `(ADR-0012)`; keep rule + why (GPU + readability + backdrop).
  2. **Surface utilities** section: lead with explicit **Floating-only (stable product rule)** callout — list allowed surfaces (Dialog, Sheet, Popover, …) and banned (forms, tables, long body, full-page glass backgrounds).
  3. Replace remaining `ADR-0012` citations with either nothing or “see this document”.
  4. For optical WIP (blur, specular, relative fill): optional one-line: **“Optical parameters may change while glass is under development; do not copy historical plan/ADR values.”**
  5. Apple HIG / Material verification dates: if they currently “pin in ADR-0012 §B6”, move **minimal** date stamp into design-system (or drop the cross-pin requirement and fix tests in Phase 3).
  6. Do not paste entire 0012 body into convention.
- **Verification:**  
  `rg -n "ADR-0012" docs/conventions/design-system.md` → empty  
  Floating-only language present.
- **Rollback:** checkout file
- **Depends on:** 0.1 recommended

### Step 1.2: Update `ui-styling` skill + REFERENCE

- **File(s):** `.agents/skills/ui-styling/SKILL.md`, `.agents/skills/ui-styling/REFERENCE.md` (if cites 0012)
- **Action:** Checklist / rules point to `docs/conventions/design-system.md` for glass placement; remove ADR-0012.
- **Verification:** `rg -n "ADR-0012|0012" .agents/skills/ui-styling` → empty; `bun run ai:skills:sync` if description unchanged still OK
- **Rollback:** checkout + sync
- **Depends on:** 1.1

### Step 1.3: MEMORY + any live AI pointers

- **File(s):** `docs/ai/MEMORY.md` (budget ≤2200B)
- **Action:**
  - Surface identity → **only** `design-system.md` (drop ADR-0012).
  - Remove dated glass changelog bullets if still present (or single pointer to design-system).
  - Freeze policy → `docs/adr/README.md`, not Deprecated 0009/0024 files (aligns with correctness-waves B1 if not done).
- **Verification:** size budget; no `0012` in MEMORY
- **Rollback:** checkout
- **Depends on:** 1.1

### Step 1.4: Soft-edit keep ADRs that mention glass/0012

- **File(s):**
  - `docs/adr/0010-frontend-platform-foundation.md` — identity/glass bullets → “surface rules: `docs/conventions/design-system.md`”
  - `docs/adr/0021-revisit-platform-rejections.md` — numbering note about 0014–0020/0012: shorten to “glass micro-ADR numbers 0014–0020 burned; glass surface ADR removed from tree 2026-07 — see git”
  - `docs/adr/0025-...` — ensure decision reads as **token pipeline**, not glass look law; OK to mention `glass-contrast.test.ts` as consumer
- **Verification:** no “read ADR-0012 for current glass doctrine”
- **Rollback:** checkout those files
- **Depends on:** 1.1

### Step 1.5: Retarget script invariants

- **File(s):** `scripts/check-ai-context.mjs`, `scripts/ai-metrics.mjs`
- **Action:** Change canonical paths for glass/solid phrases from `docs/adr/0012-...` → `docs/conventions/design-system.md`. Optionally broaden regex to match “Glass is reserved for floating” language used in convention.
- **Verification:** `bun run ai:check` (or unit path of invariant check); metrics script runs
- **Rollback:** checkout scripts
- **Depends on:** 1.1 (phrase must exist in convention)

---

## Phase 2 — Decouple tests & code comments from ADR-0012

### Step 2.1: Fix `glass-hig-primary-source.test.ts`

- **File(s):** `apps/web/src/test/design-system/glass-hig-primary-source.test.ts`
- **Action (pick one approach — prefer A):**
  - **A (recommended):** Stop reading `docs/adr/0012-...`. Assert only against `docs/conventions/design-system.md` (+ optional skill) for HIG/Material primary-source mentions and tier model wording. Drop “B6 amendment in ADR” requirements.
  - **B:** Delete the test file if owner judges HIG dating theater not worth it during WIP.
- **Verification:** `bun --filter apps/web test src/test/design-system/glass-hig-primary-source.test.ts` (or monorepo equivalent filter)
- **Rollback:** checkout test
- **Depends on:** 1.1 if A needs convention content

### Step 2.2: Fix `doc-drift.test.ts` expectations

- **File(s):** `apps/web/src/test/design-system/doc-drift.test.ts`
- **Action:**
  - Update comment: no longer “consolidated into ADR-0012”.
  - Keep “every ADR-00NN cited in DESIGN_DOCS must exist” — after Phase 1, design docs should cite **zero** missing ADRs; if they cite 0010/0025 only, files remain.
  - Ensure DESIGN_DOCS do not cite 0012 after 1.1–1.2.
- **Verification:** that test file green
- **Depends on:** 1.1–1.2

### Step 2.3: Comment-only retarget in glass tests / app comments

- **File(s):** (non-exhaustive — use `rg` inventory)
  - `packages/ui/src/test/glass-contrast.test.ts`
  - `packages/ui/src/test/glass-performance.test.ts`
  - `packages/ui/src/test/glass-wcag2-bridge.test.ts`
  - `packages/ui/src/test/border-consumption.test.ts` (ADR-0019/0020 comments)
  - `apps/web/src/test/design-system/glass-*.test.ts`
  - `apps/web/src/features/design-trends/*`, `apps/catalog/**` story comments
  - `apps/web/src/features/design-system/components/surfaces-section.tsx` if user-facing “ADR-0012” copy
- **Action:** Replace “per ADR-0012” with “per design-system floating-only rule” or “glass placement convention”. Do **not** change assertions unless they load ADR file paths.
- **Verification:** `rg -n "ADR-0012|docs/adr/0012" apps packages --glob "!**/archive/**"` → ideally empty (comments OK to say “historical ADR-0012 removed” once, not doctrine)
- **Depends on:** 1.1

---

## Phase 3 — Delete glass ADR + remove non-important ADRs from tree

### Step 3.1: Delete glass surface ADR

- **File(s):** `docs/adr/0012-engineered-glass-surface-language.md`
- **Action:** `git rm` (preferred) so history records deletion.
- **Verification:** file absent; `Test-Path` false
- **Rollback:** `git checkout HEAD~1 -- docs/adr/0012-...` or recover from git
- **Depends on:** Phase 1 + 2 complete (no live required reference)

### Step 3.2: Remove Deprecated context-layer / process ADRs from tree

- **File(s):**
  - `docs/adr/0001-structured-prompting-and-model-routing.md`
  - `docs/adr/0004-memory-layer-harness-managed.md`
  - `docs/adr/0008-refined-command-policy.md`
  - `docs/adr/0009-context-layer-lean-2026.md`
  - `docs/adr/0013-context-layer-cleanup-2026-06.md`
  - `docs/adr/0023-context-layer-team-scale-maturity.md`
  - `docs/adr/0024-context-layer-2026-07-standards-refresh.md`
- **Action:** `git rm` each. Rationale: decisions live in repo; keeping Deprecated in-tree fails “ADR best practice for agents” (retrieval distractors).
- **Verification:** only keep-list remains (+ README)
- **Rollback:** restore from git
- **Depends on:** 1.3 MEMORY no longer requires those paths; `rg` live docs for paths

### Step 3.3: Fix remaining live links to deleted ADRs

- **File(s):** whatever `rg` still finds under `docs/ai`, `docs/conventions`, `.agents`, `scripts`, `AGENTS.md`, `llms.txt`, **non-archive** plans that agents load
- **Action:** Retarget to README / conventions / skills. Active plan `glass-modernization-*.md` and `context-layer-correctness-waves-*.md`: add banner at top:

  > **ADR-0012 removed (2026-07).** Floating-only rule SSOT = `docs/conventions/design-system.md`. Do not restore 0012 while glass is WIP.

  Optionally leave body historical references with strikethrough note — or light replace. Prefer **banner + leave archive plans alone**.
- **Verification:**  
  ```powershell
  rg -n "docs/adr/0012|0009-context-layer|0024-context-layer" docs/ai docs/conventions .agents scripts AGENTS.md llms.txt
  # should be empty
  ```
- **Depends on:** 3.1–3.2

### Step 3.4: Regenerate ADR register

- **File(s):** `docs/adr/README.md` (register block)
- **Action:** `bun run ai:adr:sync` (or documented `scripts/sync-adr-register.mjs`)
- **Verification:** register lists only remaining files; no 0012; status lines clean (no broken markdown from prior 0008 glitch)
- **Depends on:** 3.1–3.2

---

## Phase 4 — Verification cluster & DoD

### Step 4.1: Full verification

```powershell
bun run ai:check
bun run ai:eval
bun run ai:metrics

# Design-system tests
bun --filter @pumni/web test -- src/test/design-system/doc-drift.test.ts
bun --filter @pumni/web test -- src/test/design-system/glass-hig-primary-source.test.ts
# Adjust package name/filter to match repo scripts if different

# No ADR-0012 file
Test-Path docs/adr/0012-engineered-glass-surface-language.md  # expect False

# Keep set
Get-ChildItem docs/adr -Filter "*.md" | Select-Object Name
```

- [ ] `ai:check` 0 ERROR (or only pre-existing unrelated — do not ignore new missing-path errors from this purge)
- [ ] doc-drift + hig tests green
- [ ] Floating-only rule findable in design-system without ADR
- [ ] Register matches disk

### Step 4.2: Execution report

- List deleted files, keep files, SSOT quote of floating-only rule.
- Note Phase Z optional thin ADR when glass freezes.
- Risks / follow-up (playground still teaching old doctrine? → separate glass plan).

---

## Phase Z — Optional later (NOT this PR unless owner opens)

**When:** glass optical pipeline declared stable by owner.  
**Then:** add thin Accepted ADR (new number):

- Decision: floating-only + solid dense; no Liquid Glass refraction on web (if still true).
- Explicit: token values & recipes → design-system only.
- Alternatives: glass everywhere; ADR-as-token-changelog.
- **Do not** revive 0012 text dump.

---

## Definition of Done

1. `docs/adr/0012-engineered-glass-surface-language.md` **gone**.
2. Deprecated context ADRs in Step 3.2 **gone**.
3. Keep set = 0002, 0003, 0010, 0011, 0021, 0022, 0025 + README (names exact on disk).
4. Floating-only rule **only** depends on `design-system.md` (+ skill pointer).
5. `CANONICAL_INVARIANTS` / metrics point at design-system for glass phrases.
6. Tests no longer require 0012 file content.
7. README documents purge exception + best-practice bar.
8. `bun run ai:check` and targeted design-system tests green.
9. Plan status → **Shipped YYYY-MM-DD**.

---

## Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Loss of “why” archaeology for glass | Git history; plans/archive; optional Phase Z thin ADR later |
| Policy “never delete” conflict | Step 0.1 documents exception before delete |
| doc-drift fails on leftover ADR-0012 cite | Phase 1 greps to zero before delete |
| glass-hig test tightly coupled | Step 2.1 rewrite or remove |
| Agents still open archive plans mentioning 0012 | Banner on active glass plan; archive low priority; untrusted plans already policy |
| Over-delete 0025 | Keep explicitly in table |
| 0010 still “glass identity” confuses | Soft-edit to convention pointer |
| `ai:check` path refs in MEMORY to deleted ADR | Phase 1.3 before 3.x |
| Team wants 0012 back mid-WIP | Stop-and-ask; do not restore full body — use convention |

---

## Execution order (DAG)

```text
0.1 README policy
    ↓
1.1 design-system SSOT → 1.2 skill → 1.3 MEMORY → 1.4 keep-ADR soft edits → 1.5 scripts
    ↓
2.1 hig test → 2.2 doc-drift → 2.3 comment sweep
    ↓
3.1 rm 0012 → 3.2 rm deprecated context ADRs → 3.3 link fix → 3.4 adr:sync
    ↓
4.1 verify → 4.2 report
```

**Forbidden:** delete 0012 before 1.x + 2.x.  
**Parallel:** 1.2 ∥ 1.3 after 1.1; 2.3 can start after 1.1.

---

## Agent checklist

```text
[ ] Read this plan + docs/adr/README.md + design-system.md surface section
[ ] Branch created
[ ] Pre-flight rg inventory
[ ] 0.1 README
[ ] 1.1 → 1.5
[ ] 2.1 → 2.3
[ ] 3.1 → 3.4
[ ] 4.1 gates green
[ ] No commit unless user asked
[ ] Status: Shipped
```

---

## Appendix A — Keep vs delete cheat sheet

| Keep | Delete from tree |
| --- | --- |
| 0002 Cache rules | 0001 Prompting/routing (Deprecated) |
| 0003 Cursor/Claude defer | 0004 Memory hybrid (Deprecated) |
| 0010 UI platform | 0008 Command policy (Deprecated) |
| 0011 Watch sync | 0009 Context lean (Deprecated) |
| 0021 Catalog/DTCG reopen | **0012 Glass surface language** |
| 0022 llms.txt | 0013 Context cleanup (Deprecated) |
| 0025 Color pipeline | 0023 Context maturity (Deprecated) |
| README | 0024 Context standards refresh (Deprecated) |

## Appendix B — Floating-only canonical wording (paste target)

Use or adapt in `design-system.md`:

```markdown
## Glass placement (stable product rule)

**Glass = floating layers only** (overlays and chrome that sit *above* content):
Dialog, Sheet, Popover, DropdownMenu, ContextMenu, Command palette, Toast,
floating topbar/dock/sidebar rail chrome, OS `Window` titlebar, small floating
pills. Glass must sit over a **colourful / media / blob backdrop** so frost reads.

**Solid (`surface-raised` / opaque shell) = dense content and flat backgrounds:**
forms, tables, long reading text, full-page backgrounds, large content cards on
flat fills.

Do **not** use glass for primary form surfaces or long body text. Optical token
values may change while glass is under development — follow `theme.css` /
this document, not historical ADRs or archived plans.
```

## Appendix C — Mapping owner intents → steps

| Owner intent | Steps |
| --- | --- |
| Chỉ giữ ADR quan trọng | 3.2, 3.4, 0.1 |
| Glass = thẻ/lớp nổi | 1.1, 1.2, Appendix B |
| Xóa hết ADR glass (AI đừng nhầm) | 1.x → 2.x → **3.1** |
| Best practice ADR | 0.1, keep table, Phase Z later |

---

*End of plan. Path: `docs/plans/adr-maintain-glass-purge-2026-07.md`. Execute surgically; glass CSS implementation remains on glass modernization plans with SSOT retargeted to `design-system.md`.*
