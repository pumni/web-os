# 0030. Context Layer v3 — Reference-Driven Agent Context

- **Status:** Accepted
- **Date:** 2026-08-21
- **Owner:** Engineering Team

## Context

Coding agents need durable repository orientation, but duplicated subsystem
prose and historical documentation make retrieval less reliable. Current
source, manifests, tests, lint, builds, migrations, and security checks are
better owners of exact behavior than copied instructions.

## Decision

1. Root `AGENTS.md` is the portable repository contract. Nested files are local
   deltas. `CLAUDE.md`, `.claude/skills`, and Copilot instructions are thin
   discovery adapters; canonical skill bodies live under `.agents/skills`.
2. Skills and conventions point to source, manifests, types, tests, lint, build,
   migration, and security owners instead of duplicating their facts. No
   arbitrary persistent-context byte or token budget is used.
3. `context:lint` owns context discovery structure. `docs:lint` owns
   deterministic documentation references. Both participate in `bun run verify`;
   scheduled external-link health remains separate.
4. Task-level isolation is allowed for focused reviews or large subtrees when
   it improves evidence quality. It is a procedure choice, not a permanent
   orchestration framework.
5. Do not create a permanent agent fleet, prompt registry, generated context
   graph, or uncalibrated LLM-as-judge CI program. Historical plans and research
   belong in Git history once their current decisions have been captured.

## Consequences

Agents load a smaller map and retrieve authoritative detail just in time.
Mechanical owners remain responsible for correctness, while the context layer
explains ownership and durable rationale. A task may require more repository
inspection; that is preferred to maintaining a second, drifting truth source.

## Alternatives considered

- **Persistent size budgets:** rejected because size is not correctness and can
  remove useful high-signal guidance.
- **One broad context/documentation parser:** rejected because discovery
  integrity and document reference health have different owners.
- **LLM review as CI authority:** rejected because acceptance requires
  reproducible repository proof.
- **Permanent agent orchestration:** rejected because task-level isolation is
  sufficient without another drifting policy system.
