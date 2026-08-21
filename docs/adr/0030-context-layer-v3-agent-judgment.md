# 0030. Context Layer v3 — Reference-Driven Agent Context

- **Status:** Accepted
- **Date:** 2026-08-21
- **Owner:** Engineering Team

## Context

ADR-0027 established portable `AGENTS.md` guidance, scoped deltas, on-demand
skills, thin provider adapters, and mechanical correctness owners. The current
repository still had duplicated subsystem prose, a context-size correctness
budget, and one lint script mixing agent discovery integrity with general
documentation health. Current coding models can inspect source and tests more
effectively when persistent guidance is a map and authoritative detail is
retrieved just in time.

## Decision

1. Keep portable `AGENTS.md` as the canonical repository contract. Nested files
   are local deltas; `CLAUDE.md`, `.claude/skills`, and Copilot instructions
   remain thin discovery adapters. Canonical skill bodies live under
   `.agents/skills`.
2. Prefer implementation source, manifests, types, tests, lint, build, and
   security checks over duplicated correctness prose. Skills describe a
   repeatable procedure and point to those owners; conventions retain only
   durable project decisions and rationale.
3. Remove arbitrary persistent-context byte/token budgets. Context quality is
   maintained by ownership, review, and structural integrity checks, not a
   magic size threshold. Ordinary implementation choices remain with the
   agent's judgment and repository evidence rather than generic heuristics.
4. Keep `context:lint` responsible for context discovery structure and add
   `docs:lint` for deterministic local documentation references. Both feed the
   single canonical `bun run verify` gate; scheduled external-link health stays
   a separate concern.
5. Permit task-level context isolation when it improves quality: a fresh-context
   reviewer, an isolated explorer for a large subtree, or an independent
   acceptance review. These are optional techniques that inspect repository
   evidence and tests, never wording-similarity scores.
6. Do not introduce a permanent agent fleet/orchestration framework, prompt
   registry, generated context graph, or uncalibrated LLM-as-judge CI program.
   Plans, research, and archived material remain subordinate evidence rather
   than normal instruction surfaces.

## Consequences

Agents load less repeated narrative and can follow references to the exact
source of truth. Context and documentation failures have separate, understandable
owners, while repository correctness remains with the compiler, linter, tests,
build, security checks, and CI. A task may require more just-in-time inspection;
that is an intentional trade-off for less stale persistent context.

## Alternatives considered

- Keep the 4096-byte context gate — rejected because size is not correctness and
  encourages deleting useful high-signal guidance.
- Keep one broad context/documentation parser — rejected because it conflates
  discovery integrity with prose/reference health and invites brittle policy
  interpretation.
- Require an LLM reviewer in CI — rejected because mechanical repository proof
  is required and model-judge quality is not calibrated.
- Build a persistent agent fleet or generated context graph — rejected because
  task-level isolation is useful, but permanent orchestration bureaucracy would
  create another drifting source of truth.
- Maintain separate Claude/Codex policy bodies — rejected; provider surfaces
  remain adapters to portable repository guidance.
