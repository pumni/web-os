# Plan — Context Layer Efficiency Overhaul 2026 (R1 + R2 + R3)

- **audit-source:** direct measurement on 2026-06-19 — full footprint scan of
  `AGENTS.md`, `docs/ai/*`, `docs/conventions/*`, `.agents/*`, `.claude/rules/*`,
  package `AGENTS.md`, and `scripts/*` (script run, then deleted).
- **goal:** cut ~35 KB (~9K tokens) of context cost without weakening the
  enforcement plane, while aligning closer to mid-2026 standards (AGENTS.md
  nested spec, Agent Skills progressive disclosure, Anthropic "smallest
  high-signal tokens").
- **non-goals (explicit):** do NOT touch the enforcement scripts
  (`scripts/check-review-gate-rules.mjs` rules, self-test), do NOT migrate to an
  AST analyzer (separate ADR-0002 follow-up), do NOT touch `agent-command-policy.md`
  (ADR-0006 already settled it as SSOT), do NOT change `apps/web/AGENTS.md`
  Next.js rules.
- **policy alignment:** this plan is **P5 (task recipe)**. It cannot override
  P0–P4. Each workstream touches P2 (architecture/conventions) and P3 (ADRs) and
  therefore requires an ADR per the `docs/adr/README.md` rule "Establishes a
  convention that spans multiple packages or task routes".

---

## Background — what the measurement found

Measured footprint (bytes):

| Group | Bytes | Files |
| --- | --- | --- |
| Root entrypoints (`AGENTS.md`, wrappers, `llms.txt`) | ~7 KB | 5 |
| `docs/ai/*` (meta-instruction plane) | **39 KB** | 14 |
| `docs/conventions/*` (canonical) | **41 KB** | 7 |
| ↳ of which `design-system.md` alone | **32.6 KB** | 1 |
| `docs/architecture/*` | 4.6 KB | 2 |
| `.agents/*` (skills/evals/workflows) | 21 KB | 11 |
| `.claude/rules/*` (glob-scoped) | 3.9 KB | 2 |
| Package `AGENTS.md` | 9 KB | 4 (of 8 packages; 5 missing) |
| `scripts/*` (enforcement — runs, not loaded) | 74 KB | 4 |

Three concrete gaps vs mid-2026 standards (from `agents.md` spec, Anthropic
context-engineering essay, SKILL.md open standard):

- **G1 — `design-system.md` is a 32.6 KB outlier.** It is a real canonical doc
  (not meta), but it violates "smallest high-signal tokens": any UI task loads
  ~8K tokens at once. It mixes (a) load-always hard rules with (b) load-rarely
  reference detail (token tables, motion, z-index, personalization).
- **G2 — meta-inversion remains.** `docs/ai/*` = 39 KB of "how to use context"
  while `docs/conventions/*` real engineering is only ~8.6 KB (excl.
  design-system). `agent-behavior.md` (4.9 KB) and `prompt-playbook.md` (3.4 KB)
  overlap on task-classification, recovery, and verification.
- **G3 — package AGENTS.md coverage 3/8.** `config`, `env`, `features`,
  `test-utils`, `validators` lack nested `AGENTS.md`. The agents.md spec and
  current best practice both recommend nested files per subproject
  (nearest-file precedence).

---

## Reference map — every place that must change

This was produced by `grep` over the whole repo (excluding `node_modules`).
**Any agent executing this plan MUST keep this list in sync** — re-run the grep
commands in "Verification" before declaring done, because `bun run ai:check`
fails on a dangling backtick doc path or a missing manifest entry.

### `design-system.md` is referenced from:

- `AGENTS.md:80` — Read Routing row (prose link).
- `docs/ai/index.md:22` — Canonical Sources table row.
- `apps/web/src/app/globals.css:10` — code comment (path only, **keep valid**).
- `packages/config/eslint.mjs:57,77,114` — ESLint rule messages (path only).
- `packages/ui/src/components/card.tsx:80,86` — code comment (`design-system.md`).
- `packages/ui/src/styles/glass.css:249`, `tokens.css:156,220` — code comments.
- `docs/plans/*.md` — historical plans (excluded from link-rot by
  `getMarkdownLinkFiles` filter; safe to leave).

**Design rule for R1:** `design-system.md` must STAY (code comments depend on
the path). R1 trims it and moves detail to a skill; it does NOT delete the file.

### `agent-behavior.md` / `prompt-playbook.md` referenced from:

- `docs/ai/index.md:28,29` — Canonical Sources rows.
- `docs/ai/MEMORY.md:5,38` — pointers.
- `docs/ai/task-routes/r1-feature.md:28,30` — "May read".
- `docs/ai/task-routes/r2-supabase.md:27,30` — "May read".
- `llms.txt:7,8` — context map.
- `scripts/ai-context.manifest.json` — three arrays:
  `requiredFiles` (lines 27-28), `frontmatterRequired` (85-86),
  `indexRequiredReferences` (116-117).
- `.gitignore:32` — comment referencing `agent-behavior.md`.
- Historical `docs/plans/*` — excluded from link-rot.

### `agent-command-policy.md` referenced from:

- `AGENTS.md:65`, `docs/ai/index.md:27`, `scripts/ai-context.manifest.json:26,84`.
- **Decision: DO NOT merge this file.** ADR-0006 explicitly retains it as the
  "canonical SSOT for PowerShell 7 host environment guidelines". This plan
  respects that ADR and leaves it untouched.

---

## Workstream R1 — Split `design-system.md` into a trimmed doc + skill

**Why:** 79% of `docs/conventions/` bytes sit in one file loaded in full on UI
tasks. Progressive disclosure (skill) keeps the always-needed hard rules in the
doc and moves the rarely-needed reference tables to an on-demand skill.

### R1.1 — Create skill `.agents/skills/ui-styling/SKILL.md`

Path: `.agents/skills/ui-styling/SKILL.md`

Frontmatter MUST include `name` + `description` (manifest
`skillValidation.yamlRequiredFields`) and body MUST have `## Rules` + `## Checklist`
(`markdownRequiredSections`). Draft content outline (the executing agent writes
full prose, this is the required structure):

```md
---
name: ui-styling
description: Apply Pumni OS design-system tokens, surface roles, motion, z-index, and personalization when styling UI or building @pumni/ui components.
---

# UI Styling (Pumni OS Design System)

Load this skill when adding tokens, building/changing a component, or picking
surface/elevation/z-index utilities. The short hard rules live in
`docs/conventions/design-system.md` (read that first); this skill holds the
reference detail.

## Rules
- Token tiers: primitive (tokens.css) -> semantic (theme.css) -> component.
  Components consume semantic only. Never reference a primitive var or raw oklch.
- Surface vocabulary is a CLOSED SET: floating glass (GlassSurface/glass-*),
  solid card (Card variant=solid), inset well (Card variant=inset / bg-muted),
  control fill (bg-muted + hover /80), status tint (/10 fill + /20 border).
- Contrast is APCA-gated (Lc 60 text / Lc 25 UI) via
  `apps/web/src/test/design-system/glass-contrast.test.ts` — never reintroduce a
  WCAG 2.x ratio gate.
- Radius: named utilities only (rounded-md/lg/xl...), never rounded-[Npx].
  All steps derive from --radius-base via calc().
- z-index: ONE OS scale in tokens.css (100-1200). --z-overlay (900) is scrim
  ONLY; floating content uses --z-popover (1050). Never hand-pick raw z-40/z-50
  for cross-component layers.
- Motion: CSS for micro-feedback (motion-safe:), JS (motion lib) only for
  orchestration; JS motion is NOT silenced by CSS reduced-motion — components
  must call useReducedMotion(). Use recipes.hoverLift/pressScale/staggerItem
  instead of hand-rolled whileHover. Motion tokens mirror in lib/motion.ts
  (motion-tokens.test.ts fails on drift).
- Personalization: accent (indigo/violet/rose), glass (soft/default/strong),
  density (comfortable/compact). PersonalizationScript must be first child of
  <body> to avoid FOUC.

## Reference tables to carry here (move verbatim from current design-system.md)
- Semantic token role table (background/foreground ... chart-1..5).
- Surface vocabulary table (role | how to build | use for).
- Radius scale table (utility | value at base 10px | typical use).
- z-index table (token/utility | value | layer).
- State-layer tokens (--state-hover/pressed/selected) + color-mix example.
- Scroll-driven animation utilities table.
- "Adding a token" + "Adding a component" subsections (incl. shadcn CLI refactor
  steps).

## Checklist
- [ ] Read `docs/conventions/design-system.md` (hard rules) first.
- [ ] No raw oklch() / primitive var / Tailwind built-in palette in component classes.
- [ ] Surface is one of the closed-set roles; no bg-{card,background,popover}/NN.
- [ ] One border-border; status tint is the only /20 border exception.
- [ ] Floating layer uses GlassSurface/glass-*; blur 8-16px only.
- [ ] Radius/z-index use named utilities; no rounded-[Npx], no raw z-40/z-50 for cross-component layers.
- [ ] Motion uses recipes / motion-safe: CSS; useReducedMotion() on JS motion.
- [ ] Contrast pairs resolved by glass-contrast.test.ts (APCA), not eyeballed.
- [ ] New component: cva variants, data-slot hooks, exported from packages/ui/src/index.ts, no @/ or server imports.
- [ ] `bun run ai:check` passes (design-token + ui-package boundary rules).
```

### R1.2 — Trim `docs/conventions/design-system.md` to ~4 KB

Keep (always-loaded, high-signal):

- Frontmatter (update `when-to-load` to mention the skill).
- Intro paragraph (1-2 lines) + token source-of-truth file list.
- "Anti-slop guardrails" table (the Don't/Do/Why matrix) — this is the single
  highest-value surface; agents need it without loading the skill.
- "Token tiers (do not exceed three)" 3-bullet definition + the **Hard rules**
  numbered list (no raw backdrop-blur, no surface opacity, one border, no raw
  shadows, radius named only, no new color tokens).
- A NEW short section at the end: `## Reference detail` — one paragraph saying
  the full token/surface/radius/z-index/motion/personalization tables and the
  "adding a token/component" recipes live in the `.agents/skills/ui-styling`
  skill; load it when you need the tables.

Move to the skill (delete from the trimmed doc):

- Semantic tokens table, Surface vocabulary table, Contrast gating APCA prose
  (keep one line: "APCA Lc 60 text / Lc 25 UI — see skill for thresholds").
- Typography & motion utilities, dark-mode halation, font loading,
  scroll-driven animations, view transitions.
- Radius scale table, z-index table + prose, state-layer tokens + RTL section.
- Personalization section, visual regression section, adding a token/component.

**Target size:** ≤ 4200 bytes so it sits below the 5000-byte `checkAiDocSizes`
warning comfortably and the freed ~28 KB moves to an on-demand skill.

### R1.3 — Wire the skill into the index

Edit `docs/ai/index.md` "## Skills" table — add a row:

```
| @pumni/ui styling / tokens / surfaces | `.agents/skills/ui-styling/SKILL.md` |
```

The skill's existence is auto-validated by `checkStructuredMarkdown` (dir walk);
it is NOT added to `requiredFiles` (skills are "added on demand"). Only the
index row is the manual wiring step.

### R1.4 — Manifest: NO change required for R1

`design-system.md` stays in `frontmatterRequired` and `indexRequiredReferences`.
The skill is auto-discovered. Do not add the skill to `requiredFiles`.

### R1.5 — Leave code comments valid

The code comments in `globals.css`, `eslint.mjs`, `card.tsx`, `glass.css`,
`tokens.css` reference `design-system.md` by **path only** ("see
design-system.md §Surface vocabulary"). Since the file is kept (not moved), all
these comments remain valid. No code edits required.

If any comment references a section anchor that was moved (e.g. "§State-layer
tokens" now lives in the skill), update THAT comment to point at the skill OR
keep a one-line stub in the doc under that heading. Prefer keeping a stub
heading in the doc to avoid editing code for a docs refactor.

---

## Workstream R2 — Collapse meta-inversion: merge `prompt-playbook.md` into `agent-behavior.md`

**Why:** both files cover task classification, retrieval, and verification with
heavy overlap. `agent-behavior.md` (4.9 KB) already owns Workflow + Retrieval +
Verification; `prompt-playbook.md` (3.4 KB) adds Risk Levels + Quick Workflows +
Mini-PRD + Recovery. Merging yields one ~6 KB "agent operating manual" and
deletes one file (-3.4 KB net, -1 round-trip on every task).

**Scope guard:** do NOT merge `agent-command-policy.md` (ADR-0006 SSOT). Only
these two files.

### R2.1 — Merge content into `agent-behavior.md`

Target structure for the merged `agent-behavior.md` (≤ 5000 bytes — this is
enforced, so cut duplication ruthlessly):

1. Intro (1 line: "Next.js 16 monorepo — don't import RN/Expo patterns").
2. `## Risk levels` (from prompt-playbook: R0/R1/R2 one-liners + default route +
   minimum validation — compress the prose, keep the route pointers).
3. `## Workflow` (current PLAN/RETRIEVE/VALIDATE/EXECUTE/VERIFY loop — keep, it
   is the canonical loop).
4. `## Retrieval rules` (current — keep the "read X before Y" bullets).
5. `## Mini-PRD` (from prompt-playbook — keep the tiny template, it is cited by
   ADR-0001; one code block).
6. `## Recovery` (from prompt-playbook — keep the "identify the owner" bullets;
   this is the P0-P6 escalation ladder, high value).
7. `## Memory & compaction` (current — keep verbatim, ADR-0004 owner).
8. `## Subagent delegation` (current — keep verbatim).
9. `## Security rules` (current — keep verbatim, reinforces P0).
10. `## Refresh rules` (current — keep).
11. `## Verification rules` (current — keep the command table).

Cut/merge: the duplicate "Quick Workflows" in prompt-playbook (Quick Fix / R1
loop / R2 loop) — these restate the Workflow + task routes; replace with a
one-line pointer to the task routes. Cut the prompt-playbook intro paragraph
("Classify the task before retrieving...") — it restates the Workflow step 1.

### R2.2 — Delete `docs/ai/prompt-playbook.md`

### R2.3 — Update every reference (from the reference map above)

- `docs/ai/index.md`: delete the "Prompt risk levels & mini-PRD" row (line 29);
  update the "AI execution workflow" row description (line 28) to mention risk
  levels + mini-PRD now live there.
- `docs/ai/MEMORY.md:5` — no change (points at agent-behavior, still valid).
- `docs/ai/task-routes/r1-feature.md:28` — change "May read prompt-playbook.md"
  to "May read agent-behavior.md (risk levels, mini-PRD, recovery)".
- `docs/ai/task-routes/r2-supabase.md:27` — same edit.
- `llms.txt:8` — delete the `/docs/ai/prompt-playbook.md` line (the file is
  gone; `checkLlmsTxt` validates every path in llms.txt exists).
- `scripts/ai-context.manifest.json`: remove `docs/ai/prompt-playbook.md` from
  ALL THREE arrays — `requiredFiles` (line 28), `frontmatterRequired` (line 86),
  `indexRequiredReferences` (line 117). Also remove the corresponding
  `indexRequiredReferences` entry if the merged doc no longer needs a distinct
  index row reference (keep `docs/ai/agent-behavior.md` in all three).
- `docs/adr/0001-*.md:114` — backtick reference to prompt-playbook.md. Since
  ADRs are never deleted and `checkDocPathReferences` validates backtick doc
  paths, this MUST be updated: change the reference to `agent-behavior.md` and
  add a parenthetical "(merged from prompt-playbook.md in the 2026 efficiency
  overhaul)".

### R2.4 — Re-verify frontmatter

`agent-behavior.md` already has frontmatter (`description`, `when-to-load`).
Update `when-to-load` to cover the merged scope: "Before non-trivial
investigations, code changes, review fixes, task classification, or when a
task route is unclear."

---

## Workstream R3 — Add nested `AGENTS.md` to the 5 uncovered packages

**Why:** agents.md spec uses nearest-file precedence; 5/8 packages have no
package-scoped guidance. Coverage metric (`ai:metrics`) goes 3/8 -> 8/8.

Packages needing a file (mirror the existing `packages/ui/AGENTS.md` shape —
Summary / Architecture / Stack / Commands / Pitfalls, ~30-50 lines each):

1. `packages/config/AGENTS.md` — ESLint flat config, tsconfig presets,
   `pumniNoRawColor` rule lives here; export-only, no runtime.
2. `packages/env/AGENTS.md` — Zod env validation, server vs client env split,
   `NEXT_PUBLIC_*` handling; consumed by supabase + auth.
3. `packages/validators/AGENTS.md` — zero-dep Zod schemas shared client/server;
   must stay framework-agnostic (no React, no Next imports).
4. `packages/features/AGENTS.md` — cross-cutting feature helpers (clarify its
   actual responsibility by reading `packages/features/src` first).
5. `packages/test-utils/AGENTS.md` — deterministic test helpers; must not pull
   in live services.

**R3 process per package:**

1. Read `packages/<name>/src` and `packages/<name>/package.json` to learn the
   real responsibility, exports, and deps.
2. Write `packages/<name>/AGENTS.md` mirroring the ui package's section shape.
3. Do NOT add to `scripts/ai-context.manifest.json requiredFiles` — the manifest
   only enforces the three existing package files. (Optional: if the team wants
   these enforced, add them — but that raises the maintenance cost and is out of
   scope for this efficiency pass. Leave a note in the ADR.)

**R3 guardrail:** each new package AGENTS.md must not duplicate root
`AGENTS.md` content — it only ADDS package-specific boundaries, exactly like
`packages/ui/AGENTS.md` does.

---

## ADR — required deliverable

Per `docs/adr/README.md`, create `docs/adr/0007-context-efficiency-2026.md`
because this "establishes a convention that spans multiple packages or task
routes" (design-system split affects UI + packages/ui; meta-merge affects all
task routes; R3 adds 5 package files).

MADR-lite format (Status / Date / Owner / Context / Decision / Consequences /
Alternatives / References). Key points to capture:

- **Context:** the 2026-06-19 measurement (cite the three gaps G1/G2/G3 with
  byte numbers). Reference ADR-0005 and ADR-0006 (this is a continuation).
- **Decision:** (1) split design-system into trimmed doc + ui-styling skill;
  (2) merge prompt-playbook into agent-behavior; (3) add 5 package AGENTS.md;
  (4) explicitly DO NOT merge agent-command-policy (ADR-0006) and DO NOT migrate
  to AST analyzer (ADR-0002 open).
- **Consequences:** -~32 KB context surface (design-system) + -3.4 KB (meta
  merge); one new skill to maintain; 5 new package files; ui-styling skill is
  the new home for design reference tables.
- **Alternatives considered:** (a) delete design-system entirely -> rejected
  (code comments + ESLint messages depend on the path); (b) merge all three
  meta files -> rejected (violates ADR-0006); (c) AST analyzer now -> rejected
  (scope/risk, deferred per ADR-0002).
- **References:** ADR-0005, ADR-0006, `agents.md` spec, Anthropic
  context-engineering essay.

Then update `docs/adr/README.md` "## Index" with the new `0007` bullet, and add
a one-line decision to `docs/ai/MEMORY.md` "## Decisions log":
`2026-06-19 — Context efficiency 2026: design-system split to skill, prompt-playbook merged into agent-behavior, 5 package AGENTS.md added. Owner: docs/adr/0007`.

---

## Execution order (do R1 first, it is the highest ROI and lowest risk)

1. **R1.1** create `.agents/skills/ui-styling/SKILL.md`.
2. **R1.2** trim `docs/conventions/design-system.md` (move tables to skill).
3. **R1.3** add index row for the skill.
4. Run `bun run ai:check` — must pass (skill auto-validated, doc still in
   manifest, size now under warning).
5. **R2.1** merge prompt-playbook content into agent-behavior.md.
6. **R2.2** delete prompt-playbook.md.
7. **R2.3** update all 7 reference sites (index, 2 task-routes, llms.txt,
   manifest 3 arrays, ADR-0001).
8. Run `bun run ai:check` — must pass (no dangling paths, manifest consistent).
9. **R3** create the 5 package AGENTS.md (read each package first).
10. **ADR-0007** + README index + MEMORY.md decision line.
11. Full validation (see below).

---

## Verification (run all; all must pass before "done")

```pwsh
bun run ai:check    # structure, frontmatter, links, manifest, freshness, token+ui boundaries
bun run ai:eval     # static rules + behavioral evals (stub agent in CI)
bun run ai:metrics  # advisory — confirm coverage 8/8, design-system <5000B, rule-efficacy
```

Optional but recommended after R1 (UI surface unchanged, but sanity):
```pwsh
bun run typecheck
bun run lint
```

Do NOT run `bun run build` unless a code file changed — this plan is docs +
skill + manifest only, so the bundle is untouched. If any code comment was
edited in R1.5, run typecheck+lint for the touched package.

### Link/reference re-grep (manual, before declaring done)

Re-run these and confirm zero dangling references to the deleted file and that
the new skill is referenced:
- `rg "prompt-playbook"` — must only appear in ADRs (0001, 0007) as historical
  mentions, NOT in any enforced doc or manifest.
- `rg "design-system\.md"` — must still resolve (file kept).
- `rg "ui-styling"` — must appear in `docs/ai/index.md` and the ADR.

---

## Done definition (checklist for the executing agent)

- [ ] `.agents/skills/ui-styling/SKILL.md` exists with valid frontmatter + Rules + Checklist.
- [ ] `docs/conventions/design-system.md` ≤ 4200 bytes, keeps anti-slop table + hard rules, points to skill.
- [ ] `docs/ai/index.md` has the ui-styling skill row; prompt-playbook row removed; agent-behavior row updated.
- [ ] `docs/ai/agent-behavior.md` contains merged risk-levels + mini-PRD + recovery; ≤ 5000 bytes.
- [ ] `docs/ai/prompt-playbook.md` deleted.
- [ ] `scripts/ai-context.manifest.json` has prompt-playbook removed from all 3 arrays.
- [ ] `llms.txt` has no prompt-playbook line.
- [ ] `docs/ai/task-routes/r1-feature.md` + `r2-supabase.md` "May read" updated.
- [ ] `docs/adr/0001-*.md` backtick reference updated to agent-behavior.md.
- [ ] `packages/{config,env,validators,features,test-utils}/AGENTS.md` created.
- [ ] `docs/adr/0007-context-efficiency-2026.md` created; `docs/adr/README.md` index updated.
- [ ] `docs/ai/MEMORY.md` decisions-log line added.
- [ ] `bun run ai:check` passes.
- [ ] `bun run ai:eval` passes.
- [ ] `bun run ai:metrics` shows coverage 8/8 and design-system under size limit.
- [ ] Re-grep confirms no dangling `prompt-playbook` references in enforced surface.

---

## Expected outcome (quantified)

| Metric | Before | After (target) |
| --- | --- | --- |
| `docs/conventions/` bytes | 41 KB | ~13 KB (design-system 32.6 -> ~4) |
| `docs/ai/*` bytes | 39 KB | ~35.5 KB (prompt-playbook -3.4) |
| Package AGENTS.md coverage | 3/8 | 8/8 |
| Always-loaded entrypoint (`AGENTS.md`) | unchanged | unchanged |
| Tokens loaded on a UI task | ~8K (full design-system) | ~1K (trimmed doc) + skill on demand |
| Net context bytes freed | — | ~32 KB (~8K tokens) |

The enforcement plane (static rules, evals, CI) is untouched — the "crown jewel"
identified in ADR-0005/0006 stays intact. This is a pure token-efficiency and
standards-alignment pass.
