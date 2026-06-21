# Context Layer Lean — Execution Plan (2026-06-22)

- **Status:** ready-to-execute
- **Owner:** AI context layer (`docs/ai/index.md`)
- **Goal:** Cut ~4,000 lines of ceremony and reduce per-task token cost without
  weakening any security/quality gate. Encode the karpathy-skills working
  principles that the layer currently lacks.

This plan is **self-contained and prescriptive**: another agent can execute it
top-to-bottom without re-deriving context. Every task lists exact file ops, the
literal text to insert, and the gate-safety constraint that must hold.

---

## Global guardrails (read before touching anything)

These are invariants. Violating one breaks `bun run ai:check` / `bun run ai:eval`.

1. **`manifest.requiredFiles`** (`scripts/ai-context.manifest.json`) lists files
   that MUST exist. None of the ADRs or plans being moved are in it — safe. But
   do not delete any file that IS listed: `common-mistakes.md`, `MEMORY.md`,
   `golden-examples.md`, all `docs/conventions/*`, `docs/ai/*`, the skills,
   `review-gate.md`, `quality-gates.md`.
2. **Frontmatter-required files** keep their `---` block with `description:` +
   `when-to-load:`. Trimming body is fine; removing frontmatter fails the gate.
3. **`review-gate.md` must keep** the `## Static Rule Inventory` heading AND the
   literal string `review-gate-rules.mjs` inside it (`checkRuleInventory`).
4. **`AGENTS.md` must stay < 6000 bytes** (`sizeBudgets`). It is 4377 now; the
   Working Principles block below adds ~620 bytes → ~5000. OK. Re-check after.
5. **`docs/ai/index.md` < 5000 bytes; `MEMORY.md` < 5000 bytes** (`sizeBudgets`).
   Both edits below only shrink them.
6. **`indexRequiredReferences`** requires `docs/ai/index.md` to keep mentioning
   each listed path/string. Do not remove rows from `index.md` for those.
7. The link checker (`checkMarkdownLinks` / `checkDocPathReferences`) **excludes**
   `docs/plans/` and `docs/adr/`, so moving files there does not create link-rot
   errors — BUT enforced docs (`docs/ai/*`, `docs/conventions/*`, `AGENTS.md`)
   that point at a moved/deleted path WILL fail. Grep for back-references before
   deleting (each task says where).
8. After **every** task that touches the context layer, run
   `bun run ai:check` then `bun run ai:eval`. Both must pass before the next task.

---

## Task A — Consolidate the glass/surface ADRs (0012–0020 → one)

**Why:** ADR-0012…0020 are 9 ADRs minted over 2 days (2026-06-20/21) for
reversible CSS-token tuning (blur 12→16px, sheen removal, specular-rim drop).
0018 was amended by 0020 and 0014 by 0016 within the same window. They violate
the ADR bar in `docs/adr/README.md` ("hard to reverse… spans multiple
packages… do NOT write for cosmetic"). The durable token values already live in
`docs/conventions/design-system.md` (the living SoT).

**Policy note (deliberate rule change, see Task E):** the README currently says
"never delete an ADR." We narrow that: *load-bearing* ADRs are never deleted;
*cosmetic/same-week superseded* ones may be squashed into one consolidated ADR,
with git preserving the originals. This is intentional and surfaced.

### Steps

1. **Rewrite `docs/adr/0012-engineered-glass-surface-language.md` in place** as
   the single consolidated record. Keep the `0012` number (lowest of the group,
   monotonic numbering preserved). New content:

   ```markdown
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
   ```

2. **Delete files** `docs/adr/0013-…md` through `docs/adr/0020-…md` (8 files).
   Git history preserves them.

3. **Verify no enforced doc points at the deleted ADR paths.** Run:
   `rg -n "001[3-9]-|0020-" docs/ai docs/conventions docs/architecture AGENTS.md apps/web/AGENTS.md packages/*/AGENTS.md .agents`
   - `common-mistakes.md` links `apps/web/AGENTS.md` for cache, not these — OK.
   - If any enforced doc references `0013`–`0020`, repoint it to `0012` or to
     `docs/conventions/design-system.md`. (`docs/adr/*` and `docs/plans/*` hits
     are excluded from the gate — ignore those.)

4. **Update `docs/adr/README.md` index** (Task E covers the structural change;
   here just ensure the index lists only `0001`–`0012` after the squash).

5. Run `bun run ai:check` + `bun run ai:eval`.

---

## Task B — Archive completed context-meta plans

**Why:** `docs/plans/` holds ~2,100 lines of finished/superseded meta-planning
about the context layer itself (the over-optimization smell).

### Steps

1. `mkdir docs/plans/archive` (use the editor/file tool; on PowerShell:
   `New-Item -ItemType Directory -Force docs/plans/archive`).
2. **Move these 4 files** into `docs/plans/archive/` (all superseded by
   ADR-0009; statuses confirmed: phase-4-done / ready-to-execute-but-superseded):
   - `ai-context-2026-phase4-5-handoff.md`
   - `context-efficiency-2026.md`
   - `context-layer-2026-overhaul.md`
   - `context-layer-2026-overhaul-v2.md`
3. **Keep in place** (still active): `dashboard-ui-redesign.md` (proposed),
   `watch-room-sync-rls-hardening.md` (draft), `watch-sync-optimization.md`
   (draft).
4. The link checker already excludes `docs/plans/**` (so `archive/` is also
   excluded). No gate impact. Run `bun run ai:check` to confirm.

> Alternative if you prefer a clean tree: `git rm` the 4 files instead of moving
> them (history still recoverable). Moving is the conservative default.

---

## Task C — Trim `review-gate.md` to behaviour-only

**Why:** 11 of ~16 checklist items are tagged `(static: id)` — already enforced
by `bun run ai:eval`. Re-reading them every task is wasted tokens; the doc itself
says it should only add "behavioural items a static analyzer cannot see."

### Steps

1. Edit `.agents/workflows/review-gate.md`. **Keep** the intro paragraph, the P0
   header (security is worth the redundancy), and the **entire `## Static Rule
   Inventory` section verbatim** (gate requires the heading + `review-gate-rules.mjs`).
2. **Remove** every checklist line that carries a `(static: …)` tag — those are
   double-coverage. Keep only the non-static behavioural items. Target end state
   of the middle of the file:

   ```markdown
   ## P0 — Security (blocking, immutable)

   - [ ] No RLS bypass; access control relies on Row Level Security, not UI hiding.
   - [ ] New tables/policies follow `docs/conventions/supabase-security.md`
         (RLS enabled, owner predicate uses `auth.uid()`).
   - [ ] No secrets committed (`bun run ai:secrets`).

   ## Behaviour a static check can't see

   - [ ] Zustand holds client UI state only — no server data mirrored into it.
   - [ ] Tests cover the happy path **and** at least one failure path.
   - [ ] Errors in server I/O are propagated/returned/logged — not swallowed.
   - [ ] Imports respect package boundaries in `docs/architecture/overview.md`.
   - [ ] Diff is scoped to the task; no unrelated working-tree changes bundled in.

   ## Verification (goal-driven, narrowest gate first)

   - [ ] Ran the narrowest gate that proves the change (see
         `docs/ai/agent-command-policy.md` altitude table), not the full suite by reflex.
   - [ ] Context-layer edits → `bun run ai:check` + `bun run ai:eval`.
         Code edits → `typecheck` / `lint` / `test` (+ `build` if the bundle can change).
   ```

3. Leave `## Static Rule Inventory` exactly as-is below that.
4. Run `bun run ai:check` (it runs `checkRuleInventory`).

---

## Task D — Dedupe per-task files (`common-mistakes §10`, `MEMORY.md`)

**Why:** Next.js-16 cache rules are stated three times (rule file + this §10 +
`apps/web/AGENTS.md`); `MEMORY.md` restates owner docs it is supposed to point to.

### Steps

1. **`docs/ai/common-mistakes.md` §10** — replace the whole "## 10. Next.js 16
   cache & tags" block (lines ~92–107) with a pointer (keep the heading so cross
   refs survive):

   ```markdown
   ## 10. Next.js 16 cache & tags (`cache-life-too-short`, `cache-tag-unparameterized`)

   Single source of truth: [`.claude/rules/nextjs-cache-components.md`]
   (/.claude/rules/nextjs-cache-components.md) (auto-loads on App Router files).
   The static rules `cache-life-too-short` and `cache-tag-unparameterized` enforce
   the two regex-catchable cases.
   ```

   Do not delete the file or its frontmatter (it is `requiredFiles` +
   `frontmatterRequired`).

2. **`docs/ai/MEMORY.md`** — make it pointers-only:
   - In `## Settled facts`, collapse each bullet that already names an `Owner:`
     doc to a single pointer line (e.g. *"State ownership → `data-fetching.md`."*).
     Drop the restated explanation; the owner doc carries it.
   - **Delete the entire `## Decisions log` section** — it triple-logs ADR/skill
     decisions already owned by ADRs. Keep the `## How to use` block.
   - Keep file + the `# Memory — Pumni Web OS` H1 (it is `requiredFiles`).
   - Confirm still < 5000 bytes (it shrinks).

3. Run `bun run ai:check` + `bun run ai:eval`.

---

## Task E — Strip the per-ADR summary index from `docs/adr/README.md`

**Why:** the `## Index` section (lines ~68–158) hand-summarizes every ADR — a
second copy of each ADR's own intro that drifts. The ADR files are the SoT.

### Steps

1. Edit `docs/adr/README.md`:
   - **Delete the `## Index` section entirely** (the per-ADR bullet list). The
     directory listing + each ADR's own header are sufficient discovery.
   - **Amend `## Lifecycle`** to encode the squash policy from Task A. Replace
     the "Never delete an ADR" line with:

     ```markdown
     - **Load-bearing ADRs are never deleted** — they evolve by status transition
       (`Proposed` → `Accepted` → `Deprecated` → `Superseded by ADR-0XXX`).
     - **Cosmetic / same-week superseded ADRs may be squashed** into one
       consolidated ADR (keeping the lowest number), with git preserving the
       originals. A token-value or visual-tuning change is a `docs/conventions/*`
       edit, **not** a new ADR.
     ```
   - **Amend `## When to write one`** — add a "Do NOT write one for" bullet:
     *"reversible visual/token tuning (update `docs/conventions/design-system.md`
     instead) — see ADR-0012's consolidation."*
2. `README.md` here is not in `requiredFiles`; link checker ignores `docs/adr/`.
   Still run `bun run ai:check`.

---

## Task F — Add karpathy working principles to `AGENTS.md`

**Why:** the layer is heavy on *what the rules are* and silent on *how to work*
(ADR-0009 deleted the old operating manual as harness-duplicating). The
karpathy-skills thesis is that a SMALL behavioural directive set is the
highest-leverage context. Re-add ~8 lines, not the 654-line manual.

### Steps

1. Edit `AGENTS.md`. Insert this block immediately **after** the `## Project`
   section (after line 58, before `## Command Discipline`):

   ```markdown
   ## Working Principles

   - **Think first.** State assumptions and tradeoffs before coding; when a
     request has multiple readings, surface them — do not choose silently.
   - **Simplicity.** Minimum code that solves the stated problem. No speculative
     abstraction for single-use code. Applies to docs too: do not mint an ADR for
     a reversible/cosmetic decision (see `docs/adr/README.md`).
   - **Surgical.** Touch only what the task needs; clean up only the mess your
     change made. Do not refactor unrelated, working code.
   - **Goal-driven verification.** Turn the request into a checkable outcome, then
     run the *narrowest* gate that proves it (a bug fix starts with a failing test
     that goes green). See the altitude table in `docs/ai/agent-command-policy.md`.
   ```

2. **Verify `AGENTS.md` is still < 6000 bytes:** `wc -c AGENTS.md` (expect
   ~5000). If over, tighten wording — do NOT raise the budget.
3. Run `bun run ai:check`.

---

## Final verification (run once, after all tasks)

```
bun run ai:check
bun run ai:eval
```

Both must exit 0. Then sanity-check the cut:

```
wc -l docs/adr/*.md         # expect ~12 files, not 20
wc -c AGENTS.md             # expect < 6000
rg -n "Decisions log" docs/ai/MEMORY.md   # expect no match
rg -n "## Index" docs/adr/README.md       # expect no match
```

## Expected outcome

- `docs/adr/`: 20 → 12 files (~1,600 lines removed; git retains history).
- `docs/plans/`: 4 finished meta-plans archived out of the active set.
- `review-gate.md`, `common-mistakes §10`, `MEMORY.md`: per-task read cost down
  ~50–60% with zero loss of enforced coverage (the static gate is unchanged).
- `AGENTS.md`: gains the behavioural steering the layer was missing, still under
  budget.
- No change to any deterministic gate: the 16 static rules, secrets scan, RLS
  checks, and size budgets all still run and pass.
