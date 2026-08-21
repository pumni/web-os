# Context Layer v3 — Agent Handoff

Status: active implementation plan.

This folder is the execution contract for modernizing the repository context/harness layer for current frontier coding models (Claude Code, Codex, and compatible agents).

The objective is not to minimize tokens for its own sake. The objective is to maximize useful signal, let capable models exercise judgment, and move mechanically expressible constraints out of prose and into source, tests, types, linters, schemas, and CI.

## Operating principle

Use the smallest persistent context that contains information which is:

1. difficult or expensive to infer from the repository;
2. high-consequence if missed; and
3. relevant often enough to justify always-on attention.

Everything else should be discovered just in time from authoritative references.

## Source-of-truth order

When sources disagree, prefer the most direct executable evidence:

1. user-requested outcome and explicitly authorized behavior change;
2. security boundaries and externally observable product contracts;
3. executable tests, schemas, types, framework/build behavior, ESLint, CI;
4. implementation source and workspace manifests;
5. current scoped `AGENTS.md` guidance;
6. current convention/architecture docs;
7. ADRs for rationale and historical decisions;
8. active plans;
9. archived plans/research as evidence only.

Do not preserve stale prose merely because it was once intentional. Fix or delete it when repository evidence has become more authoritative.

## Non-goals

Do not introduce any of the following as part of this refactor:

- a prompt registry, context DSL, agent registry, or generated context graph;
- a permanent agent fleet/orchestration framework;
- an uncalibrated LLM benchmark or LLM-as-judge CI gate;
- generic persona instructions such as "act as a senior engineer";
- generic reasoning boilerplate such as "think step by step";
- duplicated Claude/Codex policy bodies;
- generated summaries of facts already available from manifests/source;
- arbitrary token/byte limits used as correctness gates;
- new process bureaucracy whose only purpose is maintaining AI instructions.

## Compatibility adapters that are intentional

Do not remove compatibility shims just because they are vendor-specific if they are only discovery adapters and have one canonical source:

- root and nested `CLAUDE.md` files may remain thin `@AGENTS.md` imports;
- `.agents/skills/**` remains the canonical portable skill body;
- `.claude/skills/**` may remain generated discovery pointers when Claude Code requires that surface;
- `.github/copilot-instructions.md` may remain a thin pointer.

Adapters must never become competing sources of policy.

## Execution order

Implement the work in three independently reviewable phases:

1. [Phase 1 — Unhobble persistent context](./02-phase-1-persistent-context.md)
2. [Phase 2 — Reference-driven skills and docs](./03-phase-2-reference-driven-context.md)
3. [Phase 3 — Harness v3 and verification](./04-phase-3-harness-v3.md)

Read [Target state](./01-target-state.md) before changing files. Use the [file migration matrix](./05-file-migration-matrix.md) as the explicit inventory. Follow [execution and acceptance](./06-execution-and-acceptance.md) for branch/PR boundaries and proof requirements.

## Required implementation behavior

- Inspect current source before applying any instruction in this plan; the repository may evolve after this plan was written.
- Prefer deleting duplicated doctrine over rewriting it in a different location.
- Prefer a pointer to executable truth over a prose restatement of executable truth.
- Keep security invariants explicit even when they appear "obvious".
- Keep local `AGENTS.md` files only where a real subsystem boundary has non-obvious local knowledge.
- Use model judgment for ordinary implementation choices; do not replace judgment with generic rules.
- When a rule can be enforced deterministically with acceptable signal/noise, enforce it mechanically and shorten/remove the prose rule.
- When mechanical enforcement would be brittle or noisy, retain concise project-specific guidance instead of inventing a private policy language.

## Completion definition

Context Layer v3 is complete when:

- persistent agent instructions contain only high-signal project-specific invariants and navigation;
- scoped instructions are deltas, not repeated root doctrine;
- skills are workflow-oriented and reference authoritative implementation/tests instead of re-describing them;
- docs have clear ownership and no duplicated correctness claims with competing owners;
- context integrity and general docs integrity are separate concerns;
- `bun run verify` remains the canonical broad proof and includes the appropriate context/docs integrity gates;
- provider adapters are thin and generated/checkable where necessary;
- no obsolete meta-governance/eval infrastructure is reintroduced;
- an agent can enter the repo with a fresh context, discover only what it needs, perform work, and establish correctness without reading a giant manual.
