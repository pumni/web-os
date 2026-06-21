---
title: AI Context 2026 Roadmap — Phase 4 & 5 Handoff
status: phase-4-done-phase-5-deferred
owner: ai-context-layer
last-updated: 2026-06-19
purpose: Detailed, self-contained implementation guide for a NEW session to continue Phase 4 (Maturity) and Phase 5 (Scale) of the 2026 context-layer upgrade. Read this top-to-bottom before starting.
---

> [!NOTE]
> Superseded by [context-layer-2026-overhaul.md](file:///d:/Dev/web-os/docs/plans/context-layer-2026-overhaul.md) (2026-06-19)

# AI Context 2026 Roadmap — Phase 4 & 5 Handoff

This document hands off the remaining two phases of the 2026 context-layer
upgrade. Phases 1–3 (Anti-drift, Measurement, Coverage) are **complete and
committed**. A new session can pick up Phase 4 directly without re-exploring.

## State at handoff (verified)

- **Working tree: clean** (`git status` empty at handoff). All Phase 1–3 changes
  are committed on `main`. The new session should run `git log --oneline -15` to
  see the commit history.
- **Gates green**: `bun run ai:check` passes (3 pre-existing warnings only —
  see "Known warnings" below). `bun run ai:eval` passes with **16/16 rule
  coverage, 10 evals** (5 automated + 5 manual).
- **Existing ADRs**: `docs/adr/README.md` (convention), `0001` (prompting +
  model routing), `0002` (cache static rules).
- **CODEOWNERS** at `.github/CODEOWNERS` uses `@pumz`. The remote is
  `github.com/pumni/web-os` (org `pumni`). **Verify** whether `@pumz` is the
  right handle or whether an org team handle (e.g. `@pumni/maintainers`) should
  replace it — ask the user if unclear.
- **Remote**: `origin` = `https://github.com/pumni/web-os.git`.

## Known warnings (pre-existing, NOT introduced by Phase 1–3)

`bun run ai:check` emits exactly these 3 warnings — all pre-existing, all
out-of-scope unless explicitly re-scoped:

1. The one-time audit artifact (32878 bytes) — large reference doc, not in
   manifest. Consider moving to `docs/plans/` or git-ignoring if not canonical.
   **Resolved in Phase 4:** moved to `docs/plans/ai-context-audit.md`; the
   size warning no longer fires.
2. `docs/ai/common-mistakes.md` (~5485 bytes) — over the 5000-byte soft cap.
3. `docs/ai/context-system-overview.md` (~5418 bytes) — over the 5000-byte soft cap.

For (2) and (3): audit item P4 suggested splitting cache mistakes out of
`common-mistakes.md`. This was deferred because the cache content is already
routed to the canonical owner (`apps/web/AGENTS.md`); only revisit if size
keeps growing.

## The full 2026 roadmap (for context)

| Phase | Items | Status |
| --- | --- | --- |
| 1 — Anti-drift | A1 graph-sync, A3 manifest+dedupe, A4 nightly workflow | ✅ Done |
| 2 — Measurement | A2 freshness+CODEOWNERS, A6 metrics | ✅ Done |
| 3 — Coverage | A5 cache static rules, B2 prompt-injection evals | ✅ Done |
| **4 — Maturity** | **B1 MCP, B3 subagent policy, C1 Cursor/Claude settings ADR** | **✅ Done (2026-06-19)** |
| **5 — Scale** | **B5 dev portal, B4 structured output, C2 prompt-cache metric, C3 memory tool** | **Deferred — no trigger fired** |

---

# Phase 4 — Maturity

**Theme**: widen the context-delivery surface and fill documentation gaps that
the first three phases exposed. ROI drops here — these are maturity items, not
gap closures. Do them in order; each is independently shippable.

## B1 — Expand the MCP server surface

### Why

`.mcp.json` currently has only `next-devtools`. Modern 2026 context layers use
MCP as the **context-on-demand delivery layer** — agent fetches exactly what it
needs at runtime instead of loading docs. The repo is under-using this.

### Scope

Add **one or two** high-value MCP servers to `.mcp.json`. Do NOT add more than
two — each MCP server is a supply-chain vector and adds runtime dependency.

### Candidate servers (evaluate in this priority order)

1. **Postgres/Supabase introspection MCP** (highest value).
   - Lets the agent inspect the real schema at runtime instead of guessing from
     `packages/supabase/src/types.ts`.
   - Candidate: `@modelcontextprotocol/server-postgres` (official MCP org) OR a
     Supabase-specific MCP if one exists at session time.
   - **MUST connect to a read-only/dev DB URL only**. Never production. The
     connection string must come from env (`SUPABASE_DEV_DB_URL` or similar), and
     the `.mcp.json` env block must NOT hardcode a real DSN.
   - **Security gate before merge**: confirm the DB role is read-only
     (`SELECT`-only grants). Document this in `docs/ai/mcp-runtime.md`.

2. **Git archaeology MCP** (medium value).
   - Lets the agent answer "why is this code like this" via blame/log without
     shelling out manually.
   - Candidate: search npm for `git-mcp` / `mcp-server-git` at session time —
     pick the most-maintained official-ish one.

3. **Design-token lookup MCP** (low value for this repo).
   - The repo already enforces token boundaries via `checkDesignTokenBoundaries`
     in `ai:check`, and `docs/conventions/design-system.md` is canonical. An MCP
     here is likely redundant. **Skip unless a concrete need appears.**

### Implementation steps

1. Read `.mcp.json` (currently just `next-devtools`).
2. Read `docs/ai/mcp-runtime.md` — this is the canonical doc for MCP usage. It
   must be updated for every server added.
3. For each server chosen:
   - Add the entry to `.mcp.json`.
   - Add a section to `docs/ai/mcp-runtime.md` describing what it does, when to
     use it, and the security boundary (read-only / server-only / etc).
   - If the server reads secrets (DB URL), document that the secret must stay in
     env, never in `.mcp.json`.
4. Do **NOT** add MCP servers to `scripts/ai-context.manifest.json`
   `requiredFiles` — MCP is optional runtime aid, not enforcement (this is the
   existing policy, see `docs/ai/MEMORY.md` if it records it).

### Acceptance

- `.mcp.json` has 2 servers (next-devtools + 1 new), each documented in
  `mcp-runtime.md`.
- `bun run ai:check` still passes.
- A short note in `docs/ai/MEMORY.md` or a new ADR if the decision is
  non-obvious (e.g. why a server was rejected).

### Risks

- **Supply chain**: each MCP server runs arbitrary code via `npx -y`. Prefer
  official `@modelcontextprotocol/*` packages or well-maintained ones. Avoid
  unknown individual-author packages.
- **Secret leakage**: a misconfigured DB MCP could log connection strings. The
  env-only rule is P0-adjacent — treat as security review.

---

## B3 — Subagent delegation policy

### Why

The harness has an `Agent` (Explore) tool, and `docs/ai/agent-behavior.md` is
the execution-workflow doc — but neither says **when** to delegate to a subagent
vs read files directly. Result: agents over-read (quét cả repo khi chỉ cần 1
fact) or under-delegate (burn the main context window). 2026 best practice is to
make this explicit.

### Scope

Add a section to `docs/ai/agent-behavior.md` (do NOT create a new file — link,
don't duplicate). Keep it under ~1500 bytes added.

### Content to add (paraphrase, don't copy)

- **Delegate to Explore subagent when**: broad fan-out search across many files
  / naming conventions where only the conclusion matters (e.g. "where is X
  configured", "list all Server Actions touching RLS"). The subagent reads
  excerpts and returns a summary; main context stays clean.
- **Read directly when**: single fact, path already known, or the exact code
  text matters (e.g. editing a specific function).
- **Never delegate**: security-sensitive reads (the subagent's summary could
  miss a P0 detail); one-file edits; anything needing the raw code text.
- **Budget rule**: if a task route's "Must read" + "May read" list sums to >8
  files, delegate the exploration, keep the editing in the main thread.

### Implementation steps

1. Read `docs/ai/agent-behavior.md` fully to match its existing tone and
   sectioning.
2. Read one `.agents/skills/*/SKILL.md` to see if subagent use belongs in a skill
   instead (probably not — it's cross-cutting).
3. Add a `## Subagent delegation` section.
4. Cross-link from `docs/ai/task-routes/r1-feature.md` and `r2-supabase.md`
   "May read" or a short note, so agents on those routes see the policy.

### Acceptance

- `agent-behavior.md` has the new section.
- `bun run ai:check` passes (watch the 5000-byte cap on `docs/ai/*.md` — this
  file may approach it; if over, split out to a new dedicated policy file and
  link instead).

### Risks

- Low. This is documentation only; no enforcement change.

---

## C1 — ADR for Cursor/Claude `.mdc` + `settings.json` allow-deny

### Why

The repo's audit frames "no Cursor `.mdc` / Claude `settings.json` permission
allow-deny" as a "deliberate choice". That framing may be rationalization —
glob-scoped `.mdc` rules + permission allow-deny are a 2026 defense-in-depth
layer. The right move is to **make the decision explicit in an ADR** rather than
leave it as undocumented folklore. If data later shows a gap, the ADR is the
record of what was considered.

### Scope

Write `docs/adr/0003-cursor-claude-settings-permissions.md`. Do **NOT**
implement `.mdc` files or settings.json in this item — the ADR's job is to
record the analysis and the decision (which may be "defer").

### Decision options to evaluate in the ADR

1. **Adopt Cursor `.mdc` rules** — adds glob-scoped lazy-loaded rules (e.g.
   `apps/web/src/app/**/page.tsx` triggers App Router rules). Pro:
   defense-in-depth, IDE-native. Con: duplicates `.claude/rules/` which already
   exist; Cursor-specific (other tools don't read `.mdc`).
2. **Adopt Claude `settings.json` permission allow-deny** — restricts which
   files/tools the agent can touch. Pro: hard boundary. Con: tool-specific,
   maintenance burden, may conflict with the existing static-analyzer approach.
3. **Defer** — keep relying on the static analyzer + manifest + review-gate. Pro:
   no new surface. Con: no IDE-native guardrail.

### The data question (important)

Before deciding, check: **has any agent ever made a mistake that the static
analyzer did NOT catch but an `.mdc`/settings rule would have?** If yes → lean
adopt. If no → defer is defensible. Look at:
- Recent `ai:eval` failures or `ai:metrics` regression-signal output.
- Any PR review comments about agent mistakes.
- `docs/ai/MEMORY.md` for recorded incidents.

If no data exists, the ADR should record "defer, revisit when a gap is
observed" with the trigger condition.

### Implementation steps

1. Read existing `.claude/rules/*.md` (there are 2) to understand what's
   already covered by the glob-scoped approach.
2. Read `docs/adr/README.md` for the MADR-lite format.
3. Check `docs/ai/MEMORY.md` and any incident records.
4. Write `docs/adr/0003-cursor-claude-settings-permissions.md` following the
   4-section format (Context / Decision / Consequences / Alternatives).
5. Update `docs/adr/README.md` index.

### Acceptance

- `docs/adr/0003-cursor-claude-settings-permissions.md` exists with Status
  (Proposed or Accepted), and a concrete decision (not "TBD").
- `docs/adr/README.md` index updated.

### Risks

- Low (ADR is documentation). The risk is making the wrong call — mitigate by
  grounding the decision in data (`ai:metrics`, incident history).

---

## Phase 4 validation checklist

After all three items:

- [ ] `bun run ai:check` passes (still 3 pre-existing warnings, no new ones).
- [ ] `bun run ai:eval` passes, 16/16 coverage maintained.
- [ ] `docs/ai/mcp-runtime.md` updated if MCP servers added.
- [ ] `docs/ai/agent-behavior.md` has subagent section.
- [ ] `docs/adr/0003` exists and is indexed.
- [ ] No new files added to manifest `requiredFiles` unless they're truly
      enforced (MCP runtime docs are NOT enforced — existing policy).

---

# Phase 5 — Scale

**Theme**: items that only matter when the repo or team grows. **Do not start
Phase 5 unless a concrete trigger fires** (see each item's trigger). These are
conditional — implementing them now is premature optimization.

## Triggers (when to start Phase 5)

Start Phase 5 when ANY of these is true:

- `packages/` count exceeds 10 (currently 8) — dev-portal trigger.
- Onboarding a new engineer takes >1 day to find docs — dev-portal trigger.
- Agent produces structured output that prose review can't keep up with —
  structured-output trigger.
- Long sessions repeatedly hit context limits and lose state — memory trigger.
- Prompt-cache hit rate becomes measurable and matters for cost — cache-metric
  trigger.

If none of these fire, **defer all of Phase 5** and note it in
`docs/ai/MEMORY.md`.

---

## B5 — Internal Developer Portal (Docs-as-code)

### Trigger

`packages/` > 10 OR onboarding pain reported. Currently 8 packages — not yet.

### What

Compile the `docs/` markdown into a navigable portal using Fumadocs or Nextra
(Next.js-native docs frameworks). 1:1 mapping with the markdown source.

### Implementation steps (when triggered)

1. Evaluate Fumadocs vs Nextra — Fumadocs is more App-Router-native, Nextra is
   more established. Write an ADR (`0004-dev-portal.md`) recording the choice.
2. Add a `docs-portal/` app under `apps/` (or a route under `apps/web`).
3. Wire markdown source → portal routes. Keep the markdown as SSOT; the portal
   only renders.
4. Deploy (Vercel — the repo is already Next.js).
5. Update `AGENTS.md` "Read Routing" to mention the portal for humans, but keep
   the markdown paths as the agent's canonical source (agents read raw
   markdown, not rendered portals).

### Risks

- **Drift between portal and markdown**: mitigate by single-source (portal
  reads markdown files directly, no copy).
- **Build cost**: portal adds to CI. Gate it behind a separate turbo task.

---

## B4 — Structured output / tool-use schema for high-risk tasks

### Trigger

Agent produces R2-class output (migration plans, RLS reviews) that prose review
can't validate reliably. Not yet observed.

### What

Define Zod schemas for high-risk agent outputs (e.g. a migration-plan schema),
and have the agent return validated JSON instead of prose. Reference the schemas
from the relevant `.agents/skills/` (e.g. `supabase-migration`).

### Implementation steps (when triggered)

1. Identify the 1–2 task types where structured output adds most value
   (migration plan, RLS review).
2. Create `.agents/schemas/` with Zod schemas.
3. Update the relevant skill (`.agents/skills/supabase-migration/SKILL.md`) to
   reference the schema and require JSON output.
4. Update `docs/ai/prompt-structure.md` to mention structured output as the
   R2-grade companion to XML tagging.
5. Add an eval (`.agents/evals/`) that checks the agent returns valid schema
   output.

### Risks

- **Over-engineering**: only worth it if the harness supports tool-use / function
  calling. If the agent is chat-only, structured output is just a convention
  with weak enforcement. Confirm harness capability first.
- **Schema rigidity**: schemas that don't match real tasks get bypassed.

---

## C2 — Prompt-cache hit-rate measurement

### Trigger

Prompt-cache cost becomes a concern (large team, many concurrent agents). Not
yet.

### What

Measure the prompt-cache hit rate (the 2026 blueprint claims 80% TTFT
reduction). `docs/ai/context-system-overview.md` already describes the
prompt-cache layout principle but doesn't measure it.

### Implementation steps (when triggered)

1. Check whether the agent harness exposes cache metrics (cache hit %, TTFT).
   If not, write an ADR recording "not measurable in current harness, accept
   the design heuristic".
2. If measurable, add a metric to `scripts/ai-metrics.mjs` (new field in the
   JSON output) and trend it in the nightly `docs-health.yml` workflow.
3. If hit rate is low, reorganize context files for prefix stability (the
   overview doc already gives the principle).

### Risks

- **Not measurable**: likely outcome in many harnesses. The ADR is the
  deliverable in that case, not a metric.

---

## C3 — Memory layer tool-management

### Trigger

Long sessions repeatedly lose state / hit context limits. Not yet.

### What

Migrate the manual `docs/ai/MEMORY.md` + scratchpad to a tool-managed
compaction/summarization layer (harness-provided if available).

### Implementation steps (when triggered)

1. Read `docs/ai/memory-layer.md` to understand the current 3-tier manual setup.
2. Check if the harness provides managed memory/compaction.
3. If yes: migrate, write ADR recording the migration.
4. If no: keep manual, write ADR recording why (harness limitation).

### Risks

- **State loss during migration**: back up `MEMORY.md` before any change.

---

## Phase 5 validation checklist

(Only run if a trigger fired and an item was implemented.)

- [ ] Relevant ADR written (`0004+`).
- [ ] `bun run ai:check` + `ai:eval` green.
- [ ] `ai:metrics` updated if new metric added.
- [ ] `MEMORY.md` updated with the decision.

---

# How to start a new session on this

1. **Read this file first** (`docs/plans/ai-context-2026-phase4-5-handoff.md`).
2. Run `git log --oneline -15` to see committed Phase 1–3 work.
3. Run `bun run ai:check` and `bun run ai:eval` — confirm green state matches
   "State at handoff" above.
4. Decide with the user: Phase 4 in full, or specific items only.
5. For each item, follow its "Implementation steps" — they are self-contained.
6. After each item, run the gates and update this file's status checkboxes.

## Anti-drift reminders for the new session

- **Don't duplicate canonical rules across files** — link instead. This is the
  repo's P2 principle; `docs/ai/context-system-overview.md` → "Prompt-cache
  layout" documents it.
- **Every new `docs/ai/*.md` file** must be added to manifest
  `requiredFiles` + `frontmatterRequired` + `indexRequiredReferences`, and get a
  row in `docs/ai/index.md`. Missing any of the 4 → `ai:check` fails or
  silently allows deletion.
- **Every new static rule** must: add to `review-gate-rules.mjs` (RULES +
  RULE_INFO), add an analyzer in `check-review-gate-rules.mjs`, add a self-test
  fixture, add to `.agents/workflows/review-gate.md` inventory, and be covered
  by ≥1 eval (`automated-rule` or `covered-rules`). Missing any → self-test or
  coverage fails.
- **Every new ADR** follows `docs/adr/README.md` format, is never deleted, and
  gets indexed in `docs/adr/README.md`.
- **Every new eval** follows the 4-section format, has frontmatter
  (`name`/`category`/`description` + `automated-rule` OR `manual: true`), and
  gets a row in `docs/ai/index.md` → Evals.
- **Freshness**: editing an enforced doc → bump its `last-reviewed` date only if
  you actually re-reviewed accuracy (a typo fix should NOT reset the clock).
- **Commit discipline**: the user has not asked for commits yet across Phase
  1–3. **Ask before committing** unless told otherwise. If asked, branch first
  if on `main`.

## Open questions for the user (resolve at Phase 4 start)

1. **CODEOWNERS handle**: `.github/CODEOWNERS` uses `@pumz`, but remote is
   `pumni/web-os` org. Is `@pumz` a member of the org? Should it be an org team
   handle instead? (Affects whether CODEOWNERS actually triggers reviews.)
2. **Audit doc disposition**: the 32KB untracked-at-handoff reference doc that
   triggered a size warning. Commit it, move it to `docs/plans/`, or git-ignore
   it? **Resolved in Phase 4:** moved to `docs/plans/ai-context-audit.md`
   (see "Known warnings" above).
3. **Commit strategy for Phase 1–3**: already committed (working tree clean at
   handoff). Confirm with user if a consolidated "phase 1–3" PR is wanted.
