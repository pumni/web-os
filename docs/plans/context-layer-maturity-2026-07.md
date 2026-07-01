# AI Context Layer — Strategic Maturity Plan (2026-07-01)

- **Status:** ready-to-execute
- **Owner:** AI context layer (`docs/ai/index.md`)
- **Predecessors (assume DONE, tree is post-v2):**
  `docs/plans/ai-context-layer-refactor-2026-07.md` (v1) and
  `docs/plans/ai-context-layer-refactor-v2-2026-07.md` (v2). Those two *hardened
  the plumbing* of the lean layer (phantom-API denylist, size budgets, ADR
  register generator, `llms.txt` governance). Verified present in the tree:
  `checkDocApiDenylist()` and `checkAdrRegisterSync()` already exist in
  `scripts/check-ai-context.mjs`.
- **Scope (different from v1/v2):** *Strategic* maturity, not plumbing. Close the
  gaps that only bite at team + codebase scale, chosen against the two 2026
  research syntheses in `v:\` (the 3-tier "Codified Context" case study and the
  5-layer ContextOps survey). This plan **deliberately extends the frozen context
  layer** (ADR-0009/0013) and therefore opens **ADR-0023** as its first task.
- **Goal:** After this plan the layer carries (1) *embedded domain failure
  knowledge* — the single strongest empirical finding in both reports; (2) a
  *drift/staleness detector* against the #1 documented failure mode; (3) a
  *Tier-2 isolation seam* (one exemplar read-only domain-reviewer subagent + an
  extension pattern) so future team scaling extends rather than rebuilds; and (4)
  complete nearest-file `AGENTS.md` coverage.

> This plan is self-contained and prescriptive: another AI reads it and executes
> top-to-bottom. Commands use PowerShell 7 (`pwsh`). After **each** task run
> `bun run ai:check` + `bun run ai:eval`; before "done" run `bun run ai:premerge`.
> **The gate is authoritative.** Where this plan and `scripts/check-ai-context.mjs`
> / `scripts/ai-context.manifest.json` disagree, the gate wins — read the SSOT
> function before writing an edit and adjust the edit, not the gate, to fit.

---

## 0. Why now — the measured trigger (justifies unfreezing)

ADR-0009/0013 froze the context layer: *"no new context-layer ADR without a
measured regression."* This plan clears that bar on two independent grounds, both
recorded in ADR-0023 (Task M0):

1. **External best-practice evidence.** Two independent 2026 research syntheses
   (`v:\Ha-Tang-Ngu-Canh-Ma-Hoa-Cho-AI-Agent.md` and
   `v:\ha-tang-ngu-canh-ma-hoa-cho-ai-agent (1).md`) converge on findings the
   current lean layer does **not** implement — most importantly that **on-demand
   retrieval alone under-serves complex, error-prone domains**; the empirically
   strongest lever is *pre-loaded, distilled "symptom → cause → fix" domain
   knowledge* (Report 1 §4.3 "intentional overlap / brevity bias", §5.3 "Gotchas
   are the highest-signal skill content", RNG-desync case study §4.6). The layer
   was tuned for *token minimalism*; it was never measured against *domain-error
   prevention*.
2. **Scaling goal (owner directive).** The layer must follow best modern standard
   to keep future team/multi-package development easy — not stay optimized for a
   single author. Spec staleness is the **#1 documented failure mode** (Report 1
   §13.2) and the current `checkCodeReferences` only fires at gate time on
   explicit `path#symbol` anchors; there is no *session-start* drift signal.

**This plan honors the reports' own anti-bloat warnings.** It rejects, on the
record, the maximalist moves both reports caution against — see §7 (Rejected).
The lean philosophy stands; we add only high-signal, deterministic capability.

---

## 1. Global guardrails (invariant — violating = `bun run ai:check` fails)

Source of truth: `scripts/ai-context.manifest.json` + `scripts/check-ai-context.mjs`.

1. **`requiredFiles`** — never delete an entry. This plan **adds**:
   `apps/catalog/AGENTS.md`, `scripts/check-context-drift.mjs`,
   `scripts/context-map.json`. Each must exist on disk **before** it is added to
   the list (else `checkRequiredFiles` fails).
2. **`sizeBudgets`** — hard ERROR on overflow; trim the doc, never raise a
   ceiling. No file this plan edits is size-budgeted **except** via new skill body
   growth — skills are **not** in `sizeBudgets`, so `## Known Failure Modes` is
   free. Do not add skills to `sizeBudgets`.
3. **Skill structure — `checkStructuredMarkdown` (`check-ai-context.mjs:572`).**
   Skills in `.agents/skills` must keep the **required** sections
   (`manifest.skillValidation.markdownRequiredSections` = `["Rules","Checklist"]`)
   and required frontmatter (`["name","description"]`). Adding a new section is
   safe. Task M1 introduces a **recommended** (WARN, non-blocking) section list —
   it must not turn `Known Failure Modes` into a hard requirement (single-use
   skills legitimately have none).
4. **Skill shims — `checkSkillShimsSync` + `sync-skills.mjs`.** Shims carry only
   `name` + `description` + a pointer; **body sections do not appear in shims.**
   So editing skill bodies needs **no** shim regen. Changing any `description`
   does — run `bun run` for the sync script if you touch frontmatter.
5. **Hooks are Claude-specific; logic must be tool-agnostic.** Any new behavior
   lands as a `scripts/*.mjs` core (portable to Codex/Gemini/Copilot) with a thin
   `.claude/hooks/*.mjs` wrapper. Mirror the existing
   `.claude/hooks/ai-context-stop-gate.mjs` contract: **fail-open** (any infra
   error exits 0 — never wedge the agent).
6. **ADR format — MADR-lite (`docs/adr/README.md`).** ADR-0023 = 4-line header +
   exactly four sections in order. After creating it, run `bun run ai:adr:sync`
   so `docs/adr/README.md`'s auto-generated register picks it up; never hand-edit
   the register block.
7. **Validation altitude.** Context/doc/skill edits → `ai:check` + `ai:eval`.
   Script changes (`scripts/*.mjs`) also self-test under `ai:check`/`ai:eval`;
   run `ai:premerge` (adds lint/typecheck/test/build) before "done".
8. After each task: `bun run ai:check` → `bun run ai:eval`. Both pass before the
   next task.

---

## 2. Task M0 — ADR-0023 (governance gate; do FIRST)

**Why:** This plan alters the frozen layer. Per `docs/adr/README.md`, a decision
that "establishes a convention spanning multiple packages" and is hard to reverse
needs an ADR; and the freeze requires a recorded justification. ADR-0023 is that
record + the baseline the next reviewer measures against.

**Edit — create `docs/adr/0023-context-layer-team-scale-maturity.md`** (MADR-lite;
next free number — 0014–0020 retired, 0021/0022 used):

```markdown
# 0023. Context Layer — Team-Scale Maturity

- **Status:** Accepted
- **Date:** 2026-07-01
- **Owner:** AI context layer (see `docs/ai/index.md`)

## Context

ADR-0009/0013 froze the context layer after proving a "meta-inversion" (guidance
outweighed real rules) and cutting it to a lean, deterministically-enforced set.
That work optimized for **token minimalism**. Two independent 2026 research
syntheses (archived under `docs/plans/context-layer-maturity-2026-07.md` §0)
converge on capability the lean layer omits, and the layer must now follow best
modern standard for team + multi-package scaling rather than single-author lean:

1. On-demand retrieval under-serves complex, error-prone domains; the strongest
   empirical lever is pre-loaded, distilled "symptom → cause → fix" domain
   knowledge co-located with the procedure that uses it.
2. Specification staleness is the top documented failure mode; the layer catches
   doc→code drift only at gate time via explicit anchors, with no session-start
   signal.
3. A single-agent skill layer has no isolation seam for future domain-expert
   review at team scale.

This is a measured trigger under the ADR-0009/0013 freeze, not prose tuning.

## Decision

Extend the lean layer with four additive capabilities, keeping every existing
deterministic gate: (1) an optional, recommended `## Known Failure Modes` section
convention for error-prone skills, surfaced as a non-blocking WARN by the skill
validator; (2) a tool-agnostic context-drift detector (`scripts/check-context-drift.mjs`
+ `scripts/context-map.json`) with a fail-open SessionStart hook; (3) a Tier-2
isolation *seam* — one exemplar read-only domain-reviewer subagent plus a
documented extension pattern, explicitly not a full agent fleet; (4) complete
nearest-file `AGENTS.md` coverage (`apps/catalog`). Domain knowledge stays
single-sourced in skills/conventions/ADRs; new surfaces reference it.

## Consequences

Positive: error-prone domains carry distilled failure knowledge; drift is visible
at session start; team scaling extends a seam instead of rebuilding; enforcement
stays deterministic and tool-agnostic. Negative/neutral: more surface to keep in
sync (mitigated by single-sourcing + the drift detector policing itself); the
`Known Failure Modes` convention is WARN-only to avoid burdening single-use
skills. Re-freeze after this plan: no further context-layer ADR without a new
measured trigger.

## Alternatives considered

- Full Tier-2 agent fleet (the case study's 19 personas) — rejected: both reports
  warn a well-designed single agent beats multi-agent under equal compute; we add
  one exemplar + a seam instead.
- Vector/graph long-term memory (Mem0/Letta/Zep) — rejected: harness-managed
  memory + `docs/ai/MEMORY.md` suffice; context-collapse risk, upkeep cost.
- Re-add spec/PRD workflows removed by ADR-0009 — rejected: harness plan-mode +
  the grill-requirements skill already cover the feature lifecycle.
- MCP doc-retrieval server for cold memory — rejected: grep/LSP/code-graph
  navigation is the 2026 standard and the repo already has `project-graph`.
- Do nothing (keep the freeze) — rejected: the measured trigger above.
```

**Then:**
```pwsh
bun run ai:adr:sync     # register picks up 0023
bun run ai:check        # register in-sync + PASS
```

**Acceptance:** `docs/adr/0023-context-layer-team-scale-maturity.md` exists
(MADR-lite, 4 sections); `docs/adr/README.md` register lists 0023 via generator;
`bun run ai:check` PASS.

---

## 3. Task M1 — Embedded domain failure knowledge (highest signal)

**Why:** Report 1 §4.3/§5.3/§4.6 — distilled `symptom → cause → fix` tables
co-located with the domain procedure prevent the class of domain-specific errors
that on-demand retrieval misses. Today skills are `Rules` + `Checklist` only; the
one place failure knowledge lives (`docs/ai/common-mistakes.md`) is global, not
co-located with the error-prone domain.

### M1.1 — Make `Known Failure Modes` a recommended (non-blocking) section

**Edit 1 — `scripts/ai-context.manifest.json`:** add a recommended list under
`skillValidation` (keep `yamlRequiredFields` / `markdownRequiredSections` as-is):

FIND:
```json
  "skillValidation": {
    "yamlRequiredFields": ["name", "description"],
    "markdownRequiredSections": ["Rules", "Checklist"]
  },
```
REPLACE:
```json
  "skillValidation": {
    "yamlRequiredFields": ["name", "description"],
    "markdownRequiredSections": ["Rules", "Checklist"],
    "recommendedSections": ["Known Failure Modes"]
  },
```

**Edit 2 — `scripts/check-ai-context.mjs`:** in `checkStructuredMarkdown`
(≈`:572`), after the required-section loop (the block iterating
`validation.markdownRequiredSections`, ≈`:613`), add a WARN-only recommended-section
loop. Read the real function first; pattern to add (uses existing `reportWarn`,
matching the required-section detection style already in the function):

```js
    for (const section of validation.recommendedSections ?? []) {
      const heading = new RegExp(`^#{1,6}\\s+${section}\\b`, 'm');
      if (!heading.test(body)) {
        reportWarn(
          `${relativePath}: consider a '## ${section}' section (distilled symptom → cause → fix) — recommended for error-prone domains, not required.`,
        );
      }
    }
```
> Verify the local variable names (`body`, `relativePath`, `reportWarn`) against
> the actual `checkStructuredMarkdown` body before pasting; adjust to match. WARN
> must **not** call `reportError` (would break the gate for every single-use skill).

**Edit 3 — `.agents/skills/README.md`:** document the convention (one short
paragraph): error-prone domains SHOULD add `## Known Failure Modes` — a compact
table of `Symptom | Cause | Fix`, distilled from real debugging/ADRs, placed after
`## Rules`; single-use/trivial skills may omit it (WARN, non-blocking).

### M1.2 — Populate the section for the highest-risk domains

Add `## Known Failure Modes` (place it **after `## Rules`**, before `## Checklist`)
to these skills. Content must be *distilled from real repo knowledge* (the skill's
own Rules, the cited ADR, `docs/ai/common-mistakes.md`, and the referenced source)
— **never LLM-generated filler** (Report 1 §5.2 / Report 2 §4.3: LLM-authored
context measurably harms). Keep each table tight (≈3–6 rows).

Target skills (priority order): `watch-sync`, `supabase-migration`,
`server-component-read`, `server-action`. Add to `react-hook-form` and
`tanstack-query-hook` only if a genuine, non-obvious failure mode exists.

**Exemplar — `.agents/skills/watch-sync/SKILL.md`** (insert after `## Rules`, before
`## Checklist`). Grounded in the skill's own Rules + ADR-0011:

```markdown
## Known Failure Modes

| Symptom | Cause | Fix |
|---|---|---|
| Followers snap backward on a stale update | A delayed persisted (`postgres_changes`) snapshot clobbered a fresher live `broadcast` anchor | Route all anchors through `shouldAcceptPlaybackAnchor`; persisted snapshot wins only if strictly newer by `anchorServerTs` |
| Duplicate/echoed anchors re-trigger reconcile | Versioned live anchors not deduped by `originSessionId` + `sequence` | Dedupe in the anchor path, not the controller; never accept an unversioned snapshot over a versioned broadcast |
| Sync drifts under variable latency | Clock samples averaged instead of min-RTT selected | Use `selectBestClockSample` (keep min-RTT); `clockReady` gates the sync phase — do not average |
| New lifecycle behavior is untestable / regresses | A branch was added to the React controller instead of the reducer | Add a `SyncEvent`/`SyncEffect` variant + a transition test in `watch-sync-machine.test.ts`; keep `syncReducer` pure |
| Telemetry disagrees with actual transitions | Ad-hoc `track()` calls in the controller | Emit only via `syncTelemetryEvents(prev, event, next)` (derived, not hand-placed) |
```

For `supabase-migration`: distill RLS/grant failure modes (RLS not enabled on a
new table; policy present but `GRANT` missing; `SECURITY DEFINER` without
`search_path` pinned; owner policy that leaks cross-tenant rows) from
`docs/conventions/supabase-security.md` + the skill's Rules. For the cache/read
skills: distill from `.claude/rules/nextjs-cache-components.md` (unparameterized
`cacheTag` collisions; `'use cache'` in a wrapper silently going dynamic;
`'seconds'` breaking the PPR shell; `updateTag` in a route handler throwing).

**Gate-safety:** skills are not size-budgeted; new section is additive; required
sections and frontmatter untouched → `checkStructuredMarkdown` still passes.
`sync-skills.mjs` shims unaffected (bodies excluded). No `description` change → no
shim regen needed (run `--check` to confirm).

**Acceptance:**
```pwsh
bun run ai:check     # PASS; WARN lines only for skills still lacking the section
bun run ai:eval
rg -n "## Known Failure Modes" .agents/skills   # present in the targeted skills
```

---

## 4. Task M2 — Context drift / staleness detector

**Why:** Report 1 §12.3 (session-start drift hook) + §13.2 (staleness = #1 failure
mode). `checkCodeReferences` only validates explicit `path#symbol` anchors at gate
time. This adds a *proactive* signal: when code under a mapped subsystem changed
without its owning doc/skill being touched, warn at session start (advisory, never
blocking) so the human can decide whether the spec needs updating.

### M2.1 — Subsystem → owning-docs map

**Edit — create `scripts/context-map.json`.** A small, hand-curated map (curated,
not generated — it encodes *which doc owns which code*, a human judgment). Start
minimal; grow when a drift miss proves a gap:

```json
{
  "subsystems": [
    {
      "name": "watch-sync",
      "code": ["apps/web/src/features/watch/**"],
      "owners": [".agents/skills/watch-sync/SKILL.md", "docs/adr/0011-watch-sync-state-machine-and-observability-seam.md"]
    },
    {
      "name": "supabase-rls",
      "code": ["supabase/migrations/**"],
      "owners": [".agents/skills/supabase-migration/SKILL.md", "docs/conventions/supabase-security.md"]
    },
    {
      "name": "design-system",
      "code": ["packages/ui/src/**"],
      "owners": ["docs/conventions/design-system.md", ".agents/skills/ui-styling/SKILL.md"]
    }
  ]
}
```

### M2.2 — Tool-agnostic detector script

**Edit — create `scripts/check-context-drift.mjs`.** Advisory by default; compares
a git range against the map; prints subsystems whose `code` changed but no `owners`
file changed. Fail-open. `--check` may be added later; **keep default advisory**
(exit 0) so it never wedges a session.

```js
// Context-drift detector (advisory). Warns when code under a mapped subsystem
// changed without its owning doc/skill changing in the same range — a proxy for
// specification staleness (the top documented failure mode). Fail-open by design:
// any infra error prints nothing and exits 0. Tool-agnostic; the Claude hook is a
// thin wrapper. SSOT for ownership: scripts/context-map.json.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rangeArg = process.argv.find((a) => a.startsWith('--since='));
const range = rangeArg ? rangeArg.slice('--since='.length) : 'HEAD~1';

function changedFiles() {
  const res = spawnSync('git', ['diff', '--name-only', `${range}...HEAD`], {
    cwd: ROOT, encoding: 'utf8', timeout: 15_000,
  });
  if (res.status !== 0 || !res.stdout) return [];
  return res.stdout.split('\n').map((s) => s.trim()).filter(Boolean);
}

// Minimal glob: supports trailing /** and *.ext; extend only if the map needs it.
function matches(glob, file) {
  if (glob.endsWith('/**')) return file.startsWith(glob.slice(0, -2));
  if (glob.startsWith('**/')) return file.endsWith(glob.slice(2));
  return file === glob;
}

try {
  const mapPath = path.join(ROOT, 'scripts', 'context-map.json');
  if (!fs.existsSync(mapPath)) process.exit(0);
  const { subsystems = [] } = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  const changed = changedFiles();
  if (changed.length === 0) process.exit(0);

  const stale = [];
  for (const s of subsystems) {
    const codeTouched = changed.some((f) => (s.code ?? []).some((g) => matches(g, f)));
    const ownerTouched = changed.some((f) => (s.owners ?? []).includes(f));
    if (codeTouched && !ownerTouched) stale.push(s);
  }
  if (stale.length) {
    const lines = stale.map(
      (s) => `  • ${s.name}: code changed, owner docs unchanged → ${s.owners.join(', ')}`,
    );
    process.stdout.write(
      `Context-drift notice (${range}...HEAD): review whether these specs need updating:\n${lines.join('\n')}\n`,
    );
  }
} catch {
  // fail-open
}
process.exit(0);
```

### M2.3 — SessionStart hook wrapper (Claude)

**Edit — create `.claude/hooks/context-drift-notice.mjs`.** Runs the core script;
injects its stdout as session context. **Verify the exact SessionStart output
contract** (Claude Code emits added context via
`hookSpecificOutput.additionalContext` on SessionStart) — confirm against current
Claude Code docs or a claude-code-guide agent before finalizing; adjust the JSON
shape to whatever the installed runtime expects. Fail-open.

```js
import { spawnSync } from 'node:child_process';
const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();
try {
  const res = spawnSync('bun', ['scripts/check-context-drift.mjs', '--since=HEAD~1'], {
    cwd, encoding: 'utf8', timeout: 20_000,
  });
  const text = (res.stdout || '').trim();
  if (text) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text },
    }));
  }
} catch {
  // fail-open
}
process.exit(0);
```

**Edit — `.claude/settings.json`:** register the SessionStart hook (add a
`SessionStart` array alongside `PostToolUse`/`Stop`):

```json
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bun",
            "args": ["${CLAUDE_PROJECT_DIR}/.claude/hooks/context-drift-notice.mjs"],
            "timeout": 30,
            "statusMessage": "context-drift notice"
          }
        ]
      }
    ]
```

### M2.4 — Register the core script as a required file

**Edit — `scripts/ai-context.manifest.json` `requiredFiles`:** add
`scripts/check-context-drift.mjs` and `scripts/context-map.json` (after the
existing `scripts/sync-adr-register.mjs` entry). **Create both files first**, then
add. Do **not** add the `.claude/hooks/*` wrapper to `requiredFiles` (hooks are
Claude-specific; keep the manifest tool-agnostic).

**Gate-safety:** advisory script never blocks; `.claude/hooks/**` and
`scripts/**` are covered by the stop-gate `CONTEXT` regex, so editing them re-runs
`ai:check` at Stop — expected. New `requiredFiles` entries exist before listing.

**Acceptance:**
```pwsh
bun scripts/check-context-drift.mjs --since=HEAD~1   # runs, exits 0 (notice or silent)
bun run ai:check                                     # PASS (both new files required & present)
bun run ai:eval
```

---

## 5. Task M3 — Tier-2 isolation seam (one exemplar, not a fleet)

**Why:** Report 1 §4.3/§9.1 — isolated, pre-loaded domain-expert *review* in a
clean context window catches domain errors a general pass misses; §9.1/§8.3 and
Report 2 §8.3 warn against defaulting to multi-agent. Resolution: add **one**
read-only reviewer subagent for the highest-risk domain as an exemplar, plus a
documented extension pattern — a *seam*, so team scaling extends it deliberately.

**Edit 1 — create `.claude/agents/watch-sync-reviewer.md`.** Read-only tools
(review only — safe, least-privilege). Its domain knowledge is single-sourced:
it **points to** the watch-sync skill + ADR-0011 rather than restating them
(minimal, intentional overlap only for the review lens). Confirm the current
Claude Code subagent frontmatter schema (`name`, `description`, `tools`) via
claude-code-guide before finalizing:

```markdown
---
name: watch-sync-reviewer
description: Read-only domain reviewer for watch-together playback sync. Use to deep-review a diff touching apps/web/src/features/watch (sync-machine.ts, sync-math.ts, use-sync-controller.ts, use-server-clock.ts, use-room-channel.ts) before merge. Checks reducer purity, anchor-acceptance ordering, clock sampling, telemetry derivation, and the state-machine contract.
tools: Read, Grep, Glob
---

You are a read-only reviewer for the watch-together sync module. You do not edit
code; you return findings ranked most-severe first.

Load the domain rules and failure modes from
`.agents/skills/watch-sync/SKILL.md` and the rationale from
`docs/adr/0011-watch-sync-state-machine-and-observability-seam.md`. Review the
diff strictly against them:

1. Reducer purity — lifecycle/branching in `syncReducer`, not the React controller;
   `sync-math.ts` helpers pure; no input mutation.
2. Anchor acceptance — all anchors via `shouldAcceptPlaybackAnchor`; a persisted
   snapshot never clobbers a fresher versioned broadcast.
3. Clock — min-RTT sample (`selectBestClockSample`), never averaged; `clockReady`
   gates sync.
4. Telemetry — derived via `syncTelemetryEvents`, no ad-hoc `track()`.
5. Contract — `selectSyncStatus` 3-value contract intact; new behavior ships with
   a transition test in `watch-sync-machine.test.ts`.

Report each finding as: file:line · severity · what's wrong · concrete fix. If
nothing is wrong, say so plainly.
```

**Edit 2 — `.agents/workflows/review-gate.md`:** add one line making the reviewer
an **optional** deep-review step *for watch-sync diffs only* (keep the file under
its 2600-byte budget — trim a redundant phrase if needed to stay under). Wording:
"For diffs under `apps/web/src/features/watch`, optionally dispatch the
`watch-sync-reviewer` subagent for an isolated domain pass."

**Edit 3 — document the extension pattern** in `.agents/skills/README.md` (or a
short note in the review-gate file): to add a domain reviewer, (a) ensure the
domain skill has `## Known Failure Modes`; (b) add a read-only
`.claude/agents/<domain>-reviewer.md` that *references* the skill + ADR (no
knowledge duplication); (c) add an optional review-gate line scoped to that
domain's paths. Do not add reviewers speculatively — add one when a domain's
debugging repeatedly burns a session (Report 1 emergence pattern §4.3).

**Tool-agnostic note:** `.claude/agents/**` is a Claude surface (like the skill
shims). The *portable* knowledge stays in `.agents/skills` + `docs/adr`; the
subagent is a thin invocation lens. Other tools ignore it harmlessly.

**Gate-safety:** `.claude/agents/**` is not in `requiredFiles` and not size-budgeted;
the stop-gate `CONTEXT` regex covers `^\.claude/(?:rules|skills)/` but **not**
`agents/` — so adding it does not itself trigger the stop gate (acceptable: the
subagent is advisory tooling, not an enforced doc). `review-gate.md` **is**
size-budgeted (2600) — verify length after Edit 2.

**Acceptance:**
```pwsh
Test-Path .claude/agents/watch-sync-reviewer.md
(Get-Item .agents/workflows/review-gate.md).Length   # ≤ 2600
bun run ai:check ; bun run ai:eval                   # PASS
```

---

## 6. Task M4 — Coverage + hygiene

**Why:** Nearest-file `AGENTS.md` per package/app is the agents.md-standard scaling
model (Report 1 §5.1; OpenAI's repo carries 88). All `packages/*` have one;
`apps/catalog` is the sole gap (added by ADR-0021's component catalog).

**Edit 1 — create `apps/catalog/AGENTS.md`.** Nearest-file pointer, mirroring
`apps/web/AGENTS.md`'s thin style: what this app is (the ADR-0021 component
catalog), its build/dev command, its relationship to `@pumni/ui`, and a pointer
to the root `AGENTS.md` + `docs/ai/index.md`. Keep it signal-dense; do not restate
root rules (Report 2 §4.4 "toolchain/root already covers it").

**Edit 2 — `scripts/ai-context.manifest.json` `requiredFiles`:** add
`apps/catalog/AGENTS.md` (after `apps/web/AGENTS.md`). File must exist first. The
stop-gate `CONTEXT` regex already matches `^apps/[^/]+/AGENTS\.md$` — no hook change.

**Edit 3 (spike, non-prescriptive) — activation observability.** Report 1 §14 /
Report 2 §12: "measure activation, not existence." *Investigate* whether the
installed Claude Code exposes a skill/subagent-invocation hook event; if it does,
add a fail-open hook appending `{ts, skill}` to a git-ignored
`.claude/.activation.log` so unused skills can be pruned. If no such event exists,
**record the finding in this plan's done-checklist and stop** — do not fabricate a
hook for a non-existent event. Confirm via claude-code-guide.

**Acceptance:**
```pwsh
Test-Path apps/catalog/AGENTS.md
bun run ai:check      # PASS (new required file present)
```

---

## 7. Rejected (recorded so future readers don't re-propose)

Both reports explicitly caution against these; rejecting them **is** following the
modern standard, not skipping it:

- **Full Tier-2 agent fleet (≈19 personas).** Multi-agent is not free; a
  well-designed single agent beats it under equal compute (Report 1 §9, Report 2
  §8.3). We ship one exemplar + a seam (M3).
- **Vector/graph long-term memory (Mem0/Letta/Zep).** Harness-managed memory +
  `docs/ai/MEMORY.md` + ADR-promotion already do episodic→semantic consolidation;
  a store adds upkeep + context-collapse risk (Report 1 §7.3).
- **MCP doc-retrieval server for cold memory.** grep/LSP/code-graph navigation is
  the 2026 direction (Report 1 §7.4); the repo already has `project-graph`.
- **Re-adding spec/PRD/handoff workflows** (cut by ADR-0009). Harness plan-mode +
  `grill-requirements` cover the feature lifecycle; re-adding duplicates the
  harness (the exact meta-inversion ADR-0009 fixed).
- **LLM-auto-generated context/skills.** Measurably harmful (Report 1 §5.2,
  Report 2 §4.3). All new content in this plan is human-distilled from real repo
  knowledge; generators are used only for deterministic *registers*, not prose.

---

## 8. Validation sequence

Execution order: **M0 → M1 → M2 → M3 → M4** (M0 first: it authorizes the rest and
seeds the drift-map rationale).

After each task: `bun run ai:check` → `bun run ai:eval`.
Before "done":
```pwsh
bun run ai:adr:sync     # register fresh (M0 added ADR-0023)
bun run ai:premerge     # ai:check && ai:eval && lint && typecheck && test && build
```
M1/M2 touch `scripts/*.mjs` (enforced config) — the `ai:check`/`ai:eval` self-tests
must still pass; `ai:premerge` runs the full altitude.

---

## 9. Rollback

- Tasks are independent except **M0 first**. Revert one task with
  `git checkout -- <files>`.
- If you added a `requiredFiles` entry then reverted the file, remove the manifest
  entry too (else `checkRequiredFiles` fails): pairs are
  `apps/catalog/AGENTS.md`, `scripts/check-context-drift.mjs`,
  `scripts/context-map.json`.
- SessionStart hook misbehaving → remove the `SessionStart` block from
  `.claude/settings.json`; the core script is inert without it.
- Skill WARN noise unacceptable → revert `recommendedSections` (M1.1) to make the
  section purely conventional (documented, not surfaced).

---

## 10. Done checklist (exit criteria)

- [ ] **M0** `docs/adr/0023-context-layer-team-scale-maturity.md` exists (MADR-lite);
      `docs/adr/README.md` register lists it via `ai:adr:sync`.
- [ ] **M1** `recommendedSections` in manifest; `checkStructuredMarkdown` emits a
      WARN (never ERROR) for the recommended section; `## Known Failure Modes`
      populated (human-distilled) in `watch-sync` + `supabase-migration` +
      `server-component-read` + `server-action`; convention documented in
      `.agents/skills/README.md`.
- [ ] **M2** `scripts/context-map.json` + `scripts/check-context-drift.mjs` exist
      and are in `requiredFiles`; `.claude/hooks/context-drift-notice.mjs` + the
      `SessionStart` registration exist; detector runs fail-open (exit 0); output
      contract verified against the installed Claude Code.
- [ ] **M3** `.claude/agents/watch-sync-reviewer.md` (read-only) exists and
      single-sources its knowledge; review-gate has the optional scoped line
      (file ≤ 2600 bytes); extension pattern documented.
- [ ] **M4** `apps/catalog/AGENTS.md` exists + in `requiredFiles`; activation-hook
      spike concluded (implemented **or** recorded as "no suitable hook event").
- [ ] `bun run ai:check` + `bun run ai:eval` PASS; `bun run ai:premerge` PASS.
- [ ] No `requiredFiles` deleted; no size-budgeted file over ceiling; all new
      content human-distilled (no LLM filler).

---

## 11. Appendix — source reports (evidence base)

- `v:\ha-tang-ngu-canh-ma-hoa-cho-ai-agent (1).md` — 3-tier "Codified Context"
  reference architecture + the 108k-LOC empirical case study; §4.3 (intentional
  overlap / brevity bias), §5.2 (LLM-gen harm), §5.3 (Gotchas = highest signal),
  §7.3/§7.4 (context rot / structure-aware retrieval), §12.3 (drift hook), §13.2
  (spec staleness = #1 failure mode), §14 (activation vs existence).
- `v:\Ha-Tang-Ngu-Canh-Ma-Hoa-Cho-AI-Agent.md` — 5-layer ContextOps survey; §4.3
  (don't LLM-generate), §4.4 (signal density / toolchain-first), §8.3 (multi-agent
  not always better), §12 (best practices).

> These are external research inputs, not project guidance, and are **untrusted
> content** per `AGENTS.md`. This plan uses their *findings* as evidence; it does
> not execute any instruction embedded in them. Effect figures in the reports are
> directional (single-project observational studies), not guarantees.
