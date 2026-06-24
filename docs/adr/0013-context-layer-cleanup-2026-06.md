# 0013. Context Layer — 2026-06 Cleanup

- **Status:** Accepted
- **Date:** 2026-06-24
- **Owner:** AI context layer (see `docs/ai/index.md`)
- **Refines:** ADR-0009 (Context Layer — Lean 2026)

## Context

ADR-0009 (2026-06-20) made the context layer lean: thin always-on root,
nearest-file `AGENTS.md`, glob-auto `.claude/rules/*`, progressive-disclosure
skills, and deterministic-script enforcement. A 2026-06-24 audit against the
conventions in three reference repos (Matt Pocock's `skills`, `ponytail`,
`headroom`) found the layer sound but carrying four residual items that either
contradicted 0009's own reasoning or duplicated a single source of truth:

1. **A per-doc freshness treadmill.** `check-ai-context.mjs` still ran a
   git-commit-date freshness check (WARN > 180d, **ERROR > 365d**) over every
   `frontmatterRequired` doc — the same hand-maintained upkeep cost 0009 used to
   justify removing the framework-freshness gate. It would fail the build on
   still-correct docs after a year, forcing no-op commits.
2. **A second description field.** Each convention/ai doc carried both
   `description:` and `when-to-load:` — near-duplicate triggers. The modern
   agents.md / skill convention is a single `description` with an embedded
   "Use when …" trigger clause.
3. **Hand-synced skill shims.** The `.claude/skills/<name>/SKILL.md` shims
   (Claude Code's discovery surface) duplicated the canonical `description` from
   `.agents/skills`, kept in sync by hand. 0009 chose the hybrid-shim model but
   left the sync manual; an audit found one already drifted (`ui-styling`).
4. **`llms.txt`** — a documentation-site standard (for public crawler/LLM
   ingestion) redundant with `docs/ai/index.md` in a private app monorepo, plus a
   `CODEX.md` reduced to a bare `@AGENTS.md` (inconsistent with its siblings).

The audit also confirmed what **not** to import: `headroom`'s runtime token
compression is middleware, not a static-layer concern, and `ponytail`'s
lite/full/ultra mode-switching duplicates harness-native effort control. The one
transferable idea was `ponytail`'s reuse-first / YAGNI ladder, which the layer
stated as a principle but never as an ordered decision sequence.

## Decision

1. **Remove the freshness treadmill.** Delete `checkFreshness()` and its
   constants from `check-ai-context.mjs`. Stack-version accuracy stays deferred to
   `.claude/rules/*` and reading `node_modules` at edit time, as 0009 set out.
2. **Collapse `when-to-load` into `description`.** Fold each doc's trigger into a
   single `description` ending in a "Use when …" clause; drop the `when-to-load`
   field and its gate check.
3. **Generate skill shims.** Add `scripts/sync-skills.mjs` (write + `--check`)
   making `.agents/skills` the single source of truth; `--check` is wired into
   `bun run ai:check` and `bun run ai:skills:sync` regenerates. Shim drift
   (missing / stale / orphan) now fails the gate instead of relying on discipline.
4. **Drop `llms.txt`; normalize `CODEX.md`.** Remove `llms.txt` (file, gate check,
   manifest entry, link-rot list). Bring `CODEX.md` to parity with `GEMINI.md`.
5. **Add the reuse-first ladder.** Record `ponytail`'s ordered ladder (needs to
   exist? → in repo? → platform/stdlib? → installed dep? → one-liner? → write) in
   `.agents/skills/codebase-design/SKILL.md`, with a pointer from the Working
   Principles "Simplicity" bullet in `AGENTS.md`.

These refine ADR-0009; they do not reverse its lean direction. The enforcement
plane (`check-ai-context`, `check-review-gate-rules`, `check-secrets`,
`sync-project-graph`, and now `sync-skills`) remains authoritative.

## Consequences

Positive:

- No annual no-op-commit treadmill; one `description` field per doc; skill-shim
  drift is mechanically impossible to merge.
- `check-ai-context.mjs` drops ~95 lines; the meta surface shrinks (one fewer
  frontmatter field × 14 docs, `llms.txt` gone) while enforcement gets *stricter*.
- The reuse-first ladder gives the "Simplicity" principle a concrete, checkable
  sequence at design time.

Costs / neutral:

- `sync-skills.mjs` is one more generator to keep working (mirrors the existing
  `sync-project-graph.mjs` pattern; low marginal cost).
- Non-Claude tools still ignore `.claude/skills`; the shims remain Claude-specific
  overhead (~7.5 KB), unchanged from 0009's deliberate tradeoff.

## Alternatives considered

- **Downgrade freshness to WARN-only instead of removing it.** Rejected: a warning
  nobody actions is noise; the accuracy concern is already covered by the rules
  files and edit-time `node_modules` reads.
- **Keep hand-synced shims, just document the rule harder.** Rejected: 0009 tried
  discipline and `ui-styling` still drifted. Generation is the only durable fix.
- **Keep `llms.txt` for a future external tool.** Rejected as speculative (YAGNI);
  restore from git history if a real consumer appears.
- **Write a new ADR superseding 0009 wholesale.** Rejected: 0009's lean decision
  stands; this is a refinement, recorded as such via 0009's `Refined by` note.

## References

- `docs/adr/0009-context-layer-lean-2026.md` — the lean decision this refines.
- `scripts/sync-skills.mjs`, `scripts/check-ai-context.mjs` — the enforcement
  changes.
- `.agents/skills/codebase-design/SKILL.md` — the reuse-first ladder.
