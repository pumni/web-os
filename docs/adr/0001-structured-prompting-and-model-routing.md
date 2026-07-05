# 0001. Structured Prompting and Model Routing Guidance

- **Status:** Accepted
- **Date:** 2026-06-18
- **Owner:** AI context layer (see `docs/ai/index.md`)

## Context

An "Enterprise AI Context System Blueprint" was proposed for this repo. Its
enforcement, security, static-analysis, and untrusted-content layers were
already present and stronger than the blueprint described (see
`docs/plans/ai-context-audit.md`). Two capabilities the blueprint covers were
genuinely missing from this repo:

1. **Structured prompting** — XML tagging (`<context>`, `<requirements>`,
   `<task>`) and `<thinking>` chain-of-thought to keep multi-constraint tasks
   from dropping a constraint.
2. **Model routing guidance** — advice on which class of model fits which class
   of task, so a task can be matched to a model deliberately rather than by
   default.

The blueprint also proposed wholesale changes this repo declines: a migration to
a numbered `docs/01-architecture/…` taxonomy, a rewrite of `AGENTS.md`, and
Prisma-based domain/SSOT artifacts. This repo is **Supabase-first** (RLS is the
P0 security mandate), already has a working manifest-enforced instruction plane,
and follows a surgical, link-don't-duplicate change policy. Adopting the
blueprint wholesale would break `bun run ai:check` and create a parallel,
drifting documentation structure.

## Decision

1. **Add structured prompting as optional, scoped guidance.** (Note: `docs/ai/prompt-structure.md` and `prompt-playbook.md` were merged and subsequently deleted in the 2026 efficiency overhaul — see ADR-0009/0013).
   The guidance covered XML tagging and `<thinking>`. Scope it
   to multi-constraint tasks (R2 Supabase/RLS, multi-package, architecture- or
   cache-boundary work). Explicitly recommend **against** it for R0 and small R1,
   where tags add noise without value. Link to existing anchors
   (`docs/ai/golden-examples.md`, `docs/ai/common-mistakes.md`) rather than
   duplicating examples.

2. **Add model routing as advisory guidance, not config.** (Note: `docs/ai/model-routing.md` was deleted in the 2026 overhaul).
   It proposed a task-type → model-class table. Pin no
   vendor and no model name. State firmly that model routing is **P6 (task
   intent)** and cannot override P0–P4, and that `ai:check` + `ai:eval` always
   run regardless of model.

3. **Decline wholesale blueprint adoption.** Keep the Supabase-first
   constitution (`AGENTS.md`), the existing `docs/{ai,architecture,conventions}`
   structure, and the manifest-enforced plane. Do not migrate to the numbered
   taxonomy, do not rewrite `AGENTS.md`, and do not add Prisma artifacts.

4. **Seed `docs/adr/`.** Establish the ADR directory (reserved at P3 in
   `AGENTS.md` until now) with `docs/adr/README.md` defining a MADR-lite format
   (Status / Context / Decision / Consequences / Alternatives) and a
   never-delete lifecycle. Record this decision as `0001`.

5. **Enforce the two new `docs/ai/*` files via the manifest.** Add both to
   `requiredFiles`, `frontmatterRequired`, and `indexRequiredReferences` in
   `scripts/ai-context.manifest.json`, and add a row for each in
   `docs/ai/index.md`. Do **not** add `docs/adr/*` to the enforced arrays —
   their lifecycle differs (status transitions, never deleted); backtick
   references to ADRs from enforced docs remain validated by
   `checkDocPathReferences`.

## Consequences

**Positive:**

- Two real capability gaps are closed, in this repo's house style, without
  disrupting enforcement or security.
- `docs/adr/` now exists with a documented format, so future architecture
  decisions have a home.
- Wholesale adoption of an incompatible (Prisma-based, taxonomy-shifting)
  blueprint is explicitly declined on the record.

**Negative / costs:**

- Two new files to maintain in the manifest and index. Adding a future
  `docs/ai/*.md` file now has a known three-array + index-row cost.
- Structured prompting adds tokens on the tasks where it is used; mitigated by
  scoping it to R2 and multi-constraint work only.
- Model routing guidance may age as model offerings change; mitigated by
  keeping it at the class level and pinning no vendor.

**Neutral:**

- ADRs are intentionally not manifest-enforced. If ADR drift becomes a problem
  later, harden them then; do not pre-emptively over-enforce.

## Alternatives considered

- **Migrate to the blueprint's numbered taxonomy and rewrite `AGENTS.md`.**
  Rejected: breaks the manifest gate, conflicts with the Supabase-first
  constitution, and violates the repo's surgical-change policy. The blueprint's
  useful ideas (prompt structure, model routing) can be adopted without its
  structural prescriptions.

- **Add Prisma-based domain/SSOT artifacts.** Rejected: this repo has no
  Prisma. The data layer is Supabase with RLS as the P0 boundary.

- **Write two separate ADRs (0001 prompting, 0002 routing).** Rejected for now:
  the two decisions were made together as a single response to the blueprint,
  and one record captures their relationship cleanly. They can be split later
  if one is superseded independently.

- **Manifest-enforce `docs/adr/*`.** Rejected: ADRs transition status and are
  never deleted, unlike the enforced `docs/ai/*` set. Backtick-reference
  validation is sufficient for now.

## References

- `AGENTS.md` — P0–P6 priority stack; P3 = ADRs.
- `docs/plans/ai-context-audit.md` — audit that identified the two gaps and
  recommended this work.
- `docs/ai/agent-behavior.md` (deleted) — risk classification (R0/R1/R2) and Mini-PRD; this ADR's prompting decision complements that guidance.
- `docs/ai/index.md` — the delivery router.
